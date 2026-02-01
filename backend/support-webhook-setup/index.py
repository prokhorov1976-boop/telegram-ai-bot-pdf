import json
import os
import requests

def handler(event: dict, context) -> dict:
    """Автоматическая настройка вебхука Telegram для чата поддержки"""
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }

    try:
        bot_token = os.environ.get('SUPPORT_BOT_TOKEN')
        webhook_url = 'https://functions.poehali.dev/9abd7a94-704d-426b-bfe8-19437abc6fb5'

        if not bot_token:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'error': 'SUPPORT_BOT_TOKEN не настроен',
                    'message': 'Добавьте секрет SUPPORT_BOT_TOKEN в настройках проекта'
                }),
                'isBase64Encoded': False
            }

        if method == 'GET':
            # Получить информацию о текущем вебхуке
            info_url = f"https://api.telegram.org/bot{bot_token}/getWebhookInfo"
            response = requests.get(info_url, timeout=10)
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'webhook_info': response.json(),
                    'configured_url': webhook_url
                }),
                'isBase64Encoded': False
            }

        elif method == 'POST':
            # Установить вебхук
            set_url = f"https://api.telegram.org/bot{bot_token}/setWebhook"
            response = requests.post(set_url, json={'url': webhook_url}, timeout=10)
            
            if response.ok:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'message': 'Вебхук успешно настроен',
                        'webhook_url': webhook_url,
                        'telegram_response': response.json()
                    }),
                    'isBase64Encoded': False
                }
            else:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'error': 'Ошибка при настройке вебхука',
                        'telegram_response': response.json()
                    }),
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
        print(f"ERROR in support-webhook-setup: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
