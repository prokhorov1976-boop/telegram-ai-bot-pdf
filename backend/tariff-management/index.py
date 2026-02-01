import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    """API для управления тарифами (только для суперадмина)"""
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization, X-Set-Cookie',
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
        cur = conn.cursor(cursor_factory=RealDictCursor)
        schema = 't_p56134400_telegram_ai_bot_pdf'

        if method == 'GET':
            # Получить все тарифы
            cur.execute(f"""
                SELECT id, name, price, period, features, is_popular, is_active, 
                       sort_order, renewal_price, setup_fee, first_month_included, created_at, updated_at
                FROM {schema}.tariff_plans
                ORDER BY sort_order
            """)
            
            rows = cur.fetchall()
            tariffs = []
            
            for row in rows:
                tariff = dict(row)
                tariff['price'] = float(tariff['price']) if tariff['price'] else 0
                tariff['renewal_price'] = float(tariff['renewal_price']) if tariff['renewal_price'] else 0
                tariff['setup_fee'] = float(tariff['setup_fee']) if tariff['setup_fee'] else 0
                tariff['created_at'] = tariff['created_at'].isoformat() if tariff['created_at'] else None
                tariff['updated_at'] = tariff['updated_at'].isoformat() if tariff['updated_at'] else None
                tariffs.append(tariff)
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'tariffs': tariffs}),
                'isBase64Encoded': False
            }

        elif method == 'POST':
            # Изменить тариф у тенанта (action=change_tariff)
            query_params = event.get('queryStringParameters') or {}
            action = query_params.get('action')
            
            if action == 'change_tariff':
                body = json.loads(event.get('body', '{}'))
                tenant_id = body.get('tenant_id')
                new_tariff_id = body.get('new_tariff_id')
                
                if not tenant_id or not new_tariff_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'tenant_id and new_tariff_id required'}),
                        'isBase64Encoded': False
                    }
                
                # Проверяем, что тариф существует
                cur.execute(f"SELECT id FROM {schema}.tariff_plans WHERE id = %s", (new_tariff_id,))
                if not cur.fetchone():
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Tariff not found'}),
                        'isBase64Encoded': False
                    }
                
                # Обновляем тариф у тенанта
                cur.execute(f"""
                    UPDATE {schema}.tenants
                    SET tariff_id = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                """, (new_tariff_id, tenant_id))
                conn.commit()
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'Tariff changed successfully'}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Unknown action'}),
                'isBase64Encoded': False
            }

        elif method == 'PUT':
            # Обновить тариф
            body = json.loads(event.get('body', '{}'))
            tariff_id = body.get('id')
            
            if not tariff_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Tariff ID required'}),
                    'isBase64Encoded': False
                }
            
            # Собираем поля для обновления
            update_fields = []
            params = []
            
            if 'name' in body:
                update_fields.append('name = %s')
                params.append(body['name'])
            
            if 'price' in body:
                update_fields.append('price = %s')
                params.append(body['price'])
            
            if 'period' in body:
                update_fields.append('period = %s')
                params.append(body['period'])
            
            if 'setup_fee' in body:
                update_fields.append('setup_fee = %s')
                params.append(body['setup_fee'])
            
            if 'renewal_price' in body:
                update_fields.append('renewal_price = %s')
                params.append(body['renewal_price'])
            
            if 'first_month_included' in body:
                update_fields.append('first_month_included = %s')
                params.append(body['first_month_included'])
            
            if 'is_active' in body:
                update_fields.append('is_active = %s')
                params.append(body['is_active'])
            
            if not update_fields:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'No fields to update'}),
                    'isBase64Encoded': False
                }
            
            update_fields.append('updated_at = CURRENT_TIMESTAMP')
            params.append(tariff_id)
            
            query = f"""
                UPDATE {schema}.tariff_plans
                SET {', '.join(update_fields)}
                WHERE id = %s
            """
            
            cur.execute(query, params)
            conn.commit()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': f'Tariff {tariff_id} updated'}),
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