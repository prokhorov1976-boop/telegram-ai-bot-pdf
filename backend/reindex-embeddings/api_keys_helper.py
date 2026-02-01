import json
import psycopg2
import os
from typing import Tuple, Optional

def get_tenant_api_key(tenant_id: int, provider: str, key_name: str) -> Tuple[Optional[str], Optional[dict]]:
    """
    Получает API ключ для тенанта из базы данных
    
    Args:
        tenant_id: ID тенанта
        provider: Провайдер (yandex, openrouter, proxyapi)
        key_name: Имя ключа (api_key, folder_id и т.д.)
    
    Returns:
        (key_value: str or None, error_response: dict or None)
    """
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        cur.execute("""
            SELECT key_value FROM t_p56134400_telegram_ai_bot_pdf.tenant_api_keys
            WHERE tenant_id = %s AND provider = %s AND key_name = %s AND is_active = true
            ORDER BY created_at DESC
            LIMIT 1
        """, (tenant_id, provider, key_name))
        
        result = cur.fetchone()
        cur.close()
        conn.close()
        
        if result:
            return result[0], None
        else:
            return None, {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'{provider} {key_name} not configured for tenant'}),
                'isBase64Encoded': False
            }
    except Exception as e:
        return None, {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Database error: {str(e)}'}),
            'isBase64Encoded': False
        }
