import json
import os
import sys
import requests
import psycopg2
import re

sys.path.append('/function/code')
from api_keys_helper import get_tenant_api_key, get_tenant_id_by_bot_token
from formatting_helper import get_formatting_settings, format_with_settings

def handler(event: dict, context) -> dict:
    """Webhook для MAX-бота: принимает сообщения и отвечает через AI-консьержа"""
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
        print(f'[max-webhook] Received body: {json.dumps(body)}')
        
        # Определяем tenant_id по bot_token из query параметра или заголовка
        query_params = event.get('queryStringParameters', {}) or {}
        bot_token = query_params.get('bot_token', '')
        
        if not bot_token:
            headers = event.get('headers', {})
            bot_token = headers.get('X-Authorization', headers.get('authorization', ''))
        
        tenant_id = get_tenant_id_by_bot_token(bot_token) if bot_token else None
        
        if not tenant_id:
            print(f'[max-webhook] Could not determine tenant_id from bot_token: {bot_token[:20] if bot_token else "empty"}...')
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Unauthorized'}),
                'isBase64Encoded': False
            }
        
        print(f'[max-webhook] Determined tenant_id={tenant_id}')
        
        if 'message' not in body:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'ok': True}),
                'isBase64Encoded': False
            }

        message = body['message']
        print(f'[max-webhook] Message structure: {json.dumps(message)}')
        
        # MAX API structure: recipient.chat_id (для ответа) и body.text (текст сообщения)
        chat_id = message.get('recipient', {}).get('chat_id')
        sender_user_id = message.get('sender', {}).get('user_id')
        user_message = message.get('body', {}).get('text', '')
        
        # Проверяем наличие аудио в attachments
        attachments = message.get('body', {}).get('attachments', [])
        audio_attachment = next((att for att in attachments if att.get('type') == 'audio'), None)
        has_audio = bool(audio_attachment)
        
        if not chat_id or (not user_message and not has_audio):
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'ok': True}),
                'isBase64Encoded': False
            }
        
        if has_audio and not user_message:
            import base64
            speech_url = 'https://functions.poehali.dev/66ab8736-2781-4c63-9c2e-09f2061f7c7a'
            
            try:
                check_response = requests.get(
                    speech_url,
                    headers={'X-Tenant-Id': str(tenant_id)},
                    timeout=5
                )
                check_data = check_response.json()
                
                if not check_data.get('enabled', False):
                    max_token, error = get_tenant_api_key(tenant_id, 'max', 'bot_token')
                    if not error:
                        requests.post(
                            f'https://platform-api.max.ru/messages?user_id={sender_user_id}',
                            headers={
                                'Authorization': max_token,
                                'Content-Type': 'application/json'
                            },
                            json={'text': 'Извините, я понимаю только текстовые сообщения.'},
                            timeout=10
                        )
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'ok': True}),
                        'isBase64Encoded': False
                    }
                
                # Распознавание включено - скачиваем аудио и отправляем на распознавание
                audio_url = audio_attachment['payload']['url']
                print(f'[max-webhook] Downloading audio from: {audio_url[:80]}...')
                
                audio_response = requests.get(audio_url, timeout=30)
                audio_response.raise_for_status()
                audio_bytes = audio_response.content
                audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
                
                print(f'[max-webhook] Audio downloaded, size: {len(audio_bytes)} bytes. Sending to speech recognition...')
                
                speech_response = requests.post(
                    speech_url,
                    headers={
                        'X-Tenant-Id': str(tenant_id),
                        'Content-Type': 'application/json'
                    },
                    json={
                        'audio': audio_base64,
                        'duration_seconds': 0
                    },
                    timeout=60
                )
                speech_response.raise_for_status()
                speech_data = speech_response.json()
                
                user_message = speech_data.get('text', '')
                print(f'[max-webhook] Speech recognition result: {user_message}')
                
                if not user_message:
                    max_token, error = get_tenant_api_key(tenant_id, 'max', 'bot_token')
                    if not error:
                        requests.post(
                            f'https://platform-api.max.ru/messages?user_id={sender_user_id}',
                            headers={
                                'Authorization': max_token,
                                'Content-Type': 'application/json'
                            },
                            json={'text': 'Извините, не удалось распознать речь.'},
                            timeout=10
                        )
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'ok': True}),
                        'isBase64Encoded': False
                    }
                
            except Exception as e:
                print(f'[max-webhook] Speech recognition error: {e}')
                max_token, error = get_tenant_api_key(tenant_id, 'max', 'bot_token')
                if not error:
                    requests.post(
                        f'https://platform-api.max.ru/messages?user_id={sender_user_id}',
                        headers={
                            'Authorization': max_token,
                            'Content-Type': 'application/json'
                        },
                        json={'text': 'Извините, произошла ошибка при распознавании речи.'},
                        timeout=10
                    )
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'ok': True}),
                    'isBase64Encoded': False
                }

        session_id = f"max-{chat_id}"
        chat_function_url = 'https://functions.poehali.dev/7b58f4fb-5db0-4f85-bb3b-55bafa4cbf73'

        print(f'[max-webhook] Calling chat function for session={session_id}, tenant={tenant_id}, chat_id={chat_id}')
        try:
            chat_response = requests.post(
                chat_function_url,
                json={
                    'message': user_message,
                    'sessionId': session_id,
                    'tenantId': tenant_id,
                    'channel': 'max'
                },
                headers={'Content-Type': 'application/json'},
                timeout=60
            )
            print(f'[max-webhook] Chat function response status: {chat_response.status_code}')
            chat_response.raise_for_status()
            chat_data = chat_response.json()
            ai_message = chat_data.get('message', 'Извините, не могу ответить')
            
            # Форматирование уже применено в /chat через channel='max'
            print(f'[max-webhook] AI response received: {ai_message[:100]}...')
            
        except requests.exceptions.Timeout:
            print(f'[max-webhook] Chat function timeout')
            ai_message = 'Извините, сервис временно недоступен. Попробуйте позже.'
        except requests.exceptions.RequestException as e:
            print(f'[max-webhook] Chat function error: {e}')
            ai_message = 'Извините, произошла ошибка. Попробуйте позже.'

        bot_token, error = get_tenant_api_key(tenant_id, 'max', 'bot_token')
        if error:
            return error

        # По документации MAX API: user_id передаётся в query, а не в body!
        # Используем sender.user_id для отправки личного сообщения пользователю
        print(f'[max-webhook] Sending response to sender_user_id={sender_user_id}: {ai_message[:50]}...')
        max_response = requests.post(
            f'https://platform-api.max.ru/messages?user_id={sender_user_id}',
            headers={
                'Authorization': bot_token,
                'Content-Type': 'application/json'
            },
            json={
                'text': ai_message
            },
            timeout=10
        )
        print(f'[max-webhook] MAX API send response status: {max_response.status_code}')

        if not max_response.ok:
            error_text = max_response.text
            print(f'[max-webhook] MAX API error response: {error_text}')
            raise Exception(f'MAX API error: {max_response.status_code} - {error_text}')

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