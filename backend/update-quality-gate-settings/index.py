import json
import os
import psycopg2
from auth_middleware import get_tenant_id_from_request

def handler(event: dict, context) -> dict:
    """Обновление настроек Quality Gate для тенанта"""
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
        settings = body.get('settings')

        if not settings:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'settings required'}),
                'isBase64Encoded': False
            }

        # Валидация структуры
        required_categories = ['default', 'tariffs', 'services']
        required_fields = ['min_len', 'min_sim', 'min_overlap_ru', 'min_overlap_en']
        
        for category in required_categories:
            if category not in settings:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f'Missing category: {category}'}),
                    'isBase64Encoded': False
                }
            for field in required_fields:
                if field not in settings[category]:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': f'Missing field {field} in {category}'}),
                        'isBase64Encoded': False
                    }

        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()

        # Добавляем rules для обратной совместимости
        settings_with_rules = {
            'rules': settings['default'],
            **settings
        }

        cur.execute("""
            UPDATE t_p56134400_telegram_ai_bot_pdf.tenant_settings
            SET quality_gate_settings = %s
            WHERE tenant_id = %s
        """, (json.dumps(settings_with_rules), tenant_id))

        conn.commit()
        cur.close()
        conn.close()

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True}),
            'isBase64Encoded': False
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
