import json
import os
import psycopg2
from datetime import datetime, timedelta
import sys
sys.path.insert(0, '/function/code/shared')
from auth_middleware import get_tenant_id_from_request

def handler(event: dict, context) -> dict:
    """Получение статистики сообщений чата"""
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

    conn = None
    cur = None
    try:
        tenant_id, auth_error = get_tenant_id_from_request(event)
        if auth_error:
            return auth_error

        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()

        cur.execute("""
            SELECT COUNT(*) 
            FROM t_p56134400_telegram_ai_bot_pdf.chat_messages 
            WHERE role = 'user' AND tenant_id = %s
        """, (tenant_id,))
        total_messages = cur.fetchone()[0]

        cur.execute("""
            SELECT COUNT(DISTINCT session_id) 
            FROM t_p56134400_telegram_ai_bot_pdf.chat_messages
            WHERE tenant_id = %s
        """, (tenant_id,))
        total_users = cur.fetchone()[0]

        cur.execute("""
            SELECT COUNT(*) 
            FROM t_p56134400_telegram_ai_bot_pdf.chat_messages 
            WHERE role = 'user' 
            AND tenant_id = %s
            AND created_at >= NOW() - INTERVAL '24 hours'
        """, (tenant_id,))
        messages_today = cur.fetchone()[0]

        cur.execute("""
            SELECT COUNT(*) 
            FROM t_p56134400_telegram_ai_bot_pdf.chat_messages 
            WHERE role = 'user' 
            AND tenant_id = %s
            AND created_at >= NOW() - INTERVAL '7 days'
        """, (tenant_id,))
        messages_week = cur.fetchone()[0]

        cur.execute("""
            SELECT content, COUNT(*) as count
            FROM t_p56134400_telegram_ai_bot_pdf.chat_messages 
            WHERE role = 'user' AND tenant_id = %s
            GROUP BY content
            ORDER BY count DESC
            LIMIT 10
        """, (tenant_id,))
        popular_questions = cur.fetchall()
        popular_questions_list = [{'question': q[0], 'count': q[1]} for q in popular_questions]

        cur.execute("""
            SELECT 
                DATE_TRUNC('day', created_at) as day,
                COUNT(*) as count
            FROM t_p56134400_telegram_ai_bot_pdf.chat_messages 
            WHERE role = 'user' 
            AND tenant_id = %s
            AND created_at >= NOW() - INTERVAL '30 days'
            GROUP BY day
            ORDER BY day DESC
        """, (tenant_id,))
        daily_stats = cur.fetchall()
        daily_stats_list = [{'date': d[0].strftime('%Y-%m-%d'), 'count': d[1]} for d in daily_stats]

        cur.execute("""
            SELECT session_id, COUNT(*) as message_count
            FROM t_p56134400_telegram_ai_bot_pdf.chat_messages
            WHERE role = 'user' AND tenant_id = %s
            GROUP BY session_id
            ORDER BY message_count DESC
            LIMIT 5
        """, (tenant_id,))
        top_users = cur.fetchall()
        top_users_list = [{'user': u[0], 'messages': u[1]} for u in top_users]

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'totalMessages': total_messages,
                'totalUsers': total_users,
                'messagesToday': messages_today,
                'messagesWeek': messages_week,
                'popularQuestions': popular_questions_list,
                'dailyStats': daily_stats_list,
                'topUsers': top_users_list
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
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()