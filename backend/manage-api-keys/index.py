"""
Управление API ключами клиентов - сохранение и получение индивидуальных ключей
"""
import json
import os
import psycopg2
import sys
sys.path.insert(0, '/function/code/shared')
from auth_middleware import get_tenant_id_from_request

def handler(event: dict, context) -> dict:
    """Управление API ключами клиента"""
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    tenant_id, auth_error = get_tenant_id_from_request(event)
    if auth_error:
        return auth_error
    
    try:
        dsn = os.environ['DATABASE_URL']
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        if method == 'GET':
            # КРИТИЧНО: используем только tenant_id из авторизации, игнорируем query параметры
            cur.execute("""
                SELECT provider, key_name, key_value, is_active
                FROM t_p56134400_telegram_ai_bot_pdf.tenant_api_keys
                WHERE tenant_id = %s
            """, (tenant_id,))
            
            rows = cur.fetchall()
            keys = []
            for row in rows:
                key_value = row[2]
                masked_value = ''
                if key_value and len(key_value) > 0:
                    if len(key_value) >= 8:
                        masked_value = key_value[:4] + '***' + key_value[-4:]
                    else:
                        masked_value = '***'
                
                keys.append({
                    'provider': row[0],
                    'key_name': row[1],
                    'key_value': masked_value,
                    'has_value': bool(key_value and len(key_value) > 0),
                    'is_active': row[3]
                })
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'keys': keys}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST' or method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            # КРИТИЧНО: используем только tenant_id из авторизации, игнорируем body
            keys_to_save = body.get('keys', [])
            
            print(f'[manage-api-keys] POST: tenant_id={tenant_id}, keys_count={len(keys_to_save)}')
            print(f'[manage-api-keys] Keys to save: {json.dumps(keys_to_save, ensure_ascii=False)}')
            
            if not keys_to_save:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'keys array is required'}),
                    'isBase64Encoded': False
                }
            
            saved_count = 0
            skipped_keys = []
            for key_data in keys_to_save:
                provider = key_data.get('provider')
                key_name = key_data.get('key_name')
                key_value = key_data.get('key_value')
                
                if not all([provider, key_name, key_value]):
                    skipped_keys.append(f'{provider}/{key_name}')
                    print(f'[manage-api-keys] SKIPPED: provider={provider}, key_name={key_name}, has_value={bool(key_value)}')
                    continue
                
                print(f'[manage-api-keys] SAVING: tenant_id={tenant_id}, provider={provider}, key_name={key_name}')
                cur.execute("""
                    INSERT INTO t_p56134400_telegram_ai_bot_pdf.tenant_api_keys 
                    (tenant_id, provider, key_name, key_value, is_active)
                    VALUES (%s, %s, %s, %s, true)
                    ON CONFLICT (tenant_id, provider, key_name)
                    DO UPDATE SET key_value = EXCLUDED.key_value, 
                                  updated_at = CURRENT_TIMESTAMP
                """, (tenant_id, provider, key_name, key_value))
                saved_count += 1
            
            conn.commit()
            cur.close()
            conn.close()
            
            print(f'[manage-api-keys] SUCCESS: saved={saved_count}, skipped={len(skipped_keys)}, skipped_list={skipped_keys}')
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': f'Сохранено ключей: {saved_count}'}),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
            
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }