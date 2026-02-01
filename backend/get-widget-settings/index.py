import json
import os
import psycopg2
import sys
sys.path.insert(0, '/function/code/shared')
from auth_middleware import get_tenant_id_from_request

def handler(event: dict, context) -> dict:
    '''Получение настроек виджета для встраивания на сайт'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization'
            },
            'body': ''
        }
    
    try:
        tenant_id, auth_error = get_tenant_id_from_request(event)
        if auth_error:
            return auth_error

        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        # Получаем widget_settings и настройки автосообщений
        cur.execute("""
            SELECT widget_settings, 
                   auto_message_enabled,
                   auto_message_delay_seconds,
                   auto_message_text,
                   auto_message_repeat,
                   auto_message_repeat_delay_seconds
            FROM t_p56134400_telegram_ai_bot_pdf.tenant_settings
            WHERE tenant_id = %s
        """, (tenant_id,))
        
        result = cur.fetchone()
        cur.close()
        conn.close()
        
        if result and result[0]:
            settings = result[0]
            # Добавляем настройки автосообщений
            settings['auto_message_enabled'] = result[1] if result[1] is not None else False
            settings['auto_message_delay_seconds'] = result[2] if result[2] is not None else 30
            settings['auto_message_text'] = result[3] if result[3] else 'Могу помочь с выбором? 😊'
            settings['auto_message_repeat'] = result[4] if result[4] is not None else True
            settings['auto_message_repeat_delay_seconds'] = result[5] if result[5] is not None else 60
        else:
            settings = {
                'button_color': '#3b82f6',
                'button_color_end': '#1d4ed8',
                'button_size': 60,
                'button_position': 'bottom-right',
                'button_icon': 'MessageCircle',
                'window_width': 380,
                'window_height': 600,
                'header_title': 'AI Ассистент',
                'header_color': '#3b82f6',
                'header_color_end': '#1d4ed8',
                'border_radius': 16,
                'show_branding': True,
                'custom_css': None,
                'chat_url': None,
                'auto_message_enabled': False,
                'auto_message_delay_seconds': 30,
                'auto_message_text': 'Могу помочь с выбором? 😊',
                'auto_message_repeat': True,
                'auto_message_repeat_delay_seconds': 60
            }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(settings),
            'isBase64Encoded': False
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }