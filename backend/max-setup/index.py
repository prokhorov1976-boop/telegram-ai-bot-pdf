import json
import os
import sys
import requests

sys.path.append('/function/code')
from api_keys_helper import get_tenant_api_key

def handler(event: dict, context) -> dict:
    """Проверка токена MAX-бота и настройка webhook"""
    method = event.get('httpMethod', 'POST')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Authorization, Authorization',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }

    try:
        print(f'[max-setup] Received request: method={method}')
        
        query_params = event.get('queryStringParameters', {}) or {}
        tenant_id = int(query_params.get('tenant_id', 1))
        action = query_params.get('action', 'check')
        
        print(f'[max-setup] tenant_id={tenant_id}, action={action}')
        
        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            bot_token = body.get('bot_token', '')
            webhook_url = body.get('webhook_url', '')

            if action == 'verify':
                print(f'[max-setup] Verifying bot token (masked): {bot_token[:10]}...')
                try:
                    response = requests.get(
                        'https://platform-api.max.ru/me',
                        headers={'Authorization': bot_token},
                        timeout=10
                    )
                    print(f'[max-setup] MAX API response status: {response.status_code}')
                    
                    if response.status_code == 200:
                        data = response.json()
                        print(f'[max-setup] MAX API response: {json.dumps(data)}')
                        return {
                            'statusCode': 200,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'ok': True, 'bot_info': data}),
                            'isBase64Encoded': False
                        }
                    elif response.status_code == 401:
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'ok': False, 'error': 'Неверный токен'}),
                            'isBase64Encoded': False
                        }
                    else:
                        error_data = response.json() if response.text else {}
                        print(f'[max-setup] MAX API error: {json.dumps(error_data)}')
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'ok': False, 'error': error_data.get('message', 'Ошибка проверки токена')}),
                            'isBase64Encoded': False
                        }
                except Exception as e:
                    print(f'[max-setup] Verify error: {str(e)}')
                    return {
                        'statusCode': 500,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'ok': False, 'error': str(e)}),
                        'isBase64Encoded': False
                    }

            elif action == 'setup_webhook':
                if not webhook_url:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'ok': False, 'error': 'webhook_url required'}),
                        'isBase64Encoded': False
                    }

                print(f'[max-setup] Setting up webhook: {webhook_url}')
                try:
                    # Добавляем bot_token в URL webhook для идентификации
                    webhook_url_with_token = f"{webhook_url}?bot_token={bot_token}"
                    
                    response = requests.post(
                        'https://platform-api.max.ru/subscriptions',
                        headers={'Authorization': bot_token},
                        json={
                            'url': webhook_url_with_token,
                            'update_types': ['message_created', 'bot_started']
                        },
                        timeout=10
                    )
                    print(f'[max-setup] Webhook setup response status: {response.status_code}')
                    
                    if response.status_code in [200, 201]:
                        data = response.json() if response.text else {}
                        return {
                            'statusCode': 200,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'ok': True, 'result': data}),
                            'isBase64Encoded': False
                        }
                    else:
                        error_data = response.json() if response.text else {}
                        print(f'[max-setup] Webhook setup error: {json.dumps(error_data)}')
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'ok': False, 'error': error_data.get('message', 'Ошибка настройки webhook')}),
                            'isBase64Encoded': False
                        }
                except Exception as e:
                    print(f'[max-setup] Setup webhook error: {str(e)}')
                    return {
                        'statusCode': 500,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'ok': False, 'error': str(e)}),
                        'isBase64Encoded': False
                    }

        elif method == 'GET':
            bot_token, error = get_tenant_api_key(tenant_id, 'max', 'bot_token')
            if error:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'ok': False, 'error': 'Token not found'}),
                    'isBase64Encoded': False
                }

            if action == 'webhook_info':
                print(f'[max-setup] Getting webhook info')
                try:
                    response = requests.get(
                        'https://platform-api.max.ru/subscriptions',
                        headers={'Authorization': bot_token},
                        timeout=10
                    )
                    print(f'[max-setup] Webhook info response status: {response.status_code}')
                    
                    if response.status_code == 200:
                        data = response.json() if response.text else {}
                        subscriptions = data.get('subscriptions', [])
                        webhook_url = subscriptions[0].get('url', '') if subscriptions else ''
                        return {
                            'statusCode': 200,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'ok': True, 'result': {'url': webhook_url}}),
                            'isBase64Encoded': False
                        }
                    else:
                        return {
                            'statusCode': 200,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'ok': True, 'result': {'url': ''}}),
                            'isBase64Encoded': False
                        }
                except Exception as e:
                    print(f'[max-setup] Get webhook info error: {str(e)}')
                    return {
                        'statusCode': 500,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'ok': False, 'error': str(e)}),
                        'isBase64Encoded': False
                    }

        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid request'}),
            'isBase64Encoded': False
        }

    except Exception as e:
        print(f'[max-setup] Handler error: {str(e)}')
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }