import json
import os
import psycopg2
from datetime import datetime
import sys
sys.path.append('/function/code')
from timezone_helper import moscow_naive
from auth_middleware import require_auth

def handler(event: dict, context) -> dict:
    '''Мониторинг нагрузки системы: активные тенанты, статистика БД, активность пользователей'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    # Проверка авторизации (только super_admin)
    authorized, payload, error_response = require_auth(event)
    if not authorized:
        return error_response
    
    user_role = payload.get('role')
    if user_role != 'super_admin':
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Super admin access required'}),
            'isBase64Encoded': False
        }
    
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        schema = 't_p56134400_telegram_ai_bot_pdf'
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'DB connection failed: {str(e)}'}),
            'isBase64Encoded': False
        }
    
    try:
        stats = {}
        
        # 1. Общая статистика тенантов
        cur.execute(f"""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN subscription_status = 'active' THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN subscription_status = 'expired' THEN 1 ELSE 0 END) as expired,
                SUM(CASE WHEN subscription_status = 'trial' THEN 1 ELSE 0 END) as trial
            FROM {schema}.tenants
        """)
        row = cur.fetchone()
        stats['tenants'] = {
            'total': row[0] if row[0] else 0,
            'active': row[1] if row[1] else 0,
            'expired': row[2] if row[2] else 0,
            'trial': row[3] if row[3] else 0
        }
        
        # 2. Статистика сообщений
        cur.execute(f"""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 ELSE 0 END) as last_24h,
                SUM(CASE WHEN created_at >= NOW() - INTERVAL '1 hour' THEN 1 ELSE 0 END) as last_1h
            FROM {schema}.chat_messages
        """)
        row = cur.fetchone()
        stats['messages'] = {
            'total': row[0] if row[0] else 0,
            'last_24h': row[1] if row[1] else 0,
            'last_1h': row[2] if row[2] else 0
        }
        
        # 3. Статистика документов
        cur.execute(f"SELECT COUNT(*) FROM {schema}.tenant_documents")
        row = cur.fetchone()
        stats['documents'] = {
            'total': row[0] if row[0] else 0
        }
        
        # 4. Истекающие подписки (в ближайшие 7 дней)
        cur.execute(f"""
            SELECT COUNT(*) 
            FROM {schema}.tenants
            WHERE subscription_status = 'active'
            AND subscription_end_date <= NOW() + INTERVAL '7 days'
            AND subscription_end_date >= NOW()
        """)
        row = cur.fetchone()
        stats['expiring_subscriptions'] = row[0] if row[0] else 0
        
        # 5. Статистика по тарифам
        cur.execute(f"""
            SELECT 
                tp.name,
                COUNT(t.id) as count
            FROM {schema}.tariff_plans tp
            LEFT JOIN {schema}.tenants t ON t.tariff_id = tp.id AND t.subscription_status = 'active'
            GROUP BY tp.id, tp.name
            ORDER BY count DESC
        """)
        tariff_distribution = []
        for row in cur.fetchall():
            tariff_distribution.append({
                'tariff_name': row[0],
                'tenant_count': row[1]
            })
        stats['tariff_distribution'] = tariff_distribution
        
        # 6. Статистика БД
        stats['database'] = {
            'max_connections': 50,
            'tables': 26
        }
        
        # 7. Рекомендуемые лимиты
        stats['capacity'] = {
            'recommended_max_tenants': 200,
            'current_usage_percent': round((stats['tenants']['active'] / 200) * 100, 1)
        }
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'stats': stats,
                'timestamp': moscow_naive().isoformat()
            }),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        import traceback
        error_details = {
            'error': str(e),
            'traceback': traceback.format_exc()
        }
        print(f'Error getting system stats: {error_details}')
        try:
            cur.close()
            conn.close()
        except:
            pass
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(error_details),
            'isBase64Encoded': False
        }