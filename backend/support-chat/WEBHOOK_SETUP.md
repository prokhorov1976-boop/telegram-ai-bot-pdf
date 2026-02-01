# Инструкция по настройке Telegram вебхука для чата поддержки

## 1. Создайте бота через @BotFather

1. Напишите @BotFather в Telegram
2. Отправьте команду `/newbot`
3. Следуйте инструкциям (укажите имя и username бота)
4. Получите **токен бота** (например: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)
5. Сохраните токен в секрет **SUPPORT_BOT_TOKEN**

## 2. Узнайте Chat ID

1. Напишите боту @userinfobot любое сообщение
2. Он пришлет ваш **Chat ID** (например: `123456789`)
3. Сохраните Chat ID в секрет **SUPPORT_CHAT_ID**

## 3. Настройте вебхук

Отправьте HTTP запрос для установки вебхука:

```bash
curl "https://api.telegram.org/bot<ВАШ_BOT_TOKEN>/setWebhook?url=https://functions.poehali.dev/9abd7a94-704d-426b-bfe8-19437abc6fb5"
```

**Замените** `<ВАШ_BOT_TOKEN>` на реальный токен бота.

### Ожидаемый ответ:
```json
{
  "ok": true,
  "result": true,
  "description": "Webhook was set"
}
```

## 4. Проверьте вебхук

```bash
curl "https://api.telegram.org/bot<ВАШ_BOT_TOKEN>/getWebhookInfo"
```

### Ожидаемый ответ:
```json
{
  "ok": true,
  "result": {
    "url": "https://functions.poehali.dev/9abd7a94-704d-426b-bfe8-19437abc6fb5",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

## 5. Проверка работы

1. Откройте чат поддержки на сайте
2. Отправьте тестовое сообщение
3. Сообщение должно прийти боту в Telegram
4. **Ответьте на сообщение** в Telegram (через Reply)
5. Ответ должен появиться в чате на сайте

## Troubleshooting

### Сообщения не приходят в Telegram:
- Проверьте секреты SUPPORT_BOT_TOKEN и SUPPORT_CHAT_ID
- Проверьте логи функции `support-chat` в poehali.dev
- Убедитесь что бот не заблокирован

### Ответы не приходят на сайт:
- Проверьте что вебхук установлен (команда getWebhookInfo)
- Проверьте логи функции `support-telegram-webhook`
- Убедитесь что отвечаете через Reply (не просто пишете боту)

## URL вебхука для Telegram:
```
https://functions.poehali.dev/9abd7a94-704d-426b-bfe8-19437abc6fb5
```

Этот URL нужно установить как webhook в настройках вашего Telegram бота.
