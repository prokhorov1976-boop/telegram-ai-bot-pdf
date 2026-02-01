"""Helper для работы с московским временем (UTC+3)"""
from datetime import datetime, timezone, timedelta

# Московский часовой пояс UTC+3
MOSCOW_TZ = timezone(timedelta(hours=3))

def now_moscow():
    """Возвращает текущее время в московском часовом поясе (UTC+3)"""
    return datetime.now(MOSCOW_TZ)

def moscow_naive():
    """Возвращает текущее московское время без timezone (для записи в БД)"""
    return datetime.now(MOSCOW_TZ).replace(tzinfo=None)