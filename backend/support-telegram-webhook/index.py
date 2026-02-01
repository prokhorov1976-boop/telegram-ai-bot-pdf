import json
import os
import psycopg2
import re

def handler(event: dict, context) -> dict:
    """Webhook для получения ответов от суперадмина из Telegram"""
    method = event.get('httpMethod', 'POST')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }

    try:
        body = json.loads(event.get('body', '{}'))
        print(f"[support-telegram-webhook] Received: {json.dumps(body)}")

        # Извлекаем данные из Telegram update
        message = body.get('message', {})
        reply_to_message = message.get('reply_to_message')
        
        if not reply_to_message:
            # Не ответ на сообщение - игнорируем
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'ok': True, 'message': 'Not a reply, ignored'}),
                'isBase64Encoded': False
            }

        admin_message_text = message.get('text', '')
        original_message_id = reply_to_message.get('message_id')

        if not admin_message_text or not original_message_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Invalid message format'}),
                'isBase64Encoded': False
            }

        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        schema = 't_p56134400_telegram_ai_bot_pdf'

        # Найти исходное сообщение пользователя по telegram_message_id
        cur.execute(f"""
            SELECT session_id, user_name
            FROM {schema}.support_messages
            WHERE telegram_message_id = %s AND sender_type = 'user'
            ORDER BY created_at DESC
            LIMIT 1
        """, (original_message_id,))

        user_message = cur.fetchone()

        if not user_message:
            print(f"[support-telegram-webhook] Original message not found for telegram_message_id={original_message_id}")
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Original message not found'}),
                'isBase64Encoded': False
            }

        session_id, user_name = user_message

        # Сохранить ответ администратора в БД
        cur.execute(f"""
            INSERT INTO {schema}.support_messages 
            (session_id, message_text, sender_type, telegram_message_id)
            VALUES (%s, %s, 'admin', %s)
            RETURNING id, created_at
        """, (session_id, admin_message_text, message.get('message_id')))

        message_id, created_at = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        print(f"[support-telegram-webhook] Saved admin reply: message_id={message_id}, session={session_id}")

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'ok': True,
                'message_id': message_id,
                'session_id': session_id
            }),
            'isBase64Encoded': False
        }

    except Exception as e:
        print(f"ERROR in support-telegram-webhook: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
