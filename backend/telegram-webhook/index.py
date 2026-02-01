import json
import os
import sys
import requests
import re

sys.path.append('/function/code')
from api_keys_helper import get_tenant_api_key, get_tenant_id_by_bot_token
from formatting_helper import get_formatting_settings, format_with_settings

def handler(event: dict, context) -> dict:
    """Webhook для Telegram-бота: принимает сообщения и отвечает через AI-консьержа"""
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
        body = json.loads(event.get('body', '{}'))
        print(f'[telegram-webhook] Received body: {json.dumps(body)[:200]}')
        
        # Определяем tenant_id по bot_token из query параметра или пути URL
        query_params = event.get('queryStringParameters', {}) or {}
        bot_token = query_params.get('bot_token', '')
        
        if not bot_token:
            url_path = event.get('path', '') or event.get('rawPath', '')
            bot_token = url_path
        
        tenant_id = get_tenant_id_by_bot_token(bot_token) if bot_token else None
        
        if not tenant_id:
            print(f'[telegram-webhook] Could not determine tenant_id from bot_token: {bot_token[:20] if bot_token else "empty"}...')
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid bot token'}),
                'isBase64Encoded': False
            }
        
        print(f'[telegram-webhook] Determined tenant_id={tenant_id}')
        
        if 'message' not in body:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'ok': True}),
                'isBase64Encoded': False
            }

        message = body['message']
        chat_id = message['chat']['id']
        user_message = message.get('text', '').strip()
        
        has_voice = 'voice' in message
        has_video_note = 'video_note' in message
        
        print(f'[telegram-webhook] chat_id={chat_id}, text="{user_message}", voice={has_voice}, video={has_video_note}')

        # Если уже есть текст - идём сразу в чат
        if user_message:
            print(f'[telegram-webhook] Text message detected, proceeding to chat')
        # Если нет текста, но есть аудио - пытаемся распознать
        elif has_voice or has_video_note:
            speech_url = 'https://functions.poehali.dev/66ab8736-2781-4c63-9c2e-09f2061f7c7a'
            
            try:
                check_response = requests.get(
                    speech_url,
                    headers={'X-Tenant-Id': str(tenant_id)},
                    timeout=5
                )
                check_data = check_response.json()
                print(f'[telegram-webhook] Speech settings: enabled={check_data.get("enabled")}, provider={check_data.get("provider")}')
                
                if not check_data.get('enabled', False):
                    bot_token_temp, error = get_tenant_api_key(tenant_id, 'telegram', 'bot_token')
                    if not error:
                        telegram_api_url = f'https://api.telegram.org/bot{bot_token_temp}/sendMessage'
                        requests.post(
                            telegram_api_url,
                            json={
                                'chat_id': chat_id,
                                'text': 'Извините, я понимаю только текстовые сообщения.'
                            },
                            timeout=10
                        )
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'ok': True}),
                        'isBase64Encoded': False
                    }
                
                bot_token_for_audio, error = get_tenant_api_key(tenant_id, 'telegram', 'bot_token')
                if error:
                    print(f'[telegram-webhook] Failed to get bot token for audio download')
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'ok': True}),
                        'isBase64Encoded': False
                    }
                
                file_id = message.get('voice', {}).get('file_id') if has_voice else message.get('video_note', {}).get('file_id')
                duration = message.get('voice', {}).get('duration', 0) if has_voice else message.get('video_note', {}).get('duration', 0)
                
                print(f'[telegram-webhook] Downloading audio: file_id={file_id}, duration={duration}s')
                
                file_info_url = f'https://api.telegram.org/bot{bot_token_for_audio}/getFile'
                file_info_response = requests.get(file_info_url, params={'file_id': file_id}, timeout=10)
                file_info_response.raise_for_status()
                file_path = file_info_response.json()['result']['file_path']
                
                file_url = f'https://api.telegram.org/file/bot{bot_token_for_audio}/{file_path}'
                audio_response = requests.get(file_url, timeout=30)
                audio_response.raise_for_status()
                
                import base64
                audio_base64 = base64.b64encode(audio_response.content).decode('utf-8')
                print(f'[telegram-webhook] Audio downloaded: {len(audio_response.content)} bytes')
                
                transcribe_response = requests.post(
                    speech_url,
                    json={
                        'audio': audio_base64,
                        'duration_seconds': duration
                    },
                    headers={'X-Tenant-Id': str(tenant_id), 'Content-Type': 'application/json'},
                    timeout=60
                )
                transcribe_response.raise_for_status()
                transcribe_data = transcribe_response.json()
                
                user_message = transcribe_data.get('text', '').strip()
                print(f'[telegram-webhook] Transcribed text: "{user_message}" (provider: {transcribe_data.get("provider")})')
                
                if not user_message:
                    bot_token_temp, _ = get_tenant_api_key(tenant_id, 'telegram', 'bot_token')
                    if bot_token_temp:
                        telegram_api_url = f'https://api.telegram.org/bot{bot_token_temp}/sendMessage'
                        requests.post(
                            telegram_api_url,
                            json={
                                'chat_id': chat_id,
                                'text': 'Извините, не удалось распознать речь. Попробуйте ещё раз.'
                            },
                            timeout=10
                        )
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'ok': True}),
                        'isBase64Encoded': False
                    }
                    
            except Exception as e:
                print(f'[telegram-webhook] Speech recognition error: {e}')
                import traceback
                traceback.print_exc()
                
                bot_token_temp, _ = get_tenant_api_key(tenant_id, 'telegram', 'bot_token')
                if bot_token_temp:
                    telegram_api_url = f'https://api.telegram.org/bot{bot_token_temp}/sendMessage'
                    requests.post(
                        telegram_api_url,
                        json={
                            'chat_id': chat_id,
                            'text': 'Извините, произошла ошибка при распознавании речи. Попробуйте отправить текстовое сообщение.'
                        },
                        timeout=10
                    )
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'ok': True}),
                    'isBase64Encoded': False
                }
        # Если нет ни текста, ни аудио - игнорируем (стикеры, фото и т.д.)
        else:
            print(f'[telegram-webhook] No text or audio, skipping')
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'ok': True}),
                'isBase64Encoded': False
            }

        # Если дошли сюда - значит у нас есть user_message (либо изначально текст, либо распознанный)
        if not user_message:
            print(f'[telegram-webhook] Empty message after all checks, skipping')
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'ok': True}),
                'isBase64Encoded': False
            }

        session_id = f"telegram-{chat_id}"

        bot_token, error = get_tenant_api_key(tenant_id, 'telegram', 'bot_token')
        if error:
            return error

        chat_function_url = 'https://functions.poehali.dev/7b58f4fb-5db0-4f85-bb3b-55bafa4cbf73'

        try:
            chat_response = requests.post(
                chat_function_url,
                json={
                    'message': user_message,
                    'sessionId': session_id,
                    'tenantId': tenant_id,
                    'channel': 'telegram'
                },
                headers={'Content-Type': 'application/json'},
                timeout=60
            )
            chat_response.raise_for_status()
            chat_data = chat_response.json()
            ai_message = chat_data.get('message', 'Извините, не могу ответить')
            
            # Форматируем согласно настройкам тенанта
            print(f'[telegram-webhook] Getting formatting settings for tenant={tenant_id}')
            settings = get_formatting_settings(tenant_id, 'telegram')
            print(f'[telegram-webhook] Settings: {settings}')
            ai_message = format_with_settings(ai_message, settings, 'telegram')
            print(f'[telegram-webhook] Formatted message: {ai_message[:100]}...')
            
        except requests.exceptions.Timeout:
            print(f'[telegram-webhook] Chat function timeout')
            ai_message = 'Извините, сервис временно недоступен. Попробуйте позже.'
        except requests.exceptions.RequestException as e:
            print(f'[telegram-webhook] Chat function error: {e}')
            ai_message = 'Извините, произошла ошибка. Попробуйте позже.'

        print(f'[telegram-webhook] Sending to Telegram API')
        telegram_api_url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
        telegram_response = requests.post(
            telegram_api_url,
            json={
                'chat_id': chat_id,
                'text': ai_message,
                'parse_mode': 'Markdown',
                'disable_web_page_preview': False
            },
            timeout=10
        )
        print(f'[telegram-webhook] Telegram API response: {telegram_response.status_code}')

        if not telegram_response.ok:
            print(f'[telegram-webhook] Telegram API error: {telegram_response.text}')
            
            # Если ошибка парсинга markdown - отправляем без форматирования
            if telegram_response.status_code == 400 and 'parse entities' in telegram_response.text:
                print(f'[telegram-webhook] Retrying without markdown')
                plain_text = re.sub(r'[*_`\[\]]', '', ai_message)
                
                retry_response = requests.post(
                    telegram_api_url,
                    json={
                        'chat_id': chat_id,
                        'text': plain_text,
                        'disable_web_page_preview': False
                    },
                    timeout=10
                )
                
                if retry_response.ok:
                    print(f'[telegram-webhook] Sent successfully without markdown')
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'ok': True}),
                        'isBase64Encoded': False
                    }
            
            raise Exception(f'Telegram API error: {telegram_response.status_code}')

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'ok': True}),
            'isBase64Encoded': False
        }

    except Exception as e:
        print(f'Webhook error: {e}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }