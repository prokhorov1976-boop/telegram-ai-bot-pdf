import psycopg2
import os
from typing import Optional

# Тарифы Yandex Cloud (руб за 1000 токенов)
YANDEX_PRICING = {
    'text-search-doc': 0.08,  # Создание эмбеддингов документов
    'text-search-query': 0.08,  # Создание эмбеддингов запросов
    'yandexgpt-lite': 0.32,  # Генерация текста (lite)
    'yandexgpt': 1.28,  # Генерация текста (полная)
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
        price_per_1k = YANDEX_PRICING.get(model, 0)
        cost_rubles = (tokens_used / 1000.0) * price_per_1k
        
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
