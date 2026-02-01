import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def handler(event: dict, context) -> dict:
    """Отправка email-уведомлений после успешного заказа"""
    method = event.get('httpMethod', 'POST')
    
    # КРИТИЧНО: проверка секретного токена для внутренних вызовов
    headers = event.get('headers', {})
    internal_token = headers.get('X-Internal-Token') or headers.get('x-internal-token')
    expected_token = os.environ.get('INTERNAL_API_TOKEN')
    
    # Если установлен INTERNAL_API_TOKEN, проверяем его
    if expected_token and internal_token != expected_token:
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Unauthorized: invalid internal token'}),
            'isBase64Encoded': False
        }

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }

    try:
        body_str = event.get('body', '{}')
        if not body_str or body_str == '':
            body_str = '{}'
        
        body = json.loads(body_str)
        
        # Данные заказа
        customer_email = body.get('customer_email', '')
        customer_name = body.get('customer_name', '')
        customer_phone = body.get('customer_phone', '')
        tariff_name = body.get('tariff_name', '')
        amount = body.get('amount', 0)
        payment_id = body.get('payment_id', '')
        tenant_slug = body.get('tenant_slug', '')
        username = body.get('username', '')
        password = body.get('password', '')
        login_url = body.get('login_url', '')
        
        if not customer_email:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': False, 'error': 'Email клиента обязателен'}),
                'isBase64Encoded': False
            }
        
        # Настройки SMTP
        smtp_host = os.environ.get('EMAIL_SMTP_HOST', '')
        smtp_port = int(os.environ.get('EMAIL_SMTP_PORT', '465'))
        smtp_user = os.environ.get('EMAIL_SMTP_USER', '')
        smtp_password = os.environ.get('EMAIL_SMTP_PASSWORD', '')
        
        if not all([smtp_host, smtp_user, smtp_password]):
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': False, 'error': 'SMTP настройки не заданы'}),
                'isBase64Encoded': False
            }
        
        # Email клиенту через шаблоны из БД
        if username and password and login_url:
            import psycopg2
            dsn = os.environ.get('DATABASE_URL')
            if dsn:
                try:
                    conn = psycopg2.connect(dsn)
                    cur = conn.cursor()
                    cur.execute("SELECT subject, body FROM email_templates WHERE template_key = 'tariff_created'")
                    row = cur.fetchone()
                    cur.close()
                    conn.close()
                    
                    if row:
                        subject, body_html = row
                        # Подстановка переменных
                        subject = subject.replace('{{email}}', customer_email)
                        body_html = body_html.replace('{{email}}', customer_email)
                        body_html = body_html.replace('{{password}}', password)
                        body_html = body_html.replace('{{login_url}}', login_url)
                        send_email(smtp_host, smtp_port, smtp_user, smtp_password, customer_email, subject, body_html)
                    else:
                        # Fallback на старый шаблон
                        customer_msg = create_customer_email(customer_name, customer_email, tariff_name, amount, tenant_slug, username, password, login_url)
                        send_email(smtp_host, smtp_port, smtp_user, smtp_password, customer_email, 'Подтверждение заказа AI-консультанта', customer_msg)
                except:
                    # Fallback на старый шаблон при ошибке
                    customer_msg = create_customer_email(customer_name, customer_email, tariff_name, amount, tenant_slug, username, password, login_url)
                    send_email(smtp_host, smtp_port, smtp_user, smtp_password, customer_email, 'Подтверждение заказа AI-консультанта', customer_msg)
            else:
                customer_msg = create_customer_email(customer_name, customer_email, tariff_name, amount, tenant_slug, username, password, login_url)
                send_email(smtp_host, smtp_port, smtp_user, smtp_password, customer_email, 'Подтверждение заказа AI-консультанта', customer_msg)
        else:
            customer_msg = create_customer_email(customer_name, customer_email, tariff_name, amount, tenant_slug, username, password, login_url)
            send_email(smtp_host, smtp_port, smtp_user, smtp_password, customer_email, 'Подтверждение заказа AI-консультанта', customer_msg)
        
        # Email администратору
        admin_msg = create_admin_email(customer_name, customer_email, customer_phone, tariff_name, amount, payment_id, tenant_slug)
        send_email(smtp_host, smtp_port, smtp_user, smtp_password, smtp_user, f'Новый заказ: {tariff_name}', admin_msg)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'message': 'Уведомления отправлены'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        print(f'Error sending email: {e}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': str(e)}),
            'isBase64Encoded': False
        }

def send_email(host: str, port: int, user: str, password: str, to_email: str, subject: str, html_body: str):
    """Отправка email через SMTP"""
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = user
    msg['To'] = to_email
    
    html_part = MIMEText(html_body, 'html', 'utf-8')
    msg.attach(html_part)
    
    if port == 465:
        # SSL
        with smtplib.SMTP_SSL(host, port, timeout=10) as server:
            server.login(user, password)
            server.send_message(msg)
    else:
        # TLS
        with smtplib.SMTP(host, port, timeout=10) as server:
            server.starttls()
            server.login(user, password)
            server.send_message(msg)

def create_customer_email(name: str, email: str, tariff: str, amount: float, tenant_slug: str, username: str = '', password: str = '', login_url: str = '') -> str:
    """HTML шаблон письма клиенту"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
            .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            .info {{ background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }}
            .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 30px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Заказ успешно оформлен!</h1>
            </div>
            <div class="content">
                <p>Здравствуйте{', ' + name if name else ''}!</p>
                
                <p>Благодарим за выбор нашего AI-консультанта для отелей.</p>
                
                <div class="info">
                    <h3>📋 Детали заказа:</h3>
                    <p><strong>Тариф:</strong> {tariff}</p>
                    <p><strong>Стоимость:</strong> {amount:,.0f} ₽</p>
                    <p><strong>Email:</strong> {email}</p>
                    <p><strong>Ваш проект:</strong> {tenant_slug}</p>
                </div>
                
                {f'''<div class="info" style="background: #e0f2fe; border-left: 4px solid #0284c7;">
                    <h3>🔑 Доступ к админ-панели:</h3>
                    <p><strong>Логин:</strong> <code style="background: white; padding: 4px 8px; border-radius: 3px;">{username}</code></p>
                    <p><strong>Пароль:</strong> <code style="background: white; padding: 4px 8px; border-radius: 3px;">{password}</code></p>
                    <p style="font-size: 12px; color: #64748b; margin-top: 10px;">💡 При необходимости вы можете сменить пароль в настройках админ-панели</p>
                    <p><a href="{login_url}" class="button" style="display: inline-block; background: #0284c7; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 10px;">Войти в админ-панель</a></p>
                </div>''' if username and password else ''}
                
                <p><strong>📖 Что дальше?</strong></p>
                
                <div class="info" style="background: #fef3c7; border-left: 4px solid #f59e0b;">
                    <div style="display: flex; gap: 12px; margin-bottom: 16px;">
                        <div style="background: #667eea; color: white; width: 28px; height: 28px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">1</div>
                        <div>
                            <p style="margin: 0; font-weight: 600;">Получите доступы на email</p>
                            <p style="margin: 4px 0 0 0; font-size: 14px; color: #64748b;">Логин и пароль для входа в админ-панель</p>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 12px; margin-bottom: 16px;">
                        <div style="background: #667eea; color: white; width: 28px; height: 28px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">2</div>
                        <div>
                            <p style="margin: 0; font-weight: 600;">Войдите в систему</p>
                            <p style="margin: 4px 0 0 0; font-size: 14px; color: #64748b;">Перейдите в админ-панель по ссылке из письма</p>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 12px; margin-bottom: 16px;">
                        <div style="background: #667eea; color: white; width: 28px; height: 28px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">3</div>
                        <div>
                            <p style="margin: 0; font-weight: 600;">Загрузите документы</p>
                            <p style="margin: 4px 0 0 0; font-size: 14px; color: #64748b;">Добавьте PDF-файлы с информацией о вашем бизнесе</p>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 12px; margin-bottom: 16px;">
                        <div style="background: #667eea; color: white; width: 28px; height: 28px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">4</div>
                        <div>
                            <p style="margin: 0; font-weight: 600;">Настройте каналы связи</p>
                            <p style="margin: 4px 0 0 0; font-size: 14px; color: #64748b;">Подключите Telegram, WhatsApp, VK самостоятельно или с помощью наших специалистов. Бот также доступен по прямой ссылке и есть код для встраивания на сайт</p>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 12px;">
                        <div style="background: #667eea; color: white; width: 28px; height: 28px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">5</div>
                        <div>
                            <p style="margin: 0; font-weight: 600;">Всё готово!</p>
                            <p style="margin: 4px 0 0 0; font-size: 14px; color: #64748b;">AI-консультант начнёт отвечать на вопросы клиентов</p>
                        </div>
                    </div>
                </div>
                
                <p style="margin-top: 20px;"><strong>Дополнительные возможности:</strong></p>
                <ul>
                    <li>📊 Статистика обращений и популярные вопросы</li>
                    <li>⚙️ Настройка внешнего вида виджета чата</li>
                    <li>🔔 Уведомления о новых обращениях</li>
                    <li>👥 Управление пользователями (для тарифа Бизнес+)</li>
                </ul>
                
                <p>Если у вас есть вопросы, ответим в течение нескольких часов:</p>
                <p>📧 Email: <a href="mailto:info@298100.ru">info@298100.ru</a><br>
                📱 Телефон: <a href="tel:+79787236035">+7 (978) 723-60-35</a></p>
            </div>
            <div class="footer">
                <p>С уважением, команда AI-консультант для отелей</p>
                <p>Республика Крым, г. Феодосия | ИНН: 910800040469</p>
            </div>
        </div>
    </body>
    </html>
    """

def create_admin_email(name: str, email: str, phone: str, tariff: str, amount: float, payment_id: str, tenant_slug: str) -> str:
    """HTML шаблон письма администратору"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: #10b981; color: white; padding: 20px; border-radius: 5px; }}
            .content {{ padding: 20px; }}
            .info {{ background: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>✅ Новый заказ: {tariff}</h2>
            </div>
            <div class="content">
                <div class="info">
                    <h3>Информация о клиенте:</h3>
                    <p><strong>Имя:</strong> {name or 'Не указано'}</p>
                    <p><strong>Email:</strong> {email}</p>
                    <p><strong>Телефон:</strong> {phone}</p>
                </div>
                
                <div class="info">
                    <h3>Детали заказа:</h3>
                    <p><strong>Тариф:</strong> {tariff}</p>
                    <p><strong>Сумма:</strong> {amount:,.0f} ₽</p>
                    <p><strong>ID платежа:</strong> {payment_id}</p>
                    <p><strong>Slug проекта:</strong> {tenant_slug}</p>
                </div>
                
                <p><strong>Действия:</strong></p>
                <ul>
                    <li>Настроить проект в админке</li>
                    <li>Отправить клиенту данные для входа</li>
                    <li>Провести онбординг при необходимости</li>
                </ul>
            </div>
        </div>
    </body>
    </html>
    """