import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    """Получение истории голосовых звонков для тенанта"""
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
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
        params = event.get('queryStringParameters', {}) or {}
        tenant_id = params.get('tenant_id')
        status_filter = params.get('status')
        phone_filter = params.get('phone')
        date_from = params.get('date_from')
        date_to = params.get('date_to')
        
        if not tenant_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'tenant_id required'}),
                'isBase64Encoded': False
            }

        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor(cursor_factory=RealDictCursor)
        schema = os.environ.get('MAIN_DB_SCHEMA', 'public')

        # Строим WHERE условия с фильтрами
        where_conditions = ["vc.tenant_id = %s"]
        query_params = [tenant_id]
        
        if status_filter:
            where_conditions.append("vc.status = %s")
            query_params.append(status_filter)
        
        if phone_filter:
            where_conditions.append("vc.phone_number ILIKE %s")
            query_params.append(f"%{phone_filter}%")
        
        if date_from:
            where_conditions.append("vc.started_at >= %s")
            query_params.append(date_from)
        
        if date_to:
            where_conditions.append("vc.started_at <= %s")
            query_params.append(date_to)
        
        where_clause = " AND ".join(where_conditions)

        cur.execute(f"""
            SELECT 
                vc.id,
                vc.call_id,
                vc.phone_number,
                vc.status,
                vc.started_at,
                vc.ended_at
            FROM {schema}.voice_calls vc
            WHERE {where_clause}
            ORDER BY vc.started_at DESC
            LIMIT 100
        """, tuple(query_params))
        
        calls = cur.fetchall()
        
        for call in calls:
            cur.execute(f"""
                SELECT 
                    id,
                    direction,
                    text,
                    created_at
                FROM {schema}.voice_messages
                WHERE call_id = %s
                ORDER BY created_at ASC
            """, (call['call_id'],))
            
            call['messages'] = cur.fetchall()

        cur.close()
        conn.close()

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'calls': calls
            }, default=str),
            'isBase64Encoded': False
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }