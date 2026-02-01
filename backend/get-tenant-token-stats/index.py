import json
import os
import psycopg2
from datetime import datetime, timedelta
import sys
sys.path.append('/function/code')
from timezone_helper import moscow_naive
from auth_middleware import get_tenant_id_from_request

def handler(event: dict, context) -> dict:
    """API для получения статистики расходов токенов для тенанта"""
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization',
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

    try:
        tenant_id, auth_error = get_tenant_id_from_request(event)
        if auth_error:
            return auth_error
        
        params = event.get('queryStringParameters', {}) or {}
        period = params.get('period', '30')
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        days_ago = int(period)
        start_date = moscow_naive() - timedelta(days=days_ago)
        
        # Статистика по операциям
        cur.execute("""
            SELECT 
                operation_type,
                model,
                SUM(tokens_used) as total_tokens,
                SUM(cost_rubles) as total_cost,
                COUNT(*) as operations_count,
                AVG(tokens_used) as avg_tokens
            FROM t_p56134400_telegram_ai_bot_pdf.token_usage
            WHERE tenant_id = %s AND created_at >= %s
            GROUP BY operation_type, model
            ORDER BY total_cost DESC
        """, (tenant_id, start_date))
        
        breakdown = []
        for row in cur.fetchall():
            breakdown.append({
                'operationType': row[0],
                'model': row[1],
                'totalTokens': row[2],
                'totalCost': float(row[3]),
                'operationsCount': row[4],
                'avgTokens': float(row[5])
            })
        
        # Общая статистика
        cur.execute("""
            SELECT 
                SUM(tokens_used) as total_tokens,
                SUM(cost_rubles) as total_cost,
                COUNT(*) as total_operations
            FROM t_p56134400_telegram_ai_bot_pdf.token_usage
            WHERE tenant_id = %s AND created_at >= %s
        """, (tenant_id, start_date))
        
        total_row = cur.fetchone()
        
        # Статистика по дням (последние 30 дней)
        cur.execute("""
            SELECT 
                DATE_TRUNC('day', created_at) as day,
                SUM(cost_rubles) as daily_cost,
                SUM(tokens_used) as daily_tokens
            FROM t_p56134400_telegram_ai_bot_pdf.token_usage
            WHERE tenant_id = %s AND created_at >= %s
            GROUP BY day
            ORDER BY day DESC
            LIMIT 30
        """, (tenant_id, start_date))
        
        daily_stats = []
        for row in cur.fetchall():
            daily_stats.append({
                'date': row[0].strftime('%Y-%m-%d'),
                'cost': float(row[1]),
                'tokens': row[2]
            })
        
        cur.close()
        conn.close()
        
        result = {
            'tenantId': int(tenant_id),
            'period': f'{period} дней',
            'totalTokens': total_row[0] or 0,
            'totalCost': float(total_row[1] or 0),
            'totalOperations': total_row[2] or 0,
            'breakdown': breakdown,
            'dailyStats': daily_stats
        }
        
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
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
