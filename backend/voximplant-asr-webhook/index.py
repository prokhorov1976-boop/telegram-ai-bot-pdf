import json
import os
from datetime import datetime

# In-memory хранилище для связи call_id -> ASR результаты
# В продакшене используйте Redis
asr_results = {}

def handler(event: dict, context) -> dict:
    '''Webhook для обработки ASR событий от Voximplant'''
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
        }
    
    if method == 'POST':
        try:
            body_str = event.get('body', '{}')
            print(f"[ASR Webhook] Raw body: {body_str}")
            
            body = json.loads(body_str)
            
            # Voximplant может отправлять в разных форматах
            # Формат 1: наш внутренний формат
            event_type = body.get('event_type')
            
            # Формат 2: официальный формат Voximplant callback
            vox_event = body.get('event')
            
            if vox_event == 'asr_result' or event_type == 'asr_result':
                # Voximplant формат
                call_id = body.get('call_id') or body.get('callId') or body.get('sessionId')
                asr_id = body.get('asr_id') or body.get('asrId')
                text = body.get('text', '') or body.get('utterance', '')
                confidence = body.get('confidence', 0)
                
                print(f"[ASR Webhook] ASR Result - call_id={call_id}, text={text}, confidence={confidence}")
                
                if call_id not in asr_results:
                    asr_results[call_id] = []
                
                asr_results[call_id].append({
                    'text': text,
                    'confidence': confidence,
                    'timestamp': datetime.utcnow().isoformat(),
                    'asr_id': asr_id
                })
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'status': 'received'})
                }
            
            # Логируем все остальные события для отладки
            print(f"[ASR Webhook] Other event: {body}")
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'status': 'ok'})
            }
            
        except Exception as e:
            print(f"[ASR Webhook] Error: {str(e)}")
            import traceback
            print(f"[ASR Webhook] Traceback: {traceback.format_exc()}")
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': str(e)})
            }
    
    if method == 'GET':
        # Получение последнего результата для call_id
        call_id = event.get('queryStringParameters', {}).get('call_id')
        
        if not call_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'call_id required'})
            }
        
        results = asr_results.get(call_id, [])
        
        # Возвращаем последний результат и очищаем
        if results:
            last_result = results.pop(0)
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'has_result': True,
                    'text': last_result['text'],
                    'confidence': last_result['confidence']
                })
            }
        else:
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'has_result': False})
            }
    
    return {
        'statusCode': 405,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': 'Method not allowed'})
    }