import re
import os
import json
import hashlib
from collections import deque
from typing import List, Dict, Tuple
from datetime import datetime

STOPWORDS_RU = {
    "и","в","во","на","по","к","ко","с","со","у","из","за","для","о","об","от","до","или",
    "а","но","что","это","как","где","когда","сколько","какой","какая","какие","какое",
    "я","мы","вы","они","он","она","оно","мне","нам","вам","их","его","ее","этот","эта","эти",
    "тут","там","здесь","вот","ли","же","бы","то","не","нет","да"
}

STOPWORDS_EN = {
    "the","a","an","and","or","to","of","in","on","for","with","about","is","are","was","were",
    "be","been","being","as","at","by","from","this","that","these","those","it","its","i","we","you","they",
    "my","our","your","their","me","us","them","please"
}

GATE_THRESHOLDS = {
    "tariffs": {"min_len": 300, "min_sim": 0.35, "min_overlap_ru": 0.08, "min_overlap_en": 0.08},
    "rules":   {"min_len": 650, "min_sim": 0.34, "min_overlap_ru": 0.18, "min_overlap_en": 0.14},
    "services":{"min_len": 550, "min_sim": 0.32, "min_overlap_ru": 0.18, "min_overlap_en": 0.14},
    "default": {"min_len": 650, "min_sim": 0.34, "min_overlap_ru": 0.18, "min_overlap_en": 0.14},
}

RAG_DEBUG = os.environ.get('RAG_DEBUG', 'false').lower() == 'true'
RAG_TOPK_DEFAULT = int(os.environ.get('RAG_TOPK_DEFAULT', '12'))
RAG_TOPK_FALLBACK = int(os.environ.get('RAG_TOPK_FALLBACK', '15'))
RAG_LOW_OVERLAP_WINDOW = int(os.environ.get('RAG_LOW_OVERLAP_WINDOW', '50'))
RAG_LOW_OVERLAP_THRESHOLD = float(os.environ.get('RAG_LOW_OVERLAP_THRESHOLD', '0.25'))
RAG_LOW_OVERLAP_START_TOPK5 = os.environ.get('RAG_LOW_OVERLAP_START_TOPK5', 'true').lower() == 'true'

low_overlap_window = deque(maxlen=RAG_LOW_OVERLAP_WINDOW)

def rag_debug_log(event: dict):
    if not RAG_DEBUG:
        return
    print(json.dumps(event, ensure_ascii=False))

def low_overlap_rate() -> float:
    if len(low_overlap_window) == 0:
        return 0.0
    return sum(low_overlap_window) / len(low_overlap_window)

def update_low_overlap_stats(is_low_overlap: bool):
    low_overlap_window.append(1 if is_low_overlap else 0)

def detect_lang_simple(text: str) -> str:
    cyr = len(re.findall(r"[А-Яа-яЁё]", text))
    lat = len(re.findall(r"[A-Za-z]", text))
    if cyr == 0 and lat == 0:
        return "other"
    if cyr >= lat:
        return "ru"
    return "en"

def tokenize(text: str, lang: str) -> List[str]:
    text = text.lower()
    text = re.sub(r"[^a-zа-я0-9\s\-]+", " ", text, flags=re.IGNORECASE)
    raw = [t for t in text.split() if len(t) >= 3]

    if lang == "ru":
        return [t for t in raw if t not in STOPWORDS_RU]
    if lang == "en":
        return [t for t in raw if t not in STOPWORDS_EN]
    return raw

def sanitize_chunk(text: str) -> str:
    patterns = [
        r"\bpage_number\b\s*[:=]\s*\d+",
        r"\bsimilarity\b\s*[:=]\s*[0-9.]+",
        r"\bid\b\s*[:=]\s*\d+",
        r"\bfile_name\b\s*[:=]\s*\S+",
        r"\bresults\b\s*[:=]\s*\[",
        r"\.pdf\b",
        r"\bстр\.?\s*\d+\b",
        r"\bстраниц[аы]\b\s*\d+\b",
        r"\bна\s+стр\.?\s*\d+\b",
    ]
    out = text
    for p in patterns:
        out = re.sub(p, " ", out, flags=re.IGNORECASE)
    out = re.sub(r"\s{2,}", " ", out).strip()
    return out

def classify_query_type(user_text: str) -> str:
    t = user_text.lower()
    
    # Проверка на "голые даты" — день + месяц/год без других слов
    # Примеры: "22 мая", "12 февраля", "15.03", "2025-05-22"
    date_patterns = [
        r'^\s*\d{1,2}\s+(янв|фев|мар|апр|мая|июн|июл|авг|сен|окт|ноя|дек)',  # "22 мая"
        r'^\s*\d{1,2}[./\-]\d{1,2}',  # "22.05" или "22/05"
        r'^\s*\d{4}[./\-]\d{1,2}[./\-]\d{1,2}',  # "2025-05-22"
    ]
    if any(re.match(p, t, re.IGNORECASE) for p in date_patterns):
        return "tariffs"

    if any(k in t for k in ["цена", "цену", "стоимость", "сколько стоит", "тариф", "прайс", "заезд", "выезд", "ноч", "прожив", "сколько", "рубл", "стоит", "оплат", "платеж", "стандарт", "комфорт", "люкс", "видовой", "категор"]):
        return "tariffs"

    if any(k in t for k in ["правил", "нельзя", "запрет", "штраф", "курить", "документ", "ответствен", "выселен", "возмещен"]):
        return "rules"

    return "services"

def build_context_with_scores(scored_chunks: List[Tuple[str, float]], top_k: int = None, max_chars_per_chunk: int = 2200) -> Tuple[str, List[float]]:
    if not scored_chunks:
        return "", []
    
    if top_k is None:
        top_k = RAG_TOPK_DEFAULT

    sorted_chunks = sorted(scored_chunks, key=lambda x: x[1], reverse=True)[:top_k]

    parts: List[str] = []
    sims: List[float] = []

    for chunk_text, similarity in sorted_chunks:
        sims.append(similarity)
        clean = sanitize_chunk(chunk_text)
        if not clean:
            continue
        clean = clean[:max_chars_per_chunk].strip()
        parts.append(clean)

    context = "\n\n".join(parts).strip()
    return context, sims

def keyword_overlap_ratio(user_text: str, context: str, lang: str) -> Tuple[float, int]:
    q = tokenize(user_text, lang)
    c = tokenize(context, lang)

    q_set = set(q)
    c_set = set(c)
    if not q_set:
        return 0.0, 0

    overlap = len(q_set & c_set) / max(1, len(q_set))
    return overlap, len(q_set)

def get_tenant_topk(tenant_overrides: Dict = None) -> Tuple[int, int]:
    """Получить top_k настройки из tenant-specific конфига или дефолтные"""
    if tenant_overrides:
        # Безопасная конвертация значений из dict, которые могут быть строками
        default_val = tenant_overrides.get('rag_topk_default', RAG_TOPK_DEFAULT)
        fallback_val = tenant_overrides.get('rag_topk_fallback', RAG_TOPK_FALLBACK)
        
        try:
            default_topk = int(default_val) if default_val is not None else RAG_TOPK_DEFAULT
        except (ValueError, TypeError):
            default_topk = RAG_TOPK_DEFAULT
            
        try:
            fallback_topk = int(fallback_val) if fallback_val is not None else RAG_TOPK_FALLBACK
        except (ValueError, TypeError):
            fallback_topk = RAG_TOPK_FALLBACK
            
        return default_topk, fallback_topk
    return RAG_TOPK_DEFAULT, RAG_TOPK_FALLBACK

def quality_gate(user_text: str, context: str, sims: List[float], tenant_overrides: Dict = None) -> Tuple[bool, str, Dict]:
    if not context:
        return False, "empty_context", {}

    q_type = classify_query_type(user_text)
    
    # Сначала берём дефолтные пороги
    th = GATE_THRESHOLDS.get(q_type, GATE_THRESHOLDS["default"]).copy()
    
    # Если есть tenant-специфичные настройки - применяем их с конвертацией типов
    if tenant_overrides:
        tenant_th = tenant_overrides.get(q_type, tenant_overrides.get("default", {}))
        if tenant_th:
            # Конвертируем строковые значения в числа
            for key, value in tenant_th.items():
                if isinstance(value, str):
                    try:
                        # Пытаемся сначала int, потом float
                        tenant_th[key] = int(value) if '.' not in str(value) else float(value)
                    except (ValueError, TypeError):
                        pass  # Оставляем как есть, если не число
            th.update(tenant_th)

    debug_info = {
        "query_type": q_type,
        "context_len": len(context),
        "best_similarity": max(sims) if sims else None,
    }

    if len(context) < th["min_len"]:
        print(f"❌ QUALITY GATE: too_short - context_len={len(context)}, min_len={th['min_len']}")
        return False, f"too_short:{q_type}", debug_info

    if sims:
        best = max(sims)
        if best < th["min_sim"]:
            print(f"❌ QUALITY GATE: low_similarity - best={best:.4f}, min_sim={th['min_sim']}")
            return False, f"low_similarity:{q_type}:{best:.2f}", debug_info

    lang = detect_lang_simple(user_text)
    min_overlap = th["min_overlap_ru"] if lang == "ru" else th["min_overlap_en"]

    overlap, q_key_tokens = keyword_overlap_ratio(user_text, context, lang)
    debug_info["overlap"] = overlap
    debug_info["lang"] = lang
    debug_info["key_tokens"] = q_key_tokens

    print(f"DEBUG QUALITY GATE: user_text='{user_text}', q_type={q_type}, lang={lang}, overlap={overlap:.4f}, min_overlap={min_overlap}, q_key_tokens={q_key_tokens}")

    if q_key_tokens >= 4 and overlap < min_overlap:
        print(f"❌ QUALITY GATE: low_overlap - overlap={overlap:.4f}, min_overlap={min_overlap}, q_key_tokens={q_key_tokens}")
        return False, f"low_overlap:{q_type}:{lang}:{overlap:.2f}", debug_info

    print(f"✅ QUALITY GATE: PASS - {q_type}/{lang}")
    return True, f"ok:{q_type}:{lang}", debug_info

def compose_system(system_template: str, context: str, context_ok: bool) -> str:
    final_context = context if (context_ok and context) else "Документы пока не загружены"
    return f"""{system_template}

Доступная информация из документов:
{final_context}"""