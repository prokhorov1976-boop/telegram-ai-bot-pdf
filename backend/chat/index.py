import json
import os
import sys
import psycopg2
import hashlib
from datetime import datetime, timedelta
import re

sys.path.append('/function/code')
from timezone_helper import now_moscow, moscow_naive
from api_keys_helper import get_tenant_api_key
from openrouter_models import get_working_free_model
from token_logger import log_token_usage
from system_prompt import DEFAULT_SYSTEM_PROMPT
from formatting_helper import get_formatting_settings, format_with_settings

from quality_gate import (
    build_context_with_scores, 
    quality_gate, 
    compose_system,
    rag_debug_log,
    low_overlap_rate,
    update_low_overlap_stats,
    get_tenant_topk,
    RAG_TOPK_DEFAULT,
    RAG_TOPK_FALLBACK,
    RAG_LOW_OVERLAP_THRESHOLD,
    RAG_LOW_OVERLAP_START_TOPK5
)


def parse_proxy(proxy_string: str):
    """Парсит прокси из формата ip:port@login:pass в dict для httpx"""
    if not proxy_string or not proxy_string.strip():
        return None
    
    try:
        # Формат: ip:port@login:pass
        if '@' in proxy_string:
            ip_port, login_pass = proxy_string.split('@', 1)
            proxy_url = f'http://{login_pass}@{ip_port}'
        else:
            proxy_url = f'http://{proxy_string}'
        
        return {
            'http://': proxy_url,
            'https://': proxy_url
        }
    except Exception as e:
        print(f'Failed to parse proxy: {e}')
        return None


def get_proxy_settings(cur, tenant_id: int) -> dict:
    """Загружает настройки прокси для DeepSeek, OpenRouter и ProxyAPI"""
    cur.execute("""
        SELECT 
            use_proxy_deepseek, proxy_deepseek,
            use_proxy_openrouter, proxy_openrouter,
            use_proxy_proxyapi, proxy_proxyapi
        FROM t_p56134400_telegram_ai_bot_pdf.tenant_settings
        WHERE tenant_id = %s
    """, (tenant_id,))
    row = cur.fetchone()
    
    if not row:
        return {}
    
    return {
        'deepseek': {
            'enabled': row[0] or False,
            'proxy': parse_proxy(row[1]) if row[0] and row[1] else None
        },
        'openrouter': {
            'enabled': row[2] or False,
            'proxy': parse_proxy(row[3]) if row[2] and row[3] else None
        },
        'proxyapi': {
            'enabled': row[4] or False,
            'proxy': parse_proxy(row[5]) if row[4] and row[5] else None
        }
    }


def get_provider_and_api_model(frontend_model: str, frontend_provider: str) -> tuple:
    """
    Возвращает (api_model, реальный_провайдер) на основе модели и провайдера с фронта.
    Учитывает, что одна и та же модель (например deepseek-chat) может быть в разных провайдерах.
    Исправлено: убрано дублирование моделей между провайдерами. v2
    """
    mappings = {
        'yandex': {
            'yandexgpt': 'yandexgpt',
            'yandexgpt-lite': 'yandexgpt-lite'
        },
        'deepseek': {
            'deepseek-chat': 'deepseek-chat',
            'deepseek-reasoner': 'deepseek-reasoner'
        },
        'openrouter': {
            # Бесплатные
            'gemini-2.0-flash': 'google/gemini-2.0-flash-exp:free',
            'llama-3.3-70b': 'meta-llama/llama-3.3-70b-instruct:free',
            'deepseek-v3': 'deepseek/deepseek-chat:free',
            'deepseek-r1': 'deepseek/deepseek-r1:free',
            'qwen-2.5-72b': 'qwen/qwen-2.5-72b-instruct:free',
            'mistral-small': 'mistralai/mistral-small-3.1-24b-instruct:free',
            'llama-3.1-405b': 'meta-llama/llama-3.1-405b-instruct:free',
            'olmo-3-32b': 'allenai/olmo-3.1-32b-think:free',
            # Дешевые платные (быстрые для голоса)
            'gemini-flash-1.5': 'google/gemini-flash-1.5',
            'deepseek-chat': 'deepseek/deepseek-chat',
            'gpt-4o-mini': 'openai/gpt-4o-mini',
            'claude-3-haiku': 'anthropic/claude-3-haiku',
            'qwen-2.5-7b': 'qwen/qwen-2.5-7b-instruct',
            'qwen-2.5-14b': 'qwen/qwen-2.5-14b-instruct',
            'qwen-2.5-32b': 'qwen/qwen-2.5-32b-instruct',
            'qwen-3-72b': 'qwen/qwen-3-72b-instruct',
            'llama-3.1-70b': 'meta-llama/llama-3.1-70b-instruct',
            # Топовые платные
            'gemini-pro-1.5': 'google/gemini-pro-1.5',
            'gpt-4o': 'openai/gpt-4o',
            'claude-3.5-sonnet': 'anthropic/claude-3.5-sonnet',
            'claude-opus-4': 'anthropic/claude-opus-4-20250514'
        },
        'proxyapi': {
            'gpt-4o-mini': 'gpt-4o-mini-2024-07-18',
            'gpt-3.5-turbo': 'gpt-3.5-turbo-0125',
            'claude-3.5-haiku': 'claude-3-5-haiku-20241022',
            'o3-mini': 'o3-mini-2025-01-31',
            'gpt-5': 'gpt-5-2025-08-07',
            'o3': 'o3-2025-04-16',
            'gpt-4o': 'gpt-4o-2024-11-20',
            'claude-sonnet-4.5': 'claude-sonnet-4-5-20250929',
            'o3-pro': 'o3-pro-2025-06-10',
            'claude-opus-4': 'claude-opus-4-20250514'
        }
    }
    
    if frontend_provider in mappings:
        provider_models = mappings[frontend_provider]
        if frontend_model in provider_models:
            return provider_models[frontend_model], frontend_provider
    
    raise ValueError(f"Model '{frontend_model}' not supported for provider '{frontend_provider}'")

def handler(event: dict, context) -> dict:
    """AI чат с поиском в документах или в режиме чистого промпта (Moscow UTC+3)"""
    method = event.get('httpMethod', 'POST')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization, X-Session-Id'
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
        from openai import OpenAI
        
        body = json.loads(event.get('body', '{}'))
        user_message = body.get('message', '')
        session_id = body.get('sessionId', 'default')
        tenant_id = body.get('tenantId')
        tenant_slug = body.get('tenantSlug')
        channel = body.get('channel', 'widget')  # widget, telegram, vk, max
        
        # Конвертируем tenant_id в int если он передан
        if tenant_id is not None:
            tenant_id = int(tenant_id)
        
        print(f"🚀 DEBUG RECEIVED: tenant_id={tenant_id}, tenant_slug='{tenant_slug}', channel='{channel}', message='{user_message[:50]}'")

        if not user_message:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'message required'}),
                'isBase64Encoded': False
            }

        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        # Если передан slug, получаем tenant_id
        if tenant_slug and not tenant_id:
            cur.execute("""
                SELECT id FROM t_p56134400_telegram_ai_bot_pdf.tenants 
                WHERE slug = %s
            """, (tenant_slug,))
            tenant_row = cur.fetchone()
            if tenant_row:
                tenant_id = tenant_row[0]
                print(f"✅ DEBUG: Resolved tenant_slug '{tenant_slug}' to tenant_id={tenant_id}")
            else:
                tenant_id = 1
                print(f"⚠️ DEBUG: tenant_slug '{tenant_slug}' not found, using tenant_id=1")
        elif not tenant_id:
            tenant_id = 1
            print(f"⚠️ DEBUG: No tenant_slug or tenant_id provided, defaulting to tenant_id=1")
        
        # Обеспечиваем, что tenant_id - это integer
        tenant_id = int(tenant_id)

        # Load proxy settings for AI providers
        proxy_settings = get_proxy_settings(cur, tenant_id)

        # Загружаем дефолтный промпт из БД
        cur.execute("""
            SELECT setting_value 
            FROM t_p56134400_telegram_ai_bot_pdf.default_settings 
            WHERE setting_key = 'default_system_prompt'
        """)
        default_prompt_row = cur.fetchone()
        default_prompt_from_db = default_prompt_row[0] if default_prompt_row else DEFAULT_SYSTEM_PROMPT
        
        cur.execute("""
            SELECT ai_settings, embedding_provider, embedding_query_model, quality_gate_settings
            FROM t_p56134400_telegram_ai_bot_pdf.tenant_settings
            WHERE tenant_id = %s
        """, (tenant_id,))
        settings_row = cur.fetchone()
        
        embedding_provider = 'yandex'
        embedding_model = 'text-search-query'
        quality_gate_settings = {}
        
        if settings_row:
            if settings_row[1]:
                embedding_provider = settings_row[1]
            if settings_row[2]:
                embedding_model = settings_row[2]
            if settings_row[3]:
                quality_gate_settings = settings_row[3]
        
        # Получаем tenant-specific RAG top_k из ai_settings, используя get_tenant_topk
        tenant_overrides = settings_row[0] if (settings_row and settings_row[0]) else {}
        tenant_rag_topk_default, tenant_rag_topk_fallback = get_tenant_topk(tenant_overrides)
        # Принудительная конвертация в int (на случай если где-то осталась строка)
        tenant_rag_topk_default = int(tenant_rag_topk_default)
        tenant_rag_topk_fallback = int(tenant_rag_topk_fallback)
        
        # Режим работы без RAG (только на system_prompt с историей)
        enable_pure_prompt_mode = tenant_overrides.get('enable_pure_prompt_mode', False)
        print(f"DEBUG: Tenant {tenant_id} RAG settings: top_k_default={tenant_rag_topk_default}, top_k_fallback={tenant_rag_topk_fallback}, pure_prompt_mode={enable_pure_prompt_mode}")
        
        if settings_row and settings_row[0]:
            settings = settings_row[0]
            
            # Для голосовых звонков используем отдельные настройки модели, если есть
            if channel == 'voice' and settings.get('voice_model') and settings.get('voice_provider'):
                ai_model = settings.get('voice_model')
                ai_provider = settings.get('voice_provider')
                print(f"DEBUG: Using VOICE model - model={ai_model}, provider={ai_provider}")
            else:
                ai_model = settings.get('model', 'yandexgpt')
                ai_provider = settings.get('provider', 'yandex')
                print(f"DEBUG: Loaded from DB - model={ai_model}, provider={ai_provider}")
            
            # Получаем реальные значения для API
            try:
                chat_api_model, ai_provider = get_provider_and_api_model(ai_model, ai_provider)
                print(f"DEBUG: Mapped to API - model={chat_api_model}, provider={ai_provider}")
            except ValueError as e:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': str(e)}),
                    'isBase64Encoded': False
                }
            # Безопасное преобразование типов (значения могут быть строками из JSON)
            def safe_float(value, default):
                if isinstance(value, (int, float)):
                    return float(value)
                try:
                    return float(value) if value else default
                except (ValueError, TypeError):
                    return default
            
            def safe_int(value, default):
                if isinstance(value, int):
                    return value
                try:
                    return int(float(value)) if value else default
                except (ValueError, TypeError):
                    return default
            
            # Для голосовых звонков уменьшаем max_tokens для более быстрых ответов
            default_max_tokens = 500 if channel == 'voice' else 2000
            
            ai_temperature = safe_float(settings.get('temperature'), 0.7)
            ai_top_p = safe_float(settings.get('top_p'), 0.95)
            ai_frequency_penalty = safe_float(settings.get('frequency_penalty'), 0.0)
            ai_presence_penalty = safe_float(settings.get('presence_penalty'), 0.0)
            ai_max_tokens = safe_int(settings.get('max_tokens'), default_max_tokens)
            
            # Приоритет выбора промпта для звонков: voice_system_prompt → system_prompt → default
            # Для чата: system_prompt → default
            voice_system_prompt = settings.get('voice_system_prompt')
            chat_system_prompt = settings.get('system_prompt')
            
            if channel == 'voice':
                # Для звонков: voice_system_prompt → fallback на chat system_prompt → fallback на default
                system_prompt_template = voice_system_prompt or chat_system_prompt or default_prompt_from_db
                print(f"🎙️ VOICE: Using {'voice_system_prompt' if voice_system_prompt else ('system_prompt' if chat_system_prompt else 'default_prompt')}")
            else:
                # Для чата: system_prompt → fallback на default
                system_prompt_template = chat_system_prompt or default_prompt_from_db
                print(f"💬 CHAT: Using {'system_prompt' if chat_system_prompt else 'default_prompt'}")

        # Загружаем историю ДО эмбеддингов для обогащения запроса
        cur.execute("""
            SELECT role, content FROM t_p56134400_telegram_ai_bot_pdf.chat_messages 
            WHERE session_id = %s AND tenant_id = %s
            ORDER BY created_at DESC
            LIMIT 10
        """, (session_id, tenant_id))
        history_rows = cur.fetchall()
        history_messages_preview = [{"role": row[0], "content": row[1]} for row in reversed(history_rows)]
        
        # Конвертация относительных дат в абсолютные
        def convert_relative_dates(text):
            """Конвертирует относительные даты (завтра, послезавтра и т.д.) в абсолютные"""
            today = now_moscow().date()
            
            relative_patterns = {
                r'(?:на\s+)?завтра': today + timedelta(days=1),
                r'(?:на\s+)?послезавтра': today + timedelta(days=2),
                r'через\s+(\d+)\s+(?:день|дня|дней)': lambda m: today + timedelta(days=int(m.group(1))),
                r'через\s+неделю': today + timedelta(weeks=1),
                r'через\s+(\d+)\s+(?:неделю|недели|недель)': lambda m: today + timedelta(weeks=int(m.group(1))),
                r'через\s+месяц': today + timedelta(days=30),
                r'на\s+следующей\s+неделе': today + timedelta(weeks=1),
            }
            
            months_ru = [
                'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
            ]
            
            converted_text = text
            for pattern, replacement in relative_patterns.items():
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    if callable(replacement):
                        date_obj = replacement(match)
                    else:
                        date_obj = replacement
                    
                    day = date_obj.day
                    month = months_ru[date_obj.month - 1]
                    date_str = f"{day} {month}"
                    converted_text = re.sub(pattern, date_str, converted_text, flags=re.IGNORECASE)
                    print(f"DEBUG: Converted relative date '{match.group()}' to '{date_str}'")
            
            return converted_text
        
        # Извлекаем даты из истории для обогащения запроса эмбеддинга
        def extract_date_from_history(history_msgs):
            """Извлекает упоминания дат из истории для контекста"""
            date_patterns = [
                r'\d{1,2}\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)',
                r'\d{1,2}\.\d{1,2}\.\d{2,4}',
                r'(январ|феврал|март|апрел|ма|июн|июл|август|сентябр|октябр|ноябр|декабр)[а-я]{0,2}\s+\d{4}',
                r'Период:\s*\d{2}\.\d{2}\.\d{4}-\d{2}\.\d{2}\.\d{4}'
            ]
            for msg in reversed(history_msgs):  # Проверяем от старых к новым
                if msg['role'] == 'user':
                    text = msg['content'].lower()
                    for pattern in date_patterns:
                        match = re.search(pattern, text, re.IGNORECASE)
                        if match:
                            return match.group()
            return None
        
        # Конвертируем относительные даты в абсолютные в запросе пользователя
        print(f"DEBUG: User message BEFORE conversion: '{user_message}'")
        user_message_converted = convert_relative_dates(user_message)
        print(f"DEBUG: User message AFTER conversion: '{user_message_converted}' (changed: {user_message_converted != user_message})")
        
        context_date = extract_date_from_history(history_messages_preview)
        enriched_query = user_message_converted
        if context_date and len(user_message_converted.split()) <= 3:  # Обогащаем только короткие запросы
            enriched_query = f"{user_message_converted} {context_date}"
            print(f"DEBUG: Enriched query for embedding: '{enriched_query}' (original: '{user_message_converted}'")

        # Если включен режим Pure Prompt Mode - ПОЛНОСТЬЮ пропускаем RAG
        if enable_pure_prompt_mode:
            print(f"✅ Pure Prompt Mode enabled for tenant {tenant_id}, skipping RAG entirely")
            context_str = ""
            context_ok = True
            gate_reason = "pure_prompt_mode_enabled"
            sims = []
            gate_debug = {'mode': 'pure_prompt'}
        else:
            # Обычный режим: поиск по эмбеддингам и RAG
            try:
                if embedding_provider == 'yandex':
                    import requests
                    # ВСЕГДА используем PROJECT секреты для эмбеддингов (не tenant ключи!)
                    yandex_api_key = os.environ.get('YANDEXGPT_API_KEY')
                    yandex_folder_id = os.environ.get('YANDEXGPT_FOLDER_ID')
                    
                    if not yandex_api_key or not yandex_folder_id:
                        return {
                            'statusCode': 500,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'PROJECT Yandex API keys not configured'}),
                            'isBase64Encoded': False
                        }
                    
                    print(f"🚀 SENDING TO YANDEX (PROJECT keys): api_key={yandex_api_key[:10]}..., folder_id={yandex_folder_id}")
                    
                    emb_response = requests.post(
                        'https://llm.api.cloud.yandex.net/foundationModels/v1/textEmbedding',
                        headers={
                            'Authorization': f'Api-Key {yandex_api_key}',
                            'Content-Type': 'application/json'
                        },
                        json={
                            'modelUri': f'emb://{yandex_folder_id}/text-search-query/latest',
                            'text': enriched_query  # Используем обогащённый запрос вместо user_message
                        }
                    )
                    
                    if emb_response.status_code != 200:
                        print(f"Yandex Embedding API error: {emb_response.status_code}, {emb_response.text}")
                        raise Exception(f"Yandex API returned {emb_response.status_code}: {emb_response.text}")
                    
                    emb_data = emb_response.json()
                    print(f"DEBUG: Yandex embedding response keys: {emb_data.keys()}")
                    
                    if 'embedding' not in emb_data:
                        print(f"ERROR: No 'embedding' in response: {emb_data}")
                        raise Exception(f"Yandex API response missing 'embedding': {emb_data}")
                    
                    query_embedding = emb_data['embedding']
                    
                    # Логируем использование токенов для запроса (примерно по количеству символов)
                    tokens_estimate = min(len(user_message) // 4, 256)
                    log_token_usage(
                        tenant_id=tenant_id,
                        operation_type='embedding_query',
                        model='text-search-query',
                        tokens_used=tokens_estimate,
                        request_id=session_id
                    )
                else:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': f'Неизвестный провайдер эмбеддингов: {embedding_provider}'}),
                        'isBase64Encoded': False
                    }
                
                query_embedding_json = json.dumps(query_embedding)

                cur.execute("""
                    SELECT chunk_text, embedding_text FROM t_p56134400_telegram_ai_bot_pdf.tenant_chunks 
                    WHERE tenant_id = %s AND embedding_text IS NOT NULL
                """, (tenant_id,))
                all_chunks = cur.fetchall()

                if all_chunks:
                    def cosine_similarity(vec1, vec2):
                        import math
                        dot_product = sum(a * b for a, b in zip(vec1, vec2))
                        magnitude1 = math.sqrt(sum(a * a for a in vec1))
                        magnitude2 = math.sqrt(sum(b * b for b in vec2))
                        if magnitude1 == 0 or magnitude2 == 0:
                            return 0
                        return dot_product / (magnitude1 * magnitude2)

                    scored_chunks = []
                    for chunk_text, embedding_text in all_chunks:
                        chunk_embedding = json.loads(embedding_text)
                        similarity = cosine_similarity(query_embedding, chunk_embedding)
                        scored_chunks.append((chunk_text, similarity))
                    
                    scored_chunks.sort(key=lambda x: x[1], reverse=True)
                    print(f"DEBUG: Top {tenant_rag_topk_default} chunks for query '{user_message}':")
                    for i, (chunk, sim) in enumerate(scored_chunks[:tenant_rag_topk_default]):
                        print(f"  {i+1}. Similarity: {sim:.4f}, Text: {chunk[:200]}...")

                    request_id = context.request_id if hasattr(context, 'request_id') else 'unknown'
                    query_hash = hashlib.sha256(user_message.encode()).hexdigest()[:12]
                    
                    overlap_rate = low_overlap_rate()
                    start_top_k = tenant_rag_topk_fallback if (RAG_LOW_OVERLAP_START_TOPK5 and overlap_rate >= RAG_LOW_OVERLAP_THRESHOLD) else tenant_rag_topk_default
                    
                    context_str, sims = build_context_with_scores(scored_chunks, top_k=start_top_k)
                    context_ok, gate_reason, gate_debug = quality_gate(user_message, context_str, sims, quality_gate_settings)
                    
                    gate_debug['top_k_used'] = start_top_k
                    gate_debug['overlap_rate'] = overlap_rate
                    
                    rag_debug_log({
                        'event': 'rag_gate',
                        'request_id': request_id,
                        'query_hash': query_hash,
                        'timestamp': now_moscow().isoformat(),
                        'attempt': 1,
                        'top_k': start_top_k,
                        'ok': context_ok,
                        'reason': gate_reason,
                        'metrics': gate_debug
                    })
                    
                    if 'low_overlap' in gate_reason and start_top_k < tenant_rag_topk_fallback:
                        context2, sims2 = build_context_with_scores(scored_chunks, top_k=tenant_rag_topk_fallback)
                        context_ok2, gate_reason2, gate_debug2 = quality_gate(user_message, context2, sims2, quality_gate_settings)
                        
                        gate_debug2['top_k_used'] = tenant_rag_topk_fallback
                        gate_debug2['overlap_rate'] = overlap_rate
                        
                        rag_debug_log({
                            'event': 'rag_gate_fallback',
                            'request_id': request_id,
                            'query_hash': query_hash,
                            'timestamp': now_moscow().isoformat(),
                            'attempt': 2,
                            'top_k': RAG_TOPK_FALLBACK,
                            'ok': context_ok2,
                            'reason': gate_reason2,
                            'metrics': gate_debug2
                        })
                        
                        context_str = context2
                        sims = sims2
                        context_ok = context_ok2
                        gate_reason = gate_reason2
                        gate_debug = gate_debug2
                    
                    update_low_overlap_stats('low_overlap' in gate_reason)
                else:
                    # Если нет chunks - проверяем режим pure_prompt
                    context_str = ""
                    if enable_pure_prompt_mode:
                        # Режим работы без RAG: разрешаем использовать историю и system_prompt
                        context_ok = True
                        gate_reason = "no_chunks_pure_prompt_enabled"
                        print(f"✅ Pure prompt mode enabled for tenant {tenant_id} (no chunks)")
                    else:
                        # Обычный режим: без документов бот не может отвечать
                        context_ok = False
                        gate_reason = "no_chunks"
                        print(f"⚠️ No chunks found for tenant {tenant_id}, pure_prompt_mode disabled")
                    sims = []
                    gate_debug = {}
            except Exception as emb_error:
                print(f"Embedding search error: {emb_error}")
                cur.execute("""
                    SELECT chunk_text FROM t_p56134400_telegram_ai_bot_pdf.tenant_chunks 
                    WHERE tenant_id = %s
                    ORDER BY id DESC 
                    LIMIT 3
                """, (tenant_id,))
                chunks = cur.fetchall()
                context_str = "\n\n".join([chunk[0] for chunk in chunks]) if chunks else ""
                context_ok = False
                gate_reason = "embedding_error"
                sims = []
                gate_debug = {"error": str(emb_error)}

        cur.execute("""
            INSERT INTO t_p56134400_telegram_ai_bot_pdf.chat_messages (session_id, role, content, tenant_id)
            VALUES (%s, %s, %s, %s)
        """, (session_id, 'user', user_message_converted, tenant_id))
        
        cur.execute("""
            INSERT INTO t_p56134400_telegram_ai_bot_pdf.tenant_quality_gate_logs 
            (tenant_id, user_message, context_ok, gate_reason, query_type, lang, 
             best_similarity, context_len, overlap, key_tokens, top_k_used)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            tenant_id,
            user_message,
            context_ok,
            gate_reason,
            gate_debug.get('query_type'),
            gate_debug.get('lang'),
            gate_debug.get('best_similarity'),
            gate_debug.get('context_len'),
            gate_debug.get('overlap'),
            gate_debug.get('key_tokens'),
            gate_debug.get('top_k_used')
        ))
        conn.commit()
        
        # Проверяем, первое ли это сообщение в голосовом диалоге
        is_first_message = True
        if channel == 'voice':
            # Для голосовых звонков проверяем историю ДО добавления текущего сообщения
            cur.execute("""
                SELECT COUNT(*) FROM t_p56134400_telegram_ai_bot_pdf.chat_messages
                WHERE session_id = %s AND tenant_id = %s
            """, (session_id, tenant_id))
            msg_count = cur.fetchone()[0]
            is_first_message = (msg_count == 0)
            print(f"🎙️ VOICE: is_first_message={is_first_message}, message_count={msg_count}")
        
        # Используем ранее загруженную историю (history_messages_preview)
        system_prompt = compose_system(system_prompt_template, context_str, context_ok, channel=channel, is_first_message=is_first_message)
        
        # Если quality gate не прошёл - НЕ используем историю чата
        # Это предотвращает использование информации из удалённых документов
        history_to_use = history_messages_preview if context_ok else []
        
        if not context_ok:
            print(f"⚠️ Quality gate failed ({gate_reason}), history disabled for this request")

        if ai_provider == 'yandex':
            yandex_api_key, error = get_tenant_api_key(tenant_id, 'yandex', 'api_key')
            if error:
                return error
            
            yandex_folder_id, error = get_tenant_api_key(tenant_id, 'yandex', 'folder_id')
            if error:
                return error
            
            import requests
            yandex_messages = [{"role": "system", "text": system_prompt}]
            
            # Добавляем историю сообщений (только если context_ok=True)
            for msg in history_to_use:
                yandex_messages.append({
                    "role": "user" if msg["role"] == "user" else "assistant",
                    "text": msg["content"]
                })
            
            # Добавляем текущее сообщение
            yandex_messages.append({"role": "user", "text": user_message_converted})
            
            payload = {
                "modelUri": f"gpt://{yandex_folder_id}/{chat_api_model}",
                "completionOptions": {
                    "temperature": ai_temperature,
                    "maxTokens": str(ai_max_tokens)
                },
                "messages": yandex_messages
            }
            
            yandex_response = requests.post(
                'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
                headers={
                    'Authorization': f'Api-Key {yandex_api_key}',
                    'Content-Type': 'application/json'
                },
                json=payload
            )
            
            if yandex_response.status_code != 200:
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f'Yandex API error: {yandex_response.text}'}),
                    'isBase64Encoded': False
                }
            
            yandex_data = yandex_response.json()
            assistant_message = yandex_data['result']['alternatives'][0]['message']['text']
            
            # Логируем использование токенов
            usage_data = yandex_data.get('result', {}).get('usage', {})
            total_tokens = int(usage_data.get('totalTokens', 0))
            if total_tokens > 0:
                log_token_usage(
                    tenant_id=tenant_id,
                    operation_type='gpt_response',
                    model=chat_api_model,
                    tokens_used=total_tokens,
                    request_id=session_id,
                    metadata={'provider': 'yandex'}
                )
        elif ai_provider == 'openrouter':
            openrouter_key, error = get_tenant_api_key(tenant_id, 'openrouter', 'api_key')
            if error:
                return error
            
            is_free_model = chat_api_model.endswith(':free')
            
            if is_free_model:
                try:
                    working_model = get_working_free_model(chat_api_model)
                    print(f"✅ OpenRouter бесплатная модель доступна: {chat_api_model}")
                except Exception as model_error:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': f'Модель недоступна: {str(model_error)}'}),
                        'isBase64Encoded': False
                    }
            else:
                # Платные модели используем напрямую
                working_model = chat_api_model
                print(f"💰 OpenRouter платная модель: {chat_api_model}")
            
            # Setup proxy for OpenRouter if enabled
            openrouter_http_client = None
            if proxy_settings.get('openrouter', {}).get('enabled') and proxy_settings['openrouter'].get('proxy'):
                import httpx
                openrouter_http_client = httpx.Client(proxies=proxy_settings['openrouter']['proxy'])
                print(f"[chat] Using proxy for OpenRouter: {list(proxy_settings['openrouter']['proxy'].values())[0][:50]}...")
            
            chat_client = OpenAI(
                api_key=openrouter_key,
                base_url="https://openrouter.ai/api/v1",
                http_client=openrouter_http_client
            )
            openrouter_messages = [{"role": "system", "content": system_prompt}]
            for msg in history_to_use:
                openrouter_messages.append({"role": msg["role"], "content": msg["content"]})
            openrouter_messages.append({"role": "user", "content": user_message_converted})
            
            response = chat_client.chat.completions.create(
                model=working_model,
                messages=openrouter_messages,
                temperature=ai_temperature,
                top_p=ai_top_p,
                frequency_penalty=ai_frequency_penalty,
                presence_penalty=ai_presence_penalty,
                max_tokens=ai_max_tokens
            )
            assistant_message = response.choices[0].message.content
            
            # Логируем использование токенов
            if hasattr(response, 'usage') and response.usage:
                log_token_usage(
                    tenant_id=tenant_id,
                    operation_type='gpt_response',
                    model=working_model,
                    tokens_used=response.usage.total_tokens,
                    request_id=session_id,
                    metadata={'provider': 'openrouter'}
                )
        elif ai_provider == 'deepseek':
            deepseek_key, error = get_tenant_api_key(tenant_id, 'deepseek', 'api_key')
            if error:
                return error
            
            # Setup proxy for DeepSeek if enabled
            deepseek_http_client = None
            if proxy_settings.get('deepseek', {}).get('enabled') and proxy_settings['deepseek'].get('proxy'):
                import httpx
                deepseek_http_client = httpx.Client(proxies=proxy_settings['deepseek']['proxy'])
                print(f"[chat] Using proxy for DeepSeek: {list(proxy_settings['deepseek']['proxy'].values())[0][:50]}...")
            
            chat_client = OpenAI(
                api_key=deepseek_key,
                base_url="https://api.deepseek.com",
                http_client=deepseek_http_client
            )
            deepseek_messages = [{"role": "system", "content": system_prompt}]
            for msg in history_to_use:
                deepseek_messages.append({"role": msg["role"], "content": msg["content"]})
            deepseek_messages.append({"role": "user", "content": user_message_converted})
            
            response = chat_client.chat.completions.create(
                model=chat_api_model,
                messages=deepseek_messages,
                temperature=ai_temperature,
                top_p=ai_top_p,
                frequency_penalty=ai_frequency_penalty,
                presence_penalty=ai_presence_penalty,
                max_tokens=ai_max_tokens
            )
            assistant_message = response.choices[0].message.content
            
            # Логируем использование токенов
            if hasattr(response, 'usage') and response.usage:
                log_token_usage(
                    tenant_id=tenant_id,
                    operation_type='gpt_response',
                    model=chat_api_model,
                    tokens_used=response.usage.total_tokens,
                    request_id=session_id,
                    metadata={'provider': 'deepseek'}
                )
        elif ai_provider == 'proxyapi':
            proxyapi_key, error = get_tenant_api_key(tenant_id, 'proxyapi', 'api_key')
            if error:
                return error
            # Setup proxy for ProxyAPI if enabled
            proxyapi_http_client = None
            if proxy_settings.get('proxyapi', {}).get('enabled') and proxy_settings['proxyapi'].get('proxy'):
                import httpx
                proxyapi_http_client = httpx.Client(proxies=proxy_settings['proxyapi']['proxy'])
                print(f"[chat] Using proxy for ProxyAPI: {list(proxy_settings['proxyapi']['proxy'].values())[0][:50]}...")
            
            chat_client = OpenAI(
                api_key=proxyapi_key,
                base_url="https://api.proxyapi.ru/openai/v1",
                http_client=proxyapi_http_client
            )
            proxyapi_messages = [{"role": "system", "content": system_prompt}]
            for msg in history_to_use:
                proxyapi_messages.append({"role": msg["role"], "content": msg["content"]})
            proxyapi_messages.append({"role": "user", "content": user_message_converted})
            
            response = chat_client.chat.completions.create(
                model=chat_api_model,
                messages=proxyapi_messages,
                temperature=ai_temperature,
                top_p=ai_top_p,
                frequency_penalty=ai_frequency_penalty,
                presence_penalty=ai_presence_penalty,
                max_tokens=ai_max_tokens
            )
            assistant_message = response.choices[0].message.content
            
            # Логируем использование токенов
            if hasattr(response, 'usage') and response.usage:
                log_token_usage(
                    tenant_id=tenant_id,
                    operation_type='gpt_response',
                    model=chat_api_model,
                    tokens_used=response.usage.total_tokens,
                    request_id=session_id,
                    metadata={'provider': 'proxyapi'}
                )
        else:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Неизвестный провайдер: {ai_provider}'}),
                'isBase64Encoded': False
            }

        cur.execute("""
            INSERT INTO t_p56134400_telegram_ai_bot_pdf.chat_messages (session_id, role, content, tenant_id)
            VALUES (%s, %s, %s, %s)
        """, (session_id, 'assistant', assistant_message, tenant_id))
        conn.commit()

        cur.close()
        conn.close()

        # Форматируем ответ под конкретный канал
        print(f'[chat] Formatting for channel={channel}, tenant_id={tenant_id}')
        settings = get_formatting_settings(tenant_id, channel)
        formatted_message = format_with_settings(assistant_message, settings, channel)
        print(f'[chat] Original: {assistant_message[:100]}...')
        print(f'[chat] Formatted: {formatted_message[:100]}...')

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'message': formatted_message,
                'sessionId': session_id,
                'debug': {
                    'context_ok': context_ok,
                    'gate_reason': gate_reason,
                    'gate_info': gate_debug
                }
            }),
            'isBase64Encoded': False
        }

    except Exception as e:
        print(f'❌ [chat] Critical error: {e}')
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }