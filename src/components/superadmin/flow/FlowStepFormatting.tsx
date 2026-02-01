import FlowStepCard from './FlowStepCard';

const FlowStepFormatting = () => {
  return (
    <FlowStepCard stepNumber="*" color="cyan" icon="Palette" title="Система форматирования сообщений (все каналы)">
      <p className="text-slate-700">
        <strong>Таблица БД:</strong> <code className="bg-white px-2 py-1 rounded">messenger_formatting_settings</code>
      </p>
      <p className="text-slate-700">
        <strong>Функция:</strong> <code className="bg-white px-2 py-1 rounded">/chat</code> применяет форматирование централизованно
      </p>
      
      <div className="bg-white p-3 rounded mt-2 border border-cyan-300">
        <p className="font-semibold text-cyan-800 mb-2">📋 Поля настроек:</p>
        <ul className="list-disc list-inside text-slate-700 space-y-1 text-sm">
          <li><code>tenant_id</code> — ID бота</li>
          <li><code>messenger</code> — канал: telegram / vk / max / widget</li>
          <li><code>use_emoji</code> — добавлять ли эмодзи по ключевым словам</li>
          <li><code>use_markdown</code> — использовать Markdown (только telegram)</li>
          <li><code>use_lists_formatting</code> — форматировать маркированные списки</li>
          <li><code>custom_emoji_map</code> — JSON карта: {`{"завтрак": "🍳", "руб": "💰"}`}</li>
          <li><code>list_bullet_char</code> — символ маркера (по умолчанию •)</li>
          <li><code>numbered_list_char</code> — символ нумерованного списка (▫️)</li>
        </ul>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded mt-2 border-2 border-blue-300">
        <p className="font-semibold text-blue-900 mb-2">🎨 Форматирование по каналам:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="bg-white p-2 rounded border text-xs">
            <p className="font-bold text-blue-900 mb-1">📱 Telegram</p>
            <p className="text-slate-600">Формат: <strong>Markdown</strong></p>
            <p className="text-green-600 text-xs">✅ use_markdown</p>
            <p className="text-slate-500 mt-1">**bold**, *italic*</p>
            <p className="text-slate-500">Ссылки с превью</p>
          </div>
          <div className="bg-white p-2 rounded border text-xs">
            <p className="font-bold text-cyan-900 mb-1">🌐 Widget</p>
            <p className="text-slate-600">Формат: <strong>HTML</strong></p>
            <p className="text-red-600 text-xs">❌ use_markdown</p>
            <p className="text-slate-500 mt-1">&lt;b&gt;, &lt;i&gt;, &lt;a&gt;</p>
            <p className="text-slate-500">Кликабельные ссылки</p>
          </div>
          <div className="bg-white p-2 rounded border text-xs">
            <p className="font-bold text-indigo-900 mb-1">👥 VK</p>
            <p className="text-slate-600">Формат: <strong>Plain text</strong></p>
            <p className="text-red-600 text-xs">❌ use_markdown</p>
            <p className="text-slate-500 mt-1">Чистый текст</p>
            <p className="text-slate-500">VK авторендер URL</p>
          </div>
          <div className="bg-white p-2 rounded border text-xs">
            <p className="font-bold text-purple-900 mb-1">💬 MAX</p>
            <p className="text-slate-600">Формат: <strong>Plain text</strong></p>
            <p className="text-red-600 text-xs">❌ use_markdown</p>
            <p className="text-slate-500 mt-1">Чистый текст</p>
            <p className="text-slate-500">MAX авторендер URL</p>
          </div>
        </div>
      </div>

      <div className="bg-green-50 p-3 rounded mt-2 border border-green-300">
        <p className="font-semibold text-green-800 mb-2">🔄 Как работает (пошагово):</p>
        <ol className="list-decimal list-inside text-slate-700 space-y-1 text-sm">
          <li>Пользователь пишет в Telegram → <code>/telegram-webhook</code></li>
          <li>Webhook вызывает <code>/chat</code> с параметром <code>channel='telegram'</code></li>
          <li><code>/chat</code> получает ответ от AI (сырой текст)</li>
          <li><code>/chat</code> загружает настройки: <code>get_formatting_settings(tenant_id, 'telegram')</code></li>
          <li><code>/chat</code> применяет форматирование: <code>format_with_settings(text, settings, 'telegram')</code></li>
          <li>HTML теги → Markdown (<code>&lt;b&gt;</code> → <code>**bold**</code>)</li>
          <li>Добавление эмодзи по <code>custom_emoji_map</code> (если <code>use_emoji=true</code>)</li>
          <li><code>/chat</code> возвращает готовый Markdown текст</li>
          <li>Webhook отправляет через Telegram Bot API с <code>parse_mode='Markdown'</code></li>
        </ol>
      </div>

      <div className="bg-yellow-50 p-3 rounded mt-2 border border-yellow-300">
        <p className="font-semibold text-yellow-800 mb-2">⚙️ Управление настройками:</p>
        <ul className="list-disc list-inside text-slate-700 space-y-1 text-sm">
          <li><strong>API:</strong> <code>/manage-formatting-settings</code> (только суперадмины)</li>
          <li><strong>GET:</strong> получить настройки всех каналов для tenant_id</li>
          <li><strong>POST/PUT:</strong> обновить настройки конкретного канала</li>
          <li><strong>Автоинициализация:</strong> <code>/init-formatting-settings</code> создаёт дефолты при создании tenant</li>
        </ul>
      </div>

      <div className="bg-red-50 p-3 rounded mt-2 border border-red-300">
        <p className="font-semibold text-red-800 mb-2">⚠️ Важные особенности:</p>
        <ul className="list-disc list-inside text-slate-700 space-y-1 text-sm">
          <li><strong>Telegram:</strong> только Markdown, ссылки с превью (<code>disable_web_page_preview=false</code>)</li>
          <li><strong>Widget:</strong> HTML рендерится через <code>dangerouslySetInnerHTML</code></li>
          <li><strong>VK/MAX:</strong> HTML теги удаляются, ссылки автораспознаются платформой</li>
          <li><strong>Эмодзи:</strong> применяются до конвертации формата (работают везде)</li>
        </ul>
      </div>
    </FlowStepCard>
  );
};

export default FlowStepFormatting;
