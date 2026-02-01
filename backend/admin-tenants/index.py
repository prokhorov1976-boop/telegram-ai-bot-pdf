import json
import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor

sys.path.append('/function/code')
from timezone_helper import moscow_naive

def handler(event: dict, context) -> dict:
    """API для управления тенантами (клиентами) - только для суперадмина"""
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }

    try:
        # Проверка авторизации суперадмина
        import jwt
        headers = event.get('headers', {})
        auth_header = headers.get('X-Authorization') or headers.get('Authorization') or headers.get('authorization') or ''
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Unauthorized'}),
                'isBase64Encoded': False
            }
        
        token = auth_header.replace('Bearer ', '')
        jwt_secret = os.environ.get('JWT_SECRET', 'default-jwt-secret-change-in-production')
        
        try:
            payload = jwt.decode(token, jwt_secret, algorithms=['HS256'])
            user_role = payload.get('role')
            
            if user_role != 'super_admin':
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Super admin access required'}),
                    'isBase64Encoded': False
                }
        except jwt.ExpiredSignatureError:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Token expired'}),
                'isBase64Encoded': False
            }
        except jwt.InvalidTokenError:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid token'}),
                'isBase64Encoded': False
            }

        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor(cursor_factory=RealDictCursor)
        schema = 't_p56134400_telegram_ai_bot_pdf'

        if method == 'GET':
            # Получить всех тенантов
            cur.execute(f"""
                SELECT t.id, t.slug, t.name, t.description, t.tariff_id, 
                       t.subscription_end_date, t.created_at, t.fz152_enabled,
                       COUNT(DISTINCT d.id) as documents_count,
                       COUNT(DISTINCT u.id) as admins_count,
                       STRING_AGG(DISTINCT u.email, ', ') as admin_emails
                FROM {schema}.tenants t
                LEFT JOIN {schema}.tenant_documents d ON t.id = d.tenant_id
                LEFT JOIN {schema}.admin_users u ON t.id = u.tenant_id
                GROUP BY t.id, t.slug, t.name, t.description, t.tariff_id, 
                         t.subscription_end_date, t.created_at, t.fz152_enabled
                ORDER BY t.created_at DESC
            """)
            
            rows = cur.fetchall()
            tenants = []
            
            for row in rows:
                tenant = dict(row)
                tenant['created_at'] = tenant['created_at'].isoformat() if tenant['created_at'] else None
                tenant['subscription_end_date'] = tenant['subscription_end_date'].isoformat() if tenant['subscription_end_date'] else None
                tenants.append(tenant)
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'tenants': tenants}),
                'isBase64Encoded': False
            }

        elif method == 'POST':
            # Создать нового тенанта вручную (без оплаты)
            import hashlib
            import secrets
            import string
            from datetime import datetime, timedelta
            
            body = json.loads(event.get('body', '{}'))
            tenant_name = body.get('name')
            tenant_slug = body.get('slug')
            owner_email = body.get('owner_email')
            owner_phone = body.get('owner_phone', '')
            tariff_id = body.get('tariff_id', 'basic')
            subscription_months = body.get('subscription_months', 1)
            fz152_enabled = body.get('fz152_enabled', False)
            
            if not tenant_name or not tenant_slug or not owner_email:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'name, slug and owner_email required'}),
                    'isBase64Encoded': False
                }
            
            # Проверка уникальности slug
            cur.execute(f"SELECT id FROM {schema}.tenants WHERE slug = %s", (tenant_slug,))
            if cur.fetchone():
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Slug already exists'}),
                    'isBase64Encoded': False
                }
            
            # Вычисляем дату окончания подписки
            subscription_end = moscow_naive() + timedelta(days=30 * subscription_months)
            
            # Создаем тенант
            cur.execute(f"""
                INSERT INTO {schema}.tenants 
                (slug, name, description, owner_email, owner_phone, template_version, auto_update, status, 
                 is_public, subscription_status, subscription_end_date, tariff_id, fz152_enabled)
                VALUES (%s, %s, %s, %s, %s, '1.0.0', false, 'active', true, 'active', %s, %s, %s)
                RETURNING id
            """, (tenant_slug, tenant_name, 'Создан суперадмином вручную', owner_email, owner_phone, subscription_end, tariff_id, fz152_enabled))
            
            tenant_id = cur.fetchone()['id']
            
            # Копируем настройки из ШАБЛОНА (tenant_id=1)
            cur.execute(f"""
                SELECT ai_settings, widget_settings, messenger_settings, page_settings
                FROM {schema}.tenant_settings
                WHERE tenant_id = 1
            """)
            template_settings = cur.fetchone()
            
            if template_settings:
                ai_settings = template_settings['ai_settings'] or {}
                
                # ФЗ-152: принудительно Яндекс для чата и эмбеддингов
                if fz152_enabled:
                    ai_settings['chat_provider'] = 'yandex'
                    ai_settings['chat_model'] = 'yandexgpt'
                    ai_settings['embedding_provider'] = 'yandex'
                    ai_settings['embedding_model'] = 'text-search-query'
                
                cur.execute(f"""
                    INSERT INTO {schema}.tenant_settings 
                    (tenant_id, ai_settings, widget_settings, messenger_settings, page_settings, 
                     embedding_provider, embedding_query_model)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (tenant_id, json.dumps(ai_settings), template_settings['widget_settings'], 
                      template_settings['messenger_settings'], template_settings['page_settings'],
                      ai_settings.get('embedding_provider', 'yandex'),
                      ai_settings.get('embedding_model', 'text-search-query')))
            else:
                # Fallback: создаем пустую запись, если шаблон не найден
                cur.execute(f"""
                    INSERT INTO {schema}.tenant_settings (tenant_id)
                    VALUES (%s)
                """, (tenant_id,))
            
            # Создаем пользователя-владельца
            username = f"{tenant_slug}_admin"
            password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            
            cur.execute(f"""
                INSERT INTO {schema}.admin_users 
                (username, password_hash, email, role, tenant_id, is_active, subscription_status, subscription_end_date, tariff_id)
                VALUES (%s, %s, %s, 'tenant_admin', %s, true, 'active', %s, %s)
                RETURNING id
            """, (username, password_hash, owner_email, tenant_id, subscription_end, tariff_id))
            
            user_id = cur.fetchone()['id']
            
            conn.commit()
            cur.close()
            conn.close()
            
            # Инициализируем все настройки для нового тенанта
            import requests
            try:
                print(f'Initializing settings for tenant {tenant_id}')
                init_response = requests.post(
                    'https://functions.poehali.dev/696f9f2e-71e7-444d-84bd-46e69fd00150',
                    json={'tenant_id': tenant_id},
                    timeout=10
                )
                if init_response.ok:
                    print(f'Settings initialized: {init_response.json()}')
                else:
                    print(f'Warning: Failed to initialize settings: {init_response.text}')
            except Exception as init_error:
                print(f'Warning: Could not initialize settings: {init_error}')
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True, 
                    'tenant_id': tenant_id,
                    'tenant_slug': tenant_slug,
                    'user_id': user_id,
                    'username': username,
                    'password': password,
                    'login_url': f"https://ai-ru.ru/{tenant_slug}/admin"
                }),
                'isBase64Encoded': False
            }

        elif method == 'PUT':
            # Обновить тенанта (например, сменить тариф)
            body = json.loads(event.get('body', '{}'))
            tenant_id = body.get('tenant_id')
            new_tariff_id = body.get('tariff_id')
            
            if not tenant_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'tenant_id required'}),
                    'isBase64Encoded': False
                }
            
            update_fields = []
            params = []
            
            if new_tariff_id:
                update_fields.append('tariff_id = %s')
                params.append(new_tariff_id)
            
            if 'subscription_end_date' in body:
                update_fields.append('subscription_end_date = %s')
                params.append(body['subscription_end_date'])
            
            if 'fz152_enabled' in body:
                update_fields.append('fz152_enabled = %s')
                params.append(body['fz152_enabled'])
            
            if not update_fields:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'No fields to update'}),
                    'isBase64Encoded': False
                }
            
            update_fields.append('updated_at = CURRENT_TIMESTAMP')
            params.append(tenant_id)
            
            query = f"""
                UPDATE {schema}.tenants
                SET {', '.join(update_fields)}
                WHERE id = %s
            """
            
            cur.execute(query, params)
            conn.commit()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'Tenant updated'}),
                'isBase64Encoded': False
            }

        elif method == 'DELETE':
            # Удалить тенанта со всеми связанными данными
            body = json.loads(event.get('body', '{}'))
            tenant_id = body.get('tenant_id')
            
            print(f"DELETE request: tenant_id={tenant_id}, type={type(tenant_id)}")
            
            if not tenant_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'tenant_id required'}),
                    'isBase64Encoded': False
                }
            
            # Преобразуем в int для сравнения
            tenant_id = int(tenant_id)
            print(f"Converted tenant_id={tenant_id}")
            
            # Защита от удаления важных тенантов
            if tenant_id in [1, 2, 777]:
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Cannot delete protected tenants (1, 2, 777)'}),
                    'isBase64Encoded': False
                }
            
            # Удаление всех связанных данных в правильном порядке
            try:
                print(f"Starting cascade delete for tenant {tenant_id}")
                
                # 1. Удаляем чанки
                cur.execute(f"DELETE FROM {schema}.tenant_chunks WHERE tenant_id = %s", (tenant_id,))
                print(f"Deleted {cur.rowcount} chunks")
                
                # 2. Удаляем документы
                cur.execute(f"DELETE FROM {schema}.tenant_documents WHERE tenant_id = %s", (tenant_id,))
                print(f"Deleted {cur.rowcount} documents")
                
                # 3. Удаляем API ключи
                cur.execute(f"DELETE FROM {schema}.tenant_api_keys WHERE tenant_id = %s", (tenant_id,))
                print(f"Deleted {cur.rowcount} API keys")
                
                # 4. Удаляем настройки
                cur.execute(f"DELETE FROM {schema}.tenant_settings WHERE tenant_id = %s", (tenant_id,))
                print(f"Deleted {cur.rowcount} settings")
                
                # 5. Удаляем сообщения чатов
                cur.execute(f"DELETE FROM {schema}.chat_messages WHERE tenant_id = %s", (tenant_id,))
                print(f"Deleted {cur.rowcount} messages")
                
                # 6. Удаляем использование токенов
                cur.execute(f"DELETE FROM {schema}.token_usage WHERE tenant_id = %s", (tenant_id,))
                print(f"Deleted {cur.rowcount} token usage records")
                
                # 7. Удаляем настройки форматирования
                cur.execute(f"DELETE FROM {schema}.messenger_formatting_settings WHERE tenant_id = %s", (tenant_id,))
                print(f"Deleted {cur.rowcount} formatting settings")
                
                # 8. Удаляем настройки виджета (может не быть записей)
                cur.execute(f"DELETE FROM {schema}.widget_settings WHERE tenant_id = %s", (tenant_id,))
                print(f"Deleted {cur.rowcount} widget settings")
                
                # 9. Удаляем логи качества
                cur.execute(f"DELETE FROM {schema}.tenant_quality_gate_logs WHERE tenant_id = %s", (tenant_id,))
                print(f"Deleted {cur.rowcount} quality gate logs")
                
                # 10. Удаляем AI настройки
                cur.execute(f"DELETE FROM {schema}.ai_settings WHERE tenant_id = %s", (tenant_id,))
                print(f"Deleted {cur.rowcount} AI settings")
                
                # 11. Удаляем быстрые вопросы
                cur.execute(f"DELETE FROM {schema}.quick_questions WHERE tenant_id = %s", (tenant_id,))
                print(f"Deleted {cur.rowcount} quick questions")
                
                # 12. Удаляем платежи по подписке
                cur.execute(f"DELETE FROM {schema}.subscription_payments WHERE tenant_id = %s", (tenant_id,))
                print(f"Deleted {cur.rowcount} subscription payments")
                
                # 13. Удаляем админов тенанта (кроме суперадминов)
                cur.execute(f"DELETE FROM {schema}.admin_users WHERE tenant_id = %s AND role != 'super_admin'", (tenant_id,))
                print(f"Deleted {cur.rowcount} admin users")
                
                # 14. Наконец, удаляем сам тенант
                cur.execute(f"DELETE FROM {schema}.tenants WHERE id = %s", (tenant_id,))
                print(f"Deleted tenant: {cur.rowcount} row(s)")
                
                conn.commit()
                print(f"Successfully deleted tenant {tenant_id}")
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'Tenant deleted successfully'}),
                    'isBase64Encoded': False
                }
            except Exception as delete_error:
                print(f"ERROR deleting tenant: {str(delete_error)}")
                print(f"Error type: {type(delete_error).__name__}")
                import traceback
                print(f"Traceback: {traceback.format_exc()}")
                conn.rollback()
                cur.close()
                conn.close()
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f'Failed to delete tenant: {str(delete_error)}'}),
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
        print(f"MAIN HANDLER ERROR: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }