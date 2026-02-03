import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import requests
from datetime import datetime
from pathlib import Path

# URL функции chat для отправки сообщений в AI
# Обновляется автоматически при sync_backend
CHAT_FUNCTION_URL = 'https://functions.poehali.dev/7b58f4fb-5db0-4f85-bb3b-55bafa4cbf73'

def handler(event: dict, context) -> dict:
    """Webhook для обработки входящих звонков от Voximplant и взаимодействия с AI-ботом"""
    print(f"[DEBUG] Handler called: method={event.get('httpMethod')}, body={event.get('body', '')[:200]}")
    method = event.get('httpMethod', 'POST')

    if method == 'OPTIONS':
        print("[DEBUG] Returning OPTIONS response")
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Voximplant-Signature',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }

    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }

    try:
        body = json.loads(event.get('body', '{}'))
        call_id = body.get('call_id')
        event_type = body.get('event_type')
        phone_number = body.get('phone_number', '')
        speech_text = body.get('text', '')
        # Tenant slug может быть в custom_data или напрямую в body
        tenant_slug = body.get('tenant_slug') or body.get('custom_data', {}).get('tenant_slug')
        
        print(f"[Voximplant] Received: event_type={event_type}, call_id={call_id}, phone={phone_number}, tenant={tenant_slug}")

        if not tenant_slug:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Tenant slug required in custom_data'}),
                'isBase64Encoded': False
            }

        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor(cursor_factory=RealDictCursor)
        schema = 't_p56134400_telegram_ai_bot_pdf'

        cur.execute(f"""
            SELECT id, name, voximplant_enabled, voximplant_greeting
            FROM {schema}.tenants
            WHERE slug = '{tenant_slug}' AND voximplant_enabled = true
        """)
        
        print(f"[Voximplant] Looking for tenant: slug={tenant_slug}, schema={schema}")
        tenant = cur.fetchone()

        if not tenant:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Tenant not found or voice calls disabled'}),
                'isBase64Encoded': False
            }

        tenant_id = tenant['id']
        greeting = tenant.get('voximplant_greeting') or f"Здравствуйте! Это голосовой помощник {tenant['name']}. Чем могу помочь?"

        if event_type == 'call_started':
            response_text = greeting
            print(f"[Voximplant] call_started: greeting='{response_text[:100]}'")
            
            cur.execute(f"""
                INSERT INTO {schema}.voice_calls 
                (tenant_id, call_id, phone_number, status, started_at)
                VALUES ({tenant_id}, '{call_id}', '{phone_number}', 'active', NOW())
            """)
            conn.commit()

        elif event_type == 'speech_recognized':
            print(f"[Voximplant] speech_recognized: call_id={call_id}, text={speech_text}, tenant={tenant_slug}")
            
            if not speech_text:
                response_text = "Извините, я вас не расслышал. Повторите, пожалуйста."
            else:
                chat_url = CHAT_FUNCTION_URL
                request_payload = {
                    'tenantSlug': tenant_slug,
                    'sessionId': f"voice_{call_id}",
                    'message': speech_text,
                    'channel': 'voice'
                }
                print(f"[Voximplant] Отправка в AI: url={chat_url}, payload={request_payload}")
                
                try:
                    ai_response = requests.post(
                        chat_url,
                        json=request_payload,
                        headers={'Content-Type': 'application/json'},
                        timeout=30
                    )
                    
                    print(f"[Voximplant] AI response: status={ai_response.status_code}, body={ai_response.text[:500]}")
                    
                    if ai_response.status_code == 200:
                        ai_data = ai_response.json()
                        response_text = ai_data.get('message', 'Извините, не смог обработать запрос.')
                        print(f"[Voximplant] AI answer: {response_text}")
                    else:
                        response_text = "Извините, произошла ошибка. Попробуйте позже."
                        print(f"[Voximplant] AI error: status {ai_response.status_code}")
                except Exception as e:
                    response_text = "Извините, сервис временно недоступен."
                    print(f"[Voximplant] Exception calling AI: {str(e)}")

                # Сохраняем сообщения в БД
                cur.execute(f"""
                    INSERT INTO {schema}.voice_messages
                    (call_id, direction, text, created_at)
                    VALUES ('{call_id}', 'incoming', '{speech_text.replace("'", "''")}', NOW())
                """)
                
                cur.execute(f"""
                    INSERT INTO {schema}.voice_messages
                    (call_id, direction, text, created_at)
                    VALUES ('{call_id}', 'outgoing', '{response_text.replace("'", "''")}', NOW())
                """)
                conn.commit()

        elif event_type == 'call_ended':
            cur.execute(f"""
                UPDATE {schema}.voice_calls
                SET status = 'completed', ended_at = NOW()
                WHERE call_id = '{call_id}'
            """)
            conn.commit()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'status': 'call_ended'}),
                'isBase64Encoded': False
            }
        else:
            response_text = "Извините, произошла ошибка."

        cur.close()
        conn.close()

        response_data = {
            'response': response_text,
            'action': 'speak',
            'voice': 'filipp',
            'language': 'ru-RU'
        }
        print(f"[Voximplant] Returning response: {response_data}")

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(response_data),
            'isBase64Encoded': False
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }