import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

const DataFlowDiagram = () => {
  return (
    <Card className="border-2 border-teal-200 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 text-white">
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Icon name="Network" size={24} />
          Поток данных между компонентами
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-8 pb-8 bg-gradient-to-br from-slate-50 to-teal-50">
        <div className="space-y-8">
          
          {/* Frontend → Backend */}
          <div className="bg-white p-6 rounded-lg border-2 border-blue-300 shadow-lg">
            <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
              <Icon name="Monitor" size={20} />
              Frontend → Backend (HTTP)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded border border-blue-200">
                <p className="font-semibold text-blue-800 mb-2">📤 Запросы:</p>
                <ul className="text-sm text-slate-700 space-y-1">
                  <li>• <code className="bg-white px-2 py-1 rounded">/chat</code> → отправка сообщения</li>
                  <li>• <code className="bg-white px-2 py-1 rounded">/auth-admin</code> → авторизация</li>
                  <li>• <code className="bg-white px-2 py-1 rounded">/get-documents</code> → список PDF</li>
                  <li>• <code className="bg-white px-2 py-1 rounded">/upload-pdf</code> → загрузка файла</li>
                </ul>
              </div>
              <div className="bg-green-50 p-4 rounded border border-green-200">
                <p className="font-semibold text-green-800 mb-2">📥 Ответы:</p>
                <ul className="text-sm text-slate-700 space-y-1">
                  <li>• JSON с данными</li>
                  <li>• JWT токен (Authorization)</li>
                  <li>• Статус операции (success/error)</li>
                  <li>• AI-ответ клиенту</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded">
              <p className="text-sm text-slate-700">
                <strong>⚠️ Важно:</strong> Заголовок <code className="bg-white px-2 py-1">X-Authorization</code> 
                (прокси фильтрует Authorization), передаётся tenant_id в body
              </p>
            </div>
          </div>

          {/* Backend → Database */}
          <div className="bg-white p-6 rounded-lg border-2 border-purple-300 shadow-lg">
            <h3 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
              <Icon name="Database" size={20} />
              Backend → PostgreSQL (SQL)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-purple-50 p-4 rounded border border-purple-200">
                <p className="font-semibold text-purple-800 mb-2">🔍 Чтение:</p>
                <ul className="text-sm text-slate-700 space-y-1">
                  <li>• SELECT из <code>tenants</code> (по tenant_id)</li>
                  <li>• SELECT из <code>tenant_documents, tenant_chunks</code> (документы, embeddings)</li>
                  <li>• SELECT из <code>tenant_settings</code> (ai_settings, widget_settings...)</li>
                  <li>• SELECT из <code>chat_messages</code> (история диалогов)</li>
                </ul>
              </div>
              <div className="bg-pink-50 p-4 rounded border border-pink-200">
                <p className="font-semibold text-pink-800 mb-2">✏️ Запись:</p>
                <ul className="text-sm text-slate-700 space-y-1">
                  <li>• INSERT в <code>chat_messages</code> (user + assistant)</li>
                  <li>• UPDATE <code>tenant_settings</code> (настройки AI, виджета, страницы)</li>
                  <li>• UPDATE <code>tenants</code> (subscription_end_date)</li>
                  <li>• INSERT в <code>tenant_documents</code> (новый PDF)</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-300 rounded">
              <p className="text-sm text-slate-700">
                <strong>🔧 Протокол:</strong> Simple Query (psycopg2), НЕ Extended Query. 
                DSN из <code>DATABASE_URL</code> env переменной
              </p>
            </div>
          </div>

          {/* Backend → External APIs */}
          <div className="bg-white p-6 rounded-lg border-2 border-orange-300 shadow-lg">
            <h3 className="text-xl font-bold text-orange-900 mb-4 flex items-center gap-2">
              <Icon name="Cloud" size={20} />
              Backend → Внешние API
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-orange-50 p-4 rounded border border-orange-200">
                <p className="font-semibold text-orange-800 mb-2">🤖 AI Провайдеры</p>
                <ul className="text-sm text-slate-700 space-y-1">
                  <li>• <strong>YandexGPT:</strong> yandexgpt, yandexgpt-lite (прямой API)</li>
                  <li>• <strong>DeepSeek:</strong> deepseek-chat, deepseek-reasoner (прямой API)</li>
                  <li>• <strong>OpenRouter:</strong> 15+ бесплатных моделей (llama-3.3-70b, gemini-2.0-flash, deepseek-v3/r1)</li>
                  <li>• <strong>ProxyAPI:</strong> OpenAI (gpt-4o, o1), Anthropic (claude-3.5-sonnet)</li>
                  <li>• Ключи из <code>tenant_api_keys</code> (provider + api_key)</li>
                  <li>• Fallback: OpenRouter free модели при ошибках</li>
                </ul>
              </div>
              
              <div className="bg-teal-50 p-4 rounded border border-teal-200">
                <p className="font-semibold text-teal-800 mb-2">🔗 Embeddings (RAG)</p>
                <ul className="text-sm text-slate-700 space-y-1">
                  <li>• <strong>Yandex:</strong> text-search-query (PROJECT ключи)</li>
                  <li>• <strong>OpenAI:</strong> text-embedding-3-small (tenant ключи)</li>
                  <li>• Векторизация документов (tenant_chunks)</li>
                  <li>• Cosine similarity поиск (pgvector)</li>
                  <li>• Quality Gate (фильтр по релевантности)</li>
                </ul>
              </div>
              
              <div className="bg-green-50 p-4 rounded border border-green-200">
                <p className="font-semibold text-green-800 mb-2">💳 ЮKassa</p>
                <ul className="text-sm text-slate-700 space-y-1">
                  <li>• Создание платежей (тарифы)</li>
                  <li>• Webhook: payment.succeeded</li>
                  <li>• Metadata → tenant_id, tariff_id</li>
                  <li>• Автопродление подписок</li>
                </ul>
              </div>
              
              <div className="bg-purple-50 p-4 rounded border border-purple-200">
                <p className="font-semibold text-purple-800 mb-2">📬 Мессенджеры API</p>
                <ul className="text-sm text-slate-700 space-y-1">
                  <li>• <strong>Telegram Bot API:</strong> sendMessage (Markdown)</li>
                  <li>• <strong>VK API:</strong> messages.send (текст)</li>
                  <li>• <strong>MAX Platform API:</strong> POST /messages (текст)</li>
                  <li>• Webhook → /chat → ответ в канал</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Webhooks → Backend */}
          <div className="bg-white p-6 rounded-lg border-2 border-indigo-300 shadow-lg">
            <h3 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
              <Icon name="Webhook" size={20} />
              Внешние сервисы → Backend (Webhooks)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-indigo-50 p-4 rounded border border-indigo-200">
                <p className="font-semibold text-indigo-800 mb-2">📱 Telegram</p>
                <ul className="text-sm text-slate-700 space-y-1">
                  <li>• <code>/telegram-webhook</code></li>
                  <li>• <code>update.message.text</code> → парсинг сообщения</li>
                  <li>• Определение <code>tenant_id</code> по <code>bot_token</code></li>
                  <li>• Вызов <code>/chat</code> с <code>channel='telegram'</code></li>
                  <li>• Ответ через Telegram Bot API (<code>parse_mode='Markdown'</code>)</li>
                </ul>
              </div>
              <div className="bg-blue-50 p-4 rounded border border-blue-200">
                <p className="font-semibold text-blue-800 mb-2">👥 VK</p>
                <ul className="text-sm text-slate-700 space-y-1">
                  <li>• <code>/vk-webhook</code></li>
                  <li>• <code>callback.message.text</code></li>
                  <li>• Confirmation code для VK API</li>
                  <li>• Вызов <code>/chat</code> с <code>channel='vk'</code></li>
                  <li>• Ответ через VK API (чистый текст)</li>
                </ul>
              </div>
              <div className="bg-purple-50 p-4 rounded border border-purple-200">
                <p className="font-semibold text-purple-800 mb-2">💬 MAX</p>
                <ul className="text-sm text-slate-700 space-y-1">
                  <li>• <code>/max-webhook</code></li>
                  <li>• <code>event.message.body.text</code></li>
                  <li>• Определение <code>tenant_id</code> по <code>bot_token</code></li>
                  <li>• Вызов <code>/chat</code> с <code>channel='max'</code></li>
                  <li>• Ответ через MAX Platform API (чистый текст)</li>
                </ul>
              </div>
              <div className="bg-cyan-50 p-4 rounded border border-cyan-200">
                <p className="font-semibold text-cyan-800 mb-2">🌐 Widget (сайт)</p>
                <ul className="text-sm text-slate-700 space-y-1">
                  <li>• Frontend → прямой вызов <code>/chat</code></li>
                  <li>• <code>channel='widget'</code></li>
                  <li>• Ответ в HTML формате (<code>&lt;b&gt;</code>, <code>&lt;a&gt;</code>)</li>
                  <li>• Рендеринг через <code>dangerouslySetInnerHTML</code></li>
                </ul>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-lg">
              <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                <Icon name="Palette" size={18} />
                Централизованное форматирование сообщений
              </h4>
              <div className="text-sm text-slate-700 space-y-2">
                <p className="mb-2">
                  <strong>Архитектура:</strong> Единая функция <code>/chat</code> применяет форматирование 
                  под каждый канал на основе настроек из <code>messenger_formatting_settings</code>
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                  <div className="bg-white p-2 rounded border text-xs">
                    <p className="font-bold text-blue-900">Telegram</p>
                    <p className="text-slate-600">Markdown</p>
                    <p className="text-green-600">✅ use_markdown</p>
                  </div>
                  <div className="bg-white p-2 rounded border text-xs">
                    <p className="font-bold text-cyan-900">Widget</p>
                    <p className="text-slate-600">HTML</p>
                    <p className="text-red-600">❌ use_markdown</p>
                  </div>
                  <div className="bg-white p-2 rounded border text-xs">
                    <p className="font-bold text-indigo-900">VK</p>
                    <p className="text-slate-600">Plain text</p>
                    <p className="text-red-600">❌ use_markdown</p>
                  </div>
                  <div className="bg-white p-2 rounded border text-xs">
                    <p className="font-bold text-purple-900">MAX</p>
                    <p className="text-slate-600">Plain text</p>
                    <p className="text-red-600">❌ use_markdown</p>
                  </div>
                </div>
                
                <div className="mt-3 bg-yellow-50 border border-yellow-300 p-3 rounded text-xs">
                  <p className="font-semibold text-yellow-900 mb-1">⚙️ Общие настройки (применяются ко всем каналам):</p>
                  <ul className="text-yellow-800 space-y-1 ml-3">
                    <li>• <code>use_emoji</code> — добавление эмодзи по ключевым словам</li>
                    <li>• <code>custom_emoji_map</code> — JSON: {`{"завтрак": "🍳", "руб": "💰"}`}</li>
                    <li>• <code>use_lists_formatting</code> — форматирование списков</li>
                    <li>• <code>list_bullet_char</code> — символ маркера (•)</li>
                  </ul>
                </div>
                
                <div className="mt-3 bg-green-50 border border-green-300 p-3 rounded text-xs">
                  <p className="font-semibold text-green-900 mb-1">🔄 Поток форматирования:</p>
                  <ol className="text-green-800 space-y-1 ml-3">
                    <li>1. Webhook получает сообщение → передаёт <code>channel='telegram'</code></li>
                    <li>2. <code>/chat</code> → получает сырой ответ от AI провайдера</li>
                    <li>3. <code>/chat</code> → загружает настройки из <code>messenger_formatting_settings</code></li>
                    <li>4. <code>/chat</code> → применяет форматирование (<code>format_with_settings()</code>)</li>
                    <li>5. Webhook получает готовый ответ → отправляет в канал</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* Cron Jobs */}
          <div className="bg-white p-6 rounded-lg border-2 border-yellow-300 shadow-lg">
            <h3 className="text-xl font-bold text-yellow-900 mb-4 flex items-center gap-2">
              <Icon name="Clock" size={20} />
              Cron Jobs (автоматические задачи)
            </h3>
            <div className="space-y-3">
              <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                <p className="font-semibold text-yellow-800 mb-2">⏰ check-subscriptions</p>
                <ul className="text-sm text-slate-700 space-y-1">
                  <li>• <strong>Частота:</strong> каждые 24 часа (Yandex Cloud Triggers)</li>
                  <li>• <strong>Триггер:</strong> internal-cron-trigger → check-subscriptions</li>
                  <li>• <strong>Логика:</strong> SQL запрос WHERE subscription_end_date BETWEEN NOW() AND NOW()+3 days</li>
                  <li>• <strong>Действие:</strong> отправка email через send-email (Yandex Postbox)</li>
                  <li>• <strong>Данные:</strong> tenant_name, tariff_name, renewal_price, renewal_url</li>
                </ul>
              </div>
              <div className="mt-4 p-3 bg-green-50 border border-green-300 rounded">
                <p className="text-sm text-slate-700">
                  <strong>✅ Важно:</strong> Cron НЕ блокирует tenant при истечении. 
                  Только отправляет напоминание. Клиент может продолжать использовать бота.
                </p>
              </div>
            </div>
          </div>

          {/* Storage (S3) */}
          <div className="bg-white p-6 rounded-lg border-2 border-rose-300 shadow-lg">
            <h3 className="text-xl font-bold text-rose-900 mb-4 flex items-center gap-2">
              <Icon name="HardDrive" size={20} />
              Backend → S3 Storage (файлы)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-rose-50 p-4 rounded border border-rose-200">
                <p className="font-semibold text-rose-800 mb-2">📤 Загрузка:</p>
                <ul className="text-sm text-slate-700 space-y-1">
                  <li>• <strong>Endpoint:</strong> bucket.poehali.dev</li>
                  <li>• <strong>Bucket:</strong> 'files' (всегда)</li>
                  <li>• <strong>Key:</strong> documents/tenant_{'{'}id{'}'}/file.pdf</li>
                  <li>• <strong>SDK:</strong> boto3 (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)</li>
                </ul>
              </div>
              <div className="bg-blue-50 p-4 rounded border border-blue-200">
                <p className="font-semibold text-blue-800 mb-2">🔗 CDN доступ:</p>
                <ul className="text-sm text-slate-700 space-y-1">
                  <li>• <strong>URL:</strong> cdn.poehali.dev/projects/{'{'}AWS_ACCESS_KEY_ID{'}'}/bucket/...</li>
                  <li>• <strong>Публичный доступ:</strong> через CDN</li>
                  <li>• <strong>НЕ используется:</strong> PROJECT_ID (только AWS_ACCESS_KEY_ID)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Email System */}
          <div className="bg-white p-6 rounded-lg border-2 border-violet-300 shadow-lg">
            <h3 className="text-xl font-bold text-violet-900 mb-4 flex items-center gap-2">
              <Icon name="Mail" size={20} />
              Backend → Email (Yandex Cloud Postbox)
            </h3>
            <div className="space-y-3">
              <div className="bg-violet-50 p-4 rounded border border-violet-200">
                <p className="font-semibold text-violet-800 mb-2">📧 Типы писем:</p>
                <ul className="text-sm text-slate-700 space-y-2">
                  <li>
                    <strong>1. order_confirmation</strong> (после оплаты):
                    <ul className="ml-4 mt-1 list-disc">
                      <li>Отправка: yookassa-webhook → send-order-email</li>
                      <li>Данные: customer_name, customer_email, tariff_name, amount, login_url, username, password</li>
                      <li>Шаблон: HTML с брендингом, инструкцией, контактами</li>
                    </ul>
                  </li>
                  <li>
                    <strong>2. subscription_reminder</strong> (за 3 дня):
                    <ul className="ml-4 mt-1 list-disc">
                      <li>Отправка: check-subscriptions (cron) → send-email</li>
                      <li>Данные: tenant_name, tariff_name, renewal_price, renewal_url, subscription_end_date</li>
                      <li>Содержание: напоминание + ссылка на продление (ai-ru.ru/content-editor?tenant_id=X)</li>
                    </ul>
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
};

export default DataFlowDiagram;