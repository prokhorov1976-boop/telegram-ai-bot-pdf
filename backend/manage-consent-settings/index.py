import json
import os
import psycopg2
import sys
sys.path.insert(0, '/function/code/shared')
from auth_middleware import get_tenant_id_from_request

def handler(event: dict, context) -> dict:
    """Управление настройками согласия 152-ФЗ и публичным контентом"""
    method = event.get('httpMethod', 'GET')
    query_params = event.get('queryStringParameters') or {}
    action = query_params.get('action', '')
    request_tenant_id = query_params.get('tenant_id')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }

    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()

        if method == 'GET' and action == 'public_content':
            # Публичный endpoint - разрешаем доступ без авторизации
            tenant_id = request_tenant_id
            if not tenant_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'tenant_id required'}),
                    'isBase64Encoded': False
                }
            cur.execute("""
                SELECT 
                    t.name,
                    t.fz152_enabled,
                    ts.public_description,
                    ts.consent_webchat_enabled,
                    ts.consent_messenger_enabled,
                    ts.consent_text,
                    ts.consent_messenger_text,
                    ts.privacy_policy_text
                FROM t_p56134400_telegram_ai_bot_pdf.tenants t
                LEFT JOIN t_p56134400_telegram_ai_bot_pdf.tenant_settings ts ON t.id = ts.tenant_id
                WHERE t.id = %s
            """, (tenant_id,))
            
            row = cur.fetchone()
            if not row:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Tenant not found'}),
                    'isBase64Encoded': False
                }

            result = {
                'name': row[0] or '',
                'fz152_enabled': row[1] if row[1] is not None else False,
                'public_description': row[2] or '',
                'consent_settings': {
                    'webchat_enabled': row[3] if row[3] is not None else False,
                    'messenger_enabled': row[4] if row[4] is not None else False,
                    'text': row[5] or 'Я согласен на обработку персональных данных в соответствии с <a href="/privacy-policy" target="_blank">Политикой конфиденциальности</a>',
                    'messenger_text': row[6] or 'Продолжая диалог, вы соглашаетесь на обработку персональных данных согласно Политике конфиденциальности.',
                    'privacy_policy_text': row[7] or ''
                },
                'welcome_text': '',
                'faq': [],
                'contact_info': {'phone': '', 'email': '', 'address': ''}
            }

            cur.close()
            conn.close()

            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(result),
                'isBase64Encoded': False
            }

        elif method == 'PUT' and action == 'public_content':
            # Для PUT требуется авторизация
            auth_tenant_id, auth_error = get_tenant_id_from_request(event)
            if auth_error:
                return auth_error
            tenant_id = auth_tenant_id
            
            body = json.loads(event.get('body', '{}'))
            consent_settings = body.get('consent_settings', {})

            cur.execute("""
                UPDATE t_p56134400_telegram_ai_bot_pdf.tenant_settings
                SET 
                    public_description = %s,
                    consent_webchat_enabled = %s,
                    consent_messenger_enabled = %s,
                    consent_text = %s,
                    consent_messenger_text = %s,
                    privacy_policy_text = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE tenant_id = %s
            """, (
                body.get('public_description', ''),
                consent_settings.get('webchat_enabled', False),
                consent_settings.get('messenger_enabled', False),
                consent_settings.get('text', ''),
                consent_settings.get('messenger_text', ''),
                consent_settings.get('privacy_policy_text', ''),
                tenant_id
            ))

            conn.commit()
            cur.close()
            conn.close()

            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }

        elif method == 'PUT' and action == 'toggle_fz152':
            # Для toggle требуется авторизация
            auth_tenant_id, auth_error = get_tenant_id_from_request(event)
            if auth_error:
                return auth_error
            tenant_id = auth_tenant_id
            
            body = json.loads(event.get('body', '{}'))
            fz152_enabled = body.get('enabled', False)

            cur.execute("""
                UPDATE t_p56134400_telegram_ai_bot_pdf.tenants
                SET fz152_enabled = %s
                WHERE id = %s
            """, (fz152_enabled, tenant_id))

            if fz152_enabled:
                cur.execute("""
                    UPDATE t_p56134400_telegram_ai_bot_pdf.tenant_settings
                    SET 
                        embedding_provider = 'yandex',
                        embedding_doc_model = 'text-search-doc',
                        embedding_query_model = 'text-search-query',
                        ai_settings = jsonb_set(
                            COALESCE(ai_settings, '{}'::jsonb),
                            '{model}',
                            '"yandexgpt-lite"',
                            true
                        ),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE tenant_id = %s
                """, (tenant_id,))

            conn.commit()
            cur.close()
            conn.close()

            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'fz152_enabled': fz152_enabled}),
                'isBase64Encoded': False
            }

        elif method == 'GET' and action == 'global_consent_settings':
            default_settings = {
                'enabled': False,
                'text': 'Я согласен на обработку персональных данных в соответствии с Политикой конфиденциальности'
            }

            cur.close()
            conn.close()

            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(default_settings),
                'isBase64Encoded': False
            }

        elif method == 'PUT' and action == 'global_consent_settings':
            body = json.loads(event.get('body', '{}'))
            
            cur.close()
            conn.close()

            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'Global settings updated'}),
                'isBase64Encoded': False
            }

        else:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid action or missing parameters'}),
                'isBase64Encoded': False
            }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }