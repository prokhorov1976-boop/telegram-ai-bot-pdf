import json
import os
import psycopg2
from auth_middleware import get_tenant_id_from_request

def handler(event: dict, context) -> dict:
    """Получение статистики Quality Gate"""
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

    try:
        tenant_id, auth_error = get_tenant_id_from_request(event)
        if auth_error:
            return auth_error

        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()

        cur.execute("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN context_ok THEN 1 ELSE 0 END) as passed,
                SUM(CASE WHEN NOT context_ok THEN 1 ELSE 0 END) as failed
            FROM t_p56134400_telegram_ai_bot_pdf.tenant_quality_gate_logs
            WHERE tenant_id = %s
        """, (tenant_id,))
        totals = cur.fetchone()
        total = int(totals[0]) if totals[0] else 0
        passed = int(totals[1]) if totals[1] else 0
        failed = int(totals[2]) if totals[2] else 0
        pass_rate = (passed / total * 100) if total > 0 else 0

        cur.execute("""
            SELECT gate_reason, COUNT(*) 
            FROM t_p56134400_telegram_ai_bot_pdf.tenant_quality_gate_logs
            WHERE tenant_id = %s
            GROUP BY gate_reason
            ORDER BY COUNT(*) DESC
        """, (tenant_id,))
        by_reason = {row[0]: int(row[1]) for row in cur.fetchall()}

        cur.execute("""
            SELECT query_type, COUNT(*) 
            FROM t_p56134400_telegram_ai_bot_pdf.tenant_quality_gate_logs
            WHERE tenant_id = %s AND query_type IS NOT NULL
            GROUP BY query_type
            ORDER BY COUNT(*) DESC
        """, (tenant_id,))
        by_query_type = {row[0]: int(row[1]) for row in cur.fetchall()}

        cur.execute("""
            SELECT lang, COUNT(*) 
            FROM t_p56134400_telegram_ai_bot_pdf.tenant_quality_gate_logs
            WHERE tenant_id = %s AND lang IS NOT NULL
            GROUP BY lang
            ORDER BY COUNT(*) DESC
        """, (tenant_id,))
        by_lang = {row[0]: int(row[1]) for row in cur.fetchall()}

        cur.execute("""
            SELECT top_k_used, COUNT(*) 
            FROM t_p56134400_telegram_ai_bot_pdf.tenant_quality_gate_logs
            WHERE tenant_id = %s AND top_k_used IS NOT NULL
            GROUP BY top_k_used
            ORDER BY top_k_used
        """, (tenant_id,))
        by_top_k = {int(row[0]): int(row[1]) for row in cur.fetchall()}

        cur.execute("""
            SELECT id, user_message, context_ok, gate_reason, query_type, 
                   lang, best_similarity, context_len, overlap, key_tokens, top_k_used, created_at
            FROM t_p56134400_telegram_ai_bot_pdf.tenant_quality_gate_logs
            WHERE tenant_id = %s
            ORDER BY created_at DESC
            LIMIT 50
        """, (tenant_id,))
        logs_rows = cur.fetchall()
        recent_logs = []
        for row in logs_rows:
            recent_logs.append({
                'id': row[0],
                'user_message': row[1],
                'context_ok': row[2],
                'gate_reason': row[3],
                'query_type': row[4] or '',
                'lang': row[5] or '',
                'best_similarity': float(row[6]) if row[6] is not None else None,
                'context_len': row[7],
                'overlap': float(row[8]) if row[8] is not None else None,
                'key_tokens': row[9],
                'top_k_used': row[10],
                'created_at': row[11].isoformat() if row[11] else None
            })

        cur.close()
        conn.close()

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'stats': {
                    'total': total,
                    'passed': passed,
                    'failed': failed,
                    'pass_rate': pass_rate,
                    'by_reason': by_reason,
                    'by_query_type': by_query_type,
                    'by_lang': by_lang,
                    'by_top_k': by_top_k
                },
                'recent_logs': recent_logs
            }),
            'isBase64Encoded': False
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }