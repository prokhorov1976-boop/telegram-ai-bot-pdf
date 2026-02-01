"""Middleware для проверки JWT токена пользователя"""
import os
import jwt
import psycopg2

def get_authenticated_user(event: dict) -> dict | None:
    """
    Извлекает и проверяет JWT токен из заголовка Authorization.
    Возвращает данные пользователя или None.
    """
    try:
        headers = event.get('headers', {})
        auth_header = headers.get('X-Authorization', headers.get('authorization', ''))
        
        if not auth_header:
            return None
        
        # Извлекаем токен (формат: "Bearer <token>")
        token = auth_header.replace('Bearer ', '').replace('bearer ', '')
        
        # Декодируем JWT
        jwt_secret = os.environ.get('JWT_SECRET')
        if not jwt_secret:
            print('JWT_SECRET не установлен')
            return None
        
        payload = jwt.decode(token, jwt_secret, algorithms=['HS256'])
        user_id = payload.get('user_id')  # Исправлено с userId на user_id
        role = payload.get('role')
        tenant_id = payload.get('tenant_id')
        
        if not user_id:
            return None
        
        # Возвращаем данные из JWT (не делаем лишний запрос в БД)
        return {
            'id': user_id,
            'role': role,
            'is_super_admin': role == 'super_admin',
            'tenant_id': tenant_id
        }
        
    except jwt.ExpiredSignatureError:
        print('JWT токен истёк')
        return None
    except jwt.InvalidTokenError as e:
        print(f'Невалидный JWT токен: {e}')
        return None
    except Exception as e:
        print(f'Ошибка аутентификации: {e}')
        return None