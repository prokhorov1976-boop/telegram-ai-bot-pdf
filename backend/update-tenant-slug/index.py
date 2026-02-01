import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import sys
sys.path.append('/function/code')
from auth_middleware import require_auth


def handler(event: dict, context) -> dict:
    '''Обновление slug (URL) для тенанта (только суперадмин)'''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }

    # КРИТИЧНО: только super_admin может менять slug тенантов
    authorized, payload, error_response = require_auth(event)
    if not authorized:
        return error_response
    
    user_role = payload.get('role')
    if user_role != 'super_admin':
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Access denied: super_admin role required'})
        }

    try:
        body = json.loads(event.get('body', '{}'))
        tenant_id = body.get('tenant_id')
        new_slug = body.get('slug', '').strip().lower()

        if not tenant_id or not new_slug:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'tenant_id и slug обязательны'})
            }

        # Валидация slug (только буквы, цифры, дефис)
        if not all(c.isalnum() or c == '-' for c in new_slug):
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Slug может содержать только буквы, цифры и дефис'})
            }

        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Проверка на уникальность slug
        cur.execute("""
            SELECT id FROM t_p56134400_telegram_ai_bot_pdf.tenants 
            WHERE slug = %s AND id != %s
        """, (new_slug, tenant_id))
        
        if cur.fetchone():
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Slug "{new_slug}" уже используется другим ботом'})
            }

        # Обновляем slug
        cur.execute("""
            UPDATE t_p56134400_telegram_ai_bot_pdf.tenants 
            SET slug = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
            RETURNING slug
        """, (new_slug, tenant_id))
        
        result = cur.fetchone()
        conn.commit()

        if not result:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Тенант не найден'})
            }

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'slug': result['slug'],
                'message': f'URL обновлен: /{result["slug"]}'
            })
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()