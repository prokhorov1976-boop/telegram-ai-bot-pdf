import psycopg2
import os
from typing import Optional

# Тарифы провайдеров (руб за 1000 токенов)
# Курс: 1$ = 100₽ (примерно)
PRICING = {
    # Yandex Cloud
    'text-search-doc': 0.08,
    'text-search-query': 0.08,
    'yandexgpt-lite': 0.32,
    'yandexgpt': 1.28,
    
    # DeepSeek API (https://platform.deepseek.com/api-docs/pricing/)
    'deepseek-chat': 0.014,  # $0.14 per 1M input tokens = 0.014₽/1k
    'deepseek-reasoner': 0.055,  # $0.55 per 1M input tokens = 0.055₽/1k
    
    # ProxyAPI (GPT-4o-mini через прокси, примерная цена)
    'gpt-4o-mini': 0.015,  # ~$0.15 per 1M = 0.015₽/1k
    'gpt-3.5-turbo': 0.050,  # ~$0.50 per 1M
    'gpt-4o': 0.500,  # ~$5 per 1M
    'claude-3-haiku-20240307': 0.025,
    'claude-3-5-sonnet-20241022': 0.300,
    'o1-mini': 0.300,
    'gpt-4-turbo': 1.000,
    
    # OpenRouter (бесплатные модели = 0, платные - примерные цены)
    'meta-llama/llama-3.3-70b-instruct:free': 0.0,
    'google/gemini-2.0-flash-exp:free': 0.0,
    'deepseek/deepseek-chat:free': 0.0,
    'deepseek/deepseek-r1:free': 0.0,
    'meta-llama/llama-3.1-405b-instruct:free': 0.0,
    'qwen/qwen-2.5-72b-instruct:free': 0.0,
    'mistralai/mistral-small-3.1-24b-instruct:free': 0.0,
    'microsoft/phi-3-medium-128k-instruct:free': 0.0,
    'meta-llama/llama-3.1-8b-instruct:free': 0.0,
    'google/gemma-2-9b-it:free': 0.0,
    'qwen/qwen-2.5-7b-instruct:free': 0.0,
    'google/gemini-flash-1.5': 0.0075,
    'deepseek/deepseek-chat': 0.014,
    'mistralai/mixtral-8x7b-instruct': 0.024,
    'anthropic/claude-3-haiku': 0.025,
    'openai/gpt-3.5-turbo': 0.050,
    'meta-llama/llama-3.1-70b-instruct': 0.052,
    'google/gemini-pro-1.5': 0.125,
    'openai/gpt-4o': 0.500,
    'anthropic/claude-3.5-sonnet': 0.300,
}

def log_token_usage(
    tenant_id: int,
    operation_type: str,
    model: str,
    tokens_used: int,
    request_id: Optional[str] = None,
    metadata: Optional[dict] = None
):
    """
    Логирует использование токенов в БД
    
    Args:
        tenant_id: ID тенанта
        operation_type: Тип операции ('embedding_create', 'embedding_query', 'gpt_response')
        model: Название модели ('text-search-doc', 'yandexgpt-lite' и т.д.)
        tokens_used: Количество использованных токенов
        request_id: ID запроса (опционально)
        metadata: Дополнительная информация (опционально)
    """
    try:
        # Вычисляем стоимость
        price_per_1k = PRICING.get(model, 0)
        cost_rubles = (tokens_used / 1000.0) * price_per_1k
        
        # Если цена не найдена, выводим предупреждение
        if price_per_1k == 0 and model not in PRICING:
            print(f"WARNING: No pricing found for model '{model}', cost set to 0")
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        import json
        metadata_json = json.dumps(metadata) if metadata else None
        
        cur.execute("""
            INSERT INTO t_p56134400_telegram_ai_bot_pdf.token_usage 
            (tenant_id, operation_type, model, tokens_used, cost_rubles, request_id, metadata)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (tenant_id, operation_type, model, tokens_used, cost_rubles, request_id, metadata_json))
        
        conn.commit()
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Error logging token usage: {e}")