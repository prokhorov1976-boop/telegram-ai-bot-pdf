import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    """Одноразовая функция: понижает порог min_similarity для династии-крым для лучшего поиска тарифов"""
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
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()

        # Находим tenant по slug
        cur.execute("""
            SELECT id FROM t_p56134400_telegram_ai_bot_pdf.tenants 
            WHERE slug = 'dinasty-crimea'
        """)
        tenant_row = cur.fetchone()
        
        if not tenant_row:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Tenant not found'}),
                'isBase64Encoded': False
            }
        
        tenant_id = tenant_row[0]

        # Обновляем настройки Quality Gate
        new_settings = {
            'rules': {
                'min_len': 3,
                'min_sim': 0.25,
                'min_overlap_ru': 0.06,
                'min_overlap_en': 0.10
            },
            'default': {
                'min_len': 3,
                'min_sim': 0.25,
                'min_overlap_ru': 0.06,
                'min_overlap_en': 0.10
            },
            'tariffs': {
                'min_len': 3,
                'min_sim': 0.22,
                'min_overlap_ru': 0.06,
                'min_overlap_en': 0.10
            },
            'services': {
                'min_len': 3,
                'min_sim': 0.25,
                'min_overlap_ru': 0.06,
                'min_overlap_en': 0.10
            }
        }

        cur.execute("""
            UPDATE t_p56134400_telegram_ai_bot_pdf.tenant_settings
            SET quality_gate_settings = %s
            WHERE tenant_id = %s
        """, (json.dumps(new_settings), tenant_id))

        conn.commit()
        cur.close()
        conn.close()

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'tenant_id': tenant_id,
                'new_settings': new_settings
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
