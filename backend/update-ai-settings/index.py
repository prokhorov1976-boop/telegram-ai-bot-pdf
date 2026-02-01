import json
import os
import psycopg2
from datetime import datetime
import sys
sys.path.insert(0, '/function/code/shared')
from auth_middleware import get_tenant_id_from_request

def handler(event: dict, context) -> dict:
    """Обновление настроек AI провайдеров"""
    method = event.get('httpMethod', 'POST')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization'
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
        tenant_id, auth_error = get_tenant_id_from_request(event)
        if auth_error:
            return auth_error
        
        body = json.loads(event.get('body', '{}'))
        settings = body.get('settings', {})
        
        # Поддержка прямых параметров (для enable_pure_prompt_mode)
        if not settings and body:
            settings = body

        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()

        # Загружаем дефолтный промпт из БД
        cur.execute("""
            SELECT setting_value 
            FROM t_p56134400_telegram_ai_bot_pdf.default_settings 
            WHERE setting_key = 'default_system_prompt'
        """)
        default_prompt_row = cur.fetchone()
        default_prompt_from_db = default_prompt_row[0] if default_prompt_row else 'Ты — дружелюбный AI-помощник. Отвечай кратко и по делу.\n\n{rag_context_placeholder}'

        cur.execute("""
            SELECT ai_settings
            FROM t_p56134400_telegram_ai_bot_pdf.tenant_settings
            WHERE tenant_id = %s
        """, (tenant_id,))
        settings_row = cur.fetchone()
        
        # Начинаем с текущих настроек или дефолтных
        if settings_row and settings_row[0]:
            ai_settings = settings_row[0]
        else:
            ai_settings = {
                'model': 'yandexgpt',
                'temperature': '0.15',
                'top_p': '1.0',
                'frequency_penalty': '0',
                'presence_penalty': '0',
                'max_tokens': 2000,
                'system_priority': 'strict',
                'creative_mode': 'off',
                'provider': 'yandex',
                'chat_provider': 'yandex',
                'chat_model': 'yandexgpt',
                'embedding_provider': 'yandex',
                'embedding_model': 'text-search-query',
                'system_prompt': default_prompt_from_db
            }
        
        # Обновляем переданные поля
        for key, value in settings.items():
            if key in ['temperature', 'top_p', 'frequency_penalty', 'presence_penalty']:
                ai_settings[key] = str(value)
            elif key in ['provider', 'chat_provider', 'chat_model', 'embedding_provider', 'embedding_model', 'system_prompt', 'max_tokens', 'system_priority', 'creative_mode', 'model', 'enable_pure_prompt_mode', 'rag_topk_default', 'rag_topk_fallback']:
                ai_settings[key] = value
        
        # Синхронизация новой и старой схемы (обратная совместимость)
        # Если пришли provider + model из frontend, обновляем chat_provider + chat_model
        if 'provider' in settings:
            ai_settings['chat_provider'] = settings['provider']
        if 'model' in settings:
            ai_settings['chat_model'] = settings['model']
        
        ai_settings_json = json.dumps(ai_settings)

        # Используем UPSERT (INSERT ... ON CONFLICT)
        cur.execute("""
            INSERT INTO t_p56134400_telegram_ai_bot_pdf.tenant_settings (tenant_id, ai_settings, updated_at)
            VALUES (%s, %s::jsonb, CURRENT_TIMESTAMP)
            ON CONFLICT (tenant_id) 
            DO UPDATE SET 
                ai_settings = EXCLUDED.ai_settings,
                updated_at = CURRENT_TIMESTAMP
        """, (tenant_id, ai_settings_json))

        conn.commit()
        cur.close()
        conn.close()

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'message': 'Settings updated'}),
            'isBase64Encoded': False
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }