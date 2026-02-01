"""
Управление прокси настройками для AI сервисов тенанта
"""
import json
import os
import psycopg2


def handler(event: dict, context) -> dict:
    """Управление прокси настройками тенанта"""
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'DATABASE_URL not configured'}),
            'isBase64Encoded': False
        }
    
    try:
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        if method == 'GET':
            tenant_id = event.get('queryStringParameters', {}).get('tenant_id')
            if not tenant_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'tenant_id is required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("""
                SELECT 
                    use_proxy_openai, proxy_openai,
                    use_proxy_google, proxy_google,
                    use_proxy_deepseek, proxy_deepseek,
                    use_proxy_openrouter, proxy_openrouter,
                    use_proxy_proxyapi, proxy_proxyapi
                FROM t_p56134400_telegram_ai_bot_pdf.tenant_settings
                WHERE tenant_id = %s
            """, (tenant_id,))
            
            row = cur.fetchone()
            
            if not row:
                cur.execute("""
                    INSERT INTO t_p56134400_telegram_ai_bot_pdf.tenant_settings (tenant_id)
                    VALUES (%s)
                """, (tenant_id,))
                conn.commit()
                
                result = {
                    'use_proxy_openai': False,
                    'proxy_openai': '',
                    'use_proxy_google': False,
                    'proxy_google': '',
                    'use_proxy_deepseek': False,
                    'proxy_deepseek': '',
                    'use_proxy_openrouter': False,
                    'proxy_openrouter': '',
                    'use_proxy_proxyapi': False,
                    'proxy_proxyapi': ''
                }
            else:
                result = {
                    'use_proxy_openai': row[0] or False,
                    'proxy_openai': row[1] or '',
                    'use_proxy_google': row[2] or False,
                    'proxy_google': row[3] or '',
                    'use_proxy_deepseek': row[4] or False,
                    'proxy_deepseek': row[5] or '',
                    'use_proxy_openrouter': row[6] or False,
                    'proxy_openrouter': row[7] or '',
                    'use_proxy_proxyapi': row[8] or False,
                    'proxy_proxyapi': row[9] or ''
                }
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(result),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            tenant_id = body.get('tenant_id')
            
            if not tenant_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'tenant_id is required'}),
                    'isBase64Encoded': False
                }
            
            print(f'[manage-proxy-settings] Updating proxy for tenant_id={tenant_id}')
            
            cur.execute("""
                UPDATE t_p56134400_telegram_ai_bot_pdf.tenant_settings
                SET 
                    use_proxy_openai = %s,
                    proxy_openai = %s,
                    use_proxy_google = %s,
                    proxy_google = %s,
                    use_proxy_deepseek = %s,
                    proxy_deepseek = %s,
                    use_proxy_openrouter = %s,
                    proxy_openrouter = %s,
                    use_proxy_proxyapi = %s,
                    proxy_proxyapi = %s
                WHERE tenant_id = %s
            """, (
                body.get('use_proxy_openai', False),
                body.get('proxy_openai', ''),
                body.get('use_proxy_google', False),
                body.get('proxy_google', ''),
                body.get('use_proxy_deepseek', False),
                body.get('proxy_deepseek', ''),
                body.get('use_proxy_openrouter', False),
                body.get('proxy_openrouter', ''),
                body.get('use_proxy_proxyapi', False),
                body.get('proxy_proxyapi', ''),
                tenant_id
            ))
            
            conn.commit()
            cur.close()
            conn.close()
            
            print(f'[manage-proxy-settings] Proxy settings updated for tenant_id={tenant_id}')
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'Proxy settings updated'}),
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
        print(f'[manage-proxy-settings] Error: {e}')
        import traceback
        traceback.print_exc()
        
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
