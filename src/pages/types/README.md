# Index Page Types

Этот файл содержит TypeScript интерфейсы для главной страницы Index и её компонентов.

## Структура типов

### IndexState
Интерфейс для хука `useIndexState` — содержит всё состояние страницы Index:
- **tenantSlug** - слаг тенанта из URL
- **view** - текущий режим просмотра ('guest' | 'admin')
- **messages** - массив сообщений чата
- **documents** - массив загруженных документов
- **pageSettings** - настройки страницы (заголовок, иконка, цвета)
- **consentSettings** - настройки согласия на обработку данных

### IndexActions
Интерфейс для хука `useIndexActions` — содержит все обработчики действий:
- **loadTenantInfo** - загрузка информации о тенанте
- **handleSendMessage** - отправка сообщения в чат
- **handleFileUpload** - загрузка PDF-файлов
- **handleDeleteDocument** - удаление документа

### UseIndexActionsParams
Параметры для инициализации хука `useIndexActions` — передаётся из `useIndexState`.

### UseIndexEffectsParams
Параметры для хука `useIndexEffects` — координирует загрузку данных при изменении состояния.

### PublicContentResponse
Структура ответа от backend функции `manage-consent-settings` (action=public_content):
```typescript
{
  name: string;
  fz152_enabled: boolean;
  consent_settings: {
    webchat_enabled: boolean;
    messenger_enabled: boolean;
    text: string;
    messenger_text: string;
    privacy_policy_text: string; // HTML текст пользовательской политики
  }
}
```

## Использование

```typescript
// В хуках
import { IndexState, IndexActions } from '../types/index.types';

export const useIndexState = (): IndexState => { ... }
export const useIndexActions = (params: UseIndexActionsParams): IndexActions => { ... }

// В компонентах
import { PublicContentResponse } from './types/index.types';

const data: PublicContentResponse = await response.json();
```

## Backend интеграция

Типы синхронизированы с backend функциями:
- **manage-consent-settings** (GET /public_content) → `PublicContentResponse`
- **get-page-settings** → `PageSettings` (из @/components/hotel/types)
- **get-documents** → `Document[]` (из @/components/hotel/types)
