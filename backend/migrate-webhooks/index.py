import json
import os
import sys
import requests
import psycopg2

sys.path.append('/function/code')
from api_keys_helper import get_tenant_api_key

def handler(event: dict, context) -> dict:
    """Миграция webhook URL для существующих ботов (добавление bot_token в URL)"""
    method = event.get('httpMethod', 'POST')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
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
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        schema = 't_p56134400_telegram_ai_bot_pdf'

        # Webhook URLs
        TELEGRAM_WEBHOOK = 'https://functions.poehali.dev/a54f2817-d6cf-49d2-9eeb-2c038523c0cb'
        MAX_WEBHOOK = 'https://functions.poehali.dev/ae0b074b-a749-4714-90d2-2146a6de57de'
        
        results = {
            'telegram': {'success': [], 'failed': []},
            'max': {'success': [], 'failed': []}
        }

        # Получаем все тенанты с ключами
        cur.execute(f"""
            SELECT DISTINCT tenant_id 
            FROM {schema}.tenant_api_keys 
            WHERE is_active = true 
            AND provider IN ('telegram', 'max')
        """)
        tenant_ids = [row[0] for row in cur.fetchall()]

        for tenant_id in tenant_ids:
            # Миграция Telegram
            telegram_token, error = get_tenant_api_key(tenant_id, 'telegram', 'bot_token')
            if telegram_token and not error:
                try:
                    webhook_url_with_token = f"{TELEGRAM_WEBHOOK}?bot_token={telegram_token}"
                    response = requests.post(
                        f"https://api.telegram.org/bot{telegram_token}/setWebhook",
                        json={'url': webhook_url_with_token},
                        timeout=10
                    )
                    if response.ok:
                        results['telegram']['success'].append(tenant_id)
                    else:
                        results['telegram']['failed'].append({'tenant_id': tenant_id, 'error': response.text})
                except Exception as e:
                    results['telegram']['failed'].append({'tenant_id': tenant_id, 'error': str(e)})

            # Миграция MAX
            max_token, error = get_tenant_api_key(tenant_id, 'max', 'bot_token')
            if max_token and not error:
                try:
                    webhook_url_with_token = f"{MAX_WEBHOOK}?bot_token={max_token}"
                    response = requests.post(
                        'https://platform-api.max.ru/subscriptions',
                        headers={'Authorization': max_token},
                        json={
                            'url': webhook_url_with_token,
                            'update_types': ['message_created', 'bot_started']
                        },
                        timeout=10
                    )
                    if response.status_code in [200, 201]:
                        results['max']['success'].append(tenant_id)
                    else:
                        results['max']['failed'].append({'tenant_id': tenant_id, 'error': response.text})
                except Exception as e:
                    results['max']['failed'].append({'tenant_id': tenant_id, 'error': str(e)})

        conn.close()

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'ok': True,
                'results': results,
                'summary': {
                    'telegram_migrated': len(results['telegram']['success']),
                    'telegram_failed': len(results['telegram']['failed']),
                    'max_migrated': len(results['max']['success']),
                    'max_failed': len(results['max']['failed'])
                }
            }),
            'isBase64Encoded': False
        }

    except Exception as e:
        print(f"[migrate-webhooks] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'ok': False, 'error': str(e)}),
            'isBase64Encoded': False
        }