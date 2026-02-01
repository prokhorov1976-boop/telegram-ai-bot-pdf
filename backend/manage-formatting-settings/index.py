import json
import os
import sys
import psycopg2

sys.path.append('/function/code')
from auth_middleware import get_authenticated_user

def handler(event: dict, context) -> dict:
    """Управление настройками форматирования сообщений мессенджеров (только для суперадминов)"""
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Authorization, Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        # Проверка аутентификации и прав суперадмина
        user = get_authenticated_user(event)
        if not user:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Unauthorized'}),
                'isBase64Encoded': False
            }
        
        if not user.get('is_super_admin'):
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Доступ запрещён. Только для суперадминов'}),
                'isBase64Encoded': False
            }
        
        query_params = event.get('queryStringParameters', {}) or {}
        tenant_id = query_params.get('tenant_id')
        action = query_params.get('action')
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        if method == 'GET' and action == 'get_emoji_map':
            # Получить карту эмодзи для тенанта (объединенную со всех мессенджеров)
            if not tenant_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'tenant_id обязателен'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("""
                SELECT custom_emoji_map
                FROM t_p56134400_telegram_ai_bot_pdf.messenger_formatting_settings
                WHERE tenant_id = %s
                LIMIT 1
            """, (tenant_id,))
            
            row = cur.fetchone()
            emoji_map = row[0] if row and row[0] else {}
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'emoji_map': emoji_map}),
                'isBase64Encoded': False
            }
        
        elif method == 'GET':
            # Получение настроек форматирования
            if tenant_id:
                cur.execute("""
                    SELECT messenger, use_emoji, use_markdown, use_lists_formatting,
                           custom_emoji_map, list_bullet_char, numbered_list_char
                    FROM t_p56134400_telegram_ai_bot_pdf.messenger_formatting_settings
                    WHERE tenant_id = %s
                    ORDER BY messenger
                """, (tenant_id,))
            else:
                # Все настройки всех тенантов
                cur.execute("""
                    SELECT mfs.tenant_id, t.name as tenant_name, mfs.messenger,
                           mfs.use_emoji, mfs.use_markdown, mfs.use_lists_formatting,
                           mfs.custom_emoji_map, mfs.list_bullet_char, mfs.numbered_list_char
                    FROM t_p56134400_telegram_ai_bot_pdf.messenger_formatting_settings mfs
                    JOIN t_p56134400_telegram_ai_bot_pdf.tenants t ON t.id = mfs.tenant_id
                    ORDER BY mfs.tenant_id, mfs.messenger
                """)
            
            rows = cur.fetchall()
            
            if tenant_id:
                settings = []
                for row in rows:
                    settings.append({
                        'messenger': row[0],
                        'use_emoji': row[1],
                        'use_markdown': row[2],
                        'use_lists_formatting': row[3],
                        'custom_emoji_map': row[4],
                        'list_bullet_char': row[5],
                        'numbered_list_char': row[6]
                    })
            else:
                settings = []
                for row in rows:
                    settings.append({
                        'tenant_id': row[0],
                        'tenant_name': row[1],
                        'messenger': row[2],
                        'use_emoji': row[3],
                        'use_markdown': row[4],
                        'use_lists_formatting': row[5],
                        'custom_emoji_map': row[6],
                        'list_bullet_char': row[7],
                        'numbered_list_char': row[8]
                    })
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'settings': settings}),
                'isBase64Encoded': False
            }
        
        elif method in ['POST', 'PUT']:
            # Обновление настроек
            body = json.loads(event.get('body', '{}'))
            action_body = body.get('action')
            
            # Обновление карты эмодзи для всех мессенджеров тенанта
            if action_body == 'update_emoji_map':
                if not tenant_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'tenant_id обязателен'}),
                        'isBase64Encoded': False
                    }
                
                emoji_map = body.get('emoji_map', {})
                
                # Обновляем карту для всех мессенджеров
                cur.execute("""
                    UPDATE t_p56134400_telegram_ai_bot_pdf.messenger_formatting_settings
                    SET custom_emoji_map = %s, updated_at = NOW()
                    WHERE tenant_id = %s
                """, (json.dumps(emoji_map), tenant_id))
                
                conn.commit()
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            # Обновление настроек конкретного мессенджера
            messenger = body.get('messenger')
            use_emoji = body.get('use_emoji', True)
            use_markdown = body.get('use_markdown', False)
            use_lists_formatting = body.get('use_lists_formatting', True)
            custom_emoji_map = body.get('custom_emoji_map', {})
            list_bullet_char = body.get('list_bullet_char', '•')
            numbered_list_char = body.get('numbered_list_char', '▫️')
            
            if not tenant_id or not messenger:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'tenant_id и messenger обязательны'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("""
                INSERT INTO t_p56134400_telegram_ai_bot_pdf.messenger_formatting_settings
                    (tenant_id, messenger, use_emoji, use_markdown, use_lists_formatting,
                     custom_emoji_map, list_bullet_char, numbered_list_char, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
                ON CONFLICT (tenant_id, messenger) 
                DO UPDATE SET
                    use_emoji = EXCLUDED.use_emoji,
                    use_markdown = EXCLUDED.use_markdown,
                    use_lists_formatting = EXCLUDED.use_lists_formatting,
                    custom_emoji_map = EXCLUDED.custom_emoji_map,
                    list_bullet_char = EXCLUDED.list_bullet_char,
                    numbered_list_char = EXCLUDED.numbered_list_char,
                    updated_at = NOW()
            """, (tenant_id, messenger, use_emoji, use_markdown, use_lists_formatting,
                  json.dumps(custom_emoji_map), list_bullet_char, numbered_list_char))
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        print(f'Error: {e}')
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }