import jwt
import json
import os

SECRET_KEY = os.environ.get('JWT_SECRET', 'your-secret-key-here')

def get_tenant_id_from_request(event: dict):
    """Извлекает tenant_id из JWT токена или query параметра (для суперадмина)"""
    try:
        # Сначала проверяем query параметр (для суперадмина)
        query_params = event.get('queryStringParameters', {}) or {}
        tenant_id_param = query_params.get('tenant_id')
        
        auth_header = event.get('headers', {}).get('X-Authorization', '')
        if not auth_header:
            auth_header = event.get('headers', {}).get('authorization', '')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return None, {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Missing or invalid authorization header'}),
                'isBase64Encoded': False
            }
        
        token = auth_header.replace('Bearer ', '')
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        
        # Если это суперадмин с query параметром - используем его
        if payload.get('role') == 'super_admin' and tenant_id_param:
            return int(tenant_id_param), None
        
        # Иначе берём из токена (поддерживаем оба формата: tenant_id и tenantId)
        tenant_id = payload.get('tenant_id') or payload.get('tenantId')
        
        if not tenant_id:
            return None, {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid token: missing tenant_id'}),
                'isBase64Encoded': False
            }
        
        return tenant_id, None
        
    except jwt.ExpiredSignatureError:
        return None, {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Token expired'}),
            'isBase64Encoded': False
        }
    except jwt.InvalidTokenError:
        return None, {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid token'}),
            'isBase64Encoded': False
        }