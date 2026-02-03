import json
import os
import base64
import requests

def handler(event: dict, context) -> dict:
    """Распознавание речи из аудио через Yandex SpeechKit для Voximplant звонков"""
    method = event.get('httpMethod', 'POST')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
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
        
        audio_url = body.get('audio_url')
        audio_base64 = body.get('audio_base64')
        
        if not audio_url and not audio_base64:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'audio_url or audio_base64 required'}),
                'isBase64Encoded': False
            }

        yandex_api_key = os.environ.get('YANDEXGPT_API_KEY')
        folder_id = os.environ.get('YANDEXGPT_FOLDER_ID')
        
        if not yandex_api_key or not folder_id:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Yandex credentials not configured'}),
                'isBase64Encoded': False
            }

        if audio_url:
            audio_response = requests.get(audio_url, timeout=30)
            if audio_response.status_code != 200:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Failed to download audio'}),
                    'isBase64Encoded': False
                }
            audio_data = audio_response.content
        else:
            audio_data = base64.b64decode(audio_base64)

        stt_url = 'https://stt.api.cloud.yandex.net/speech/v1/stt:recognize'
        
        headers = {
            'Authorization': f'Api-Key {yandex_api_key}'
        }
        
        params = {
            'lang': 'ru-RU',
            'folderId': folder_id,
            'format': 'oggopus'
        }
        
        stt_response = requests.post(
            stt_url,
            headers=headers,
            params=params,
            data=audio_data,
            timeout=30
        )
        
        if stt_response.status_code != 200:
            return {
                'statusCode': stt_response.status_code,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'error': 'Yandex STT error',
                    'details': stt_response.text
                }),
                'isBase64Encoded': False
            }

        result = stt_response.json()
        recognized_text = result.get('result', '')
        
        if not recognized_text:
            recognized_text = "Не удалось распознать речь"

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'text': recognized_text,
                'confidence': 1.0
            }),
            'isBase64Encoded': False
        }

    except requests.exceptions.Timeout:
        return {
            'statusCode': 504,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Recognition timeout'}),
            'isBase64Encoded': False
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
