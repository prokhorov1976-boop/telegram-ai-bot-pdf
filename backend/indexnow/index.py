import json
import urllib.request
import urllib.error
from urllib.parse import quote
import os
import time

# Кэш для rate limiting (хранится между вызовами функции)
_last_notification_time = 0
RATE_LIMIT_SECONDS = 900  # 15 минут между уведомлениями

def handler(event: dict, context) -> dict:
    '''Уведомляет поисковики через IndexNow API и Ping-O-Matic о новых или обновлённых страницах'''
    
    global _last_notification_time
    
    method = event.get('httpMethod', 'GET')
    
    # CORS
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    # Rate limiting: не чаще 1 раза в 15 минут
    current_time = time.time()
    time_since_last = current_time - _last_notification_time
    
    if _last_notification_time > 0 and time_since_last < RATE_LIMIT_SECONDS:
        remaining = int(RATE_LIMIT_SECONDS - time_since_last)
        return {
            'statusCode': 429,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': False,
                'message': f'Rate limit: можно уведомлять не чаще 1 раза в 15 минут. Подождите {remaining // 60} мин {remaining % 60} сек',
                'retry_after': remaining
            }, ensure_ascii=False)
        }
    
    # Параметры для IndexNow
    host = "ai-ru.ru"
    key = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
    key_location = f"https://{host}/indexnow-key.txt"
    
    # URL-ы для уведомления
    urls = [
        f"https://{host}",
        f"https://{host}#features",
        f"https://{host}#vector-tech",
        f"https://{host}#how-it-works",
        f"https://{host}#pricing",
        f"https://{host}#faq",
        f"https://{host}#order-form"
    ]
    
    # Подготовка данных
    data = {
        "host": host,
        "key": key,
        "keyLocation": key_location,
        "urlList": urls
    }
    
    results = []
    
    # Отправка в разные поисковики через IndexNow
    indexnow_endpoints = [
        "https://api.indexnow.org/indexnow",  # Общий endpoint
        "https://www.bing.com/indexnow",       # Bing
        "https://yandex.com/indexnow"          # Yandex
    ]
    
    for endpoint in indexnow_endpoints:
        try:
            req = urllib.request.Request(
                endpoint,
                data=json.dumps(data).encode('utf-8'),
                headers={'Content-Type': 'application/json; charset=utf-8'}
            )
            
            with urllib.request.urlopen(req, timeout=10) as response:
                status = response.getcode()
                results.append({
                    'endpoint': endpoint,
                    'status': status,
                    'success': status in [200, 202]
                })
        except urllib.error.HTTPError as e:
            results.append({
                'endpoint': endpoint,
                'status': e.code,
                'success': e.code == 202,  # 202 = успешно принято
                'error': str(e.reason)
            })
        except Exception as e:
            results.append({
                'endpoint': endpoint,
                'status': 0,
                'success': False,
                'error': str(e)
            })
    
    # XML-RPC Ping сервис (только Ping-O-Matic, остальные устарели)
    site_url = f"https://{host}"
    site_name = "AI-консультант на векторной базе данных"
    
    ping_services = [
        {
            'name': 'Ping-O-Matic',
            'url': 'http://rpc.pingomatic.com/',
            'type': 'xmlrpc'
        }
    ]
    
    for service in ping_services:
        try:
            if service['type'] == 'xmlrpc':
                # XML-RPC запрос для Ping-O-Matic
                xml_body = f'''<?xml version="1.0" encoding="UTF-8"?>
<methodCall>
  <methodName>weblogUpdates.ping</methodName>
  <params>
    <param><value><string>{site_name}</string></value></param>
    <param><value><string>{site_url}</string></value></param>
  </params>
</methodCall>'''
                
                req = urllib.request.Request(
                    service['url'],
                    data=xml_body.encode('utf-8'),
                    headers={'Content-Type': 'text/xml; charset=utf-8'}
                )
                
                with urllib.request.urlopen(req, timeout=10) as response:
                    status = response.getcode()
                    response_text = response.read().decode('utf-8')
                    # Проверяем успешность в ответе XML
                    success = status == 200 and 'flerror' in response_text and '>0<' in response_text
                    results.append({
                        'endpoint': service['name'],
                        'status': status,
                        'success': success
                    })
                    
        except urllib.error.HTTPError as e:
            results.append({
                'endpoint': service['name'],
                'status': e.code,
                'success': False,
                'error': str(e.reason)
            })
        except Exception as e:
            results.append({
                'endpoint': service['name'],
                'status': 0,
                'success': False,
                'error': str(e)
            })
    
    # Проверяем, был ли хоть один успешный ответ
    any_success = any(r['success'] for r in results)
    success_count = sum(1 for r in results if r['success'])
    
    # Обновляем время последнего уведомления только при успехе
    if any_success:
        _last_notification_time = current_time
    
    return {
        'statusCode': 200 if any_success else 500,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'success': any_success,
            'message': f'Уведомлено {success_count} из {len(results)} сервисов' if any_success else 'Ошибка уведомления',
            'results': results,
            'urls_submitted': len(urls),
            'services_notified': success_count
        }, ensure_ascii=False)
    }