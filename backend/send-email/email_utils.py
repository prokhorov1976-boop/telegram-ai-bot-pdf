import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_email(to_email: str, subject: str, html_body: str) -> dict:
    '''Отправка email через SMTP'''
    smtp_host = os.environ.get('EMAIL_SMTP_HOST')
    smtp_port = int(os.environ.get('EMAIL_SMTP_PORT', 465))
    smtp_user = os.environ.get('EMAIL_SMTP_USER')
    smtp_password = os.environ.get('EMAIL_SMTP_PASSWORD')
    
    if not all([smtp_host, smtp_user, smtp_password]):
        return {'success': False, 'error': 'Email configuration missing'}
    
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = smtp_user
        msg['To'] = to_email
        
        html_part = MIMEText(html_body, 'html', 'utf-8')
        msg.attach(html_part)
        
        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_host, smtp_port)
        else:
            server = smtplib.SMTP(smtp_host, smtp_port)
            server.starttls()
        
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
        server.quit()
        
        return {'success': True, 'message': f'Email sent to {to_email}'}
    
    except Exception as e:
        return {'success': False, 'error': str(e)}
