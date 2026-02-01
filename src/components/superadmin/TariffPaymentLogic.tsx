import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

const TariffPaymentLogic = () => {
  return (
    <Card className="border-purple-200 shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon name="Calculator" className="text-purple-600" size={24} />
          <CardTitle>Логика расчета платежей и продления подписки</CardTitle>
        </div>
        <CardDescription>
          Как работает система биллинга и расчета стоимости для клиентов
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Формулы расчета */}
        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Icon name="Sigma" size={18} className="text-blue-600" />
            Формулы расчета
          </h3>
          
          <div className="space-y-4">
            {/* Первый платеж */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Icon name="Rocket" size={16} />
                1. Первый платеж (подключение)
              </h4>
              <div className="space-y-2 text-sm">
                <div className="bg-white rounded p-3 font-mono text-xs">
                  <div className="text-slate-600">Если <span className="text-green-600 font-bold">первый месяц включен</span>:</div>
                  <div className="ml-4 mt-1">
                    <div>первый_платеж = <span className="text-purple-600 font-bold">setup_fee</span></div>
                    <div>период_подписки = <span className="text-orange-600 font-bold">30 дней</span></div>
                  </div>
                  
                  <div className="mt-3 text-slate-600">Если <span className="text-red-600 font-bold">первый месяц НЕ включен</span>:</div>
                  <div className="ml-4 mt-1">
                    <div>первый_платеж = <span className="text-purple-600 font-bold">setup_fee</span> + <span className="text-blue-600 font-bold">renewal_price</span></div>
                    <div>период_подписки = <span className="text-orange-600 font-bold">30 дней</span></div>
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded p-2 text-xs">
                  <div className="font-semibold text-green-900 mb-1">✅ Текущие настройки (все тарифы):</div>
                  <div className="text-green-800">Первый месяц включен = <strong>Да</strong></div>
                  <div className="text-green-700 mt-1">→ Клиент платит только setup_fee и получает 30 дней доступа</div>
                </div>
              </div>
            </div>

            {/* Продление */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                <Icon name="RefreshCw" size={16} />
                2. Продление подписки
              </h4>
              <div className="space-y-2 text-sm">
                <div className="bg-white rounded p-3 font-mono text-xs">
                  <div>платеж_продления = <span className="text-blue-600 font-bold">renewal_price</span> × <span className="text-orange-600 font-bold">количество_месяцев</span></div>
                  <div className="mt-2">новая_дата = текущая_дата_окончания + (30 × месяцы) дней</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Примеры расчетов */}
        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Icon name="Receipt" size={18} className="text-green-600" />
            Примеры расчетов по тарифам
          </h3>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Старт */}
            <div className="border border-slate-200 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-white">
              <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                <Icon name="Zap" size={16} />
                Тариф "Старт"
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Первый платеж:</span>
                  <span className="font-bold text-blue-600">9 975 ₽</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Доступ:</span>
                  <span className="font-semibold text-green-600">30 дней</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Продление (мес):</span>
                  <span className="font-bold text-purple-600">1 975 ₽</span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <div className="text-xs text-slate-500 mb-1">Годовая стоимость:</div>
                  <div className="flex items-center justify-between text-xs">
                    <span>1-й год:</span>
                    <span className="font-bold">31 700 ₽</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>2-й год:</span>
                    <span className="font-semibold">23 700 ₽</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Бизнес */}
            <div className="border border-slate-200 rounded-lg p-4 bg-gradient-to-br from-purple-50 to-white">
              <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                <Icon name="Briefcase" size={16} />
                Тариф "Бизнес"
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Первый платеж:</span>
                  <span className="font-bold text-blue-600">19 975 ₽</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Доступ:</span>
                  <span className="font-semibold text-green-600">30 дней</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Продление (мес):</span>
                  <span className="font-bold text-purple-600">4 975 ₽</span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <div className="text-xs text-slate-500 mb-1">Годовая стоимость:</div>
                  <div className="flex items-center justify-between text-xs">
                    <span>1-й год:</span>
                    <span className="font-bold">74 700 ₽</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>2-й год:</span>
                    <span className="font-semibold">59 700 ₽</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Премиум */}
            <div className="border border-slate-200 rounded-lg p-4 bg-gradient-to-br from-orange-50 to-white">
              <h4 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
                <Icon name="Crown" size={16} />
                Тариф "Премиум"
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Первый платеж:</span>
                  <span className="font-bold text-blue-600">49 975 ₽</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Доступ:</span>
                  <span className="font-semibold text-green-600">30 дней</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Продление (мес):</span>
                  <span className="font-bold text-purple-600">14 975 ₽</span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <div className="text-xs text-slate-500 mb-1">Годовая стоимость:</div>
                  <div className="flex items-center justify-between text-xs">
                    <span>1-й год:</span>
                    <span className="font-bold">214 700 ₽</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>2-й год:</span>
                    <span className="font-semibold">179 700 ₽</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Управление в админке */}
        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Icon name="Settings" size={18} className="text-orange-600" />
            Управление тарифами в админке
          </h3>
          
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2 text-slate-900">Поля тарифа:</h4>
                <ul className="space-y-1 text-slate-700">
                  <li className="flex items-start gap-2">
                    <Icon name="Check" size={14} className="text-green-600 mt-0.5" />
                    <span><strong>Название</strong> — отображаемое имя тарифа</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="Check" size={14} className="text-green-600 mt-0.5" />
                    <span><strong>Стоимость подключения</strong> — разовый платеж setup_fee</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="Check" size={14} className="text-green-600 mt-0.5" />
                    <span><strong>Первоначальная оплата</strong> — price (для отображения)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="Check" size={14} className="text-green-600 mt-0.5" />
                    <span><strong>Стоимость продления</strong> — renewal_price (ежемесячно)</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2 text-slate-900">Галочка "Первый месяц включен":</h4>
                <ul className="space-y-2 text-slate-700">
                  <li className="flex items-start gap-2">
                    <Icon name="CheckSquare" size={14} className="text-green-600 mt-0.5" />
                    <div>
                      <div className="font-semibold text-green-700">✅ Включен</div>
                      <div className="text-xs">Первый платеж = setup_fee, клиент получает 30 дней</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon name="Square" size={14} className="text-slate-400 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-600">❌ Не включен</div>
                      <div className="text-xs">Первый платеж = setup_fee + renewal_price, клиент получает 30 дней</div>
                    </div>
                  </li>
                </ul>
                
                <div className="mt-3 pt-3 border-t border-slate-300">
                  <div className="text-xs text-slate-600">
                    <strong>Текущее состояние:</strong> Все тарифы имеют галочку <span className="text-green-600 font-bold">включенной</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Доступ к функциям по тарифам */}
        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Icon name="Shield" size={18} className="text-green-600" />
            Доступ к функциям в админ-панели клиента
          </h3>
          
          <div className="grid gap-4 md:grid-cols-3">
            {/* Старт */}
            <div className="border border-green-200 rounded-lg p-4 bg-green-50">
              <h4 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                <Icon name="Zap" size={16} />
                Старт (basic)
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-start gap-2">
                  <Icon name="Check" size={12} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Документы (до 10 PDF)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Icon name="Check" size={12} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Мессенджеры (виджет)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Icon name="Check" size={12} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Страница настроек</span>
                </div>
                <div className="flex items-start gap-2">
                  <Icon name="Check" size={12} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Виджет</span>
                </div>
                <div className="flex items-start gap-2">
                  <Icon name="X" size={12} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-600">AI (только с 152-ФЗ)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Icon name="X" size={12} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-600">Статистика</span>
                </div>
              </div>
            </div>

            {/* Бизнес */}
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                <Icon name="Briefcase" size={16} />
                Бизнес (professional)
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-start gap-2">
                  <Icon name="Check" size={12} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Документы (до 25 PDF)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Icon name="Check" size={12} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Мессенджеры (+ Telegram)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Icon name="Check" size={12} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Страница настроек</span>
                </div>
                <div className="flex items-start gap-2">
                  <Icon name="Check" size={12} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Виджет</span>
                </div>
                <div className="flex items-start gap-2">
                  <Icon name="Check" size={12} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="font-semibold">Статистика</span>
                </div>
                <div className="flex items-start gap-2">
                  <Icon name="X" size={12} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-600">AI (только с 152-ФЗ)</span>
                </div>
              </div>
            </div>

            {/* Премиум */}
            <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
              <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                <Icon name="Crown" size={16} />
                Премиум (enterprise)
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-start gap-2">
                  <Icon name="Check" size={12} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Документы (до 100 PDF)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Icon name="Check" size={12} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Мессенджеры (все каналы)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Icon name="Check" size={12} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Страница настроек</span>
                </div>
                <div className="flex items-start gap-2">
                  <Icon name="Check" size={12} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Виджет</span>
                </div>
                <div className="flex items-start gap-2">
                  <Icon name="Check" size={12} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="font-semibold">Статистика</span>
                </div>
                <div className="flex items-start gap-2">
                  <Icon name="X" size={12} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-600">AI (только с 152-ФЗ)</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 space-y-3">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Icon name="Clock" size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-semibold text-yellow-900 mb-1">Автосообщения</div>
                  <div className="text-yellow-800">
                    Настройка автосообщений доступна <strong>только суперадмину</strong>. 
                    По умолчанию автосообщения <strong>выключены для всех клиентов</strong>. 
                    Суперадмин может включить и настроить задержку + текст для каждого мессенджера отдельно (виджет, Telegram, VK, MAX).
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Icon name="ShieldCheck" size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-semibold text-blue-900 mb-1">Вкладка AI и 152-ФЗ</div>
                  <div className="text-blue-800">
                    Вкладка "AI" появляется у клиентов только при включенном режиме <strong>152-ФЗ</strong> или для суперадмина. 
                    Вкладка "152-ФЗ" доступна только при активации этого режима.
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Icon name="Crown" size={16} className="text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-semibold text-purple-900 mb-1">Суперадмин</div>
                  <div className="text-purple-800">
                    Суперадмин видит <strong>все вкладки всегда</strong>, включая эксклюзивную вкладку "Эмбеддинги". 
                    При просмотре клиентов через /slug/admin получает полный доступ независимо от тарифа.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Техническая реализация */}
        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Icon name="Code" size={18} className="text-indigo-600" />
            Техническая реализация биллинга
          </h3>
          
          <div className="space-y-3">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
              <h4 className="font-semibold text-indigo-900 mb-2 text-sm">Frontend (PaymentPage.tsx)</h4>
              <pre className="text-xs bg-white rounded p-2 overflow-x-auto">
{`const firstPayment = plan.first_month_included 
  ? plan.setup_fee 
  : plan.setup_fee + plan.renewal_price;

const metadata = {
  tariff_id: selectedTariff,
  first_month_included: plan.first_month_included
};`}
              </pre>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <h4 className="font-semibold text-purple-900 mb-2 text-sm">Backend (yookassa-webhook)</h4>
              <pre className="text-xs bg-white rounded p-2 overflow-x-auto">
{`if first_month_included:
    subscription_end = now + 30 days
else:
    subscription_end = now  # Setup без месяца`}
              </pre>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <h4 className="font-semibold text-green-900 mb-2 text-sm">Продление (SubscriptionWidget)</h4>
              <pre className="text-xs bg-white rounded p-2 overflow-x-auto">
{`amount = renewal_price × renewalMonths;
new_date = current_end + (30 × months) days;`}
              </pre>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TariffPaymentLogic;