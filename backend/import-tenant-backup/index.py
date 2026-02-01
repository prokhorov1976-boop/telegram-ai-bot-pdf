import json
import os
import psycopg2
from auth_middleware import get_tenant_id_from_request

def handler(event: dict, context) -> dict:
    """Импорт резервной копии данных тенанта из JSON"""
    method = event.get('httpMethod', 'POST')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization'
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
        tenant_id, auth_error = get_tenant_id_from_request(event)
        if auth_error:
            return auth_error

        body = json.loads(event.get('body', '{}'))
        backup_data = body.get('backup_data')
        
        if not backup_data:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Missing backup_data in request'}),
                'isBase64Encoded': False
            }

        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()

        imported_items = []

        # 1. Tenant settings
        if 'tenant_settings' in backup_data:
            settings = backup_data['tenant_settings']
            cur.execute("""
                INSERT INTO t_p56134400_telegram_ai_bot_pdf.tenant_settings 
                (tenant_id, page_settings, ai_settings, quality_gate_settings, widget_settings)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (tenant_id) DO UPDATE SET
                    page_settings = EXCLUDED.page_settings,
                    ai_settings = EXCLUDED.ai_settings,
                    quality_gate_settings = EXCLUDED.quality_gate_settings,
                    widget_settings = EXCLUDED.widget_settings
            """, (
                tenant_id,
                json.dumps(settings.get('page_settings')) if settings.get('page_settings') else None,
                json.dumps(settings.get('ai_settings')) if settings.get('ai_settings') else None,
                json.dumps(settings.get('quality_gate_settings')) if settings.get('quality_gate_settings') else None,
                json.dumps(settings.get('widget_settings')) if settings.get('widget_settings') else None
            ))
            imported_items.append('tenant_settings')

        # 2. Quick questions
        if 'quick_questions' in backup_data:
            # Удаляем старые
            cur.execute("""
                DELETE FROM t_p56134400_telegram_ai_bot_pdf.quick_questions
                WHERE tenant_id = %s
            """, (tenant_id,))
            
            # Добавляем новые
            for q in backup_data['quick_questions']:
                cur.execute("""
                    INSERT INTO t_p56134400_telegram_ai_bot_pdf.quick_questions
                    (tenant_id, text, question, icon, sort_order)
                    VALUES (%s, %s, %s, %s, %s)
                """, (tenant_id, q.get('text'), q.get('question'), q.get('icon'), q.get('sort_order', 0)))
            imported_items.append(f'quick_questions ({len(backup_data["quick_questions"])} items)')

        # 3. Messenger auto messages
        if 'messenger_auto_messages' in backup_data:
            msgs = backup_data['messenger_auto_messages']
            cur.execute("""
                INSERT INTO t_p56134400_telegram_ai_bot_pdf.messenger_auto_messages
                (tenant_id, telegram_message, vk_message, max_message)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (tenant_id) DO UPDATE SET
                    telegram_message = EXCLUDED.telegram_message,
                    vk_message = EXCLUDED.vk_message,
                    max_message = EXCLUDED.max_message
            """, (tenant_id, msgs.get('telegram_message'), msgs.get('vk_message'), msgs.get('max_message')))
            imported_items.append('messenger_auto_messages')

        # 4. API Keys - импортируем только если они отсутствуют
        if 'api_keys' in backup_data:
            keys_imported = 0
            for key in backup_data['api_keys']:
                cur.execute("""
                    SELECT COUNT(*) FROM t_p56134400_telegram_ai_bot_pdf.tenant_api_keys
                    WHERE tenant_id = %s AND key_name = %s
                """, (tenant_id, key.get('key_name')))
                exists = cur.fetchone()[0] > 0
                
                if not exists:
                    cur.execute("""
                        INSERT INTO t_p56134400_telegram_ai_bot_pdf.tenant_api_keys
                        (tenant_id, key_name, encrypted_value, is_fz152)
                        VALUES (%s, %s, %s, %s)
                    """, (tenant_id, key.get('key_name'), key.get('encrypted_value'), key.get('is_fz152', False)))
                    keys_imported += 1
            
            if keys_imported > 0:
                imported_items.append(f'api_keys ({keys_imported} new keys)')

        conn.commit()
        cur.close()
        conn.close()

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'message': 'Backup imported successfully',
                'imported_items': imported_items
            }),
            'isBase64Encoded': False
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
