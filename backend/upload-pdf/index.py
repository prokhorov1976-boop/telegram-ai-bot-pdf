import json
import os
import base64
import boto3
import psycopg2
from datetime import datetime
import sys
sys.path.insert(0, '/function/code/shared')
from auth_middleware import get_tenant_id_from_request
sys.path.append('/function/code')
from timezone_helper import moscow_naive

def handler(event: dict, context) -> dict:
    """Загрузка PDF файла в S3 и сохранение метаданных в БД"""
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
        print(f"🔍 DEBUG upload-pdf: headers={event.get('headers', {})}, queryParams={event.get('queryStringParameters', {})}")
        tenant_id, auth_error = get_tenant_id_from_request(event)
        if auth_error:
            print(f"❌ AUTH ERROR in upload-pdf: {auth_error}")
            return auth_error
        print(f"✅ AUTH SUCCESS in upload-pdf: tenant_id={tenant_id}")
        
        # Проверяем наличие API ключей ДО загрузки файла
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        cur.execute("""
            SELECT COUNT(*) FROM t_p56134400_telegram_ai_bot_pdf.tenant_api_keys 
            WHERE tenant_id = %s AND provider = 'yandex' AND key_name = 'api_key'
        """, (tenant_id,))
        
        has_api_key = cur.fetchone()[0] > 0
        cur.close()
        conn.close()
        
        if not has_api_key:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Для загрузки документов необходимо добавить Yandex API ключи в разделе «AI» → «API Ключи»'}),
                'isBase64Encoded': False
            }
        
        body = json.loads(event.get('body', '{}'))
        file_name = body.get('fileName')
        file_base64 = body.get('fileData')
        category = body.get('category', 'Общая')

        if not file_name or not file_base64:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'fileName and fileData required'}),
                'isBase64Encoded': False
            }

        if not file_name.lower().endswith('.pdf'):
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Только PDF файлы разрешены'}),
                'isBase64Encoded': False
            }

        file_data = base64.b64decode(file_base64)
        file_size = len(file_data)
        
        max_size = 10 * 1024 * 1024  # 10 MB
        if file_size > max_size:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Файл слишком большой. Максимальный размер: 10 МБ'}),
                'isBase64Encoded': False
            }
        
        if not file_data.startswith(b'%PDF'):
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Файл не является PDF документом'}),
                'isBase64Encoded': False
            }
        file_key = f'documents/{moscow_naive().strftime("%Y%m%d_%H%M%S")}_{file_name}'

        s3 = boto3.client('s3',
            endpoint_url='https://bucket.poehali.dev',
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
        )
        
        s3.put_object(
            Bucket='files',
            Key=file_key,
            Body=file_data,
            ContentType='application/pdf'
        )

        cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{file_key}"

        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        cur.execute("""
            INSERT INTO t_p56134400_telegram_ai_bot_pdf.tenant_documents (tenant_id, file_name, file_key, file_size_bytes, category, status)
            VALUES (%s, %s, %s, %s, %s, 'processing')
            RETURNING id
        """, (tenant_id, file_name, file_key, file_size, category))
        
        doc_id = cur.fetchone()[0]
        print(f"📄 CREATED DOCUMENT: doc_id={doc_id}, tenant_id={tenant_id}, file_name={file_name}")
        conn.commit()
        print(f"✅ COMMITTED to DB: doc_id={doc_id}")
        cur.close()
        conn.close()

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'documentId': doc_id,
                'fileName': file_name,
                'fileKey': file_key,
                'cdnUrl': cdn_url,
                'status': 'processing'
            }),
            'isBase64Encoded': False
        }

    except Exception as e:
        print(f"ERROR in upload-pdf: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }