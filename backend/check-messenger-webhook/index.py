import json
import os
import psycopg2
import requests
from auth_middleware import get_tenant_id_from_request

def handler(event: dict, context) -> dict:
    """Проверка статуса webhook для мессенджеров (Telegram, MAX, VK)"""
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }

    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }

    try:
        # Проверка авторизации
        tenant_id, auth_error = get_tenant_id_from_request(event)
        if auth_error:
            return auth_error
        
        query_params = event.get('queryStringParameters', {}) or {}
        messenger = query_params.get('messenger')  # telegram, max, vk
        expected_webhook_url = query_params.get('webhook_url', '')

        if not messenger:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'messenger is required'}),
                'isBase64Encoded': False
            }

        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()

        if messenger == 'telegram':
            # Получаем bot_token
            cur.execute("""
                SELECT key_value
                FROM t_p56134400_telegram_ai_bot_pdf.tenant_api_keys
                WHERE tenant_id = %s AND provider = 'telegram' 
                  AND key_name = 'bot_token' AND is_active = true
            """, (tenant_id,))
            
            row = cur.fetchone()
            if not row:
                cur.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'ok': False, 'status': 'not_configured'}),
                    'isBase64Encoded': False
                }
            
            bot_token = row[0]
            cur.close()
            conn.close()
            
            # Проверяем через Telegram API
            telegram_api_url = f'https://api.telegram.org/bot{bot_token}/getWebhookInfo'
            response = requests.get(telegram_api_url, timeout=10)
            data = response.json()
            
            if data.get('ok') and data.get('result', {}).get('url', '').startswith(expected_webhook_url):
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'ok': True,
                        'status': 'active',
                        'webhook_url': data['result']['url']
                    }),
                    'isBase64Encoded': False
                }
            elif data.get('ok') and data.get('result', {}).get('url'):
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'ok': True,
                        'status': 'error',
                        'webhook_url': data['result']['url'],
                        'message': 'Webhook настроен на другой URL'
                    }),
                    'isBase64Encoded': False
                }
            else:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'ok': True,
                        'status': 'not_set',
                        'message': 'Webhook не настроен'
                    }),
                    'isBase64Encoded': False
                }

        elif messenger == 'max':
            # Для MAX проверяем наличие токена
            cur.execute("""
                SELECT key_value
                FROM t_p56134400_telegram_ai_bot_pdf.tenant_api_keys
                WHERE tenant_id = %s AND provider = 'max' 
                  AND key_name = 'bot_token' AND is_active = true
            """, (tenant_id,))
            
            row = cur.fetchone()
            cur.close()
            conn.close()
            
            if not row:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'ok': False, 'status': 'not_configured'}),
                    'isBase64Encoded': False
                }
            
            # MAX API не предоставляет endpoint для проверки webhook
            # Просто возвращаем что токен настроен
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'ok': True,
                    'status': 'active',
                    'message': 'Токен настроен (MAX API не предоставляет проверку webhook)'
                }),
                'isBase64Encoded': False
            }

        elif messenger == 'vk':
            # Проверяем наличие всех ключей VK
            cur.execute("""
                SELECT key_name, key_value
                FROM t_p56134400_telegram_ai_bot_pdf.tenant_api_keys
                WHERE tenant_id = %s AND provider = 'vk' AND is_active = true
            """, (tenant_id,))
            
            rows = cur.fetchall()
            cur.close()
            conn.close()
            
            keys = {row[0]: row[1] for row in rows}
            
            if not all(k in keys for k in ['group_id', 'group_token', 'secret_key']):
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'ok': False, 'status': 'not_configured'}),
                    'isBase64Encoded': False
                }
            
            # VK API не предоставляет простой способ проверки callback webhook
            # Возвращаем что все ключи настроены
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'ok': True,
                    'status': 'active',
                    'message': 'Все ключи настроены (VK API не предоставляет проверку webhook)'
                }),
                'isBase64Encoded': False
            }

        else:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Unknown messenger type'}),
                'isBase64Encoded': False
            }

    except Exception as e:
        print(f'Error checking webhook: {e}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }