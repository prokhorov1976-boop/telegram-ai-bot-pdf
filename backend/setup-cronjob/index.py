import json
import os
import requests
from datetime import datetime
import sys
sys.path.append('/function/code')
from auth_middleware import require_auth

def handler(event: dict, context) -> dict:
    """Управление cron-заданиями через API cron-job.org"""
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }

    # КРИТИЧНО: только super_admin может управлять cron-заданиями
    authorized, payload, error_response = require_auth(event)
    if not authorized:
        return error_response
    
    user_role = payload.get('role')
    if user_role != 'super_admin':
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Access denied: super_admin role required'}),
            'isBase64Encoded': False
        }

    try:
        api_key = os.environ.get('CRONJOB_API_KEY', '').strip()
        
        if not api_key:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'API ключ cron-job.org не настроен'}),
                'isBase64Encoded': False
            }

        query_params = event.get('queryStringParameters') or {}
        action = query_params.get('action', 'status')

        if action == 'create':
            return create_cronjob(api_key)
        elif action == 'status':
            return get_cronjob_status(api_key)
        elif action == 'delete':
            job_id = query_params.get('job_id')
            if not job_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'job_id required'}),
                    'isBase64Encoded': False
                }
            return delete_cronjob(api_key, job_id)
        else:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid action'}),
                'isBase64Encoded': False
            }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }


def create_cronjob(api_key: str) -> dict:
    """Создание cron-задания для проверки подписок"""
    try:
        # URL функции проверки подписок
        check_url = 'https://functions.poehali.dev/2b45e5d6-8138-4bae-9236-237fe424ef95'
        
        # Настройки задания
        job_data = {
            'job': {
                'url': check_url,
                'enabled': True,
                'title': 'Daily Subscription Check',
                'saveResponses': True,
                'schedule': {
                    'timezone': 'Europe/Moscow',
                    'hours': [9],
                    'mdays': [-1],
                    'minutes': [0],
                    'months': [-1],
                    'wdays': [-1]
                }
            }
        }

        response = requests.put(
            'https://api.cron-job.org/jobs',
            json=job_data,
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            }
        )

        if response.status_code in [200, 201]:
            result = response.json()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'message': 'Cron-задание успешно создано',
                    'job_id': result.get('jobId'),
                    'job': result
                }),
                'isBase64Encoded': False
            }
        else:
            error_text = response.text
            return {
                'statusCode': response.status_code,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Failed to create cronjob: {error_text}'}),
                'isBase64Encoded': False
            }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }


def get_cronjob_status(api_key: str) -> dict:
    """Получение списка всех cron-заданий"""
    try:
        response = requests.get(
            'https://api.cron-job.org/jobs',
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            }
        )

        if response.status_code == 200:
            result = response.json()
            jobs = result.get('jobs', [])
            
            # Ищем наше задание по URL
            check_url = 'https://functions.poehali.dev/2b45e5d6-8138-4bae-9236-237fe424ef95'
            subscription_job = None
            
            for job in jobs:
                if job.get('url') == check_url:
                    subscription_job = job
                    break
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'exists': subscription_job is not None,
                    'job': subscription_job,
                    'all_jobs': jobs
                }),
                'isBase64Encoded': False
            }
        else:
            error_text = response.text
            return {
                'statusCode': response.status_code,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Failed to get cronjobs: {error_text}'}),
                'isBase64Encoded': False
            }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }


def delete_cronjob(api_key: str, job_id: str) -> dict:
    """Удаление cron-задания"""
    try:
        response = requests.delete(
            f'https://api.cron-job.org/jobs/{job_id}',
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            }
        )

        if response.status_code in [200, 204]:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'message': 'Cron-задание успешно удалено'
                }),
                'isBase64Encoded': False
            }
        else:
            error_text = response.text
            return {
                'statusCode': response.status_code,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Failed to delete cronjob: {error_text}'}),
                'isBase64Encoded': False
            }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }