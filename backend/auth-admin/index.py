import json
import os
import hashlib
import psycopg2
import jwt
from datetime import datetime, timedelta
import sys
sys.path.append('/function/code')
from timezone_helper import moscow_naive

def handler(event: dict, context) -> dict:
    """Авторизация администратора с JWT токенами и защитой от брутфорса"""
    method = event.get('httpMethod', 'POST')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
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
        body = json.loads(event.get('body', '{}'))
        username = body.get('username', '')
        password = body.get('password', '')
        ip_address = event.get('requestContext', {}).get('identity', {}).get('sourceIp', 'unknown')

        if not username or not password:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'username and password required'}),
                'isBase64Encoded': False
            }

        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()

        cur.execute("""
            CREATE TABLE IF NOT EXISTS t_p56134400_telegram_ai_bot_pdf.login_attempts (
                id SERIAL PRIMARY KEY,
                ip_address VARCHAR(50),
                attempt_time TIMESTAMP DEFAULT NOW(),
                success BOOLEAN
            )
        """)
        conn.commit()

        lockout_duration = timedelta(minutes=15)
        max_attempts = 5
        attempt_window = timedelta(minutes=10)

        cur.execute("""
            SELECT COUNT(*) 
            FROM t_p56134400_telegram_ai_bot_pdf.login_attempts 
            WHERE ip_address = %s 
            AND success = false 
            AND attempt_time > %s
        """, (ip_address, moscow_naive() - attempt_window))
        
        failed_attempts = cur.fetchone()[0]

        if failed_attempts >= max_attempts:
            cur.execute("""
                SELECT attempt_time 
                FROM t_p56134400_telegram_ai_bot_pdf.login_attempts 
                WHERE ip_address = %s 
                AND success = false 
                ORDER BY attempt_time DESC 
                LIMIT 1
            """, (ip_address,))
            
            last_attempt = cur.fetchone()
            if last_attempt:
                time_since_last = moscow_naive() - last_attempt[0]
                if time_since_last < lockout_duration:
                    remaining_time = int((lockout_duration - time_since_last).total_seconds() / 60)
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 429,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'error': f'Слишком много попыток входа. Попробуйте через {remaining_time} мин.',
                            'remainingMinutes': remaining_time
                        }),
                        'isBase64Encoded': False
                    }

        # Ищем пользователя в базе и получаем tariff_id из tenants
        cur.execute("""
            SELECT u.id, u.username, u.password_hash, u.role, u.tenant_id, u.is_active, t.tariff_id
            FROM t_p56134400_telegram_ai_bot_pdf.admin_users u
            LEFT JOIN t_p56134400_telegram_ai_bot_pdf.tenants t ON u.tenant_id = t.id
            WHERE u.username = %s AND u.is_active = true
        """, (username,))
        
        user_row = cur.fetchone()
        
        if not user_row:
            # Записываем неудачную попытку
            cur.execute("""
                INSERT INTO t_p56134400_telegram_ai_bot_pdf.login_attempts (ip_address, success)
                VALUES (%s, false)
            """, (ip_address,))
            conn.commit()
            cur.close()
            conn.close()
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Неверный логин или пароль'}),
                'isBase64Encoded': False
            }
        
        user_id, username_db, password_hash_db, role, tenant_id, is_active, tariff_id = user_row
        password_hash = hashlib.sha256(password.encode()).hexdigest()

        if password_hash == password_hash_db:
            # Генерируем JWT токен
            jwt_secret = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
            token_payload = {
                'user_id': user_id,
                'username': username_db,
                'role': role,
                'tenant_id': tenant_id,
                'exp': moscow_naive() + timedelta(days=7)
            }
            jwt_token = jwt.encode(token_payload, jwt_secret, algorithm='HS256')
            
            # Обновляем last_login
            cur.execute("""
                UPDATE t_p56134400_telegram_ai_bot_pdf.admin_users
                SET last_login_at = NOW()
                WHERE id = %s
            """, (user_id,))
            
            cur.execute("""
                INSERT INTO t_p56134400_telegram_ai_bot_pdf.login_attempts (ip_address, success)
                VALUES (%s, true)
            """, (ip_address,))
            
            conn.commit()
            cur.close()
            conn.close()

            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'token': jwt_token,
                    'user': {
                        'id': user_id,
                        'username': username_db,
                        'role': role,
                        'tenant_id': tenant_id,
                        'tariff_id': tariff_id
                    }
                }),
                'isBase64Encoded': False
            }
        else:
            cur.execute("""
                INSERT INTO t_p56134400_telegram_ai_bot_pdf.login_attempts (ip_address, success)
                VALUES (%s, false)
            """, (ip_address,))
            conn.commit()

            cur.execute("""
                SELECT COUNT(*) 
                FROM t_p56134400_telegram_ai_bot_pdf.login_attempts 
                WHERE ip_address = %s 
                AND success = false 
                AND attempt_time > %s
            """, (ip_address, moscow_naive() - attempt_window))
            
            current_failed = cur.fetchone()[0]
            attempts_left = max_attempts - current_failed

            cur.close()
            conn.close()

            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'error': 'Неверный пароль',
                    'attemptsLeft': max(0, attempts_left)
                }),
                'isBase64Encoded': False
            }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }