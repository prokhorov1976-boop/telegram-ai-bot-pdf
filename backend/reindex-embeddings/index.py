import json
import os
import psycopg2
import sys
sys.path.append('/function/code')
from api_keys_helper import get_tenant_api_key

def handler(event: dict, context) -> dict:
    """Переиндексация эмбеддингов после смены модели"""
    method = event.get('httpMethod', 'POST')
    print(f"[Reindex] START: method={method}, query={event.get('queryStringParameters')}, headers_keys={list(event.get('headers', {}).keys())}")

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }

    try:
        # Получаем tenant_id из query параметров (передается фронтендом)
        query_params = event.get('queryStringParameters') or {}
        tenant_id = query_params.get('tenant_id')
        print(f"[Reindex] Query params: {query_params}, tenant_id={tenant_id}")
        
        if not tenant_id:
            print(f"[Reindex] ERROR: No tenant_id in query params")
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'tenant_id query parameter required'}),
                'isBase64Encoded': False
            }
        
        tenant_id = int(tenant_id)
        print(f"[Reindex] Parsed tenant_id={tenant_id}, method={method}")

        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()

        if method == 'GET':
            cur.execute("""
                SELECT 
                    revectorization_status,
                    revectorization_progress,
                    revectorization_total,
                    revectorization_model,
                    revectorization_error
                FROM t_p56134400_telegram_ai_bot_pdf.tenant_settings
                WHERE tenant_id = %s
            """, (tenant_id,))
            row = cur.fetchone()
            
            if not row:
                cur.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Tenant not found'}),
                    'isBase64Encoded': False
                }

            result = {
                'status': row[0] or 'idle',
                'progress': row[1] or 0,
                'total': row[2] or 0,
                'model': row[3] or '',
                'error': row[4] or ''
            }

            cur.close()
            conn.close()

            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(result),
                'isBase64Encoded': False
            }

        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')

            if action == 'start':
                cur.execute("""
                    SELECT embedding_provider, embedding_doc_model, revectorization_status, revectorization_progress
                    FROM t_p56134400_telegram_ai_bot_pdf.tenant_settings
                    WHERE tenant_id = %s
                """, (tenant_id,))
                settings_row = cur.fetchone()
                
                if not settings_row:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Tenant settings not found'}),
                        'isBase64Encoded': False
                    }

                embedding_provider = settings_row[0] or 'yandex'
                embedding_doc_model = settings_row[1] or 'text-search-doc'
                current_status = settings_row[2]
                current_progress = settings_row[3] if settings_row[3] else 0

                cur.execute("""
                    SELECT COUNT(*) FROM t_p56134400_telegram_ai_bot_pdf.tenant_documents
                    WHERE tenant_id = %s AND status = 'ready'
                """, (tenant_id,))
                total_docs = cur.fetchone()[0]

                if total_docs == 0:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'No documents to reindex'}),
                        'isBase64Encoded': False
                    }

                # Если статус НЕ 'in_progress', то это новая переиндексация — сбрасываем прогресс
                # Если статус 'in_progress', то продолжаем с текущего прогресса
                if current_status != 'in_progress':
                    current_progress = 0
                    print(f"[Reindex] Starting NEW reindexing, resetting progress to 0")
                else:
                    print(f"[Reindex] Continuing EXISTING reindexing from progress {current_progress}")

                cur.execute("""
                    UPDATE t_p56134400_telegram_ai_bot_pdf.tenant_settings
                    SET 
                        revectorization_status = 'in_progress',
                        revectorization_progress = %s,
                        revectorization_total = %s,
                        revectorization_model = %s,
                        revectorization_error = NULL
                    WHERE tenant_id = %s
                """, (current_progress, total_docs, f"{embedding_provider}:{embedding_doc_model}", tenant_id))
                
                cur.execute("""
                    SELECT id FROM t_p56134400_telegram_ai_bot_pdf.tenant_documents
                    WHERE tenant_id = %s AND status = 'ready'
                    ORDER BY id
                """, (tenant_id,))
                all_document_ids = [row[0] for row in cur.fetchall()]
                
                # Пропускаем уже обработанные документы
                document_ids = all_document_ids[current_progress:]
                print(f"[Reindex] Total docs: {len(all_document_ids)}, already processed: {current_progress}, remaining: {len(document_ids)}")

                conn.commit()
                cur.close()
                conn.close()

                import requests
                process_pdf_url = 'https://functions.poehali.dev/44b9c312-5377-4fa7-8b4c-522f4bbbf201'
                
                # Получаем токен из заголовков (поддерживаем разные варианты)
                auth_token = (
                    event.get('headers', {}).get('x-authorization') or
                    event.get('headers', {}).get('X-Authorization') or
                    event.get('headers', {}).get('authorization') or
                    event.get('headers', {}).get('Authorization') or
                    ''
                )
                print(f"[Reindex] Auth token present: {bool(auth_token)}, headers keys: {list(event.get('headers', {}).keys())}")
                print(f"[Reindex] Processing {len(document_ids)} documents in batch mode (max 10 per request)")
                
                # Обрабатываем максимум 10 документов за раз, чтобы уложиться в таймаут
                batch_size = 10
                success_count = 0
                
                for i, doc_id in enumerate(document_ids[:batch_size]):
                    try:
                        response = requests.post(
                            process_pdf_url,
                            headers={
                                'X-Authorization': auth_token,
                                'Content-Type': 'application/json'
                            },
                            json={'documentId': doc_id, 'tenant_id': tenant_id},
                            timeout=120
                        )
                        
                        print(f"[Reindex] Document {doc_id} ({i+1}/{min(batch_size, len(document_ids))}): status={response.status_code}, response={response.text[:200]}")
                        
                        if response.ok:
                            success_count += 1
                        
                        # Обновляем прогресс после каждого документа (текущий прогресс + успешные в этом batch)
                        conn = psycopg2.connect(os.environ['DATABASE_URL'])
                        cur = conn.cursor()
                        cur.execute("""
                            UPDATE t_p56134400_telegram_ai_bot_pdf.tenant_settings
                            SET revectorization_progress = %s
                            WHERE tenant_id = %s
                        """, (current_progress + success_count, tenant_id))
                        conn.commit()
                        cur.close()
                        conn.close()
                        
                    except Exception as e:
                        print(f"[Reindex] Error reindexing document {doc_id}: {e}")
                        continue
                
                # Если есть ещё документы, запускаем следующий batch через отдельный вызов
                remaining_docs = document_ids[batch_size:]
                if remaining_docs:
                    print(f"[Reindex] Remaining {len(remaining_docs)} documents will be processed in background")
                    # TODO: можно добавить фоновую очередь через Cloud Tasks
                    # Пока просто отмечаем прогресс

                conn = psycopg2.connect(os.environ['DATABASE_URL'])
                cur = conn.cursor()
                
                # Проверяем, остались ли ещё документы
                final_progress = current_progress + success_count
                is_completed = final_progress >= len(all_document_ids)
                
                cur.execute("""
                    UPDATE t_p56134400_telegram_ai_bot_pdf.tenant_settings
                    SET 
                        revectorization_status = %s,
                        revectorization_progress = %s
                    WHERE tenant_id = %s
                """, ('completed' if is_completed else 'in_progress', final_progress, tenant_id))
                conn.commit()
                cur.close()
                conn.close()
                
                print(f"[Reindex] Batch complete: processed {success_count}, total progress: {final_progress}/{len(all_document_ids)}, status: {'completed' if is_completed else 'in_progress'}")

                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'reindexed': success_count,
                        'total': total_docs
                    }),
                    'isBase64Encoded': False
                }

            else:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid action'}),
                    'isBase64Encoded': False
                }

        else:
            cur.close()
            conn.close()
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }