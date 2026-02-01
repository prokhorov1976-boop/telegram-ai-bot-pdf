import json
import os
import psycopg2
import sys
sys.path.insert(0, '/function/code/shared')
from auth_middleware import get_tenant_id_from_request

def handler(event: dict, context) -> dict:
    """Получение настроек страницы и быстрых вопросов"""
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
        query_params = event.get('queryStringParameters') or {}
        tenant_slug = query_params.get('slug')
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        if tenant_slug:
            cur.execute("""
                SELECT id FROM t_p56134400_telegram_ai_bot_pdf.tenants 
                WHERE slug = %s
            """, (tenant_slug,))
            tenant_row = cur.fetchone()
            if not tenant_row:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Tenant not found'}),
                    'isBase64Encoded': False
                }
            tenant_id = tenant_row[0]
        else:
            tenant_id, auth_error = get_tenant_id_from_request(event)
            if auth_error:
                cur.close()
                conn.close()
                return auth_error

        # Получаем page_settings, public_description и consent настройки из JSONB
        cur.execute("""
            SELECT page_settings, public_description, consent_webchat_enabled, consent_text
            FROM t_p56134400_telegram_ai_bot_pdf.tenant_settings
            WHERE tenant_id = %s
        """, (tenant_id,))
        row = cur.fetchone()
        settings = row[0] if row and row[0] else {}
        
        # Добавляем public_description в settings
        if row and row[1]:
            settings['public_description'] = row[1]
        
        # Добавляем consent настройки
        if row:
            settings['consent_enabled'] = row[2] if row[2] is not None else False
            settings['consent_text'] = row[3] if row[3] else 'Я согласен на обработку персональных данных'

        # Получаем название бота из таблицы tenants
        cur.execute("""
            SELECT name
            FROM t_p56134400_telegram_ai_bot_pdf.tenants
            WHERE id = %s
        """, (tenant_id,))
        tenant_row = cur.fetchone()
        bot_name = tenant_row[0] if tenant_row else ''

        cur.execute("""
            SELECT id, text, question, icon, sort_order
            FROM t_p56134400_telegram_ai_bot_pdf.quick_questions
            WHERE tenant_id = %s
            ORDER BY sort_order, id
        """, (tenant_id,))
        questions_rows = cur.fetchall()
        quick_questions = [
            {
                'id': row[0],
                'text': row[1],
                'question': row[2],
                'icon': row[3],
                'sort_order': row[4]
            }
            for row in questions_rows
        ]

        cur.close()
        conn.close()

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'settings': settings,
                'quickQuestions': quick_questions,
                'botName': bot_name
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