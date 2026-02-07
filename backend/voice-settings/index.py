import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    """API для управления настройками голосовых звонков Voximplant"""
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }

    try:
        headers = event.get('headers', {})
        auth_header = headers.get('X-Authorization') or headers.get('x-authorization') or headers.get('authorization')
        
        if not auth_header:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Unauthorized'}),
                'isBase64Encoded': False
            }

        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor(cursor_factory=RealDictCursor)
        schema = 't_p56134400_telegram_ai_bot_pdf'

        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            tenant_id = params.get('tenant_id')
            
            if not tenant_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'tenant_id required'}),
                    'isBase64Encoded': False
                }

            cur.execute(f"""
                SELECT 
                    t.voximplant_enabled,
                    t.voximplant_greeting,
                    ts.ai_settings
                FROM {schema}.tenants t
                LEFT JOIN {schema}.tenant_settings ts ON ts.tenant_id = t.id
                WHERE t.id = {int(tenant_id)}
            """)
            
            row = cur.fetchone()
            
            if not row:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Tenant not found'}),
                    'isBase64Encoded': False
                }

            ai_settings = row['ai_settings'] or {}
            
            response_data = {
                'voximplant_enabled': row['voximplant_enabled'] or False,
                'voximplant_greeting': row['voximplant_greeting'] or '',
                'voice_system_prompt': ai_settings.get('voice_system_prompt', ''),
                'voice_model': ai_settings.get('voice_model', 'gemini-2.0-flash'),
                'voice_provider': ai_settings.get('voice_provider', 'openrouter'),
                'max_tokens': ai_settings.get('max_tokens', 500),
                'call_transfer_enabled': ai_settings.get('call_transfer_enabled', False),
                'admin_phone_number': ai_settings.get('admin_phone_number', ''),
                'voice': ai_settings.get('voice', 'maria')
            }

            cur.close()
            conn.close()

            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(response_data),
                'isBase64Encoded': False
            }

        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            tenant_id = body.get('tenant_id')
            
            if not tenant_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'tenant_id required'}),
                    'isBase64Encoded': False
                }

            voximplant_enabled = body.get('voximplant_enabled', False)
            voximplant_greeting = body.get('voximplant_greeting', '').replace("'", "''")
            voice_system_prompt = body.get('voice_system_prompt', '').replace("'", "''")
            voice_model = body.get('voice_model', 'gemini-2.0-flash')
            voice_provider = body.get('voice_provider', 'openrouter')
            max_tokens = int(body.get('max_tokens', 500))
            call_transfer_enabled = body.get('call_transfer_enabled', False)
            admin_phone_number = body.get('admin_phone_number', '').replace("'", "''")
            voice = body.get('voice', 'maria')
            
            # Валидация соответствия модели и провайдера
            VALID_MODELS = {
                'yandex': ['yandexgpt', 'yandexgpt-lite'],
                'deepseek': ['deepseek-chat', 'deepseek-reasoner'],
                'openai': ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo', 'o1-preview', 'o1-mini'],
                'openrouter': ['gemini-2.0-flash', 'llama-3.3-70b', 'deepseek-v3', 'deepseek-r1', 'qwen-2.5-72b', 
                              'gemini-flash-1.5', 'gpt-4o-mini', 'claude-3-haiku', 'gemini-pro-1.5', 'gpt-4o', 'claude-3.5-sonnet'],
                'proxyapi': ['gpt-4o-mini', 'claude-3.5-haiku', 'gpt-5', 'gpt-4o', 'claude-sonnet-4.5']
            }
            
            # Проверяем валидность провайдера и модели
            if voice_provider not in VALID_MODELS:
                print(f"Invalid provider {voice_provider}, using openrouter")
                voice_provider = 'openrouter'
                voice_model = 'gemini-2.0-flash'
            elif voice_model not in VALID_MODELS[voice_provider]:
                print(f"Model {voice_model} not valid for provider {voice_provider}, using first available")
                voice_model = VALID_MODELS[voice_provider][0]
                print(f"Corrected to: provider={voice_provider}, model={voice_model}")

            cur.execute(f"""
                UPDATE {schema}.tenants 
                SET 
                    voximplant_enabled = {voximplant_enabled},
                    voximplant_greeting = '{voximplant_greeting}'
                WHERE id = {int(tenant_id)}
            """)

            cur.execute(f"""
                UPDATE {schema}.tenant_settings
                SET ai_settings = jsonb_set(
                    jsonb_set(
                        jsonb_set(
                            jsonb_set(
                                jsonb_set(
                                    jsonb_set(
                                        jsonb_set(
                                            COALESCE(ai_settings, '{{}}'::jsonb),
                                            '{{voice_system_prompt}}',
                                            to_jsonb('{voice_system_prompt}'::text)
                                        ),
                                        '{{voice_model}}',
                                        to_jsonb('{voice_model}'::text)
                                    ),
                                    '{{voice_provider}}',
                                    to_jsonb('{voice_provider}'::text)
                                ),
                                '{{max_tokens}}',
                                to_jsonb({max_tokens})
                            ),
                            '{{call_transfer_enabled}}',
                            to_jsonb({str(call_transfer_enabled).lower()})
                        ),
                        '{{admin_phone_number}}',
                        to_jsonb('{admin_phone_number}'::text)
                    ),
                    '{{voice}}',
                    to_jsonb('{voice}'::text)
                )
                WHERE tenant_id = {int(tenant_id)}
            """)

            conn.commit()
            cur.close()
            conn.close()

            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'Voice settings updated'}),
                'isBase64Encoded': False
            }

        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
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