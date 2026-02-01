"""Утилита для работы с API ключами клиентов"""
import os
import json
import psycopg2

def get_tenant_id_by_bot_token(bot_token: str) -> int | None:
    """
    Определяет tenant_id по bot_token из query параметра или пути URL.
    
    Args:
        bot_token: Bot token (чистый токен или путь /bot<TOKEN>)
    
    Returns:
        tenant_id или None если не найдено
    """
    try:
        if not bot_token:
            return None
        
        # Если токен в формате /bot<TOKEN>, извлекаем его
        if bot_token.startswith('/bot'):
            bot_token = bot_token[4:]
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        cur.execute("""
            SELECT tenant_id
            FROM t_p56134400_telegram_ai_bot_pdf.tenant_api_keys
            WHERE provider = 'telegram' 
              AND key_name = 'bot_token' 
              AND key_value = %s
              AND is_active = true
        """, (bot_token,))
        
        row = cur.fetchone()
        cur.close()
        conn.close()
        
        return row[0] if row else None
        
    except Exception as e:
        print(f'Error determining tenant_id: {e}')
        return None

def get_tenant_api_key(tenant_id: int, provider: str, key_name: str) -> tuple[str | None, dict | None]:
    """
    Получить API ключ клиента из tenant_api_keys.
    
    Args:
        tenant_id: ID клиента
        provider: Провайдер (yandexgpt, openai, deepseek, telegram)
        key_name: Название ключа (api_key, folder_id, bot_token)
    
    Returns:
        (key_value, error_response) - либо значение ключа, либо HTTP ошибка
    """
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        cur.execute("""
            SELECT key_value
            FROM t_p56134400_telegram_ai_bot_pdf.tenant_api_keys
            WHERE tenant_id = %s 
              AND provider = %s 
              AND key_name = %s 
              AND is_active = true
        """, (tenant_id, provider, key_name))
        
        row = cur.fetchone()
        cur.close()
        conn.close()
        
        if not row:
            error_msg = f"API ключ не настроен: {provider}.{key_name}. Добавьте ключи в админ-панели."
            return None, {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': error_msg}),
                'isBase64Encoded': False
            }
        
        return row[0], None
        
    except Exception as e:
        return None, {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Ошибка чтения API ключей: {str(e)}'}),
            'isBase64Encoded': False
        }