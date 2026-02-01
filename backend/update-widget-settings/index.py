import json
import os
import psycopg2
from auth_middleware import get_tenant_id_from_request

def handler(event: dict, context) -> dict:
    '''Обновление настроек виджета'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        body_raw = event.get('body', '{}')
        print(f"[UPDATE WIDGET] RAW BODY: {body_raw[:500]}")
        
        tenant_id, auth_error = get_tenant_id_from_request(event)
        print(f"[UPDATE WIDGET] tenant_id from auth: {tenant_id}, error: {auth_error}")
        
        if auth_error:
            print(f"[UPDATE WIDGET] Returning auth error: {auth_error}")
            return auth_error

        data = json.loads(body_raw)
        print(f"[UPDATE WIDGET] tenant_id={tenant_id}, data keys={list(data.keys())}")
        
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
    
        # Формируем JSONB объект с настройками виджета
        widget_settings = {
            'button_color': data.get('button_color', '#3b82f6'),
            'button_color_end': data.get('button_color_end', '#1d4ed8'),
            'button_size': data.get('button_size', 60),
            'button_position': data.get('button_position', 'bottom-right'),
            'button_icon': data.get('button_icon', 'MessageCircle'),
            'window_width': data.get('window_width', 380),
            'window_height': data.get('window_height', 600),
            'header_title': data.get('header_title', 'AI Ассистент'),
            'header_color': data.get('header_color', '#3b82f6'),
            'header_color_end': data.get('header_color_end', '#1d4ed8'),
            'border_radius': data.get('border_radius', 16),
            'show_branding': data.get('show_branding', True),
            'custom_css': data.get('custom_css'),
            'chat_url': data.get('chat_url')
        }
    
        widget_settings_json = json.dumps(widget_settings)
        
        # Обновляем widget_settings и настройки автосообщений
        update_fields = ['widget_settings = %s::jsonb']
        update_values = [widget_settings_json]
        
        # Добавляем автосообщения, если переданы
        if 'auto_message_enabled' in data:
            update_fields.append('auto_message_enabled = %s')
            update_values.append(data['auto_message_enabled'])
        if 'auto_message_delay_seconds' in data:
            update_fields.append('auto_message_delay_seconds = %s')
            update_values.append(data['auto_message_delay_seconds'])
        if 'auto_message_text' in data:
            update_fields.append('auto_message_text = %s')
            update_values.append(data['auto_message_text'])
        if 'auto_message_repeat' in data:
            update_fields.append('auto_message_repeat = %s')
            update_values.append(data['auto_message_repeat'])
        if 'auto_message_repeat_delay_seconds' in data:
            update_fields.append('auto_message_repeat_delay_seconds = %s')
            update_values.append(data['auto_message_repeat_delay_seconds'])
        
        update_values.append(tenant_id)
        
        query = f"""
            UPDATE t_p56134400_telegram_ai_bot_pdf.tenant_settings
            SET {', '.join(update_fields)}, updated_at = CURRENT_TIMESTAMP
            WHERE tenant_id = %s
        """
        
        cur.execute(query, tuple(update_values))
    
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'success': True})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }