import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import csv
from io import StringIO

def handler(event: dict, context) -> dict:
    """API для управления логами согласий продаж"""
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }

    try:
        # Проверка авторизации суперадмина
        import jwt
        headers = event.get('headers', {})
        auth_header = headers.get('X-Authorization') or headers.get('Authorization') or headers.get('authorization') or ''
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Unauthorized'}),
                'isBase64Encoded': False
            }
        
        token = auth_header.replace('Bearer ', '')
        jwt_secret = os.environ.get('JWT_SECRET', 'default-jwt-secret-change-in-production')
        
        try:
            payload = jwt.decode(token, jwt_secret, algorithms=['HS256'])
            user_role = payload.get('role')
            
            if user_role != 'super_admin':
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Super admin access required'}),
                    'isBase64Encoded': False
                }
        except jwt.ExpiredSignatureError:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Token expired'}),
                'isBase64Encoded': False
            }
        except jwt.InvalidTokenError:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid token'}),
                'isBase64Encoded': False
            }

        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        schema = 't_p56134400_telegram_ai_bot_pdf'
        
        query_params = event.get('queryStringParameters') or {}
        action = query_params.get('action', 'list')

        if method == 'GET' and action == 'list':
            # Получить все логи согласий
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            cur.execute(f"""
                SELECT id, session_id, email, tenant_name, tariff_id, 
                       consent_text, ip_address, user_agent, created_at, requires_fz152
                FROM {schema}.sales_consent_logs
                ORDER BY created_at DESC
                LIMIT 1000
            """)
            
            rows = cur.fetchall()
            consents = []
            
            for row in rows:
                consent = dict(row)
                consent['created_at'] = consent['created_at'].isoformat() if consent['created_at'] else None
                consents.append(consent)
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'consents': consents}),
                'isBase64Encoded': False
            }

        elif method == 'GET' and action == 'export':
            # Экспорт в CSV
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            cur.execute(f"""
                SELECT id, session_id, email, tenant_name, tariff_id, 
                       consent_text, ip_address, user_agent, created_at, requires_fz152
                FROM {schema}.sales_consent_logs
                ORDER BY created_at DESC
            """)
            
            rows = cur.fetchall()
            
            # Создаем CSV
            output = StringIO()
            writer = csv.writer(output)
            
            # Заголовки
            writer.writerow(['ID', 'Session ID', 'Email', 'Tenant Name', 'Tariff ID', 'IP Address', 'User Agent', 'Requires FZ152', 'Consent Text', 'Created At'])
            
            # Данные
            for row in rows:
                writer.writerow([
                    row['id'],
                    row['session_id'] or '',
                    row['email'],
                    row['tenant_name'] or '',
                    row['tariff_id'] or '',
                    row['ip_address'] or '',
                    row['user_agent'] or '',
                    'Да' if row.get('requires_fz152') else 'Нет',
                    row['consent_text'][:100] + '...' if len(row['consent_text']) > 100 else row['consent_text'],
                    row['created_at'].isoformat() if row['created_at'] else ''
                ])
            
            csv_content = output.getvalue()
            output.close()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': 'attachment; filename="consent_logs.csv"',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': csv_content,
                'isBase64Encoded': False
            }

        elif method == 'POST':
            # Сохранить новый лог согласия (публичный endpoint для формы продажи)
            body = json.loads(event.get('body', '{}'))
            
            email = body.get('email')
            tenant_name = body.get('tenant_name')
            tariff_id = body.get('tariff_id')
            consent_text = body.get('consent_text')
            session_id = body.get('session_id')
            
            # Получаем IP и User-Agent из заголовков
            request_context = event.get('requestContext', {})
            identity = request_context.get('identity', {})
            ip_address = identity.get('sourceIp', '')
            user_agent = identity.get('userAgent', '')
            
            if not email or not consent_text:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'email and consent_text required'}),
                    'isBase64Encoded': False
                }
            
            cur = conn.cursor()
            
            requires_fz152 = body.get('requires_fz152', False)
            
            cur.execute(f"""
                INSERT INTO {schema}.sales_consent_logs 
                (session_id, email, tenant_name, tariff_id, consent_text, ip_address, user_agent, requires_fz152)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (session_id, email, tenant_name, tariff_id, consent_text, ip_address, user_agent, requires_fz152))
            
            consent_id = cur.fetchone()[0]
            conn.commit()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'consent_id': consent_id}),
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
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }