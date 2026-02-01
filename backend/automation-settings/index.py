import json
import os
import psycopg2
import requests
from typing import Optional
from auth_middleware import require_auth

def handler(event: dict, context) -> dict:
    """Управление настройками автоматизации и cron-заданиями"""
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 204,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }

    try:
        # Проверка авторизации (только super_admin)
        authorized, payload, error_response = require_auth(event)
        if not authorized:
            return error_response
        
        user_role = payload.get('role')
        if user_role != 'super_admin':
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Super admin access required'}),
                'isBase64Encoded': False
            }
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()

        if method == 'GET':
            settings = get_automation_settings(cur)
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json', 
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, X-Authorization'
                },
                'body': json.dumps(settings),
                'isBase64Encoded': False
            }

        elif method == 'POST':
            body_str = event.get('body', '{}')
            print(f'POST body: {body_str}')
            body = json.loads(body_str)
            action = body.get('action')
            print(f'Action: {action}')

            if action == 'save_api_key':
                api_key = body.get('api_key', '').strip()
                if not api_key:
                    raise ValueError('API ключ не может быть пустым')
                
                save_cronjob_api_key(cur, api_key)
                conn.commit()
                
                result = {'ok': True, 'message': 'API ключ сохранён'}

            elif action == 'enable_subscription_check':
                api_key = get_cronjob_api_key(cur)
                if not api_key:
                    raise ValueError('Сначала сохраните API ключ Cron-job.org')
                
                job_id = create_or_update_cronjob(api_key, enabled=True)
                save_cronjob_id(cur, 'check_subscriptions', job_id)
                conn.commit()
                
                result = {'ok': True, 'message': 'Автопроверка включена', 'job_id': job_id}

            elif action == 'disable_subscription_check':
                api_key = get_cronjob_api_key(cur)
                if not api_key:
                    raise ValueError('API ключ не настроен')
                
                job_id = get_cronjob_id(cur, 'check_subscriptions')
                if job_id:
                    disable_cronjob(api_key, job_id)
                
                result = {'ok': True, 'message': 'Автопроверка отключена'}

            elif action == 'test_subscription_check':
                check_url = 'https://functions.poehali.dev/d4cc01d8-b97c-4f4c-894f-ccafc67a58b9'
                response = requests.get(check_url, timeout=30)
                response.raise_for_status()
                test_result = response.json()
                
                result = {
                    'ok': True,
                    'message': 'Проверка выполнена',
                    'expired_count': test_result.get('expired_count', 0),
                    'notifications_sent': test_result.get('notifications_sent', 0)
                }

            elif action == 'enable_embeddings_cleanup':
                api_key = get_cronjob_api_key(cur)
                if not api_key:
                    raise ValueError('Сначала сохраните API ключ Cron-job.org')
                
                job_id = create_cronjob(
                    api_key=api_key,
                    title='Очистка устаревших эмбеддингов',
                    url='https://functions.poehali.dev/53a14995-b007-4a99-a49a-596ff9370544',
                    hours=[3],
                    enabled=True
                )
                save_cronjob_id(cur, 'cleanup_embeddings', job_id)
                conn.commit()
                
                result = {'ok': True, 'message': 'Автоочистка эмбеддингов включена'}

            elif action == 'disable_embeddings_cleanup':
                api_key = get_cronjob_api_key(cur)
                job_id = get_cronjob_id(cur, 'cleanup_embeddings')
                if job_id:
                    disable_cronjob(api_key, job_id)
                result = {'ok': True, 'message': 'Автоочистка эмбеддингов отключена'}

            elif action == 'enable_db_backup':
                api_key = get_cronjob_api_key(cur)
                if not api_key:
                    raise ValueError('Сначала сохраните API ключ Cron-job.org')
                
                job_id = create_cronjob(
                    api_key=api_key,
                    title='Резервное копирование БД',
                    url='https://functions.poehali.dev/e01ced46-3748-405d-b336-283fdbc04b71',
                    hours=[2],
                    enabled=True
                )
                save_cronjob_id(cur, 'db_backup', job_id)
                conn.commit()
                
                result = {'ok': True, 'message': 'Автобэкап БД включён'}

            elif action == 'disable_db_backup':
                api_key = get_cronjob_api_key(cur)
                job_id = get_cronjob_id(cur, 'db_backup')
                if job_id:
                    disable_cronjob(api_key, job_id)
                result = {'ok': True, 'message': 'Автобэкап БД отключён'}

            elif action == 'enable_analytics_report':
                api_key = get_cronjob_api_key(cur)
                if not api_key:
                    raise ValueError('Сначала сохраните API ключ Cron-job.org')
                
                job_id = create_cronjob(
                    api_key=api_key,
                    title='Еженедельный отчёт по аналитике',
                    url='https://functions.poehali.dev/25740d7e-5ddb-4b5c-8c5b-3eb8d1443fba',
                    hours=[10],
                    wdays=[1],
                    enabled=True
                )
                save_cronjob_id(cur, 'analytics_report', job_id)
                conn.commit()
                
                result = {'ok': True, 'message': 'Еженедельный отчёт включён'}

            elif action == 'disable_analytics_report':
                api_key = get_cronjob_api_key(cur)
                job_id = get_cronjob_id(cur, 'analytics_report')
                if job_id:
                    disable_cronjob(api_key, job_id)
                result = {'ok': True, 'message': 'Еженедельный отчёт отключён'}

            elif action == 'enable_daily_analytics':
                api_key = get_cronjob_api_key(cur)
                if not api_key:
                    raise ValueError('Сначала сохраните API ключ Cron-job.org')
                job_id = create_cronjob(api_key, 'Ежедневная аналитика', 'https://functions.poehali.dev/placeholder-daily-analytics', [9], enabled=True)
                save_cronjob_id(cur, 'daily_analytics', job_id)
                conn.commit()
                result = {'ok': True, 'message': 'Ежедневная аналитика включена'}

            elif action == 'disable_daily_analytics':
                api_key = get_cronjob_api_key(cur)
                job_id = get_cronjob_id(cur, 'daily_analytics')
                if job_id:
                    disable_cronjob(api_key, job_id)
                result = {'ok': True, 'message': 'Ежедневная аналитика отключена'}

            elif action == 'enable_error_monitoring':
                api_key = get_cronjob_api_key(cur)
                if not api_key:
                    raise ValueError('Сначала сохраните API ключ Cron-job.org')
                job_id = create_cronjob(api_key, 'Мониторинг ошибок', 'https://functions.poehali.dev/placeholder-error-monitoring', [0,6,12,18], enabled=True)
                save_cronjob_id(cur, 'error_monitoring', job_id)
                conn.commit()
                result = {'ok': True, 'message': 'Мониторинг ошибок включён'}

            elif action == 'disable_error_monitoring':
                api_key = get_cronjob_api_key(cur)
                job_id = get_cronjob_id(cur, 'error_monitoring')
                if job_id:
                    disable_cronjob(api_key, job_id)
                result = {'ok': True, 'message': 'Мониторинг ошибок отключён'}

            elif action == 'enable_cleanup_logs':
                api_key = get_cronjob_api_key(cur)
                if not api_key:
                    raise ValueError('Сначала сохраните API ключ Cron-job.org')
                job_id = create_cronjob(api_key, 'Очистка логов', 'https://functions.poehali.dev/placeholder-cleanup-logs', [4], wdays=[0], enabled=True)
                save_cronjob_id(cur, 'cleanup_logs', job_id)
                conn.commit()
                result = {'ok': True, 'message': 'Очистка логов включена'}

            elif action == 'disable_cleanup_logs':
                api_key = get_cronjob_api_key(cur)
                job_id = get_cronjob_id(cur, 'cleanup_logs')
                if job_id:
                    disable_cronjob(api_key, job_id)
                result = {'ok': True, 'message': 'Очистка логов отключена'}

            elif action == 'enable_subscription_reminders':
                api_key = get_cronjob_api_key(cur)
                if not api_key:
                    raise ValueError('Сначала сохраните API ключ Cron-job.org')
                job_id = create_cronjob(api_key, 'Напоминания о подписке', 'https://functions.poehali.dev/placeholder-subscription-reminders', [10], enabled=True)
                save_cronjob_id(cur, 'subscription_reminders', job_id)
                conn.commit()
                result = {'ok': True, 'message': 'Напоминания включены'}

            elif action == 'disable_subscription_reminders':
                api_key = get_cronjob_api_key(cur)
                job_id = get_cronjob_id(cur, 'subscription_reminders')
                if job_id:
                    disable_cronjob(api_key, job_id)
                result = {'ok': True, 'message': 'Напоминания отключены'}

            elif action == 'enable_admin_alerts':
                api_key = get_cronjob_api_key(cur)
                if not api_key:
                    raise ValueError('Сначала сохраните API ключ Cron-job.org')
                job_id = create_cronjob(api_key, 'Алерты админа', 'https://functions.poehali.dev/placeholder-admin-alerts', list(range(24)), enabled=True)
                save_cronjob_id(cur, 'admin_alerts', job_id)
                conn.commit()
                result = {'ok': True, 'message': 'Алерты админа включены'}

            elif action == 'disable_admin_alerts':
                api_key = get_cronjob_api_key(cur)
                job_id = get_cronjob_id(cur, 'admin_alerts')
                if job_id:
                    disable_cronjob(api_key, job_id)
                result = {'ok': True, 'message': 'Алерты админа отключены'}

            elif action == 'enable_security_audit':
                api_key = get_cronjob_api_key(cur)
                if not api_key:
                    raise ValueError('Сначала сохраните API ключ Cron-job.org')
                job_id = create_cronjob(api_key, 'Аудит безопасности', 'https://functions.poehali.dev/placeholder-security-audit', [0,12], enabled=True)
                save_cronjob_id(cur, 'security_audit', job_id)
                conn.commit()
                result = {'ok': True, 'message': 'Аудит безопасности включён'}

            elif action == 'disable_security_audit':
                api_key = get_cronjob_api_key(cur)
                job_id = get_cronjob_id(cur, 'security_audit')
                if job_id:
                    disable_cronjob(api_key, job_id)
                result = {'ok': True, 'message': 'Аудит безопасности отключён'}

            else:
                raise ValueError(f'Неизвестное действие: {action}')

            cur.close()
            conn.close()

            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json', 
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, X-Authorization'
                },
                'body': json.dumps(result),
                'isBase64Encoded': False
            }

    except Exception as e:
        print(f'Error in automation settings: {str(e)}')
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json', 
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Authorization'
            },
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }


def get_automation_settings(cur) -> dict:
    """Получить текущие настройки автоматизации"""
    api_key = get_cronjob_api_key(cur)
    
    settings = {
        'cronjob_api_key': api_key[:8] + '...' if api_key else '',
        'cronjob_enabled': bool(api_key)
    }
    
    if api_key:
        jobs = [
            ('check_subscriptions', 'check_subscriptions_job'),
            ('cleanup_embeddings', 'cleanup_embeddings_job'),
            ('db_backup', 'db_backup_job'),
            ('analytics_report', 'analytics_report_job'),
            ('daily_analytics', 'daily_analytics_job'),
            ('error_monitoring', 'error_monitoring_job'),
            ('cleanup_logs', 'cleanup_logs_job'),
            ('subscription_reminders', 'subscription_reminders_job'),
            ('admin_alerts', 'admin_alerts_job'),
            ('security_audit', 'security_audit_job')
        ]
        
        for job_name, settings_key in jobs:
            job_id = get_cronjob_id(cur, job_name)
            if job_id:
                job_info = get_cronjob_info(api_key, job_id)
                if job_info:
                    settings[settings_key] = job_info
    
    return settings


def get_cronjob_api_key(cur) -> Optional[str]:
    """Получить API ключ cron-job.org из БД"""
    cur.execute("""
        SELECT setting_value 
        FROM t_p56134400_telegram_ai_bot_pdf.default_settings 
        WHERE setting_key = 'cronjob_api_key'
    """)
    row = cur.fetchone()
    return row[0] if row else None


def save_cronjob_api_key(cur, api_key: str):
    """Сохранить API ключ cron-job.org в БД"""
    cur.execute("""
        INSERT INTO t_p56134400_telegram_ai_bot_pdf.default_settings (setting_key, setting_value)
        VALUES ('cronjob_api_key', %s)
        ON CONFLICT (setting_key) 
        DO UPDATE SET setting_value = EXCLUDED.setting_value
    """, (api_key,))


def get_cronjob_id(cur, job_name: str) -> Optional[int]:
    """Получить ID cron-задания из БД"""
    cur.execute("""
        SELECT setting_value 
        FROM t_p56134400_telegram_ai_bot_pdf.default_settings 
        WHERE setting_key = %s
    """, (f'cronjob_id_{job_name}',))
    row = cur.fetchone()
    return int(row[0]) if row else None


def save_cronjob_id(cur, job_name: str, job_id: int):
    """Сохранить ID cron-задания в БД"""
    cur.execute("""
        INSERT INTO t_p56134400_telegram_ai_bot_pdf.default_settings (setting_key, setting_value)
        VALUES (%s, %s)
        ON CONFLICT (setting_key) 
        DO UPDATE SET setting_value = EXCLUDED.setting_value
    """, (f'cronjob_id_{job_name}', str(job_id)))


def create_or_update_cronjob(api_key: str, enabled: bool = True) -> int:
    """Создать или обновить cron-задание для проверки подписок"""
    check_url = 'https://functions.poehali.dev/d4cc01d8-b97c-4f4c-894f-ccafc67a58b9'
    
    job_data = {
        'job': {
            'enabled': enabled,
            'title': 'Проверка подписок тенантов AI-консьержа',
            'url': check_url,
            'schedule': {
                'timezone': 'Europe/Moscow',
                'hours': [9],
                'mdays': [-1],
                'minutes': [0],
                'months': [-1],
                'wdays': [-1]
            },
            'requestMethod': 1
        }
    }
    
    response = requests.put(
        'https://api.cron-job.org/jobs',
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        },
        json=job_data,
        timeout=10
    )
    
    response.raise_for_status()
    result = response.json()
    return result['jobId']


def create_cronjob(api_key: str, title: str, url: str, hours: list, enabled: bool = True, wdays: list = None) -> int:
    """Создать новое cron-задание"""
    job_data = {
        'job': {
            'enabled': enabled,
            'title': title,
            'url': url,
            'schedule': {
                'timezone': 'Europe/Moscow',
                'hours': hours,
                'mdays': [-1],
                'minutes': [0],
                'months': [-1],
                'wdays': wdays if wdays else [-1]
            },
            'requestMethod': 1
        }
    }
    
    response = requests.put(
        'https://api.cron-job.org/jobs',
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        },
        json=job_data,
        timeout=10
    )
    
    response.raise_for_status()
    result = response.json()
    return result['jobId']


def disable_cronjob(api_key: str, job_id: int):
    """Отключить cron-задание"""
    response = requests.patch(
        f'https://api.cron-job.org/jobs/{job_id}',
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        },
        json={'job': {'enabled': False}},
        timeout=10
    )
    response.raise_for_status()


def get_cronjob_info(api_key: str, job_id: int) -> Optional[dict]:
    """Получить информацию о cron-задании"""
    try:
        response = requests.get(
            f'https://api.cron-job.org/jobs/{job_id}',
            headers={'Authorization': f'Bearer {api_key}'},
            timeout=10
        )
        response.raise_for_status()
        job = response.json()['jobDetails']
        
        return {
            'jobId': job['jobId'],
            'enabled': job['enabled'],
            'title': job['title'],
            'url': job['url'],
            'schedule': job['schedule'],
            'lastExecution': job.get('lastExecution'),
            'nextExecution': job.get('nextExecution')
        }
    except Exception as e:
        print(f'Error getting cronjob info: {str(e)}')
        return None