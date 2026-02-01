import json
import os
import psycopg2
from datetime import datetime, timezone, timedelta

def handler(event: dict, context) -> dict:
    """Админ-панель для просмотра всех обращений в поддержку"""
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
            # Получить все уникальные сессии с последним сообщением
            cur.execute(f"""
                WITH last_messages AS (
                    SELECT DISTINCT ON (session_id)
                        session_id,
                        user_name,
                        user_email,
                        user_phone,
                        message_text,
                        sender_type,
                        created_at,
                        (SELECT COUNT(*) FROM {schema}.support_messages sm2 
                         WHERE sm2.session_id = sm.session_id AND sm2.is_read = false AND sm2.sender_type = 'user') as unread_count,
                        (SELECT COUNT(*) FROM {schema}.support_messages sm2 
                         WHERE sm2.session_id = sm.session_id) as total_messages
                    FROM {schema}.support_messages sm
                    ORDER BY session_id, created_at DESC
                )
                SELECT * FROM last_messages
                ORDER BY created_at DESC
            """)

            rows = cur.fetchall()
            sessions = []
            moscow_tz = timezone(timedelta(hours=3))
            
            for row in rows:
                created_at_utc = row[6]
                if created_at_utc and created_at_utc.tzinfo is None:
                    created_at_utc = created_at_utc.replace(tzinfo=timezone.utc)
                moscow_time = created_at_utc.astimezone(moscow_tz) if created_at_utc else None
                
                sessions.append({
                    'session_id': row[0],
                    'user_name': row[1] or 'Аноним',
                    'user_email': row[2],
                    'user_phone': row[3],
                    'last_message': row[4],
                    'last_sender': row[5],
                    'last_message_at': moscow_time.isoformat() if moscow_time else None,
                    'unread_count': row[7],
                    'total_messages': row[8]
                })

            cur.close()
            conn.close()

            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'sessions': sessions}),
                'isBase64Encoded': False
            }

        elif method == 'POST':
            # Отметить все сообщения сессии как прочитанные
            body = json.loads(event.get('body', '{}'))
            session_id = body.get('session_id')

            if not session_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'session_id required'}),
                    'isBase64Encoded': False
                }

            cur.execute(f"""
                UPDATE {schema}.support_messages
                SET is_read = true
                WHERE session_id = %s AND sender_type = 'user'
            """, (session_id,))

            conn.commit()
            cur.close()
            conn.close()

            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
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
        print(f"ERROR in support-admin: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
