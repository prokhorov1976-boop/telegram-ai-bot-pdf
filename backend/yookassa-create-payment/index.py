import json
import os
import requests
import uuid
import psycopg2

def handler(event: dict, context) -> dict:
    """Создание платежа через ЮKassa API"""
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
        amount = body.get('amount')
        tariff_id = body.get('tariff_id')
        description = body.get('description', 'Оплата услуг отеля')
        return_url = body.get('return_url', 'https://example.com')

        if not amount or amount <= 0:
            raise ValueError('Invalid amount')
        
        # КРИТИЧНО: валидация amount против тарифов (защита от подделки сумм)
        if tariff_id:
            conn = psycopg2.connect(os.environ['DATABASE_URL'])
            cur = conn.cursor()
            cur.execute("""
                SELECT setup_fee, renewal_price 
                FROM t_p56134400_telegram_ai_bot_pdf.tariff_plans 
                WHERE id = %s
            """, (tariff_id,))
            tariff = cur.fetchone()
            cur.close()
            conn.close()
            
            if tariff:
                setup_fee, renewal_price = tariff
                valid_amounts = [float(setup_fee), float(renewal_price)]
                if float(amount) not in valid_amounts:
                    raise ValueError(f'Invalid amount for tariff {tariff_id}: expected {valid_amounts}, got {amount}')

        shop_id = os.environ.get('YOOKASSA_SHOP_ID')
        secret_key = os.environ.get('YOOKASSA_SECRET_KEY')

        if not shop_id or not secret_key:
            raise Exception('ЮKassa credentials not configured')

        idempotence_key = str(uuid.uuid4())

        # Добавляем metadata с tariff_id для проверки в webhook
        payment_metadata = body.get('metadata', {})
        if tariff_id:
            payment_metadata['tariff_id'] = tariff_id
        
        yookassa_response = requests.post(
            'https://api.yookassa.ru/v3/payments',
            auth=(shop_id, secret_key),
            headers={
                'Idempotence-Key': idempotence_key,
                'Content-Type': 'application/json'
            },
            json={
                'amount': {
                    'value': f'{amount:.2f}',
                    'currency': 'RUB'
                },
                'confirmation': {
                    'type': 'redirect',
                    'return_url': return_url
                },
                'description': description,
                'capture': True,
                'metadata': payment_metadata
            },
            timeout=10
        )

        if not yookassa_response.ok:
            raise Exception(f'ЮKassa API error: {yookassa_response.status_code} - {yookassa_response.text}')

        payment_data = yookassa_response.json()

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'payment_id': payment_data.get('id'),
                'confirmation_url': payment_data.get('confirmation', {}).get('confirmation_url'),
                'status': payment_data.get('status')
            }),
            'isBase64Encoded': False
        }

    except ValueError as e:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    except Exception as e:
        print(f'Payment creation error: {e}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }