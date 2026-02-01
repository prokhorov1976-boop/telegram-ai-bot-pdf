import json
import os
import psycopg2
from datetime import datetime
from auth_middleware import get_tenant_id_from_request

def handler(event: dict, context) -> dict:
    """Экспорт полной резервной копии данных тенанта в JSON"""
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
        tenant_id, auth_error = get_tenant_id_from_request(event)
        if auth_error:
            return auth_error

        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()

        backup_data = {
            'export_date': datetime.utcnow().isoformat(),
            'tenant_id': tenant_id,
            'version': '1.0'
        }

        # 1. Tenant settings
        cur.execute("""
            SELECT page_settings, ai_settings, quality_gate_settings, widget_settings
            FROM t_p56134400_telegram_ai_bot_pdf.tenant_settings
            WHERE tenant_id = %s
        """, (tenant_id,))
        row = cur.fetchone()
        if row:
            backup_data['tenant_settings'] = {
                'page_settings': row[0],
                'ai_settings': row[1],
                'quality_gate_settings': row[2],
                'widget_settings': row[3]
            }

        # 2. Quick questions
        cur.execute("""
            SELECT text, question, icon, sort_order
            FROM t_p56134400_telegram_ai_bot_pdf.quick_questions
            WHERE tenant_id = %s
            ORDER BY sort_order, id
        """, (tenant_id,))
        backup_data['quick_questions'] = [
            {'text': row[0], 'question': row[1], 'icon': row[2], 'sort_order': row[3]}
            for row in cur.fetchall()
        ]

        # 3. Messenger auto messages
        cur.execute("""
            SELECT telegram_message, vk_message, max_message
            FROM t_p56134400_telegram_ai_bot_pdf.messenger_auto_messages
            WHERE tenant_id = %s
        """, (tenant_id,))
        row = cur.fetchone()
        if row:
            backup_data['messenger_auto_messages'] = {
                'telegram_message': row[0],
                'vk_message': row[1],
                'max_message': row[2]
            }

        # 4. Tenant API keys (encrypted values will remain encrypted)
        cur.execute("""
            SELECT key_name, encrypted_value, is_fz152
            FROM t_p56134400_telegram_ai_bot_pdf.tenant_api_keys
            WHERE tenant_id = %s
        """, (tenant_id,))
        backup_data['api_keys'] = [
            {'key_name': row[0], 'encrypted_value': row[1], 'is_fz152': row[2]}
            for row in cur.fetchall()
        ]

        # 5. Tenant documents metadata (without file content)
        cur.execute("""
            SELECT file_name, file_size, upload_date, status, file_type
            FROM t_p56134400_telegram_ai_bot_pdf.tenant_documents
            WHERE tenant_id = %s
            ORDER BY upload_date DESC
        """, (tenant_id,))
        backup_data['documents'] = [
            {
                'file_name': row[0],
                'file_size': row[1],
                'upload_date': row[2].isoformat() if row[2] else None,
                'status': row[3],
                'file_type': row[4]
            }
            for row in cur.fetchall()
        ]

        # 6. Tenant info
        cur.execute("""
            SELECT name, slug, telegram_token, vk_token, max_token, tariff_id, 
                   trial_ends_at, fz152_enabled, created_at
            FROM t_p56134400_telegram_ai_bot_pdf.tenants
            WHERE id = %s
        """, (tenant_id,))
        row = cur.fetchone()
        if row:
            backup_data['tenant_info'] = {
                'name': row[0],
                'slug': row[1],
                'telegram_token': row[2],
                'vk_token': row[3],
                'max_token': row[4],
                'tariff_id': row[5],
                'trial_ends_at': row[6].isoformat() if row[6] else None,
                'fz152_enabled': row[7],
                'created_at': row[8].isoformat() if row[8] else None
            }

        cur.close()
        conn.close()

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Content-Disposition': f'attachment; filename="tenant_{tenant_id}_backup_{datetime.utcnow().strftime("%Y%m%d_%H%M%S")}.json"'
            },
            'body': json.dumps(backup_data, ensure_ascii=False, indent=2),
            'isBase64Encoded': False
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
