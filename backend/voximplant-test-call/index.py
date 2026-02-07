import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import requests

def handler(event: dict, context) -> dict:
    """Инициация тестового звонка через Voximplant для проверки настроек голоса"""
    method = event.get('httpMethod', 'POST')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400'
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
        phone_number = body.get('phone_number')

        if not tenant_id or not phone_number:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'tenant_id and phone_number are required'}),
                'isBase64Encoded': False
            }

        # Получаем настройки из БД
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cur = conn.cursor(cursor_factory=RealDictCursor)

        schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
        
        cur.execute(f"""
            SELECT t.voximplant_greeting, ts.ai_settings
            FROM {schema}.tenants t
            LEFT JOIN {schema}.tenant_settings ts ON t.id = ts.tenant_id
            WHERE t.id = %s
        """, (tenant_id,))
        
        result = cur.fetchone()
        cur.close()
        conn.close()

        if not result:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Tenant not found'}),
                'isBase64Encoded': False
            }

        ai_settings = result.get('ai_settings') or {}
        voice = ai_settings.get('voice', 'maria')
        greeting = result.get('voximplant_greeting') or 'Здравствуйте! Это тестовый звонок для проверки настроек голоса.'

        # Проверяем наличие Voximplant credentials
        account_id = os.environ.get('VOXIMPLANT_ACCOUNT_ID')
        api_key = os.environ.get('VOXIMPLANT_API_KEY')
        rule_id = os.environ.get('VOXIMPLANT_RULE_ID')
        
        if not all([account_id, api_key, rule_id]):
            missing = []
            if not account_id:
                missing.append('VOXIMPLANT_ACCOUNT_ID')
            if not api_key:
                missing.append('VOXIMPLANT_API_KEY')
            if not rule_id:
                missing.append('VOXIMPLANT_RULE_ID')
            
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'error': 'Voximplant не настроен',
                    'details': f"Отсутствуют секреты: {', '.join(missing)}. Настройте их в разделе Секреты."
                }),
                'isBase64Encoded': False
            }

        # Отправляем запрос в Voximplant API для инициации звонка
        # Используем ваш Voximplant аккаунт и правило
        voximplant_api_url = 'https://api.voximplant.com/platform_api/StartScenarios/'
        
        voximplant_payload = {
            'account_id': account_id,
            'api_key': api_key,
            'rule_id': rule_id,
            'script_custom_data': json.dumps({
                'phone': phone_number,
                'voice': voice,
                'text': greeting,
                'is_test_call': True
            })
        }

        response = requests.post(voximplant_api_url, data=voximplant_payload, timeout=10)
        
        if response.status_code != 200:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Failed to initiate call', 'details': response.text}),
                'isBase64Encoded': False
            }

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'message': 'Test call initiated',
                'voice': voice,
                'phone': phone_number
            }),
            'isBase64Encoded': False
        }

    except Exception as e:
        print(f"[ERROR] Test call failed: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }