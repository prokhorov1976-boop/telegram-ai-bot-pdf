import json
import os
import requests

CHECK_SUBSCRIPTIONS_URL = os.environ.get('CHECK_SUBSCRIPTIONS_URL', 'https://functions.poehali.dev/2b45e5d6-8138-4bae-9236-237fe424ef95')

def handler(event: dict, context) -> dict:
    """Встроенный cron-триггер для проверки подписок
    
    Эта функция вызывается по расписанию через Yandex Cloud Triggers
    и запускает проверку окончания подписок.
    
    Настройка триггера:
    1. Откройте Yandex Cloud Console
    2. Перейдите в Cloud Functions
    3. Создайте Trigger типа "Timer"
    4. Cron expression: 0 6 * * ? * (каждый день в 9:00 МСК = 6:00 UTC)
    5. Выберите эту функцию (internal-cron-trigger)
    """
    
    # КРИТИЧНО: проверка авторизации (Yandex Cloud Trigger или секретный токен)
    headers = event.get('headers', {})
    auth_token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
    expected_token = os.environ.get('CRON_SECRET_TOKEN')
    
    # Если установлен CRON_SECRET_TOKEN, проверяем его
    if expected_token and auth_token != expected_token:
        return {
            'statusCode': 403,
            'body': json.dumps({
                'success': False,
                'error': 'Unauthorized: invalid cron token'
            })
        }
    
    try:
        print(f'Cron trigger fired at {context.request_id}')
        
        # Вызываем функцию проверки подписок
        try:
            response = requests.post(
                CHECK_SUBSCRIPTIONS_URL,
                json={},
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
        except requests.exceptions.Timeout:
            error_msg = 'Timeout calling check-subscriptions function'
            print(error_msg)
            return {
                'statusCode': 500,
                'body': json.dumps({
                    'success': False,
                    'error': error_msg
                })
            }
        except requests.exceptions.RequestException as e:
            error_msg = f'Request error: {str(e)}'
            print(error_msg)
            return {
                'statusCode': 500,
                'body': json.dumps({
                    'success': False,
                    'error': error_msg
                })
            }
        
        if response.status_code == 200:
            result = response.json()
            print(f'Subscription check completed successfully: {result}')
            
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'success': True,
                    'message': 'Subscription check completed',
                    'result': result
                })
            }
        else:
            error_msg = f'Failed to call check-subscriptions: {response.status_code} {response.text}'
            print(error_msg)
            
            return {
                'statusCode': 500,
                'body': json.dumps({
                    'success': False,
                    'error': error_msg
                })
            }
    
    except Exception as e:
        error_msg = f'Cron trigger error: {str(e)}'
        print(error_msg)
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'success': False,
                'error': error_msg
            })
        }