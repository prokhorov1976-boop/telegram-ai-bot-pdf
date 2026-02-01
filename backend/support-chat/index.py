import json
import os
import psycopg2
from datetime import datetime, timezone, timedelta
import requests
import sys
sys.path.append('/function/code')
from timezone_helper import moscow_naive

def handler(event: dict, context) -> dict:
    """API для чата поддержки с интеграцией Telegram"""
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }

    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        schema = 't_p56134400_telegram_ai_bot_pdf'

        if method == 'GET':
            # Получить историю сообщений по session_id
            query_params = event.get('queryStringParameters') or {}
            session_id = query_params.get('session_id')

            if not session_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'session_id required'}),
                    'isBase64Encoded': False
                }

            cur.execute(f"""
                SELECT id, session_id, user_name, user_email, user_phone,
                       message_text, sender_type, created_at, is_read
                FROM {schema}.support_messages
                WHERE session_id = %s
                ORDER BY created_at ASC
            """, (session_id,))

            rows = cur.fetchall()
            messages = []
            for row in rows:
                messages.append({
                    'id': row[0],
                    'session_id': row[1],
                    'user_name': row[2],
                    'user_email': row[3],
                    'user_phone': row[4],
                    'message_text': row[5],
                    'sender_type': row[6],
                    'created_at': row[7].isoformat() if row[7] else None,
                    'is_read': row[8]
                })

            cur.close()
            conn.close()

            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'messages': messages}),
                'isBase64Encoded': False
            }

        elif method == 'POST':
            # Отправить сообщение от пользователя
            body = json.loads(event.get('body', '{}'))
            session_id = body.get('session_id')
            message_text = body.get('message_text')
            user_name = body.get('user_name')
            user_email = body.get('user_email')
            user_phone = body.get('user_phone')

            if not session_id or not message_text:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'session_id and message_text required'}),
                    'isBase64Encoded': False
                }

            # Сохранить сообщение в БД
            cur.execute(f"""
                INSERT INTO {schema}.support_messages 
                (session_id, user_name, user_email, user_phone, message_text, sender_type)
                VALUES (%s, %s, %s, %s, %s, 'user')
                RETURNING id, created_at
            """, (session_id, user_name, user_email, user_phone, message_text))

            message_id, created_at = cur.fetchone()
            conn.commit()

            # Отправить в Telegram
            support_bot_token = os.environ.get('SUPPORT_BOT_TOKEN')
            support_chat_id = os.environ.get('SUPPORT_CHAT_ID_NEW') or os.environ.get('SUPPORT_CHAT_ID')

            print(f"[support-chat] Bot token present: {bool(support_bot_token)}")
            print(f"[support-chat] Chat ID present: {bool(support_chat_id)}")

            if support_bot_token and support_chat_id:
                try:
                    # Формируем сообщение для Telegram
                    # Преобразуем время в GMT+3
                    moscow_tz = timezone(timedelta(hours=3))
                    moscow_time = created_at.replace(tzinfo=timezone.utc).astimezone(moscow_tz)
                    
                    telegram_text = f"💬 Новое сообщение в поддержку\n\n"
                    telegram_text += f"👤 Имя: {user_name or 'Не указано'}\n"
                    telegram_text += f"📧 Email: {user_email or 'Не указано'}\n"
                    telegram_text += f"📱 Телефон: {user_phone or 'Не указано'}\n"
                    telegram_text += f"🔑 Session: {session_id}\n\n"
                    telegram_text += f"📝 Сообщение:\n{message_text}\n\n"
                    telegram_text += f"⏰ {moscow_time.strftime('%d.%m.%Y %H:%M')} МСК"

                    telegram_url = f"https://api.telegram.org/bot{support_bot_token}/sendMessage"
                    print(f"[support-chat] Sending to Telegram: {support_chat_id}")
                    
                    telegram_response = requests.post(telegram_url, json={
                        'chat_id': support_chat_id,
                        'text': telegram_text
                    }, timeout=5)

                    print(f"[support-chat] Telegram response status: {telegram_response.status_code}")
                    print(f"[support-chat] Telegram response: {telegram_response.text}")

                    if telegram_response.ok:
                        telegram_data = telegram_response.json()
                        telegram_message_id = telegram_data.get('result', {}).get('message_id')
                        print(f"[support-chat] Telegram message sent: {telegram_message_id}")

                        # Сохраняем telegram_message_id для связи ответов
                        cur.execute(f"""
                            UPDATE {schema}.support_messages
                            SET telegram_message_id = %s
                            WHERE id = %s
                        """, (telegram_message_id, message_id))
                        conn.commit()
                    else:
                        print(f"[support-chat] Telegram error: {telegram_response.text}")

                except Exception as telegram_error:
                    print(f"[support-chat] Telegram exception: {telegram_error}")
                    import traceback
                    traceback.print_exc()
            else:
                print(f"[support-chat] Telegram credentials missing!")

            cur.close()
            conn.close()

            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'message_id': message_id,
                    'created_at': created_at.isoformat()
                }),
                'isBase64Encoded': False
            }

        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }

    except Exception as e:
        print(f"ERROR in support-chat: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }