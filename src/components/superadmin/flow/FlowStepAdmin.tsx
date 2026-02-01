import FlowStepCard from './FlowStepCard';

const FlowStepAdmin = () => {
  return (
    <>
      {/* Этап 5: Работа в админке */}
      <FlowStepCard stepNumber={5} color="indigo" icon="Settings" title="Работа в админке">
        <p className="text-slate-700"><strong>Файл:</strong> <code className="bg-white px-2 py-1 rounded">src/pages/Index.tsx</code></p>
        <p className="text-slate-700"><strong>Роут:</strong> <code>/{'{'}tenant_slug{'}'}/admin</code></p>
        <div className="bg-white p-3 rounded mt-2 border border-indigo-300">
          <p className="font-semibold text-indigo-800">🔐 Авторизация:</p>
          <ul className="list-disc list-inside text-slate-700 space-y-1">
            <li>Компонент: <code>AdminLoginForm.tsx</code></li>
            <li>Backend: <code>/backend/auth-admin/index.py</code></li>
            <li>Метод: username + password → JWT токен</li>
            <li>JWT содержит: tenant_id, username, role</li>
            <li>Хранение: localStorage (auth_token)</li>
          </ul>
        </div>
        <div className="bg-white p-3 rounded mt-2 border border-indigo-300">
          <p className="font-semibold text-indigo-800">⚙️ Доступные вкладки (AdminView.tsx):</p>
          <ul className="list-disc list-inside text-slate-700 space-y-1">
            <li><strong>📄 Документы:</strong> загрузка PDF через DocumentsPanel (RAG knowledge base)</li>
            <li><strong>💬 Мессенджеры:</strong> интеграция Telegram, VK, MAX.ru</li>
            <li><strong>🧠 AI:</strong> настройка модели, параметров, API ключей (только superadmin или при fz152_enabled=true)</li>
            <li><strong>📄 Страница:</strong> редактирование текста, логотипа, цветов (PageSettingsCard)</li>
            <li><strong>🔧 Виджет:</strong> настройка виджета чата для сайта</li>
            <li><strong>🔒 152-ФЗ:</strong> управление согласиями пользователей (только если fz152_enabled=true)</li>
            <li><strong>📊 Статистика:</strong> количество чатов, сообщений</li>
          </ul>
          <p className="text-xs text-slate-600 mt-2">
            <strong>Важно:</strong> Вкладка AI показывается только для: (1) суперадмина ИЛИ (2) tenant с fz152_enabled=true
          </p>
        </div>
        <div className="bg-white p-3 rounded mt-2 border border-indigo-300">
          <p className="font-semibold text-indigo-800">🔑 Доступ суперадмина:</p>
          <ul className="list-disc list-inside text-slate-700 space-y-1">
            <li><strong>Роль:</strong> super_admin (в таблице admin_users)</li>
            <li><strong>Отличия:</strong> видит ВСЕ настройки (включая все AI провайдеры), доступ к вкладке "Эмбеддинги"</li>
            <li><strong>Вкладка AI:</strong> суперадмин видит AiSettingsCard (выбор модели) + TenantApiKeysCard с ВСЕМИ провайдерами (Yandex, OpenRouter, ProxyAPI)</li>
            <li><strong>Просмотр tenant:</strong> может заходить в любой tenant через /super-admin → переключение tenant_id</li>
          </ul>
        </div>
        <div className="bg-white p-3 rounded mt-2 border border-indigo-300">
          <p className="font-semibold text-indigo-800">🔐 Доступ tenant с fz152_enabled=true:</p>
          <ul className="list-disc list-inside text-slate-700 space-y-1">
            <li><strong>Вкладка AI:</strong> видит только TenantApiKeysCard</li>
            <li><strong>Провайдеры:</strong> только YandexGPT (OpenRouter и ProxyAPI скрыты)</li>
            <li><strong>Предупреждение:</strong> показывается amber блок с требованиями 152-ФЗ</li>
            <li><strong>Вкладка 152-ФЗ:</strong> ConsentSettingsCard для управления текстом согласия</li>
          </ul>
        </div>
        <div className="bg-white p-3 rounded mt-2 border border-indigo-300">
          <p className="font-semibold text-indigo-800">🚫 Доступ tenant с fz152_enabled=false:</p>
          <ul className="list-disc list-inside text-slate-700 space-y-1">
            <li><strong>Вкладка AI:</strong> НЕ видит вообще (скрыта)</li>
            <li><strong>Вкладка 152-ФЗ:</strong> НЕ видит (скрыта)</li>
            <li><strong>Использование:</strong> работает на моделях и ключах, настроенных суперадмином</li>
          </ul>
        </div>
      </FlowStepCard>

      {/* Этап 6: Публикация */}
      <FlowStepCard stepNumber={6} color="pink" icon="Globe" title="Публикация и использование">
        <div className="bg-white p-3 rounded border border-pink-300">
          <p className="font-semibold text-pink-800">🌐 Публичная страница:</p>
          <ul className="list-disc list-inside text-slate-700 space-y-1">
            <li><strong>URL:</strong> /{'{'}tenant_slug{'}'} (работает на ai-ru.ru и других доменах)</li>
            <li><strong>Компонент:</strong> GuestView (чат для конечных пользователей)</li>
            <li><strong>Функционал:</strong> отправка вопросов → ответы от AI + база знаний (RAG)</li>
          </ul>
        </div>
        <div className="bg-white p-3 rounded mt-2 border border-pink-300">
          <p className="font-semibold text-pink-800">🔌 Виджет на сайте клиента:</p>
          <ul className="list-disc list-inside text-slate-700 space-y-1">
            <li><strong>Код:</strong> <code>&lt;script src="/widget.js"&gt;</code></li>
            <li><strong>Инициализация:</strong> <code>AIWidget.init({'{'}tenantSlug: "{'{'}slug{'}'}"{'}'})</code></li>
            <li><strong>Внешний вид:</strong> настраивается в вкладке "Виджет"</li>
          </ul>
        </div>
        <div className="bg-white p-3 rounded mt-2 border border-pink-300">
          <p className="font-semibold text-pink-800">📱 Интеграция с мессенджерами:</p>
          <ul className="list-disc list-inside text-slate-700 space-y-1">
            <li><strong>Telegram:</strong> webhook через /backend/telegram-webhook/</li>
            <li><strong>VK:</strong> webhook через /backend/vk-webhook/</li>
            <li><strong>MAX.ru:</strong> webhook через /backend/max-webhook/</li>
            <li>Все мессенджеры используют единый /backend/chat/ для ответов AI</li>
          </ul>
        </div>
      </FlowStepCard>
    </>
  );
};

export default FlowStepAdmin;