import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TARIFF_LIMITS } from '@/lib/tariff-limits';
import Icon from '@/components/ui/icon';

const TariffAccessTab = () => {
  const features = [
    { key: 'maxPdfDocuments', label: 'Документы (PDF)', type: 'number' },
    { key: 'hasWebChat', label: 'Веб-чат', icon: 'MessageSquare' },
    { key: 'hasTelegram', label: 'Telegram', icon: 'Send' },
    { key: 'hasVK', label: 'VK', icon: 'MessageCircle' },
    { key: 'hasMAX', label: 'MAX.ru', icon: 'MessageCircleMore' },
    { key: 'hasWidget', label: 'Виджет', icon: 'Code' },
    { key: 'hasPageSettings', label: 'Настройки страницы', icon: 'Layout' },
    { key: 'hasStats', label: 'Статистика', icon: 'BarChart' },
    { key: 'hasAISettings', label: 'Настройки AI', icon: 'Brain' },
    { key: 'hasAdvancedAISettings', label: 'Расширенные AI', icon: 'BrainCircuit' },
    { key: 'hasCustomization', label: 'Кастомизация', icon: 'Palette' },
    { key: 'hasPersonalManager', label: 'Персональный менеджер', icon: 'UserCheck' }
  ];

  const tariffs = [
    TARIFF_LIMITS.basic,
    TARIFF_LIMITS.professional,
    TARIFF_LIMITS.enterprise
  ];

  const getFeatureValue = (tariff: any, feature: any) => {
    const value = tariff[feature.key];
    
    if (feature.type === 'number') {
      return value === -1 ? '∞' : value;
    }
    
    return value ? (
      <Icon name="Check" size={20} className="text-green-600 mx-auto" />
    ) : (
      <Icon name="X" size={20} className="text-red-400 mx-auto" />
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Table" size={24} />
          Матрица доступа по тарифам
        </CardTitle>
        <CardDescription>
          Полная таблица возможностей для каждого тарифного плана
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-300">
                <th className="text-left p-4 font-semibold text-slate-900 bg-slate-50">
                  Возможность
                </th>
                {tariffs.map((tariff) => (
                  <th key={tariff.id} className="text-center p-4 font-semibold text-slate-900 bg-slate-50">
                    {tariff.name}
                    <div className="text-xs font-normal text-slate-500 mt-1">
                      ({tariff.id})
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <tr 
                  key={feature.key} 
                  className={`border-b border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
                >
                  <td className="p-4 font-medium text-slate-700 flex items-center gap-2">
                    {feature.icon && <Icon name={feature.icon as any} size={16} className="text-slate-400" />}
                    {feature.label}
                  </td>
                  {tariffs.map((tariff) => (
                    <td key={`${tariff.id}-${feature.key}`} className="p-4 text-center">
                      {getFeatureValue(tariff, feature)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <Icon name="Info" size={16} />
            Дополнительные правила доступа
          </h4>
          <ul className="text-sm text-slate-700 space-y-2">
            <li className="flex items-start gap-2">
              <Icon name="ShieldCheck" size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <span><strong>152-ФЗ:</strong> Вкладка AI доступна при включенном режиме 152-ФЗ для любого тарифа</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="Crown" size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
              <span><strong>Суперадмин:</strong> Имеет доступ ко всем вкладкам всегда, включая эксклюзивную вкладку "Эмбеддинги"</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="Lock" size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
              <span><strong>Ограничения:</strong> При достижении лимита документов загрузка блокируется с предложением апгрейда</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="Zap" size={16} className="text-purple-600 mt-0.5 flex-shrink-0" />
              <span><strong>Мгновенно:</strong> Все изменения тарифа применяются немедленно после обновления subscription_end_date</span>
            </li>
          </ul>
        </div>

        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
            <Icon name="Monitor" size={16} />
            Вкладки в админ-панели клиента
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
            <div className="bg-white p-3 rounded border border-green-200">
              <h5 className="font-semibold text-sm text-green-800 mb-2">Старт (basic)</h5>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>✅ Документы (до 10)</li>
                <li>✅ Мессенджеры (виджет + автосообщения)</li>
                <li>✅ Страница</li>
                <li>✅ Виджет</li>
                <li>✅ Статистика</li>
                <li>❌ AI (только с 152-ФЗ)</li>
                <li>❌ Эмбеддинги</li>
              </ul>
            </div>
            <div className="bg-white p-3 rounded border border-blue-200">
              <h5 className="font-semibold text-sm text-blue-800 mb-2">Бизнес (professional)</h5>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>✅ Документы (до 25)</li>
                <li>✅ Мессенджеры (+ Telegram)</li>
                <li>✅ Страница</li>
                <li>✅ Виджет</li>
                <li>✅ Статистика</li>
                <li>❌ AI (только с 152-ФЗ)</li>
                <li>❌ Эмбеддинги</li>
              </ul>
            </div>
            <div className="bg-white p-3 rounded border border-purple-200">
              <h5 className="font-semibold text-sm text-purple-800 mb-2">Премиум (enterprise)</h5>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>✅ Документы (до 100)</li>
                <li>✅ Мессенджеры (Telegram + VK + MAX)</li>
                <li>✅ Страница</li>
                <li>✅ Виджет</li>
                <li>✅ Статистика</li>
                <li>❌ AI (только с 152-ФЗ)</li>
                <li>❌ Эмбеддинги</li>
              </ul>
            </div>
          </div>
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-xs text-yellow-900">
              <strong>Суперадмин:</strong> Имеет доступ ко всем вкладкам всегда, включая эксклюзивную "Эмбеддинги". При просмотре клиентов видит все возможности независимо от тарифа.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TariffAccessTab;