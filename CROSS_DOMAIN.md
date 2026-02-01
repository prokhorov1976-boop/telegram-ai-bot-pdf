# Работа приложения на разных доменах

## Проблема
Приложение должно работать как на основном домене **ai-ru.ru**, так и на технических доменах **.poehali.dev**. При жёсткой привязке URL к одному домену возникают проблемы с перенаправлениями и ссылками.

## Решение
Используется конфигурация `src/config/app.ts` для динамического определения базового URL:

```typescript
export const APP_CONFIG = {
  baseUrl: typeof window !== 'undefined' ? window.location.origin : 'https://ai-ru.ru',
  apiUrl: 'https://functions.poehali.dev',
  cdnUrl: 'https://cdn.poehali.dev'
};
```

## Правила использования URL

### ✅ Относительные ссылки (ПРАВИЛЬНО)
Используйте для всех внутренних ссылок приложения:

```tsx
// Навигация внутри приложения
<a href="/try-bot">Попробовать</a>
<a href="/dinasty-crimea/chat">Демо чат</a>
<a href={`/${tenantSlug}/admin`}>Админка</a>

// Или через хелпер
import { getAppUrl } from '@/config/app';
const url = getAppUrl(`/${tenantSlug}/chat`);
```

### ❌ Абсолютные ссылки на свой домен (НЕПРАВИЛЬНО)
НЕ использовать жёсткие ссылки:

```tsx
// ❌ ПЛОХО - работает только на ai-ru.ru
<a href="https://ai-ru.ru/try-bot">Попробовать</a>
const url = `https://ai-ru.ru/${tenantSlug}/chat`;
```

### ✅ Абсолютные ссылки на внешние сервисы (ПРАВИЛЬНО)
API endpoints и внешние сервисы ДОЛЖНЫ быть абсолютными:

```tsx
// ✅ ХОРОШО - API всегда на functions.poehali.dev
const CHAT_API = 'https://functions.poehali.dev/7b58f4fb-5db0-4f85-bb3b-55bafa4cbf73';

// ✅ ХОРОШО - внешние ссылки
<a href="https://t.me/dynastiya_bot">Telegram</a>
<a href="https://max.ru/spa/ai-ru">MAX.ru</a>
```

## Компоненты, использующие динамические URL

1. **src/components/hotel/PublicChatLinkCard.tsx**
   - Генерирует публичные ссылки на чат тенанта
   - Использует `getAppUrl()` для корректной работы на всех доменах

2. **src/components/landing/LandingPage.tsx**
   - Добавляет canonical URL через React Helmet
   - Автоматически подставляет текущий домен

3. **src/components/landing/FAQSection.tsx**
   - Ссылка на демо-чат использует относительный URL `/sales/chat`

4. **src/components/hotel/ConsentSettingsCard.tsx**
   - Шаблон текста согласия использует `window.location.origin`

## Файлы конфигурации

### public/_redirects
```
/*    /index.html   200
```
Обеспечивает корректную работу SPA routing на статическом хостинге (Netlify/Cloudflare Pages style).

### index.html
- Canonical URL удалён из статического HTML
- Добавляется динамически через React Helmet в компонентах

### public/sitemap.xml
- Использует ai-ru.ru как основной домен для SEO
- Это правильно - основной домен для индексации поисковиками

## Проверка работоспособности

Тестируйте на обоих доменах:
- ✅ https://ai-ru.ru/try-bot → должен открыть демо-страницу
- ✅ https://p56134400.poehali.dev/try-bot → должен открыть ту же страницу
- ✅ Веб-чат линк: `/dinasty-crimea/chat` работает на обоих
- ✅ Ссылки на тенантов: `/${slug}/chat` и `/${slug}/admin`

## Добавление новых компонентов

При создании нового компонента с ссылками:

1. **НЕ ИСПОЛЬЗУЙТЕ** жёсткие `https://ai-ru.ru/...`
2. **ИСПОЛЬЗУЙТЕ**:
   - Относительные пути: `/path/to/page`
   - Хелпер: `getAppUrl('/path')`
   - Динамический origin: `window.location.origin`

3. **Исключения** - только для:
   - API endpoints (functions.poehali.dev)
   - CDN (cdn.poehali.dev)  
   - Внешние сервисы (telegram, vk, max.ru и т.д.)
