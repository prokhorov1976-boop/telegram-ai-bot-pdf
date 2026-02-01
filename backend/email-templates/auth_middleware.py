import os
import jwt
import json
from typing import Optional, Dict, Tuple

def verify_jwt_token(token: str) -> Tuple[bool, Optional[Dict], Optional[str]]:
    """
    Проверяет JWT токен и возвращает payload
    
    Returns:
        (success: bool, payload: dict or None, error: str or None)
    """
    try:
        jwt_secret = os.environ.get('JWT_SECRET', 'default-jwt-secret-change-in-production')
        payload = jwt.decode(token, jwt_secret, algorithms=['HS256'])
        return True, payload, None
    except jwt.ExpiredSignatureError:
        return False, None, 'Token expired'
    except jwt.InvalidTokenError:
        return False, None, 'Invalid token'
    except Exception as e:
        return False, None, str(e)

def extract_token_from_headers(headers: Dict) -> Optional[str]:
    """
    Извлекает JWT токен из заголовков Authorization
    Поддерживает форматы:
    - Authorization: Bearer <token>
    - X-Authorization: Bearer <token> (после прокси)
    """
    auth_header = headers.get('Authorization') or headers.get('authorization')
    x_auth_header = headers.get('X-Authorization') or headers.get('x-authorization')
    
    token_header = auth_header or x_auth_header
    
    if not token_header:
        return None
    
    if token_header.startswith('Bearer '):
        return token_header[7:]
    
    return token_header

def require_auth(event: dict) -> Tuple[bool, Optional[Dict], Dict]:
    """
    Middleware для проверки авторизации
    
    Returns:
        (authorized: bool, user_payload: dict or None, error_response: dict)
    """
    headers = event.get('headers', {})
    token = extract_token_from_headers(headers)
    
    if not token:
        return False, None, {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Authorization required'}),
            'isBase64Encoded': False
        }
    
    success, payload, error = verify_jwt_token(token)
    
    if not success:
        return False, None, {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': error or 'Invalid token'}),
            'isBase64Encoded': False
        }
    
    return True, payload, {}
