import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from auth_middleware import require_auth

def handler(event: dict, context) -> dict:
    '''API для получения статистики использования токенов в чатах по тенантам'''
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

    authorized, user_payload, error_response = require_auth(event)
    if not authorized:
        return error_response

    if user_payload.get('role') != 'super_admin':
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Superadmin access required'}),
            'isBase64Encoded': False
        }

    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database connection not configured'}),
            'isBase64Encoded': False
        }

    try:
        conn = psycopg2.connect(dsn)
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        query_params = event.get('queryStringParameters') or {}
        tenant_id = query_params.get('tenantId')
        period_days = int(query_params.get('period', '30'))

        if tenant_id and tenant_id != 'all':
            stats = get_tenant_chat_stats(cursor, int(tenant_id), period_days)
        else:
            stats = get_all_tenants_chat_stats(cursor, period_days)

        cursor.close()
        conn.close()

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(stats),
            'isBase64Encoded': False
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }


def get_tenant_chat_stats(cursor, tenant_id: int, period_days: int) -> dict:
    '''Статистика чатов для конкретного тенанта'''
    
    query = '''
        SELECT 
            COUNT(DISTINCT cm.session_id) as unique_chats,
            COUNT(cm.id) as total_messages,
            COALESCE(
                (SELECT SUM(tokens_used) 
                 FROM t_p56134400_telegram_ai_bot_pdf.token_usage 
                 WHERE tenant_id = %s 
                   AND operation_type = 'gpt_response'
                   AND created_at >= NOW() - INTERVAL '%s days'), 
                0
            ) as total_tokens,
            COALESCE(
                (SELECT SUM(cost_rubles) 
                 FROM t_p56134400_telegram_ai_bot_pdf.token_usage 
                 WHERE tenant_id = %s 
                   AND operation_type = 'gpt_response'
                   AND created_at >= NOW() - INTERVAL '%s days'), 
                0
            ) as total_cost,
            CASE 
                WHEN COUNT(cm.id) > 0 THEN 
                    COALESCE(
                        (SELECT SUM(tokens_used) 
                         FROM t_p56134400_telegram_ai_bot_pdf.token_usage 
                         WHERE tenant_id = %s 
                           AND operation_type = 'gpt_response'
                           AND created_at >= NOW() - INTERVAL '%s days'), 
                        0
                    )::float / COUNT(cm.id)
                ELSE 0
            END as avg_tokens_per_message
        FROM t_p56134400_telegram_ai_bot_pdf.chat_messages cm
        WHERE cm.tenant_id = %s
            AND cm.created_at >= NOW() - INTERVAL '%s days'
    ''' % (tenant_id, period_days, tenant_id, period_days, tenant_id, period_days, tenant_id, period_days)
    
    cursor.execute(query)
    row = cursor.fetchone()
    
    top_chats_query = '''
        SELECT 
            cm.session_id as chat_id,
            COALESCE(MAX(cm.content), 'Unknown') as user_name,
            COUNT(cm.id) as message_count,
            COALESCE(
                (SELECT SUM(tokens_used) 
                 FROM t_p56134400_telegram_ai_bot_pdf.token_usage 
                 WHERE tenant_id = %s 
                   AND operation_type = 'gpt_response'
                   AND request_id = cm.session_id
                   AND created_at >= NOW() - INTERVAL '%s days'), 
                0
            ) as total_tokens,
            COALESCE(
                (SELECT SUM(cost_rubles) 
                 FROM t_p56134400_telegram_ai_bot_pdf.token_usage 
                 WHERE tenant_id = %s 
                   AND operation_type = 'gpt_response'
                   AND request_id = cm.session_id
                   AND created_at >= NOW() - INTERVAL '%s days'), 
                0
            ) as total_cost
        FROM t_p56134400_telegram_ai_bot_pdf.chat_messages cm
        WHERE cm.tenant_id = %s
            AND cm.created_at >= NOW() - INTERVAL '%s days'
        GROUP BY cm.session_id
        ORDER BY total_cost DESC
        LIMIT 10
    ''' % (tenant_id, period_days, tenant_id, period_days, tenant_id, period_days)
    
    cursor.execute(top_chats_query)
    top_chats = cursor.fetchall()
    
    return {
        'tenantId': tenant_id,
        'period': f'{period_days} дней',
        'totalMessages': int(row['total_messages']),
        'totalTokens': int(row['total_tokens']),
        'totalCost': float(row['total_cost']),
        'avgTokensPerMessage': float(row['avg_tokens_per_message']),
        'topChats': [
            {
                'chatId': chat['chat_id'],
                'userName': chat['user_name'][:50] if chat['user_name'] else 'Unknown',
                'messageCount': int(chat['message_count']),
                'totalTokens': int(chat['total_tokens']),
                'totalCost': float(chat['total_cost'])
            }
            for chat in top_chats
        ]
    }


def get_all_tenants_chat_stats(cursor, period_days: int) -> dict:
    '''Статистика чатов по всем тенантам'''
    
    query = '''
        SELECT 
            t.id as tenant_id,
            t.slug,
            t.name,
            COUNT(DISTINCT cm.id) as total_messages,
            COALESCE(
                (SELECT SUM(tokens_used) 
                 FROM t_p56134400_telegram_ai_bot_pdf.token_usage 
                 WHERE tenant_id = t.id 
                   AND operation_type = 'gpt_response'
                   AND created_at >= NOW() - INTERVAL '%s days'), 
                0
            ) as total_tokens,
            COALESCE(
                (SELECT SUM(cost_rubles) 
                 FROM t_p56134400_telegram_ai_bot_pdf.token_usage 
                 WHERE tenant_id = t.id 
                   AND operation_type = 'gpt_response'
                   AND created_at >= NOW() - INTERVAL '%s days'), 
                0
            ) as total_cost
        FROM t_p56134400_telegram_ai_bot_pdf.tenants t
        LEFT JOIN t_p56134400_telegram_ai_bot_pdf.chat_messages cm 
            ON cm.tenant_id = t.id
            AND cm.created_at >= NOW() - INTERVAL '%s days'
        GROUP BY t.id, t.slug, t.name
        HAVING COUNT(DISTINCT cm.id) > 0
        ORDER BY total_cost DESC
    ''' % (period_days, period_days, period_days)
    
    cursor.execute(query)
    tenants = cursor.fetchall()
    
    total_messages = sum(int(t['total_messages']) for t in tenants)
    total_tokens = sum(int(t['total_tokens']) for t in tenants)
    total_cost = sum(float(t['total_cost']) for t in tenants)
    
    return {
        'period': f'{period_days} дней',
        'totalMessages': total_messages,
        'totalTokens': total_tokens,
        'totalCost': total_cost,
        'avgTokensPerMessage': float(total_tokens / total_messages) if total_messages > 0 else 0,
        'tenants': [
            {
                'tenantId': int(tenant['tenant_id']),
                'slug': tenant['slug'],
                'name': tenant['name'],
                'totalMessages': int(tenant['total_messages']),
                'totalTokens': int(tenant['total_tokens']),
                'totalCost': float(tenant['total_cost'])
            }
            for tenant in tenants
        ]
    }