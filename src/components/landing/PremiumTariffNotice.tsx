import Icon from '@/components/ui/icon';

const PremiumTariffNotice = () => {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-6 mb-6 shadow-lg transition-all duration-500 animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon name="Crown" size={24} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-purple-900 mb-3 flex items-center gap-2">
            Тариф Премиум — делаем всё за вас
            <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full">VIP</span>
          </h3>
          <ul className="space-y-2.5 text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <Icon name="Check" size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Шаг 1:</strong> Оплатите тариф Премиум прямо сейчас</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="Check" size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Шаг 2:</strong> Система автоматически создаст ваш аккаунт за 30 секунд</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="Check" size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Шаг 3:</strong> В течение 24 часов наш специалист свяжется с вами для настройки</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="Check" size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Шаг 4:</strong> Мы подготовим ваши документы, настроим промпт и AI — вам не нужно ничего делать</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="Check" size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Шаг 5:</strong> Через 24 часа ваш бот готов! Вам остаётся только получить ссылку и виджет</span>
            </li>
          </ul>
          <div className="mt-4 pt-4 border-t border-purple-200">
            <p className="text-sm text-purple-800 font-semibold flex items-center gap-2">
              <Icon name="Gift" size={16} />
              Включено в тариф Премиум: персональный менеджер + полная настройка системы + обучение работе с платформой
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumTariffNotice;