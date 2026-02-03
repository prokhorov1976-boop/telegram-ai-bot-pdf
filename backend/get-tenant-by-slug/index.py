import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    """Получить tenant_id и tariff_id по slug, обновить настройки тенанта"""
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }

    conn = None
    cur = None
    
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor(cursor_factory=RealDictCursor)
        schema = 't_p56134400_telegram_ai_bot_pdf'

        if method == 'GET':
            query_params = event.get('queryStringParameters') or {}
            slug = query_params.get('slug')
            tenant_id = query_params.get('tenant_id')
            
            if slug:
                cur.execute(f"""
                    SELECT id, name, slug, tariff_id
                    FROM {schema}.tenants
                    WHERE slug = %s
                """, (slug,))
            elif tenant_id:
                cur.execute(f"""
                    SELECT id, name, slug, tariff_id, 
                           voximplant_enabled, voximplant_phone_number, 
                           voximplant_greeting, voximplant_rule_id
                    FROM {schema}.tenants
                    WHERE id = %s
                """, (tenant_id,))
            else:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'slug or tenant_id parameter required'}),
                    'isBase64Encoded': False
                }
            
            row = cur.fetchone()
            
            if not row:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Tenant not found'}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'tenant': dict(row)}),
                'isBase64Encoded': False
            }

        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            tenant_id = body.get('tenant_id')
            
            if not tenant_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'tenant_id required'}),
                    'isBase64Encoded': False
                }

            update_fields = []
            update_values = []
            
            if 'voximplant_enabled' in body:
                update_fields.append('voximplant_enabled = %s')
                update_values.append(body['voximplant_enabled'])
            
            if 'voximplant_phone_number' in body:
                update_fields.append('voximplant_phone_number = %s')
                update_values.append(body['voximplant_phone_number'])
            
            if 'voximplant_greeting' in body:
                update_fields.append('voximplant_greeting = %s')
                update_values.append(body['voximplant_greeting'])
            
            if 'voximplant_rule_id' in body:
                update_fields.append('voximplant_rule_id = %s')
                update_values.append(body['voximplant_rule_id'])
            
            if not update_fields:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'No fields to update'}),
                    'isBase64Encoded': False
                }
            
            update_values.append(tenant_id)
            update_query = f"""
                UPDATE {schema}.tenants 
                SET {', '.join(update_fields)}
                WHERE id = %s
                RETURNING id
            """
            
            cur.execute(update_query, update_values)
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'Tenant updated'}),
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
        if conn:
            conn.rollback()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()