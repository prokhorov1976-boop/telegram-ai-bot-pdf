import FlowStepCard from './FlowStepCard';

const FlowStepInitial = () => {
  return (
    <>
      {/* Этап 1: Заход клиента */}
      <FlowStepCard stepNumber={1} color="blue" icon="Globe" title="Клиент заходит на landing">
        <p className="text-slate-700"><strong>URL:</strong> <code className="bg-white px-2 py-1 rounded">/</code> (главная страница на текущем домене)</p>
        <p className="text-slate-700"><strong>Компоненты:</strong> PricingSection, FeaturesSection, HowItWorksSection, FAQSection</p>
        <p className="text-slate-700"><strong>Видит:</strong> 3 тарифа с возможностью подключения за 1 час</p>
        <div className="bg-white p-3 rounded mt-2 border border-blue-300">
          <p className="font-semibold text-blue-800">🎯 Цель этапа:</p>
          <p className="text-slate-700">Заинтересовать клиента, показать ценность → переход к оплате</p>
        </div>
      </FlowStepCard>

      {/* Этап 2: Выбор тарифа */}
      <FlowStepCard stepNumber={2} color="green" icon="CreditCard" title="Выбор тарифа и оплата">
        <p className="text-slate-700"><strong>Действие:</strong> Клик на кнопку "Начать" в карточке тарифа</p>
        <p className="text-slate-700"><strong>Backend:</strong> <code className="bg-white px-2 py-1 rounded">/backend/yookassa-create-payment/</code></p>
        <p className="text-slate-700"><strong>Интеграция:</strong> ЮKassa API (создание платежа)</p>
        <div className="bg-white p-3 rounded mt-2 border border-green-300">
          <p className="font-semibold text-green-800">💳 Тарифы (из БД):</p>
          <ul className="list-disc list-inside text-slate-700 space-y-1">
            <li><strong>basic (Старт):</strong> 9 975 ₽ первый месяц (включен) → 1 975 ₽/мес</li>
            <li><strong>professional (Бизнес):</strong> 19 975 ₽ первый месяц (включен) → 4 975 ₽/мес</li>
            <li><strong>enterprise (Премиум):</strong> 49 975 ₽ первый месяц (включен) → 14 975 ₽/мес</li>
          </ul>
          <p className="text-xs text-slate-600 mt-2">Все тарифы: first_month_included = true (первый месяц входит в setup_fee)</p>
        </div>
        <div className="bg-white p-3 rounded mt-2 border border-green-300">
          <p className="font-semibold text-green-800">💳 Процесс оплаты:</p>
          <ul className="list-disc list-inside text-slate-700 space-y-1">
            <li>Frontend отправляет metadata: email, phone, tariff_id, tenant_name, <strong className="text-amber-600">requires_fz152</strong></li>
            <li>Backend создаёт платёж в ЮKassa → получение payment_url</li>
            <li>Редирект клиента на страницу оплаты ЮKassa</li>
            <li>После оплаты: webhook на <code className="bg-slate-100 px-1">/backend/yookassa-webhook/</code></li>
          </ul>
        </div>
        <div className="bg-amber-50 p-3 rounded mt-2 border border-amber-300">
          <p className="font-semibold text-amber-800">🔒 152-ФЗ (только Бизнес и Премиум):</p>
          <ul className="list-disc list-inside text-slate-700 space-y-1">
            <li>При оплате доступен чекбокс "Я буду обрабатывать персональные данные клиентов"</li>
            <li>Если отмечен → <code className="bg-white px-1">requires_fz152=true</code> в metadata</li>
            <li>Автоматически активируется вкладка "152-ФЗ" в админке</li>
            <li>Клиент обязан использовать собственный API ключ YandexGPT</li>
          </ul>
        </div>
      </FlowStepCard>

      {/* Этап 3: Обработка payment webhook */}
      <FlowStepCard stepNumber={3} color="yellow" icon="Webhook" title="Webhook от ЮKassa: создание tenant">
        <p className="text-slate-700"><strong>Backend:</strong> <code className="bg-white px-2 py-1 rounded">/backend/yookassa-webhook/index.py</code></p>
        <p className="text-slate-700"><strong>Событие:</strong> <code>payment.succeeded</code></p>
        <div className="bg-white p-3 rounded mt-2 border border-yellow-300">
          <p className="font-semibold text-yellow-800">⚙️ Логика обработки:</p>
          <ul className="list-disc list-inside text-slate-700 space-y-1">
            <li>Проверка статуса платежа (succeeded)</li>
            <li>Извлечение metadata: email, phone, tenant_name, tariff_id, <strong className="text-amber-600">requires_fz152</strong></li>
            <li><strong>Создание tenant в БД:</strong> INSERT INTO tenants (slug, name, owner_email, <strong className="text-amber-600">fz152_enabled</strong>...)</li>
            <li><strong>Логирование согласия:</strong> INSERT INTO sales_consent_logs (<strong className="text-amber-600">requires_fz152</strong>, session_id, email, consent_text, ip_address)</li>
            <li><strong className="text-green-600">🎨 Копирование шаблона:</strong> SELECT settings FROM tenant_id=1 → INSERT для нового tenant_id</li>
            <li>Генерация уникального slug из metadata (tenant_slug или tenant-{'{'}payment_id{'}'})</li>
            <li>Создание admin-пользователя (username={'{'}slug{'}'}_admin, role='tenant_admin', случайный пароль)</li>
            <li>Установка tariff_id и subscription_end_date (тариф + 30 дней)</li>
            <li>Отправка email с доступами через send-order-email</li>
          </ul>
        </div>
        <div className="bg-blue-100 p-3 rounded mt-2 border border-blue-400">
          <p className="font-semibold text-blue-900">📊 Таблицы БД:</p>
          <ul className="list-disc list-inside text-slate-700 space-y-1">
            <li><code>tenants</code>: id, name, slug, tariff_id, subscription_end_date, owner_email, owner_phone, <strong className="text-amber-600">fz152_enabled</strong></li>
            <li><code>admin_users</code>: id, tenant_id, username, password_hash, <strong>role ('tenant_admin' | 'super_admin')</strong>, email</li>
            <li><code>tenant_settings</code>: tenant_id, ai_settings, widget_settings, page_settings, messenger_settings</li>
            <li><code className="text-amber-600">sales_consent_logs</code>: session_id, email, tenant_name, tariff_id, consent_text, ip_address, user_agent, <strong>requires_fz152</strong></li>
          </ul>
          <p className="text-xs text-slate-600 mt-2">
            <strong>Важно:</strong> Роутинг через slug в URL: <code>/{'{'}tenant_slug{'}'}/admin</code> (работает на всех доменах)
          </p>
        </div>
      </FlowStepCard>

      {/* Этап 4: Email с доступами */}
      <FlowStepCard stepNumber={4} color="purple" icon="Mail" title="Email с доступами">
        <p className="text-slate-700"><strong>Backend:</strong> <code className="bg-white px-2 py-1 rounded">/backend/send-order-email/index.py</code></p>
        <p className="text-slate-700"><strong>Интеграция:</strong> Brevo (SendInBlue) API для отправки email</p>
        <div className="bg-white p-3 rounded mt-2 border border-purple-300">
          <p className="font-semibold text-purple-800">📧 Содержимое письма:</p>
          <ul className="list-disc list-inside text-slate-700 space-y-1">
            <li><strong>Тема:</strong> "Ваш чат-бот готов к настройке!"</li>
            <li><strong>URL админки:</strong> {'{'}domain{'}'}/{'{'}slug{'}'}/admin (domain зависит от настроек)</li>
            <li><strong>Логин:</strong> {'{'}slug{'}'}_admin</li>
            <li><strong>Пароль:</strong> случайный (сгенерирован в webhook)</li>
            <li>Инструкция по первичной настройке</li>
          </ul>
        </div>
        <div className="bg-amber-50 p-3 rounded mt-2 border border-amber-300">
          <p className="font-semibold text-amber-800">⏱️ Таймлайн:</p>
          <p className="text-slate-700">Доставка в течение 1-2 минут после оплаты (автоматизация webhook → email)</p>
        </div>
      </FlowStepCard>
    </>
  );
};

export default FlowStepInitial;