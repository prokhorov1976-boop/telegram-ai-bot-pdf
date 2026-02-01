import json
import os
import psycopg2
from email_utils import send_email

def handler(event: dict, context) -> dict:
    '''Отправка email по шаблону из БД с подстановкой переменных'''
    method = event.get('httpMethod', 'POST')
    
    # КРИТИЧНО: проверка секретного токена для внутренних вызовов
    headers = event.get('headers', {})
    internal_token = headers.get('X-Internal-Token') or headers.get('x-internal-token')
    expected_token = os.environ.get('INTERNAL_API_TOKEN')
    
    # Если установлен INTERNAL_API_TOKEN, проверяем его
    if expected_token and internal_token != expected_token:
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Unauthorized: invalid internal token'})
        }
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    body = json.loads(event.get('body', '{}'))
    template_key = body.get('template_key')
    to_email = body.get('to_email')
    variables = body.get('variables', {})
    
    if not template_key or not to_email:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Missing template_key or to_email'})
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'DATABASE_URL not configured'})
        }
    
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    try:
        cur.execute('SELECT subject, body FROM t_p56134400_telegram_ai_bot_pdf.email_templates WHERE template_key = %s', (template_key,))
        row = cur.fetchone()
        
        if not row:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Template not found: {template_key}'})
            }
        
        subject, body_html = row
        
        for key, value in variables.items():
            subject = subject.replace(f'{{{{{key}}}}}', str(value))
            body_html = body_html.replace(f'{{{{{key}}}}}', str(value))
        
        result = send_email(to_email, subject, body_html)
        
        if result['success']:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(result)
            }
        else:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(result)
            }
    
    finally:
        cur.close()
        conn.close()