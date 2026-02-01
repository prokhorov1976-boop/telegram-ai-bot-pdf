import json
import os
import psycopg2
from datetime import datetime, timedelta
import sys
sys.path.append('/function/code')
from timezone_helper import moscow_naive
from auth_middleware import require_auth

def handler(event: dict, context) -> dict:
    """API для получения статистики использования токенов по тенантам"""
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization, Accept, Accept-Encoding',
                'Access-Control-Max-Age': '86400'
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

    authorized, payload, error_response = require_auth(event)
    if not authorized:
        return error_response
    
    if payload.get('role') != 'super_admin':
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Super admin access required'}),
            'isBase64Encoded': False
        }

    try:
        params = event.get('queryStringParameters', {}) or {}
        tenant_id = params.get('tenantId')
        period = params.get('period', '30')  # дней назад
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        # Вычисляем дату начала периода
        days_ago = int(period)
        start_date = moscow_naive() - timedelta(days=days_ago)
        
        if tenant_id:
            # Статистика по конкретному тенанту
            cur.execute("""
                SELECT 
                    operation_type,
                    model,
                    SUM(tokens_used) as total_tokens,
                    SUM(cost_rubles) as total_cost,
                    COUNT(*) as operations_count
                FROM t_p56134400_telegram_ai_bot_pdf.token_usage
                WHERE tenant_id = %s AND created_at >= %s
                GROUP BY operation_type, model
                ORDER BY total_cost DESC
            """, (tenant_id, start_date))
            
            stats = []
            for row in cur.fetchall():
                stats.append({
                    'operationType': row[0],
                    'model': row[1],
                    'totalTokens': row[2],
                    'totalCost': float(row[3]),
                    'operationsCount': row[4]
                })
            
            # Общая статистика за период
            cur.execute("""
                SELECT 
                    SUM(tokens_used) as total_tokens,
                    SUM(cost_rubles) as total_cost
                FROM t_p56134400_telegram_ai_bot_pdf.token_usage
                WHERE tenant_id = %s AND created_at >= %s
            """, (tenant_id, start_date))
            
            total_row = cur.fetchone()
            
            result = {
                'tenantId': int(tenant_id),
                'period': f'{period} дней',
                'totalTokens': total_row[0] or 0,
                'totalCost': float(total_row[1] or 0),
                'breakdown': stats
            }
        else:
            # Статистика по всем тенантам
            cur.execute("""
                SELECT 
                    t.id,
                    t.slug,
                    t.name,
                    COALESCE(SUM(tu.tokens_used), 0) as total_tokens,
                    COALESCE(SUM(tu.cost_rubles), 0) as total_cost,
                    COUNT(tu.id) as operations_count
                FROM t_p56134400_telegram_ai_bot_pdf.tenants t
                LEFT JOIN t_p56134400_telegram_ai_bot_pdf.token_usage tu 
                    ON t.id = tu.tenant_id AND tu.created_at >= %s
                GROUP BY t.id, t.slug, t.name
                ORDER BY total_cost DESC
            """, (start_date,))
            
            tenants = []
            for row in cur.fetchall():
                tenants.append({
                    'tenantId': row[0],
                    'slug': row[1],
                    'name': row[2],
                    'totalTokens': row[3],
                    'totalCost': float(row[4]),
                    'operationsCount': row[5]
                })
            
            result = {
                'period': f'{period} дней',
                'tenants': tenants
            }
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(result),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }