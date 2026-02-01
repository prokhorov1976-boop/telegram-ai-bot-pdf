"""
Управление подписками - получение информации о тарифе и подписке клиента
"""
import json
import os
import psycopg2
from datetime import datetime, timedelta
from decimal import Decimal
import sys
sys.path.append('/function/code')
from timezone_helper import moscow_naive

def handler(event: dict, context) -> dict:
    """Получение информации о подписке клиента или продление (для суперадмина)"""
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization'
            },
            'body': ''
        }
    
    # POST: Продление подписки суперадмином без оплаты
    if method == 'POST':
        try:
            import jwt
            headers = event.get('headers', {})
            auth_header = headers.get('X-Authorization') or headers.get('Authorization') or headers.get('authorization') or ''
            
            if not auth_header or not auth_header.startswith('Bearer '):
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Unauthorized'})
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
                        'body': json.dumps({'error': 'Super admin access required'})
                    }
            except jwt.InvalidTokenError:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid token'})
                }
            
            body = json.loads(event.get('body', '{}'))
            tenant_id = body.get('tenant_id')
            months = body.get('months', 1)
            
            if not tenant_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'tenant_id required'})
                }
            
            dsn = os.environ['DATABASE_URL']
            conn = psycopg2.connect(dsn)
            cur = conn.cursor()
            schema = 't_p56134400_telegram_ai_bot_pdf'
            
            # Получаем текущую дату окончания
            cur.execute(f"SELECT subscription_end_date FROM {schema}.tenants WHERE id = %s", (tenant_id,))
            row = cur.fetchone()
            
            if not row:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Tenant not found'})
                }
            
            current_end_date = row[0]
            
            # Вычисляем новую дату
            if current_end_date and isinstance(current_end_date, datetime):
                if current_end_date > moscow_naive():
                    new_end_date = current_end_date + timedelta(days=30 * months)
                else:
                    new_end_date = moscow_naive() + timedelta(days=30 * months)
            else:
                new_end_date = moscow_naive() + timedelta(days=30 * months)
            
            # Обновляем подписку
            cur.execute(f"""
                UPDATE {schema}.tenants
                SET subscription_end_date = %s, 
                    subscription_status = 'active',
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (new_end_date, tenant_id))
            conn.commit()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'new_end_date': new_end_date.isoformat(),
                    'message': f'Подписка продлена на {months} мес.'
                })
            }
            
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': str(e)})
            }
    
    # GET: Получение информации о подписке
    # Проверка авторизации для GET
    import jwt
    headers = event.get('headers', {})
    auth_header = headers.get('X-Authorization') or headers.get('Authorization') or headers.get('authorization') or ''
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Authorization required'})
        }
    
    token = auth_header.replace('Bearer ', '')
    jwt_secret = os.environ.get('JWT_SECRET', 'default-jwt-secret-change-in-production')
    
    try:
        payload = jwt.decode(token, jwt_secret, algorithms=['HS256'])
        user_role = payload.get('role')
        user_tenant_id = payload.get('tenant_id')
    except jwt.InvalidTokenError:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid token'})
        }
    
    query_params = event.get('queryStringParameters') or {}
    tenant_id = query_params.get('tenant_id')
    
    if not tenant_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'tenant_id обязателен'})
        }
    
    # Проверка доступа: tenant_admin видит только свой tenant_id
    if user_role == 'tenant_admin' and str(user_tenant_id) != tenant_id:
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Access denied: you can only view your own subscription'})
        }
    
    try:
        dsn = os.environ['DATABASE_URL']
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        # Получаем информацию о тенанте и его тарифе
        schema = 't_p56134400_telegram_ai_bot_pdf'
        cur.execute(f"""
            SELECT 
                t.id,
                t.name,
                t.tariff_id,
                t.subscription_end_date,
                tar.name as tariff_name,
                tar.renewal_price,
                tar.period
            FROM {schema}.tenants t
            LEFT JOIN {schema}.tariff_plans tar ON t.tariff_id = tar.id
            WHERE t.id = %s
        """, (tenant_id,))
        
        row = cur.fetchone()
        
        if not row:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Клиент не найден'})
            }
        
        tenant_name, tariff_id, end_date, tariff_name, renewal_price, period = row[1], row[2], row[3], row[4], row[5], row[6]
        
        # Вычисляем статус и оставшиеся дни
        if end_date:
            # end_date уже datetime объект из БД
            if isinstance(end_date, str):
                end_datetime = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            else:
                end_datetime = end_date
            
            now = moscow_naive()
            days_left = (end_datetime - now).days
            status = 'active' if days_left > 0 else 'expired'
            end_date_str = end_datetime.isoformat()
        else:
            days_left = 0
            status = 'no_subscription'
            end_date_str = None
        
        subscription = {
            'status': status,
            'end_date': end_date_str,
            'tariff_id': tariff_id,
            'tariff_name': tariff_name or 'Не указан',
            'renewal_price': float(renewal_price) if renewal_price is not None else 0,
            'days_left': max(0, days_left),
            'period': period or 'месяц'
        }
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'subscription': subscription})
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }