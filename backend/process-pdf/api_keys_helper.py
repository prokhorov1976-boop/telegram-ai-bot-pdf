"""Утилита для работы с API ключами клиентов"""
import os
import json
import psycopg2

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
