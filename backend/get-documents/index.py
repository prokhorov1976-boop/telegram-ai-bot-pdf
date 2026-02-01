import json
import os
import psycopg2
import sys
sys.path.insert(0, '/function/code/shared')
from auth_middleware import get_tenant_id_from_request

def handler(event: dict, context) -> dict:
    """Получение списка всех документов"""
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
        print(f"🔍 DEBUG get-documents: headers={event.get('headers', {})}, queryParams={event.get('queryStringParameters', {})}")
        tenant_id, auth_error = get_tenant_id_from_request(event)
        if auth_error:
            print(f"❌ AUTH ERROR in get-documents: {auth_error}")
            return auth_error
        print(f"✅ AUTH SUCCESS in get-documents: tenant_id={tenant_id}")
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        cur.execute("""
            SELECT id, file_name, file_size_bytes, pages, category, status, uploaded_at, file_key
            FROM t_p56134400_telegram_ai_bot_pdf.tenant_documents
            WHERE tenant_id = %s
            ORDER BY uploaded_at DESC
        """, (tenant_id,))
        
        rows = cur.fetchall()
        documents = []
        
        aws_access_key_id = os.environ.get('AWS_ACCESS_KEY_ID', '')
        
        for row in rows:
            size_bytes = row[2]
            if size_bytes and size_bytes > 0:
                if size_bytes < 1024 * 1024:
                    size_kb = size_bytes / 1024
                    size_str = f"{size_kb:.0f} КБ"
                else:
                    size_mb = size_bytes / 1024 / 1024
                    size_str = f"{size_mb:.1f} МБ"
            else:
                size_str = "—"
            
            file_key = row[7]
            file_url = None
            if file_key and aws_access_key_id:
                file_url = f"https://cdn.poehali.dev/projects/{aws_access_key_id}/bucket/{file_key}"
            
            doc = {
                'id': row[0],
                'name': row[1],
                'size': size_str,
                'pages': row[3] or 0,
                'category': row[4] or 'Общая',
                'status': row[5],
                'uploadedAt': row[6].strftime('%Y-%m-%d') if row[6] else None,
                'fileUrl': file_url
            }
            documents.append(doc)

        cur.close()
        conn.close()

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'documents': documents}),
            'isBase64Encoded': False
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }