import json
import os
import psycopg2
from auth_middleware import require_auth

def handler(event: dict, context) -> dict:
    """Управление настройками эмбеддингов для суперадмина"""
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

    try:
        print(f"[manage-embeddings] Method: {method}")
        print(f"[manage-embeddings] Headers: {event.get('headers', {})}")
        print(f"[manage-embeddings] Query params: {event.get('queryStringParameters', {})}")
        
        # Проверка авторизации
        authorized, payload, auth_error = require_auth(event)
        if not authorized:
            print(f"[manage-embeddings] Auth failed: {auth_error}")
            return auth_error

        # Проверка что пользователь - суперадмин
        user_role = payload.get('role')
        user_tenant_id = payload.get('tenant_id')
        
        print(f"[manage-embeddings] User role: {user_role}, tenant_id: {user_tenant_id}")
        
        if user_role != 'super_admin':
            print(f"[manage-embeddings] Access denied - not super admin")
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Access denied. Super admin only'}),
                'isBase64Encoded': False
            }

        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        print(f"[manage-embeddings] DB connected successfully")

        if method == 'GET':
            query_params = event.get('queryStringParameters') or {}
            target_tenant_id = query_params.get('tenant_id')

            if target_tenant_id:
                cur.execute("""
                    SELECT 
                        ts.embedding_provider,
                        ts.embedding_doc_model,
                        ts.embedding_query_model,
                        t.fz152_enabled
                    FROM t_p56134400_telegram_ai_bot_pdf.tenant_settings ts
                    JOIN t_p56134400_telegram_ai_bot_pdf.tenants t ON t.id = ts.tenant_id
                    WHERE ts.tenant_id = %s
                """, (target_tenant_id,))
                row = cur.fetchone()
                
                if not row:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Tenant not found'}),
                        'isBase64Encoded': False
                    }

                result = {
                    'embedding_provider': row[0] or 'yandex',
                    'embedding_doc_model': row[1] or 'text-search-doc',
                    'embedding_query_model': row[2] or 'text-search-query',
                    'fz152_enabled': row[3] if row[3] is not None else False
                }

                cur.close()
                conn.close()

                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'tenants': [result]}),
                    'isBase64Encoded': False
                }
            else:
                cur.execute("""
                    SELECT 
                        t.id,
                        t.name,
                        t.fz152_enabled,
                        ts.embedding_provider,
                        ts.embedding_doc_model,
                        ts.embedding_query_model
                    FROM t_p56134400_telegram_ai_bot_pdf.tenants t
                    LEFT JOIN t_p56134400_telegram_ai_bot_pdf.tenant_settings ts ON t.id = ts.tenant_id
                    WHERE t.is_super_admin = false
                    ORDER BY t.name
                """)
                rows = cur.fetchall()
                
                tenants = []
                for row in rows:
                    tenants.append({
                        'id': row[0],
                        'name': row[1],
                        'fz152_enabled': row[2] if row[2] is not None else False,
                        'embedding_provider': row[3] or 'yandex',
                        'embedding_doc_model': row[4] or 'text-search-doc',
                        'embedding_query_model': row[5] or 'text-search-query'
                    })

                cur.close()
                conn.close()

                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'tenants': tenants}),
                    'isBase64Encoded': False
                }

        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            target_tenant_id = body.get('tenant_id')
            embedding_provider = body.get('embedding_provider')
            embedding_doc_model = body.get('embedding_doc_model')
            embedding_query_model = body.get('embedding_query_model')

            if not target_tenant_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'tenant_id required'}),
                    'isBase64Encoded': False
                }

            cur.execute("""
                SELECT fz152_enabled 
                FROM t_p56134400_telegram_ai_bot_pdf.tenants 
                WHERE id = %s
            """, (target_tenant_id,))
            tenant_row = cur.fetchone()
            
            if not tenant_row:
                cur.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Tenant not found'}),
                    'isBase64Encoded': False
                }

            fz152_enabled = tenant_row[0]
            if fz152_enabled and embedding_provider != 'yandex':
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Cannot change embedding provider for tenants with 152-ФЗ enabled'}),
                    'isBase64Encoded': False
                }

            cur.execute("""
                UPDATE t_p56134400_telegram_ai_bot_pdf.tenant_settings
                SET 
                    embedding_provider = %s,
                    embedding_doc_model = %s,
                    embedding_query_model = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE tenant_id = %s
            """, (embedding_provider, embedding_doc_model, embedding_query_model, target_tenant_id))

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
            cur.close()
            conn.close()
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }

    except Exception as e:
        print(f"ERROR in manage-embeddings: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }