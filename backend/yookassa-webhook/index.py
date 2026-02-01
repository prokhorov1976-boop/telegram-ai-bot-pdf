import json
import os
import psycopg2
import psycopg2.extras
import hashlib
import secrets
import string
import requests
import sys
from datetime import datetime, timedelta

sys.path.append('/function/code')
from timezone_helper import moscow_naive

psycopg2.extensions.register_adapter(dict, psycopg2.extras.Json)

SEND_EMAIL_URL = 'https://functions.poehali.dev/38938588-b119-4fcc-99d9-952e16dd8d6a'

def handler(event: dict, context) -> dict:
    """Webhook для получения уведомлений от ЮKassa о статусе платежей"""
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
        
        event_type = body.get('event')
        payment_object = body.get('object', {})
        
        payment_id = payment_object.get('id')
        status = payment_object.get('status')
        amount = payment_object.get('amount', {}).get('value')
        description = payment_object.get('description')

        if not payment_id:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'ok': True}),
                'isBase64Encoded': False
            }

        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        schema = os.environ.get('MAIN_DB_SCHEMA', 'public')

        cur.execute(f"""
            INSERT INTO {schema}.payments (payment_id, status, amount, description, event_type, created_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (payment_id) 
            DO UPDATE SET status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP
        """, (payment_id, status, amount, description, event_type, moscow_naive()))

        conn.commit()
        
        # Если платеж успешный и это новое событие (succeeded), создаем тенант и пользователя
        if status == 'succeeded' and event_type == 'payment.succeeded':
            # Извлекаем данные из metadata платежа
            metadata = payment_object.get('metadata', {})
            tenant_name = metadata.get('tenant_name', description or 'New Tenant')
            tenant_slug = metadata.get('tenant_slug', f"tenant-{payment_id[:8]}")
            owner_email = metadata.get('owner_email')
            owner_phone = metadata.get('owner_phone', '')
            
            if owner_email:
                tariff_id = metadata.get('tariff_id', 'basic')
                consent_text = metadata.get('consent_text', '')
                session_id = metadata.get('session_id', '')
                requires_fz152 = metadata.get('requires_fz152', False)
                
                # Получаем first_month_included из БД по tariff_id
                cur.execute("""
                    SELECT first_month_included 
                    FROM t_p56134400_telegram_ai_bot_pdf.tariff_plans 
                    WHERE id = %s
                """, (tariff_id,))
                tariff_row = cur.fetchone()
                first_month_included = tariff_row[0] if tariff_row else False
                
                # Получаем IP и User-Agent из контекста запроса
                request_context = event.get('requestContext', {})
                identity = request_context.get('identity', {})
                ip_address = identity.get('sourceIp', '')
                user_agent = identity.get('userAgent', '')
                
                # Логируем согласие пользователя на обработку персональных данных
                if consent_text:
                    try:
                        cur.execute("""
                            INSERT INTO t_p56134400_telegram_ai_bot_pdf.sales_consent_logs 
                            (session_id, email, tenant_name, tariff_id, consent_text, ip_address, user_agent, requires_fz152)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        """, (session_id, owner_email, tenant_name, tariff_id, consent_text, ip_address, user_agent, requires_fz152))
                        conn.commit()
                    except Exception as e:
                        print(f"Failed to log consent: {e}")
                
                # Вычисляем дату окончания подписки:
                # Если first_month_included=true, то первый платеж уже включает 1 месяц
                # Если false, то первый платеж = setup_fee, период не предоставляется
                if first_month_included:
                    subscription_end = moscow_naive() + timedelta(days=30)
                else:
                    # Setup fee без месяца - подписка истекает сразу
                    subscription_end = moscow_naive()
                
                # Начинаем транзакцию для атомарного создания тенанта
                try:
                    cur.execute("BEGIN")
                    
                    # Создаем тенант
                    cur.execute("""
                        INSERT INTO t_p56134400_telegram_ai_bot_pdf.tenants 
                        (slug, name, description, owner_email, owner_phone, template_version, auto_update, status, 
                         is_public, subscription_status, subscription_end_date, tariff_id, fz152_enabled)
                        VALUES (%s, %s, %s, %s, %s, '1.0.0', false, 'active', true, 'active', %s, %s, %s)
                        RETURNING id
                    """, (tenant_slug, tenant_name, f'Создан после оплаты {payment_id}', owner_email, owner_phone, subscription_end, tariff_id, requires_fz152))
                    
                    tenant_id = cur.fetchone()[0]
                    
                    # Копируем настройки из ШАБЛОНА (tenant_id=1: template)
                    # Шаблон содержит все настройки по умолчанию: AI, промпт, виджет, telegram, автосообщения
                    cur.execute("""
                        SELECT ai_settings, widget_settings, telegram_settings, page_settings
                        FROM t_p56134400_telegram_ai_bot_pdf.tenant_settings
                        WHERE tenant_id = 1
                    """)
                    template_settings = cur.fetchone()
                    
                    if template_settings:
                        ai_settings = template_settings[0] or {}
                        
                        # ФЗ-152: принудительно Яндекс для чата и эмбеддингов
                        if requires_fz152:
                            ai_settings['chat_provider'] = 'yandex'
                            ai_settings['chat_model'] = 'yandexgpt'
                            ai_settings['embedding_provider'] = 'yandex'
                            ai_settings['embedding_model'] = 'text-search-query'
                        
                        # Подставляем данные клиента в page_settings
                        page_settings = template_settings[3] or {}
                        if isinstance(page_settings, dict):
                            # Подставляем название бота
                            if tenant_name:
                                page_settings['header_title'] = tenant_name
                            
                            # Подставляем контакты клиента
                            if owner_email:
                                page_settings['contact_email_value'] = owner_email
                            if owner_phone:
                                page_settings['contact_phone_value'] = owner_phone
                        
                        cur.execute("""
                            INSERT INTO t_p56134400_telegram_ai_bot_pdf.tenant_settings 
                            (tenant_id, ai_settings, widget_settings, telegram_settings, page_settings,
                             embedding_provider, embedding_query_model)
                            VALUES (%s, %s, %s, %s, %s, %s, %s)
                        """, (tenant_id, json.dumps(ai_settings), template_settings[1], template_settings[2], page_settings,
                              ai_settings.get('embedding_provider', 'yandex'),
                              ai_settings.get('embedding_model', 'text-search-query')))
                    else:
                        # Fallback: создаем пустую запись, если шаблон не найден
                        cur.execute("""
                            INSERT INTO t_p56134400_telegram_ai_bot_pdf.tenant_settings (tenant_id)
                            VALUES (%s)
                        """, (tenant_id,))
                    
                    # Копируем API-ключи из шаблона (для эмбеддингов и AI)
                    cur.execute("""
                        SELECT provider, key_name, key_value, is_active
                        FROM t_p56134400_telegram_ai_bot_pdf.tenant_api_keys
                        WHERE tenant_id = 1 AND is_active = true
                    """)
                    template_keys = cur.fetchall()
                    
                    for key_row in template_keys:
                        cur.execute("""
                            INSERT INTO t_p56134400_telegram_ai_bot_pdf.tenant_api_keys
                            (tenant_id, provider, key_name, key_value, is_active)
                            VALUES (%s, %s, %s, %s, %s)
                        """, (tenant_id, key_row[0], key_row[1], key_row[2], key_row[3]))
                    
                    # Создаем пользователя
                    username = f"{tenant_slug}_user"
                    password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
                    password_hash = hashlib.sha256(password.encode()).hexdigest()
                    
                    cur.execute("""
                        INSERT INTO t_p56134400_telegram_ai_bot_pdf.admin_users 
                        (username, password_hash, email, role, tenant_id, is_active, subscription_status, subscription_end_date, tariff_id)
                        VALUES (%s, %s, %s, 'tenant_admin', %s, true, 'active', %s, %s)
                        RETURNING id
                    """, (username, password_hash, owner_email, tenant_id, subscription_end, tariff_id))
                    
                    user_id = cur.fetchone()[0]
                    
                    # Записываем платеж в таблицу подписок
                    cur.execute("""
                        INSERT INTO t_p56134400_telegram_ai_bot_pdf.subscription_payments
                        (tenant_id, payment_id, amount, status, tariff_id, payment_type)
                        VALUES (%s, %s, %s, %s, %s, 'initial')
                    """, (tenant_id, payment_id, amount, status, tariff_id))
                    
                    # Обновляем запись платежа с tenant_id
                    cur.execute(f"""
                        UPDATE {schema}.payments 
                        SET description = description || ' | Tenant ID: ' || %s
                        WHERE payment_id = %s
                    """, (tenant_id, payment_id))
                    
                    conn.commit()
                    
                    # Инициализируем все настройки для нового тенанта
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
                    
                except Exception as tenant_error:
                    conn.rollback()
                    print(f"Error creating tenant: {tenant_error}")
                    raise
                
                # Отправляем email уведомление через отдельный сервис
                tariff_names = {
                    'basic': 'Старт',
                    'professional': 'Бизнес',
                    'enterprise': 'Премиум'
                }
                
                # Формируем URL для входа
                login_url = f"https://ai-ru.ru/{tenant_slug}/admin"
                
                email_sent = send_order_notification(
                    customer_email=owner_email,
                    customer_name=metadata.get('tenant_name', ''),
                    customer_phone=owner_phone,
                    tariff_name=tariff_names.get(tariff_id, tariff_id),
                    amount=float(amount),
                    payment_id=payment_id,
                    tenant_slug=tenant_slug,
                    username=username,
                    password=password,
                    login_url=login_url
                )
                
                print(f'Tenant {tenant_id} and user {user_id} created for payment {payment_id}. Email sent: {email_sent}')
        
        cur.close()
        conn.close()

        print(f'Payment {payment_id} updated with status {status}')

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'ok': True}),
            'isBase64Encoded': False
        }

    except Exception as e:
        print(f'Webhook processing error: {e}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }

def send_welcome_email(to_email: str, username: str, password: str, tenant_id: int, cur) -> bool:
    """Отправка email с доступами после оплаты"""
    try:
        # Получаем SMTP настройки и шаблон
        cur.execute("""
            SELECT setting_key, setting_value 
            FROM t_p56134400_telegram_ai_bot_pdf.default_settings
            WHERE setting_key IN ('smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'email_template_welcome')
        """)
        settings_rows = cur.fetchall()
        settings = {row[0]: row[1] for row in settings_rows}
        
        smtp_host = settings.get('smtp_host', '').strip()
        smtp_port = int(settings.get('smtp_port', 465))
        smtp_user = settings.get('smtp_user', '').strip()
        smtp_password = settings.get('smtp_password', '').strip()
        email_template = settings.get('email_template_welcome', 'Здравствуйте!\n\nВаш логин: {username}\nВаш пароль: {password}')
        
        if not all([smtp_host, smtp_user, smtp_password]):
            print('SMTP настройки не полностью заполнены')
            return False
        
        login_url = f"https://your-domain.com/content-editor?tenant_id={tenant_id}"
        email_body = email_template.format(username=username, password=password, login_url=login_url)
        
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = to_email
        msg['Subject'] = 'Доступ к AI-консультанту - оплата подтверждена'
        msg.attach(MIMEText(email_body, 'plain', 'utf-8'))
        
        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_host, smtp_port)
        else:
            server = smtplib.SMTP(smtp_host, smtp_port)
            server.starttls()
        
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
        server.quit()
        
        print(f'Welcome email успешно отправлен на {to_email}')
        return True
    except Exception as e:
        print(f'Ошибка отправки welcome email: {str(e)}')
        return False

def send_order_notification(customer_email: str, customer_name: str, customer_phone: str, 
                           tariff_name: str, amount: float, payment_id: str, tenant_slug: str,
                           username: str = '', password: str = '', login_url: str = '') -> bool:
    """Отправка email уведомления через отдельный сервис"""
    try:
        headers = {}
        internal_token = os.environ.get('INTERNAL_API_TOKEN')
        if internal_token:
            headers['X-Internal-Token'] = internal_token
        
        response = requests.post(
            SEND_EMAIL_URL,
            json={
                'customer_email': customer_email,
                'customer_name': customer_name,
                'customer_phone': customer_phone,
                'tariff_name': tariff_name,
                'amount': amount,
                'payment_id': payment_id,
                'tenant_slug': tenant_slug,
                'username': username,
                'password': password,
                'login_url': login_url
            },
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            print(f'Email notifications sent successfully for {customer_email}')
            return True
        else:
            print(f'Failed to send email: {response.text}')
            return False
    except Exception as e:
        print(f'Error sending email notification: {e}')
        return False