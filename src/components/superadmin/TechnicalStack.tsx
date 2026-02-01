import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

const TechnicalStack = () => {
  return (
    <Card className="border-4 border-gradient-to-r from-purple-500 to-blue-500">
      <CardHeader className="bg-gradient-to-r from-purple-100 to-blue-100">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Icon name="CheckCircle" size={24} className="text-green-600" />
          Ключевые таблицы БД
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-slate-50 p-4 rounded border">
            <p className="font-bold text-slate-900 mb-2">👥 tenants</p>
            <p className="text-xs text-slate-600">id, name, slug, tariff_id, subscription_end_date, owner_email, owner_phone, created_at</p>
          </div>
          <div className="bg-slate-50 p-4 rounded border">
            <p className="font-bold text-slate-900 mb-2">🔐 admin_users</p>
            <p className="text-xs text-slate-600">id, tenant_id, username, password_hash, role, email, tariff_id</p>
          </div>
          <div className="bg-slate-50 p-4 rounded border">
            <p className="font-bold text-slate-900 mb-2">💳 tariff_plans</p>
            <p className="text-xs text-slate-600">id, name, price, renewal_price, setup_fee, first_month_included, is_active</p>
          </div>
          <div className="bg-slate-50 p-4 rounded border">
            <p className="font-bold text-slate-900 mb-2">📄 tenant_documents</p>
            <p className="text-xs text-slate-600">id, tenant_id, filename, original_filename, file_path, created_at</p>
          </div>
          <div className="bg-slate-50 p-4 rounded border">
            <p className="font-bold text-slate-900 mb-2">📊 tenant_chunks</p>
            <p className="text-xs text-slate-600">id, tenant_id, document_id, chunk_text, embedding, metadata</p>
          </div>
          <div className="bg-slate-50 p-4 rounded border">
            <p className="font-bold text-slate-900 mb-2">🔑 tenant_api_keys</p>
            <p className="text-xs text-slate-600">id, tenant_id, provider (telegram/vk/max), api_key, settings (JSONB)</p>
          </div>
          <div className="bg-slate-50 p-4 rounded border">
            <p className="font-bold text-slate-900 mb-2">⚙️ tenant_settings</p>
            <p className="text-xs text-slate-600 mb-2">tenant_id, ai_settings (JSONB), widget_settings (JSONB), page_settings (JSONB)</p>
            <details className="text-xs text-slate-600">
              <summary className="cursor-pointer font-semibold text-blue-800 hover:text-blue-600">ai_settings структура →</summary>
              <div className="mt-2 bg-white p-2 rounded border border-blue-200">
                <code className="text-xs">
                  {`{
  "chat_provider": "yandex | deepseek | openrouter | proxyapi",
  "chat_model": "yandexgpt | deepseek-chat | llama-3.3-70b | gpt-4o",
  "embedding_provider": "yandex | openai",
  "embedding_model": "text-search-query | text-embedding-3-small",
  "temperature": "0.0-2.0",
  "max_tokens": 2000,
  "top_p": "0.0-1.0",
  "frequency_penalty": "0.0-2.0",
  "presence_penalty": "0.0-2.0",
  "system_prompt": "...",
  "creative_mode": "off | on",
  "system_priority": "strict | balanced | creative"
}`}
                </code>
              </div>
            </details>
          </div>
          <div className="bg-slate-50 p-4 rounded border">
            <p className="font-bold text-slate-900 mb-2">💬 chat_messages</p>
            <p className="text-xs text-slate-600">id, tenant_id, session_id, role (user/assistant), content, timestamp</p>
          </div>
          <div className="bg-slate-50 p-4 rounded border">
            <p className="font-bold text-slate-900 mb-2">📧 email_templates</p>
            <p className="text-xs text-slate-600">id, template_type, subject, html_body, variables</p>
          </div>
          <div className="bg-slate-50 p-4 rounded border">
            <p className="font-bold text-slate-900 mb-2">💳 subscription_payments</p>
            <p className="text-xs text-slate-600">id, tenant_id, payment_id, amount, status, tariff_id, payment_type</p>
          </div>
          <div className="bg-slate-50 p-4 rounded border">
            <p className="font-bold text-slate-900 mb-2">🎯 quality_gate_logs</p>
            <p className="text-xs text-slate-600">id, tenant_id, session_id, decision, reason, timestamp</p>
          </div>
          <div className="bg-slate-50 p-4 rounded border">
            <p className="font-bold text-slate-900 mb-2">🎨 messenger_formatting_settings</p>
            <p className="text-xs text-slate-600">id, tenant_id, messenger (telegram/vk/max/widget), use_emoji, use_markdown, use_lists_formatting, custom_emoji_map (JSONB)</p>
          </div>
        </div>
        
        <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
            <Icon name="MessageSquare" size={20} />
            Форматирование сообщений по каналам
          </h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p><strong>Архитектура:</strong> Централизованное форматирование в <code>/chat</code> + настройки в БД для каждого канала</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <div className="bg-white p-3 rounded border border-blue-200">
                <p className="font-semibold text-blue-900 mb-1">📱 Telegram</p>
                <p className="text-xs">• Markdown: <code>**bold**</code>, <code>*italic*</code></p>
                <p className="text-xs">• Ссылки: кликабельные с превью</p>
                <p className="text-xs">• use_markdown: <strong>true</strong></p>
              </div>
              
              <div className="bg-white p-3 rounded border border-blue-200">
                <p className="font-semibold text-blue-900 mb-1">🌐 Widget (сайт)</p>
                <p className="text-xs">• HTML: <code>&lt;b&gt;</code>, <code>&lt;i&gt;</code>, <code>&lt;a&gt;</code></p>
                <p className="text-xs">• Ссылки: автораспознавание + HTML</p>
                <p className="text-xs">• use_markdown: <strong>false</strong></p>
              </div>
              
              <div className="bg-white p-3 rounded border border-blue-200">
                <p className="font-semibold text-blue-900 mb-1">💬 VK</p>
                <p className="text-xs">• Чистый текст (без HTML)</p>
                <p className="text-xs">• Ссылки: автораспознавание VK</p>
                <p className="text-xs">• use_markdown: <strong>false</strong></p>
              </div>
              
              <div className="bg-white p-3 rounded border border-blue-200">
                <p className="font-semibold text-blue-900 mb-1">📩 MAX</p>
                <p className="text-xs">• Чистый текст (без HTML)</p>
                <p className="text-xs">• Ссылки: автораспознавание MAX</p>
                <p className="text-xs">• use_markdown: <strong>false</strong></p>
              </div>
            </div>
            
            <div className="mt-3 bg-yellow-50 border border-yellow-300 p-3 rounded">
              <p className="font-semibold text-yellow-900 mb-1">⚙️ Общие настройки (для всех каналов):</p>
              <ul className="text-xs text-yellow-800 space-y-1 ml-4">
                <li>• <strong>use_emoji</strong> — добавлять эмодзи по ключевым словам</li>
                <li>• <strong>custom_emoji_map</strong> — кастомные эмодзи (JSON: {`{"завтрак": "🍳", "руб": "💰"}`})</li>
                <li>• <strong>use_lists_formatting</strong> — форматировать маркированные списки</li>
                <li>• <strong>list_bullet_char</strong> — символ маркера (по умолчанию •)</li>
              </ul>
            </div>
            
            <div className="mt-3 bg-green-50 border border-green-300 p-3 rounded">
              <p className="font-semibold text-green-900 mb-1">🔄 Как работает:</p>
              <ol className="text-xs text-green-800 space-y-1 ml-4">
                <li>1. Webhook получает сообщение → передаёт <code>channel='telegram'</code> в <code>/chat</code></li>
                <li>2. <code>/chat</code> загружает настройки из <code>messenger_formatting_settings</code></li>
                <li>3. Применяет форматирование: Telegram→Markdown, Widget→HTML, VK/MAX→текст</li>
                <li>4. Возвращает готовый ответ в формате конкретного канала</li>
              </ol>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TechnicalStack;