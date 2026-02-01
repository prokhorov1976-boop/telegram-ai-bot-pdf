import json
import os
import psycopg2
from auth_middleware import get_tenant_id_from_request

def handler(event: dict, context) -> dict:
    '''Управление настройками автосообщений для мессенджеров'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization'
            },
            'body': ''
        }
    
    try:
        tenant_id, auth_error = get_tenant_id_from_request(event)
        if auth_error:
            return auth_error

        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        if method == 'GET':
            # Получаем настройки для всех мессенджеров
            messenger_type = event.get('queryStringParameters', {}).get('messenger_type')
            
            if messenger_type:
                # Конкретный мессенджер
                cur.execute("""
                    SELECT messenger_type, enabled, delay_seconds, message_text, 
                           repeat_enabled, repeat_delay_seconds
                    FROM t_p56134400_telegram_ai_bot_pdf.messenger_auto_messages
                    WHERE tenant_id = %s AND messenger_type = %s
                """, (tenant_id, messenger_type))
                
                row = cur.fetchone()
                if row:
                    settings = {
                        'messenger_type': row[0],
                        'enabled': row[1],
                        'delay_seconds': row[2],
                        'message_text': row[3],
                        'repeat_enabled': row[4],
                        'repeat_delay_seconds': row[5]
                    }
                else:
                    # Дефолтные значения
                    settings = {
                        'messenger_type': messenger_type,
                        'enabled': False,
                        'delay_seconds': 30,
                        'message_text': 'Могу помочь с выбором? 😊',
                        'repeat_enabled': True,
                        'repeat_delay_seconds': 60
                    }
            else:
                # Все мессенджеры
                cur.execute("""
                    SELECT messenger_type, enabled, delay_seconds, message_text, 
                           repeat_enabled, repeat_delay_seconds
                    FROM t_p56134400_telegram_ai_bot_pdf.messenger_auto_messages
                    WHERE tenant_id = %s
                """, (tenant_id,))
                
                rows = cur.fetchall()
                settings = {}
                for row in rows:
                    settings[row[0]] = {
                        'enabled': row[1],
                        'delay_seconds': row[2],
                        'message_text': row[3],
                        'repeat_enabled': row[4],
                        'repeat_delay_seconds': row[5]
                    }
                
                # Добавляем дефолты для отсутствующих
                for mtype in ['telegram', 'whatsapp', 'vk', 'max', 'widget']:
                    if mtype not in settings:
                        settings[mtype] = {
                            'enabled': False,
                            'delay_seconds': 30,
                            'message_text': 'Могу помочь с выбором? 😊',
                            'repeat_enabled': True,
                            'repeat_delay_seconds': 60
                        }
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'settings': settings})
            }
        
        elif method == 'POST':
            data = json.loads(event.get('body', '{}'))
            messenger_type = data.get('messenger_type')
            
            if not messenger_type:
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'messenger_type is required'})
                }
            
            # Upsert настроек
            cur.execute("""
                INSERT INTO t_p56134400_telegram_ai_bot_pdf.messenger_auto_messages
                    (tenant_id, messenger_type, enabled, delay_seconds, message_text, 
                     repeat_enabled, repeat_delay_seconds, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                ON CONFLICT (tenant_id, messenger_type) 
                DO UPDATE SET
                    enabled = EXCLUDED.enabled,
                    delay_seconds = EXCLUDED.delay_seconds,
                    message_text = EXCLUDED.message_text,
                    repeat_enabled = EXCLUDED.repeat_enabled,
                    repeat_delay_seconds = EXCLUDED.repeat_delay_seconds,
                    updated_at = CURRENT_TIMESTAMP
            """, (
                tenant_id,
                messenger_type,
                data.get('enabled', False),
                data.get('delay_seconds', 30),
                data.get('message_text', 'Могу помочь с выбором? 😊'),
                data.get('repeat_enabled', True),
                data.get('repeat_delay_seconds', 60)
            ))
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': True})
            }
        
        return {
            'statusCode': 405,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
