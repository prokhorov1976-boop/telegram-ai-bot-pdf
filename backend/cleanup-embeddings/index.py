import json
import os
import psycopg2
from auth_middleware import require_auth

def handler(event: dict, context) -> dict:
    """Очистка устаревших эмбеддингов удалённых документов"""
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization, X-API-Key'
            },
            'body': '',
            'isBase64Encoded': False
        }

    try:
        # Проверка API ключа или JWT (для cron-задач и super_admin)
        headers = event.get('headers', {})
        api_key = headers.get('X-API-Key') or headers.get('x-api-key')
        
        # Если есть API ключ - проверяем его
        if api_key:
            internal_key = os.environ.get('INTERNAL_API_KEY')
            if not internal_key or api_key != internal_key:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid API key'}),
                    'isBase64Encoded': False
                }
        else:
            # Если нет API ключа - проверяем JWT (super_admin)
            authorized, payload, error_response = require_auth(event)
            if not authorized:
                return error_response
            
            user_role = payload.get('role')
            if user_role != 'super_admin':
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Super admin access or API key required'}),
                    'isBase64Encoded': False
                }
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        cur.execute("""
            DELETE FROM t_p56134400_telegram_ai_bot_pdf.tenant_chunks
            WHERE document_id NOT IN (
                SELECT id FROM t_p56134400_telegram_ai_bot_pdf.tenant_documents
            )
        """)
        
        deleted_tenant_chunks = cur.rowcount
        
        cur.execute("""
            DELETE FROM t_p56134400_telegram_ai_bot_pdf.document_chunks
            WHERE document_id NOT IN (
                SELECT id FROM t_p56134400_telegram_ai_bot_pdf.documents
            )
        """)
        
        deleted_count = deleted_tenant_chunks + cur.rowcount
        conn.commit()
        
        cur.close()
        conn.close()
        
        result = {
            'ok': True,
            'deleted_embeddings': deleted_count,
            'message': f'Удалено {deleted_count} устаревших эмбеддингов'
        }
        
        print(f'Cleanup completed: {json.dumps(result)}')
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(result),
            'isBase64Encoded': False
        }

    except Exception as e:
        print(f'Error cleaning up embeddings: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }