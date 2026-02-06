"""
API для распознавания голосовых сообщений через разные провайдеры.
Поддерживает Yandex SpeechKit, OpenAI Whisper, Google Speech-to-Text.
"""
import json
import os
import base64
import psycopg2
from typing import Dict, Any, Optional
import requests
import time


def get_db_connection():
    """Создает подключение к БД"""
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        raise ValueError('DATABASE_URL not configured')
    return psycopg2.connect(dsn)


def get_tenant_settings(tenant_id: int) -> Dict[str, Any]:
    """Получает настройки распознавания речи для тенанта + прокси"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # CRITICAL: Simple Query Protocol ONLY - no %s placeholders
            query = f"""
                SELECT 
                    speech_recognition_enabled,
                    speech_recognition_provider,
                    consent_enabled,
                    use_proxy_openai,
                    proxy_openai,
                    use_proxy_google,
                    proxy_google
                FROM t_p56134400_telegram_ai_bot_pdf.tenant_settings
                WHERE tenant_id = {tenant_id}
            """
            cur.execute(query)
            row = cur.fetchone()
            
            if not row:
                return {
                    'enabled': False,
                    'provider': 'yandex',
                    'fz152_enabled': False,
                    'use_proxy_openai': False,
                    'proxy_openai': None,
                    'use_proxy_google': False,
                    'proxy_google': None
                }
            
            return {
                'enabled': row[0] or False,
                'provider': row[1] or 'yandex',
                'fz152_enabled': row[2] or False,
                'use_proxy_openai': row[3] or False,
                'proxy_openai': row[4],
                'use_proxy_google': row[5] or False,
                'proxy_google': row[6]
            }
    finally:
        conn.close()


def get_api_key(tenant_id: int, provider: str, key_name: str) -> Optional[str]:
    """Получает API-ключ тенанта из tenant_api_keys"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # CRITICAL: Simple Query Protocol ONLY - no %s placeholders
            # Escape strings by doubling single quotes
            safe_provider = provider.replace("'", "''")
            safe_key_name = key_name.replace("'", "''")
            
            query = f"""
                SELECT key_value
                FROM t_p56134400_telegram_ai_bot_pdf.tenant_api_keys
                WHERE tenant_id = {tenant_id}
                  AND provider = '{safe_provider}'
                  AND key_name = '{safe_key_name}'
                  AND is_active = true
            """
            cur.execute(query)
            row = cur.fetchone()
            return row[0] if row else None
    finally:
        conn.close()


def parse_proxy(proxy_string: str) -> Optional[Dict[str, str]]:
    """Парсит прокси из формата ip:port@login:pass в dict для requests"""
    if not proxy_string or not proxy_string.strip():
        return None
    
    try:
        # Формат: ip:port@login:pass
        if '@' in proxy_string:
            ip_port, login_pass = proxy_string.split('@', 1)
            proxy_url = f'http://{login_pass}@{ip_port}'
        else:
            proxy_url = f'http://{proxy_string}'
        
        return {
            'http': proxy_url,
            'https': proxy_url
        }
    except Exception as e:
        print(f'Failed to parse proxy: {e}')
        return None


def log_usage(tenant_id: int, provider: str, audio_duration_seconds: float, cost: float):
    """Записывает использование распознавания речи в token_usage"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO t_p56134400_telegram_ai_bot_pdf.token_usage 
                (tenant_id, operation_type, model, tokens_used, cost_rubles, metadata)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                tenant_id,
                'speech_recognition',
                provider,
                int(audio_duration_seconds),
                cost,
                json.dumps({'audio_duration_seconds': audio_duration_seconds})
            ))
            conn.commit()
    finally:
        conn.close()


def calculate_cost(provider: str, audio_duration_seconds: float) -> float:
    """Рассчитывает стоимость распознавания"""
    costs_per_second = {
        'yandex': 1.0 / 15.0,
        'openai_whisper': 0.006 / 60.0 * 100.0,
        'google': 0.006 / 15.0 * 100.0
    }
    rate = costs_per_second.get(provider, 0.0)
    return round(audio_duration_seconds * rate, 4)


def transcribe_yandex(audio_base64: str, api_key: str, folder_id: str) -> str:
    """Распознавание через Yandex SpeechKit"""
    audio_bytes = base64.b64decode(audio_base64)
    
    url = 'https://stt.api.cloud.yandex.net/speech/v1/stt:recognize'
    headers = {
        'Authorization': f'Api-Key {api_key}'
    }
    params = {
        'folderId': folder_id,
        'lang': 'ru-RU'
    }
    
    response = requests.post(url, headers=headers, params=params, data=audio_bytes)
    response.raise_for_status()
    
    result = response.json()
    return result.get('result', '')


def transcribe_openai_whisper(audio_base64: str, api_key: str, proxies: Optional[Dict[str, str]] = None) -> str:
    """Распознавание через OpenAI Whisper"""
    audio_bytes = base64.b64decode(audio_base64)
    
    url = 'https://api.openai.com/v1/audio/transcriptions'
    headers = {
        'Authorization': f'Bearer {api_key}'
    }
    files = {
        'file': ('audio.ogg', audio_bytes, 'audio/ogg'),
        'model': (None, 'whisper-1'),
        'language': (None, 'ru')
    }
    
    if proxies:
        print(f'[speech-recognition] Using proxy for OpenAI: {list(proxies.values())[0][:50]}...')
    
    response = requests.post(url, headers=headers, files=files, proxies=proxies, timeout=60)
    response.raise_for_status()
    
    result = response.json()
    return result.get('text', '')


def transcribe_google(audio_base64: str, api_key: str, proxies: Optional[Dict[str, str]] = None) -> str:
    """Распознавание через Google Speech-to-Text"""
    url = f'https://speech.googleapis.com/v1/speech:recognize?key={api_key}'
    
    payload = {
        'config': {
            'encoding': 'OGG_OPUS',
            'sampleRateHertz': 48000,
            'languageCode': 'ru-RU'
        },
        'audio': {
            'content': audio_base64
        }
    }
    
    if proxies:
        print(f'[speech-recognition] Using proxy for Google: {list(proxies.values())[0][:50]}...')
    
    response = requests.post(url, json=payload, proxies=proxies, timeout=60)
    response.raise_for_status()
    
    result = response.json()
    if 'results' in result and len(result['results']) > 0:
        return result['results'][0]['alternatives'][0]['transcript']
    return ''


def handler(event: dict, context) -> dict:
    """
    Распознает голосовое сообщение через выбранный провайдер.
    Автоматически использует Яндекс при включенном ФЗ-152.
    """
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Tenant-Id'
            },
            'body': ''
        }
    
    if method == 'GET':
        tenant_id = event.get('headers', {}).get('X-Tenant-Id')
        if not tenant_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'X-Tenant-Id header required'})
            }
        
        tenant_id = int(tenant_id)
        settings = get_tenant_settings(tenant_id)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'enabled': settings['enabled'],
                'provider': settings['provider']
            })
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        tenant_id = event.get('headers', {}).get('X-Tenant-Id')
        if not tenant_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'X-Tenant-Id header required'})
            }
        
        tenant_id = int(tenant_id)
        
        body = json.loads(event.get('body', '{}'))
        
        if 'enabled' in body:
            conn = get_db_connection()
            try:
                with conn.cursor() as cur:
                    provider = body.get('provider', 'yandex')
                    
                    # CRITICAL: Simple Query Protocol ONLY - no %s placeholders
                    cur.execute(f"""
                        SELECT consent_enabled 
                        FROM t_p56134400_telegram_ai_bot_pdf.tenant_settings 
                        WHERE tenant_id = {tenant_id}
                    """)
                    fz152_row = cur.fetchone()
                    fz152_enabled = fz152_row[0] if fz152_row else False
                    
                    if fz152_enabled and provider != 'yandex':
                        provider = 'yandex'
                    
                    # Escape strings for SQL
                    safe_provider = provider.replace("'", "''")
                    enabled_val = 'true' if body['enabled'] else 'false'
                    
                    cur.execute(f"""
                        UPDATE t_p56134400_telegram_ai_bot_pdf.tenant_settings 
                        SET speech_recognition_enabled = {enabled_val},
                            speech_recognition_provider = '{safe_provider}'
                        WHERE tenant_id = {tenant_id}
                    """)
                    conn.commit()
            finally:
                conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': True})
            }
        
        settings = get_tenant_settings(tenant_id)
        
        if not settings['enabled']:
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'enabled': False,
                    'message': 'Извините, я понимаю только текстовые сообщения.'
                })
            }
        
        body = json.loads(event.get('body', '{}'))
        audio_base64 = body.get('audio')
        audio_duration = body.get('duration_seconds', 0)
        
        if not audio_base64:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'audio field required (base64)'})
            }
        
        provider = settings['provider']
        if settings['fz152_enabled']:
            provider = 'yandex'
        
        if audio_duration == 0:
            audio_bytes = base64.b64decode(audio_base64)
            audio_duration = max(1.0, len(audio_bytes) / 16000.0)
        
        text = ''
        
        if provider == 'yandex':
            api_key = get_api_key(tenant_id, 'yandex', 'YANDEX_SPEECHKIT_API_KEY')
            folder_id = get_api_key(tenant_id, 'yandex', 'folder_id')
            
            if not api_key or not folder_id:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'error': 'Yandex SpeechKit API key or Folder ID not configured'
                    })
                }
            
            start_time = time.time()
            text = transcribe_yandex(audio_base64, api_key, folder_id)
            processing_time = time.time() - start_time
        
        elif provider == 'openai_whisper':
            api_key = get_api_key(tenant_id, 'openai', 'OPENAI_API_KEY')
            
            if not api_key:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'error': 'OpenAI API key not configured'
                    })
                }
            
            proxies = None
            if settings.get('use_proxy_openai') and settings.get('proxy_openai'):
                proxies = parse_proxy(settings['proxy_openai'])
                print(f'[speech-recognition] OpenAI proxy enabled: {bool(proxies)}')
            
            start_time = time.time()
            text = transcribe_openai_whisper(audio_base64, api_key, proxies)
            processing_time = time.time() - start_time
        
        elif provider == 'google':
            api_key = get_api_key(tenant_id, 'google', 'GOOGLE_SPEECH_API_KEY')
            
            if not api_key:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'error': 'Google Speech API key not configured'
                    })
                }
            
            proxies = None
            if settings.get('use_proxy_google') and settings.get('proxy_google'):
                proxies = parse_proxy(settings['proxy_google'])
                print(f'[speech-recognition] Google proxy enabled: {bool(proxies)}')
            
            start_time = time.time()
            text = transcribe_google(audio_base64, api_key, proxies)
            processing_time = time.time() - start_time
        
        else:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': f'Unknown provider: {provider}'})
            }
        
        cost = calculate_cost(provider, audio_duration)
        log_usage(tenant_id, provider, audio_duration, cost)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'text': text,
                'provider': provider,
                'duration_seconds': audio_duration,
                'cost_rubles': cost,
                'processing_time': round(processing_time, 2)
            })
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }