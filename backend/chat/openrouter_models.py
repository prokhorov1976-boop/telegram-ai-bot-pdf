"""
Автоматическое обновление списка бесплатных моделей OpenRouter
"""
import requests
import json
from datetime import datetime, timedelta

# Кэш моделей (обновляется раз в час)
_models_cache = {
    'models': [],
    'updated_at': None
}

def fetch_openrouter_models():
    """Получить актуальный список бесплатных моделей OpenRouter"""
    global _models_cache
    
    # Проверяем кэш (обновляем раз в час)
    if _models_cache['updated_at'] and (datetime.now() - _models_cache['updated_at']) < timedelta(hours=1):
        return _models_cache['models']
    
    try:
        response = requests.get(
            'https://openrouter.ai/api/v1/models',
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            all_models = data.get('data', [])
            
            # Фильтруем только БЕСПЛАТНЫЕ модели
            free_models = []
            for model in all_models:
                pricing = model.get('pricing', {})
                prompt_price = float(pricing.get('prompt', '0'))
                completion_price = float(pricing.get('completion', '0'))
                
                # Если цена == 0, то модель бесплатная
                if prompt_price == 0 and completion_price == 0:
                    free_models.append({
                        'id': model.get('id', ''),
                        'name': model.get('name', ''),
                        'context_length': model.get('context_length', 0),
                        'description': model.get('description', '')
                    })
            
            _models_cache['models'] = free_models
            _models_cache['updated_at'] = datetime.now()
            
            print(f"✅ Обновлён список бесплатных моделей OpenRouter: {len(free_models)} моделей")
            return free_models
        else:
            print(f"⚠️ Ошибка получения моделей OpenRouter: {response.status_code}")
            return _models_cache['models']  # Возвращаем старый кэш
            
    except Exception as e:
        print(f"⚠️ Ошибка при обновлении моделей OpenRouter: {e}")
        return _models_cache['models']  # Возвращаем старый кэш


def get_free_model_mapping():
    """
    Получить маппинг дружественных имён на актуальные ID бесплатных моделей
    """
    free_models = fetch_openrouter_models()
    
    # Приоритетные бесплатные модели (в порядке предпочтения)
    preferred_models = {
        # DeepSeek (приоритет #1 - мощные модели)
        'deepseek-r1': ['deepseek/deepseek-r1', 'deepseek/deepseek-r1-distill-llama-70b'],
        'deepseek-chat': ['deepseek/deepseek-chat'],
        
        # Llama 3.3/3.2 (приоритет #2 - стабильные модели)
        'llama-3.3-70b': ['meta-llama/llama-3.3-70b-instruct:free'],
        'llama-3.2-90b-vision': ['meta-llama/llama-3.2-90b-vision-instruct:free'],
        'llama-3.2-11b-vision': ['meta-llama/llama-3.2-11b-vision-instruct:free'],
        'llama-3.2-3b': ['meta-llama/llama-3.2-3b-instruct:free'],
        'llama-3.2-1b': ['meta-llama/llama-3.2-1b-instruct:free'],
        
        # Llama 3.1 (fallback)
        'llama-3.1-405b': ['meta-llama/llama-3.1-405b-instruct:free'],
        'llama-3.1-70b': ['meta-llama/llama-3.1-70b-instruct:free'],
        'llama-3.1-8b': ['meta-llama/llama-3.1-8b-instruct:free'],
        
        # Qwen (приоритет #3 - альтернатива)
        'qwen-2.5-72b': ['qwen/qwen-2.5-72b-instruct:free'],
        'qwen-2.5-7b': ['qwen/qwen-2.5-7b-instruct:free'],
        'qwen-qwq-32b': ['qwen/qwq-32b-preview:free'],
        
        # Gemma (приоритет #4 - Google модели)
        'gemma-2-27b': ['google/gemma-2-27b-it:free'],
        'gemma-2-9b': ['google/gemma-2-9b-it:free'],
        
        # Mistral/Phi (fallback варианты)
        'mistral-7b': ['mistralai/mistral-7b-instruct:free'],
        'phi-3-medium': ['microsoft/phi-3-medium-128k-instruct:free'],
        'mythomist-7b': ['gryphe/mythomist-7b:free'],
    }
    
    # Получаем список ID доступных бесплатных моделей
    available_ids = {model['id'] for model in free_models}
    
    # Строим финальный маппинг
    mapping = {}
    for friendly_name, candidates in preferred_models.items():
        for candidate_id in candidates:
            if candidate_id in available_ids:
                mapping[friendly_name] = candidate_id
                break
        
        # Если ни один кандидат не найден, берём первую доступную бесплатную модель
        if friendly_name not in mapping and free_models:
            mapping[friendly_name] = free_models[0]['id']
            print(f"⚠️ Модель {friendly_name} не найдена, используется fallback: {free_models[0]['id']}")
    
    return mapping


def get_working_free_model(requested_model: str) -> str:
    """
    Получить рабочую бесплатную модель на основе запрошенной
    
    Args:
        requested_model: Запрошенная модель (friendly name или полный ID)
    
    Returns:
        Рабочий ID модели OpenRouter
    """
    mapping = get_free_model_mapping()
    
    # Если это friendly name - находим маппинг
    if requested_model in mapping:
        return mapping[requested_model]
    
    # Если это полный ID - проверяем доступность
    free_models = fetch_openrouter_models()
    available_ids = {model['id'] for model in free_models}
    
    if requested_model in available_ids:
        return requested_model
    
    # Fallback: возвращаем первую доступную бесплатную модель
    if free_models:
        fallback = free_models[0]['id']
        print(f"⚠️ Модель {requested_model} недоступна, используется: {fallback}")
        return fallback
    
    # Критическая ошибка: нет бесплатных моделей
    raise ValueError(f"Модель {requested_model} недоступна и нет бесплатных альтернатив")
