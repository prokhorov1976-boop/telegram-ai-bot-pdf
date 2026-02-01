import FlowStepCard from './FlowStepCard';

const FlowStepCompliance = () => {
  return (
    <>
      {/* Этап 7: 152-ФЗ */}
      <FlowStepCard stepNumber={7} color="amber" icon="ShieldCheck" title="152-ФЗ: Обработка персональных данных">
        <div className="bg-white p-3 rounded border border-amber-300">
          <p className="font-semibold text-amber-800">🔐 Кто имеет доступ:</p>
          <ul className="list-disc list-inside text-slate-700 space-y-1">
            <li><strong>Тарифы:</strong> только Business (professional) и Premium (enterprise)</li>
            <li><strong>Активация:</strong> чекбокс при оплате "Я буду обрабатывать персональные данные клиентов"</li>
            <li><strong>База данных:</strong> поле <code>tenants.fz152_enabled = true</code></li>
            <li><strong>Логирование:</strong> запись в <code>sales_consent_logs</code> с <code>requires_fz152 = true</code></li>
          </ul>
        </div>
        <div className="bg-white p-3 rounded mt-2 border border-amber-300">
          <p className="font-semibold text-amber-800">⚙️ Что происходит при активации:</p>
          <ul className="list-disc list-inside text-slate-700 space-y-1">
            <li>В админке появляется вкладка <strong>"152-ФЗ"</strong> (ConsentSettingsCard)</li>
            <li>В админке появляется вкладка <strong>"AI"</strong> (ранее была скрыта)</li>
            <li>На вкладке AI доступен только провайдер YandexGPT (OpenRouter и ProxyAPI скрыты)</li>
            <li>Показывается предупреждение о требованиях 152-ФЗ (amber блок)</li>
            <li>Tenant обязан добавить собственный API ключ YandexGPT + Folder ID</li>
          </ul>
        </div>
        <div className="bg-white p-3 rounded mt-2 border border-amber-300">
          <p className="font-semibold text-amber-800">📝 Настройки согласия (ConsentSettingsCard):</p>
          <ul className="list-disc list-inside text-slate-700 space-y-1">
            <li><strong>Включение/отключение:</strong> checkbox "Требовать согласие на обработку ПД"</li>
            <li><strong>Текст согласия:</strong> редактируемое поле (по умолчанию шаблон)</li>
            <li><strong>Backend:</strong> <code>/backend/public-content/index.py</code> (GET/POST)</li>
            <li><strong>Хранение:</strong> таблица <code>tenant_settings</code>, поле <code>consent_settings</code></li>
          </ul>
        </div>
        <div className="bg-white p-3 rounded mt-2 border border-amber-300">
          <p className="font-semibold text-amber-800">🔑 Требования к API ключу YandexGPT:</p>
          <ul className="list-disc list-inside text-slate-700 space-y-1">
            <li><strong>Компонент:</strong> TenantApiKeysCard (режим fz152Enabled=true)</li>
            <li><strong>Поля:</strong> Yandex API Key + Yandex Folder ID</li>
            <li><strong>Backend:</strong> <code>/backend/manage-api-keys/index.py</code></li>
            <li><strong>Хранение:</strong> таблица <code>tenant_api_keys</code> (provider='yandex')</li>
            <li><strong>Использование:</strong> модель YandexGPT Lite для чата, text-search-doc/query для эмбеддингов</li>
          </ul>
        </div>
        <div className="bg-white p-3 rounded mt-2 border border-amber-300">
          <p className="font-semibold text-amber-800">📊 Логирование согласий пользователей:</p>
          <ul className="list-disc list-inside text-slate-700 space-y-1">
            <li><strong>Таблица:</strong> <code>user_consents</code></li>
            <li><strong>Поля:</strong> tenant_id, session_id, user_identifier, consent_text, ip_address, user_agent, timestamp</li>
            <li><strong>Backend:</strong> <code>/backend/chat/index.py</code> (логирование при первом сообщении)</li>
            <li><strong>Просмотр:</strong> суперадмин может просматривать логи через <code>/backend/consent-logs/index.py</code></li>
          </ul>
        </div>
        <div className="bg-amber-100 p-3 rounded mt-2 border border-amber-400">
          <p className="font-semibold text-amber-900">⚠️ Важные ограничения:</p>
          <ul className="list-disc list-inside text-slate-700 space-y-1">
            <li><strong>Суперадмин:</strong> видит ВСЕ настройки и всех провайдеров, даже при просмотре tenant с fz152_enabled=true</li>
            <li><strong>Tenant:</strong> при fz152_enabled=true видит ТОЛЬКО YandexGPT, не может выбрать другую модель</li>
            <li><strong>Без ключа:</strong> если tenant не добавил ключ YandexGPT, AI не будет работать</li>
          </ul>
        </div>
      </FlowStepCard>

      {/* Этап 8: Продление */}
      <FlowStepCard stepNumber={8} color="rose" icon="Calendar" title="Ежемесячное продление">
        <div className="bg-white p-3 rounded border border-rose-300">
          <p className="font-semibold text-rose-800">🔄 Автоматическое продление:</p>
          <ul className="list-disc list-inside text-slate-700 space-y-1">
            <li><strong>Механизм:</strong> ЮKassa Auto-payment (рекуррентные платежи)</li>
            <li><strong>Частота:</strong> каждые 30 дней</li>
            <li><strong>Сумма:</strong> monthly_price из таблицы tariffs (1 975 ₽ / 4 975 ₽ / 14 975 ₽)</li>
            <li><strong>Backend:</strong> тот же <code>/backend/yookassa-webhook/index.py</code></li>
          </ul>
        </div>
        <div className="bg-white p-3 rounded mt-2 border border-rose-300">
          <p className="font-semibold text-rose-800">⚙️ Логика обработки:</p>
          <ul className="list-disc list-inside text-slate-700 space-y-1">
            <li>Webhook получает событие <code>payment.succeeded</code></li>
            <li>Проверка: это новый tenant или продление? (по наличию tenant_id в metadata)</li>
            <li><strong>Если продление:</strong> UPDATE subscription_end_date = subscription_end_date + 30 дней</li>
            <li><strong>Если новый:</strong> создание tenant (как в этапе 3)</li>
          </ul>
        </div>
        <div className="bg-white p-3 rounded mt-2 border border-rose-300">
          <p className="font-semibold text-rose-800">📧 Уведомления:</p>
          <ul className="list-disc list-inside text-slate-700 space-y-1">
            <li><strong>Успешное продление:</strong> email через Brevo "Подписка продлена"</li>
            <li><strong>Неуспешная оплата:</strong> email "Проблема с оплатой" + grace period 3 дня</li>
            <li><strong>Истечение:</strong> блокировка tenant (is_active = false)</li>
          </ul>
        </div>
        <div className="bg-rose-100 p-3 rounded mt-2 border border-rose-400">
          <p className="font-semibold text-rose-900">🔔 Супер-админ видит:</p>
          <ul className="list-disc list-inside text-slate-700 space-y-1">
            <li>В панели /super-admin: список всех tenants с датами окончания</li>
            <li>Фильтр по статусу: активные / истекающие / заблокированные</li>
            <li>Возможность ручного продления через <code>/backend/admin-tenants/</code></li>
          </ul>
        </div>
      </FlowStepCard>
    </>
  );
};

export default FlowStepCompliance;
