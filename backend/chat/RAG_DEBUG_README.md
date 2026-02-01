# RAG Debug Mode & Auto Top-K Adjustment

Система качественного контроля RAG с автоматической адаптацией и режимом отладки.

## Возможности

### 1. DEBUG MODE
JSON-логирование всех проверок quality gate для анализа и отладки.

**Конфигурация:**
```bash
RAG_DEBUG=true  # Включить режим отладки (по умолчанию: false)
```

**Формат логов:**
```json
{
  "event": "rag_gate",
  "request_id": "abc123",
  "query_hash": "7f3e2a1b9c8d",
  "timestamp": "2026-01-12T15:30:00.000000",
  "attempt": 1,
  "top_k": 3,
  "ok": false,
  "reason": "low_overlap:services:ru:0.08",
  "metrics": {
    "query_type": "services",
    "lang": "ru",
    "context_len": 450,
    "best_similarity": 0.35,
    "overlap": 0.08,
    "key_tokens": 5,
    "top_k_used": 3,
    "overlap_rate": 0.22
  }
}
```

### 2. Авто-повышение top_k
Автоматический повтор retrieval с увеличенным top_k при low_overlap.

**Поведение:**
- Первый запрос: top_k=3 (по умолчанию)
- Если gate_reason содержит "low_overlap" → повтор с top_k=5
- Только одна попытка повтора (без бесконечных циклов)
- Финальный результат используется для compose_system

**Конфигурация:**
```bash
RAG_TOPK_DEFAULT=3    # Стартовый top_k (по умолчанию: 3)
RAG_TOPK_FALLBACK=5   # Fallback top_k при low_overlap (по умолчанию: 5)
```

### 3. Адаптивный старт с top_k=5
Автоматический переход на top_k=5 при частых low_overlap.

**Метрика:**
- Sliding window из последних N запросов (in-memory)
- Подсчёт доли low_overlap в окне
- Если overlap_rate >= threshold → старт с top_k=5

**Конфигурация:**
```bash
RAG_LOW_OVERLAP_WINDOW=50         # Размер окна запросов (по умолчанию: 50)
RAG_LOW_OVERLAP_THRESHOLD=0.25    # Порог для автостарта с top_k=5 (по умолчанию: 25%)
RAG_LOW_OVERLAP_START_TOPK5=true  # Включить адаптивный старт (по умолчанию: true)
```

**Логика:**
```python
if overlap_rate >= 0.25:
    start_top_k = 5  # Сразу стартуем с 5
else:
    start_top_k = 3  # Обычный режим
```

## Quality Gate Thresholds

Разные пороги для различных типов вопросов:

| Тип запроса | min_len | min_sim | min_overlap_ru | min_overlap_en |
|-------------|---------|---------|----------------|----------------|
| tariffs     | 900     | 0.40    | 0.18           | 0.14           |
| rules       | 650     | 0.34    | 0.18           | 0.14           |
| services    | 550     | 0.32    | 0.18           | 0.14           |

## Логирование в базу данных

Все проверки gate логируются в таблицу `quality_gate_logs`:

```sql
CREATE TABLE quality_gate_logs (
    id SERIAL PRIMARY KEY,
    user_message TEXT NOT NULL,
    context_ok BOOLEAN NOT NULL,
    gate_reason VARCHAR(100) NOT NULL,
    query_type VARCHAR(50),
    lang VARCHAR(10),
    best_similarity DECIMAL(5,4),
    context_len INTEGER,
    overlap DECIMAL(5,4),
    key_tokens INTEGER,
    top_k_used INTEGER DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Admin Dashboard

Frontend компонент `QualityGateStatsCard` отображает:

1. **Общую статистику:**
   - Total / Passed / Failed / Pass Rate

2. **Breakdown:**
   - По причинам отклонения
   - По типу вопроса (tariffs/rules/services)
   - По языку (RU/EN/other)
   - По top_k (3/5)

3. **Последние 50 проверок:**
   - Детальные метрики каждой проверки
   - Автообновление каждые 30 секунд

## Безопасность

✅ **Гарантии:**
- Никакие служебные поля (id, similarity, page_number) не попадают в messages
- Имена файлов и нумерация страниц удаляются через sanitize_chunk
- Debug-логи НЕ отправляются пользователю
- gate_reason и метрики логируются только в базу и JSON-логи

## Примеры использования

### Включить debug-режим
```bash
export RAG_DEBUG=true
```

### Настроить агрессивное повышение top_k
```bash
export RAG_TOPK_DEFAULT=3
export RAG_TOPK_FALLBACK=7
export RAG_LOW_OVERLAP_THRESHOLD=0.15  # Порог 15% вместо 25%
```

### Отключить адаптивный старт
```bash
export RAG_LOW_OVERLAP_START_TOPK5=false
```

## Мониторинг

### Через Admin UI
1. Откройте админ-панель
2. Перейдите в раздел "Quality Gate статистика"
3. Просмотрите метрики и последние логи

### Через логи (при RAG_DEBUG=true)
```bash
# Фильтр по событиям gate
cat logs.json | jq 'select(.event == "rag_gate")'

# Проверить fallback-попытки
cat logs.json | jq 'select(.event == "rag_gate_fallback")'

# Средний overlap_rate
cat logs.json | jq -s 'map(.metrics.overlap_rate) | add / length'
```

### SQL-запросы
```sql
-- Pass rate за последние 24 часа
SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN context_ok THEN 1 ELSE 0 END)::float / COUNT(*) * 100 as pass_rate
FROM quality_gate_logs
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Распределение по top_k
SELECT top_k_used, COUNT(*) 
FROM quality_gate_logs 
GROUP BY top_k_used;

-- Запросы с fallback на top_k=5
SELECT user_message, gate_reason, overlap, context_len
FROM quality_gate_logs
WHERE top_k_used = 5 AND gate_reason LIKE 'low_overlap%'
ORDER BY created_at DESC
LIMIT 20;
```

## Критерии приёмки ✅

- [x] Debug-логи включаются через RAG_DEBUG=true
- [x] При low_overlap система повторяет с top_k=5 (один раз)
- [x] Sliding window отслеживает частоту low_overlap
- [x] При overlap_rate >= 25% старт с top_k=5
- [x] Все метрики логируются в базу
- [x] Admin UI показывает статистику в реальном времени
- [x] Никакие служебные поля не попадают пользователю
- [x] sanitize_chunk удаляет id/similarity/page_number/filenames

## Зависимости

- Python 3.11+
- psycopg2-binary>=2.9.0
- PostgreSQL (для quality_gate_logs)

## Структура файлов

```
backend/chat/
├── index.py              # Основной handler с интеграцией
├── quality_gate.py       # Quality gate логика + debug
├── requirements.txt      # Зависимости
├── tests.json           # Тесты
└── RAG_DEBUG_README.md  # Эта документация
```
