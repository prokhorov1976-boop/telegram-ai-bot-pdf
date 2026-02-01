import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    """Инициализация настроек форматирования для нового тенанта (внутренняя функция)"""
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
        body_str = event.get('body', '{}')
        body = json.loads(body_str) if isinstance(body_str, str) else body_str
        tenant_id = body.get('tenant_id') if isinstance(body, dict) else None
        
        if not tenant_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'tenant_id обязателен'}),
                'isBase64Encoded': False
            }
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        # Проверяем, есть ли уже настройки
        cur.execute("""
            SELECT COUNT(*) FROM t_p56134400_telegram_ai_bot_pdf.messenger_formatting_settings
            WHERE tenant_id = %s
        """, (tenant_id,))
        
        count = cur.fetchone()[0]
        
        if count > 0:
            cur.close()
            conn.close()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Настройки уже существуют', 'count': count}),
                'isBase64Encoded': False
            }
        
        # Создаём дефолтные настройки для всех мессенджеров
        default_telegram_emoji = {
            "номер": "🏨", "стоимость": "💰", "цена": "💰", "завтрак": "🍳",
            "обед": "🍽", "ужин": "🍴", "время": "🕐", "адрес": "📍",
            "телефон": "📞", "пляж": "🏖", "бассейн": "🏊", "сауна": "🧖",
            "трансфер": "🚗", "анимация": "🎭"
        }
        
        default_max_emoji = {
            "Стандарт": "🏨", "Комфорт": "✨", "Люкс": "👑",
            "завтрак": "🍳", "без питания": "🍽", "полный пансион": "🍴", "руб": "💰"
        }
        
        cur.execute("""
            INSERT INTO t_p56134400_telegram_ai_bot_pdf.messenger_formatting_settings
                (tenant_id, messenger, use_emoji, use_markdown, use_lists_formatting, 
                 custom_emoji_map, list_bullet_char, numbered_list_char)
            VALUES
                (%s, 'telegram', true, true, true, %s, '•', '▫️'),
                (%s, 'vk', true, false, true, '{}', '•', '▫️'),
                (%s, 'max', true, false, true, %s, '•', '▫️'),
                (%s, 'widget', true, false, true, '{}', '•', '▫️')
        """, (tenant_id, json.dumps(default_telegram_emoji), tenant_id, tenant_id, json.dumps(default_max_emoji), tenant_id))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'message': 'Настройки форматирования созданы', 'tenant_id': tenant_id}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        print(f'Error: {e}')
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }