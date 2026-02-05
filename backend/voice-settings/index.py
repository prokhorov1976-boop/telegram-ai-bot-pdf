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
                'max_tokens': ai_settings.get('max_tokens', 500)
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
                                COALESCE(ai_settings, '{{}}'::jsonb),
                                '{{voice_system_prompt}}',
                                '"{voice_system_prompt}"'::jsonb
                            ),
                            '{{voice_model}}',
                            '"{voice_model}"'::jsonb
                        ),
                        '{{voice_provider}}',
                        '"{voice_provider}"'::jsonb
                    ),
                    '{{max_tokens}}',
                    '{max_tokens}'::jsonb
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