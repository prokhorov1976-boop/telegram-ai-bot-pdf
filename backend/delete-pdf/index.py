import json
import os
import psycopg2
import boto3
import sys
sys.path.insert(0, '/function/code/shared')
from auth_middleware import get_tenant_id_from_request

def handler(event: dict, context) -> dict:
    """Удаление PDF документа и всех связанных данных"""
    method = event.get('httpMethod', 'DELETE')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }

    if method != 'DELETE':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }

    conn = None
    cur = None
    try:
        tenant_id, auth_error = get_tenant_id_from_request(event)
        if auth_error:
            return auth_error
        
        body = json.loads(event.get('body', '{}'))
        document_id = body.get('documentId')

        if not document_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'documentId required'}),
                'isBase64Encoded': False
            }

        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()

        cur.execute("""
            SELECT file_key FROM t_p56134400_telegram_ai_bot_pdf.tenant_documents 
            WHERE id = %s AND tenant_id = %s
        """, (document_id, tenant_id))
        result = cur.fetchone()

        if not result:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Document not found'}),
                'isBase64Encoded': False
            }

        file_key = result[0]

        s3 = boto3.client('s3',
            endpoint_url='https://bucket.poehali.dev',
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        )

        try:
            s3.delete_object(Bucket='files', Key=file_key)
        except Exception as s3_error:
            print(f"S3 delete warning: {s3_error}")

        # Используем транзакцию для атомарности
        try:
            cur.execute("BEGIN")
            
            cur.execute("""
                DELETE FROM t_p56134400_telegram_ai_bot_pdf.document_chunks 
                WHERE document_id = %s AND document_id IN (
                    SELECT id FROM t_p56134400_telegram_ai_bot_pdf.tenant_documents WHERE tenant_id = %s
                )
            """, (document_id, tenant_id))

            cur.execute("""
                DELETE FROM t_p56134400_telegram_ai_bot_pdf.tenant_chunks 
                WHERE document_id = %s AND tenant_id = %s
            """, (document_id, tenant_id))

            cur.execute("""
                DELETE FROM t_p56134400_telegram_ai_bot_pdf.tenant_documents 
                WHERE id = %s AND tenant_id = %s
            """, (document_id, tenant_id))

            conn.commit()
        except Exception as db_error:
            conn.rollback()
            raise

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'message': 'Document deleted successfully'
            }),
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