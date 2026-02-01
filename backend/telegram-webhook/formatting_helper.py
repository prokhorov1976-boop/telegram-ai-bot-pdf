"""Утилита для загрузки настроек форматирования из БД"""
import os
import json
import psycopg2
import re

def get_formatting_settings(tenant_id: int, messenger: str) -> dict:
    """Получить настройки форматирования для тенанта и мессенджера"""
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        cur.execute("""
            SELECT use_emoji, use_markdown, use_lists_formatting,
                   custom_emoji_map, list_bullet_char, numbered_list_char
            FROM t_p56134400_telegram_ai_bot_pdf.messenger_formatting_settings
            WHERE tenant_id = %s AND messenger = %s
        """, (tenant_id, messenger))
        
        row = cur.fetchone()
        cur.close()
        conn.close()
        
        if not row:
            # Дефолтные настройки
            return {
                'use_emoji': True,
                'use_markdown': messenger == 'telegram',
                'use_lists_formatting': True,
                'custom_emoji_map': {},
                'list_bullet_char': '•',
                'numbered_list_char': '▫️'
            }
        
        return {
            'use_emoji': row[0],
            'use_markdown': row[1],
            'use_lists_formatting': row[2],
            'custom_emoji_map': row[3] if row[3] else {},
            'list_bullet_char': row[4],
            'numbered_list_char': row[5]
        }
    except Exception as e:
        print(f'Error loading formatting settings: {e}')
        return {
            'use_emoji': True,
            'use_markdown': messenger == 'telegram',
            'use_lists_formatting': True,
            'custom_emoji_map': {},
            'list_bullet_char': '•',
            'numbered_list_char': '▫️'
        }

def format_with_settings(text: str, settings: dict, messenger: str) -> str:
    """Форматирование текста согласно настройкам"""
    
    # Убираем HTML-теги и конвертируем в Markdown для Telegram
    if messenger == 'telegram':
        text = re.sub(r'<b>(.+?)</b>', r'**\1**', text, flags=re.IGNORECASE | re.DOTALL)
        text = re.sub(r'<i>(.+?)</i>', r'*\1*', text, flags=re.IGNORECASE | re.DOTALL)
        text = re.sub(r'<[^>]+>', '', text)
    elif messenger in ['max', 'vk']:
        # Просто удаляем HTML-теги
        text = re.sub(r'<b>(.+?)</b>', r'\1', text, flags=re.IGNORECASE | re.DOTALL)
        text = re.sub(r'<i>(.+?)</i>', r'\1', text, flags=re.IGNORECASE | re.DOTALL)
        text = re.sub(r'<[^>]+>', '', text)
    
    # Добавляем эмодзи к каждой строке содержащей ключевое слово
    if settings.get('use_emoji'):
        lines = text.split('\n')
        # Используем карту из настроек или дефолтную
        emoji_mapping = settings.get('custom_emoji_map', {})
        
        # Если карта пустая, используем дефолтную
        if not emoji_mapping:
            emoji_mapping = {
                'завтрак': '🍳',
                'без питания': '🍽',
                'полный пансион': '🍴',
                'стандарт': '🏨',
                'комфорт': '✨',
                'люкс': '👑',
                'руб': '💰'
            }
        
        for i, line in enumerate(lines):
            line_lower = line.lower()
            # Проверяем наличие ключевых слов и добавляем эмодзи, если его еще нет
            for keyword, emoji in emoji_mapping.items():
                if keyword in line_lower and emoji not in line:
                    # Добавляем эмодзи в начало строки после пробелов
                    indent = len(line) - len(line.lstrip())
                    lines[i] = line[:indent] + emoji + ' ' + line[indent:]
                    break
        
        text = '\n'.join(lines)
    
    return text