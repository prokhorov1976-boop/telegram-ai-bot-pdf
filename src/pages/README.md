# Pages Architecture

Документация по архитектуре страниц приложения после рефакторинга.

## Структура Index.tsx (главная страница)

### До рефакторинга
- 1 файл Index.tsx (~500 строк)
- Всё состояние, логика и UI в одном месте
- Сложно поддерживать и тестировать

### После рефакторинга
Страница разделена на 4 независимых модуля:

```
src/pages/
├── Index.tsx                      # Главный файл-оркестратор (88 строк)
├── components/
│   └── IndexHeader.tsx            # Компонент заголовка с кнопками
├── hooks/
│   ├── useIndexState.ts           # Управление состоянием + базовые эффекты
│   ├── useIndexActions.ts         # Все обработчики действий
│   └── useIndexEffects.ts         # Координация загрузки данных
└── types/
    ├── index.types.ts             # TypeScript интерфейсы
    └── README.md                  # Документация типов
```

## Модули

### 1. useIndexState (State Management)
**Ответственность:** Управление всем состоянием страницы
- View state (guest/admin)
- Messages и chat state
- Documents state
- Page settings (header, colors, quick questions)
- Consent settings (ФЗ-152, текст согласия)
- Tenant info (ID, name, slug)

**Эффекты:**
- Автосообщения от виджета (window.postMessage)
- Проверка авторизации и редирект для super admin

### 2. useIndexActions (Action Handlers)
**Ответственность:** Все обработчики пользовательских действий
- `loadTenantInfo` - загрузка информации о тенанте по slug
- `loadPageSettings` - загрузка настроек страницы
- `loadConsentSettings` - загрузка настроек согласия ФЗ-152
- `loadDocuments` - загрузка списка документов
- `handleSendMessage` - отправка сообщения в чат
- `handleFileUpload` - загрузка PDF-файлов
- `handleQuickQuestion` - выбор быстрого вопроса
- `handleDeleteDocument` - удаление документа
- `handleAdminLoginSuccess` - успешная авторизация
- `handleLogout` - выход из админки

**Backend интеграция:**
- `/chat` - отправка сообщений
- `/upload-pdf`, `/process-pdf` - загрузка документов
- `/delete-pdf` - удаление документов
- `/get-page-settings` - настройки страницы
- `manage-consent-settings?action=public_content` - настройки согласия

### 3. useIndexEffects (Effects Coordination)
**Ответственность:** Координация загрузки данных при изменении состояния
- Загрузка tenant при изменении slug
- Загрузка настроек при смене tenant
- Загрузка документов при входе в админку

### 4. IndexHeader (UI Component)
**Ответственность:** Рендер заголовка страницы
- Иконка и название из pageSettings
- Кнопка переключения guest/admin
- Кнопка "Мастер-панель" для super admin
- Кнопка выхода для admin

## Типы данных

### IndexState
```typescript
interface IndexState {
  view: 'guest' | 'admin';
  messages: Message[];
  documents: Document[];
  pageSettings?: PageSettings;
  quickQuestions: QuickQuestion[];
  consentEnabled: boolean;
  consentText: string;
  // ... + все setters
}
```

### IndexActions
```typescript
interface IndexActions {
  loadTenantInfo: (slug?: string) => Promise<void>;
  handleSendMessage: () => Promise<void>;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  // ... остальные handlers
}
```

### PublicContentResponse (Backend)
```typescript
interface PublicContentResponse {
  name: string;
  fz152_enabled: boolean;
  consent_settings: {
    webchat_enabled: boolean;
    messenger_enabled: boolean;
    text: string;
    messenger_text: string;
    privacy_policy_text: string; // HTML текст пользовательской политики
  };
}
```

## Политика конфиденциальности (PrivacyPolicy.tsx)

### Загрузка пользовательского текста
1. Страница проверяет `tenantId` из URL params или auth
2. Запрос к `manage-consent-settings?action=public_content&tenant_id=X`
3. Если `data.consent_settings.privacy_policy_text` не пустой → показываем HTML
4. Иначе → показываем дефолтную политику из компонента

### Backend flow
```
Frontend: /privacy-policy/:tenantSlug
   ↓
   loadTenantInfo() → get tenant_id from slug
   ↓
   loadPrivacyPolicy() → GET manage-consent-settings
   ↓
   Backend: SELECT privacy_policy_text FROM tenant_settings
   ↓
   Render: customText (HTML) или дефолтная политика
```

## Преимущества новой архитектуры

### ✅ Разделение ответственности
- State отделён от Actions
- UI компоненты изолированы
- Эффекты координируются отдельно

### ✅ Типобезопасность
- Все интерфейсы типизированы
- Backend responses имеют типы
- IDE автодополнение и проверка типов

### ✅ Переиспользование
- Хуки можно использовать в других страницах
- Компоненты независимы
- Легко писать тесты

### ✅ Поддерживаемость
- Каждый файл < 150 строк
- Понятная структура
- Легко найти нужную логику

## Как добавить новый функционал

### 1. Новое состояние
Добавить в `useIndexState.ts`:
```typescript
const [newState, setNewState] = useState(initialValue);
return { ...existing, newState, setNewState };
```

### 2. Новый обработчик
Добавить в `useIndexActions.ts`:
```typescript
const handleNewAction = async () => {
  // ваша логика
};
return { ...existing, handleNewAction };
```

### 3. Новый эффект
Добавить в `useIndexEffects.ts`:
```typescript
useEffect(() => {
  // ваша логика
}, [dependencies]);
```

### 4. Обновить типы
Добавить интерфейсы в `types/index.types.ts`:
```typescript
export interface NewFeatureResponse {
  // поля из backend
}
```

## Связь с Backend

### Функции Cloud Functions
- `chat` - чат с AI (POST)
- `upload-pdf`, `process-pdf`, `delete-pdf` - работа с документами
- `get-page-settings` - настройки UI страницы
- `manage-consent-settings` - настройки согласия + политика конфиденциальности
- `get-tenant-by-slug` - получение tenant_id по slug

### База данных
- `tenants` - информация о тенантах (name, slug, fz152_enabled)
- `tenant_settings` - настройки (privacy_policy_text, consent_text, page_settings)
- `documents` - загруженные PDF-файлы
- `chat_messages` - история чата

## Migration Guide

Если нужно вернуться к старой структуре или портировать изменения:

1. Все state переменные в `useIndexState` соответствуют старым `useState`
2. Все handlers в `useIndexActions` — это старые `handle*` функции
3. Все useEffect в `useIndexEffects` — старые эффекты
4. IndexHeader — это JSX из старого return

**Логика не изменилась** — только структура файлов!
