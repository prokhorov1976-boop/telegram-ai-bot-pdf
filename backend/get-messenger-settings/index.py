import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from auth_middleware import get_tenant_id_from_request, require_auth


def handler(event: dict, context) -> dict:
    """Получение и сохранение настроек мессенджеров (Telegram, VK, MAX)"""
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization'
            },
            'body': ''
        }
    
    try:
        dsn = os.environ.get('DATABASE_URL')
        if not dsn:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'DATABASE_URL not configured'})
            }
        
        if method == 'GET':
            return handle_get(event, dsn)
        elif method == 'POST':
            return handle_post(event, dsn)
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'})
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }


def handle_get(event: dict, dsn: str) -> dict:
    """Обработка GET запроса - получение настроек"""
    try:
        tenant_id, auth_error = get_tenant_id_from_request(event)
        if auth_error:
            return auth_error
        
        query_params = event.get('queryStringParameters') or {}
        messenger_type = query_params.get('messenger_type')
        
        if messenger_type and messenger_type not in ['telegram', 'whatsapp', 'vk']:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid messenger_type'})
            }
        
        conn = psycopg2.connect(dsn)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("""
            SELECT telegram_settings FROM t_p56134400_telegram_ai_bot_pdf.tenant_settings
            WHERE tenant_id = %s
        """, (tenant_id,))
        
        row = cur.fetchone()
        cur.close()
        conn.close()
        
        if not row:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'settings': {}})
            }
        
        all_settings = row['telegram_settings'] or {}
        
        if messenger_type:
            result = {}
            if messenger_type == 'telegram':
                result = {'bot_token': all_settings.get('bot_token')}
            elif messenger_type == 'whatsapp':
                result = {
                    'phone_number_id': all_settings.get('whatsapp_phone_id'),
                    'access_token': all_settings.get('whatsapp_access_token')
                }
            elif messenger_type == 'vk':
                result = {
                    'group_id': all_settings.get('vk_group_id'),
                    'group_token': all_settings.get('vk_group_token'),
                    'secret_key': all_settings.get('vk_secret_key')
                }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'settings': result})
            }
        else:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'settings': {
                        'telegram': {'bot_token': all_settings.get('bot_token')},
                        'whatsapp': {
                            'phone_number_id': all_settings.get('whatsapp_phone_id'),
                            'access_token': all_settings.get('whatsapp_access_token')
                        },
                        'vk': {
                            'group_id': all_settings.get('vk_group_id'),
                            'group_token': all_settings.get('vk_group_token'),
                            'secret_key': all_settings.get('vk_secret_key')
                        }
                    }
                })
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'GET error: {str(e)}'})
        }


def handle_post(event: dict, dsn: str) -> dict:
    """Обработка POST запроса - сохранение настроек"""
    try:
        tenant_id, auth_error = get_tenant_id_from_request(event)
        if auth_error:
            return auth_error
        
        body_str = event.get('body', '{}')
        body = json.loads(body_str) if isinstance(body_str, str) else body_str
        
        messenger_type = body.get('messenger_type')
        settings = body.get('settings', {})
        
        if not messenger_type or messenger_type not in ['telegram', 'whatsapp', 'vk']:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid messenger_type'})
            }
        
        conn = psycopg2.connect(dsn)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("""
            SELECT telegram_settings FROM t_p56134400_telegram_ai_bot_pdf.tenant_settings
            WHERE tenant_id = %s
        """, (tenant_id,))
        
        row = cur.fetchone()
        
        if row:
            current_settings = row['telegram_settings'] or {}
            
            if messenger_type == 'telegram':
                current_settings['bot_token'] = settings.get('bot_token')
            elif messenger_type == 'whatsapp':
                current_settings['whatsapp_phone_id'] = settings.get('phone_number_id')
                current_settings['whatsapp_access_token'] = settings.get('access_token')
            elif messenger_type == 'vk':
                current_settings['vk_group_id'] = settings.get('group_id')
                current_settings['vk_group_token'] = settings.get('group_token')
                current_settings['vk_secret_key'] = settings.get('secret_key')
            
            cur.execute("""
                UPDATE t_p56134400_telegram_ai_bot_pdf.tenant_settings
                SET telegram_settings = %s, updated_at = CURRENT_TIMESTAMP
                WHERE tenant_id = %s
            """, (json.dumps(current_settings), tenant_id))
        else:
            settings_json = {}
            
            if messenger_type == 'telegram':
                settings_json['bot_token'] = settings.get('bot_token')
            elif messenger_type == 'whatsapp':
                settings_json['whatsapp_phone_id'] = settings.get('phone_number_id')
                settings_json['whatsapp_access_token'] = settings.get('access_token')
            elif messenger_type == 'vk':
                settings_json['vk_group_id'] = settings.get('group_id')
                settings_json['vk_group_token'] = settings.get('group_token')
                settings_json['vk_secret_key'] = settings.get('secret_key')
            
            cur.execute("""
                INSERT INTO t_p56134400_telegram_ai_bot_pdf.tenant_settings (tenant_id, telegram_settings)
                VALUES (%s, %s)
            """, (tenant_id, json.dumps(settings_json)))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'message': f'{messenger_type.capitalize()} settings saved'
            })
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'POST error: {str(e)}'})
        }