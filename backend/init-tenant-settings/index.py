import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    """Инициализация всех настроек для нового тенанта (копирование из tenant_id=1)"""
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
        tenant_id = body.get('tenant_id')
        
        if not tenant_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'tenant_id required'}),
                'isBase64Encoded': False
            }
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor(cursor_factory=RealDictCursor)
        schema = 't_p56134400_telegram_ai_bot_pdf'
        
        # Проверяем существует ли тенант
        cur.execute(f"SELECT id FROM {schema}.tenants WHERE id = %s", (tenant_id,))
        if not cur.fetchone():
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Tenant {tenant_id} not found'}),
                'isBase64Encoded': False
            }
        
        copied_settings = {}
        
        # 1. Копируем messenger_formatting_settings (3 мессенджера)
        try:
            cur.execute(f"""
                INSERT INTO {schema}.messenger_formatting_settings 
                    (tenant_id, messenger, use_emoji, use_markdown, use_lists_formatting, 
                     custom_emoji_map, list_bullet_char, numbered_list_char)
                SELECT %s, messenger, use_emoji, use_markdown, use_lists_formatting,
                       custom_emoji_map, list_bullet_char, numbered_list_char
                FROM {schema}.messenger_formatting_settings
                WHERE tenant_id = 1
                ON CONFLICT (tenant_id, messenger) DO NOTHING
            """, (tenant_id,))
            copied_settings['messenger_formatting'] = cur.rowcount
        except Exception as e:
            print(f'Error copying messenger_formatting_settings: {e}')
            copied_settings['messenger_formatting'] = 'error'
        
        # 2. Копируем ai_settings table
        try:
            cur.execute(f"""
                INSERT INTO {schema}.ai_settings (tenant_id, setting_key, setting_value)
                SELECT %s, setting_key, setting_value
                FROM {schema}.ai_settings
                WHERE tenant_id = 1
                ON CONFLICT (tenant_id, setting_key) DO NOTHING
            """, (tenant_id,))
            copied_settings['ai_settings'] = cur.rowcount
        except Exception as e:
            print(f'Error copying ai_settings: {e}')
            copied_settings['ai_settings'] = 'error'
        
        # 3. Копируем ai_model_settings
        try:
            cur.execute(f"""
                INSERT INTO {schema}.ai_model_settings 
                    (tenant_id, temperature, top_p, frequency_penalty, presence_penalty, max_tokens, system_priority)
                SELECT %s, temperature, top_p, frequency_penalty, presence_penalty, max_tokens, system_priority
                FROM {schema}.ai_model_settings
                WHERE tenant_id = 1
                ON CONFLICT (tenant_id) DO NOTHING
            """, (tenant_id,))
            copied_settings['ai_model_settings'] = cur.rowcount
        except Exception as e:
            print(f'Error copying ai_model_settings: {e}')
            copied_settings['ai_model_settings'] = 'error'
        
        # 4. Копируем page_settings
        try:
            cur.execute(f"""
                INSERT INTO {schema}.page_settings (tenant_id, setting_key, setting_value)
                SELECT %s, setting_key, setting_value
                FROM {schema}.page_settings
                WHERE tenant_id = 1
                ON CONFLICT (tenant_id, setting_key) DO NOTHING
            """, (tenant_id,))
            copied_settings['page_settings'] = cur.rowcount
        except Exception as e:
            print(f'Error copying page_settings: {e}')
            copied_settings['page_settings'] = 'error'
        
        # 5. Копируем widget_settings
        try:
            cur.execute(f"""
                INSERT INTO {schema}.widget_settings (tenant_id, setting_value)
                SELECT %s, setting_value
                FROM {schema}.widget_settings
                WHERE tenant_id = 1
                ON CONFLICT (tenant_id) DO NOTHING
            """, (tenant_id,))
            copied_settings['widget_settings'] = cur.rowcount
        except Exception as e:
            print(f'Error copying widget_settings: {e}')
            copied_settings['widget_settings'] = 'error'
        
        # 6. Копируем email_templates
        try:
            cur.execute(f"""
                INSERT INTO {schema}.email_templates (tenant_id, template_key, subject, body, is_active)
                SELECT %s, template_key, subject, body, is_active
                FROM {schema}.email_templates
                WHERE tenant_id = 1
                ON CONFLICT (tenant_id, template_key) DO NOTHING
            """, (tenant_id,))
            copied_settings['email_templates'] = cur.rowcount
        except Exception as e:
            print(f'Error copying email_templates: {e}')
            copied_settings['email_templates'] = 'error'
        
        # 7. Копируем tenant_api_keys для Yandex (критично для ФЗ-152)
        try:
            cur.execute(f"""
                INSERT INTO {schema}.tenant_api_keys (tenant_id, provider, key_name, key_value, is_active)
                SELECT %s, provider, key_name, key_value, is_active
                FROM {schema}.tenant_api_keys
                WHERE tenant_id = 1 AND provider = 'yandex'
                ON CONFLICT (tenant_id, provider, key_name) DO NOTHING
            """, (tenant_id,))
            copied_settings['tenant_api_keys_yandex'] = cur.rowcount
        except Exception as e:
            print(f'Error copying tenant_api_keys: {e}')
            copied_settings['tenant_api_keys_yandex'] = 'error'
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'tenant_id': tenant_id,
                'copied_settings': copied_settings
            }),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        print(f'Error initializing tenant settings: {e}')
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
