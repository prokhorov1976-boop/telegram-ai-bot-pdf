import PricingCard from './PricingCard';

interface PricingSectionProps {
  onPlanSelect: (tariffId: string) => void;
}

export const PricingSection = ({ onPlanSelect }: PricingSectionProps) => {
  const startFeatures = [
    { text: 'Настроим Web-чат и виджет для сайта', included: true },
    { text: 'Обучим бота на 10 ваших документах', included: true },
    { text: 'Подберём оптимальную AI-модель', included: true },
    { text: 'Запуск за 24 часа', included: true },
    { text: 'Без мессенджеров', included: false }
  ];

  const businessFeatures = [
    { text: 'Всё из тарифа Старт', included: true },
    { text: 'Подключим Telegram (ваш ключ + наша инструкция)', included: true },
    { text: 'Обучим бота на 25 документах', included: true },
    { text: 'Оптимизируем модель под вашу нишу', included: true },
    { text: 'Приоритетная поддержка', included: true }
  ];

  const premiumFeatures = [
    { text: 'Всё из тарифа Бизнес', included: true },
    { text: 'Подключим VK, MAX (даём инструкции для ключей)', included: true },
    { text: 'Бот понимает голосовые в Telegram и MAX', included: true },
    { text: 'Подберём лучшую модель с учётом 152-ФЗ', included: true },
    { text: 'Обучим бота на 100 документах', included: true },
    { text: 'ВСЮ настройку делаем МЫ — вы только даёте информацию', included: true },
    { text: 'Личный менеджер на связи 24/7', included: true },
    { text: 'Кастомизация логики под вашу нишу', included: true }
  ];

  return (
    <div id="pricing" className="bg-slate-50 py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-5xl font-bold text-center text-slate-900 mb-4">
          Выберите свой тариф
        </h2>
        <p className="text-xl text-slate-600 text-center mb-12 max-w-3xl mx-auto">
          От вас — только информация и оплата. Мы настроим, обучим, запустим. Первый месяц — с полной настройкой под ключ
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <PricingCard
            badge="Лучшее для старта"
            badgeStyle="bg-blue-50 text-primary"
            title="Старт"
            description="Для малого бизнеса"
            price="9 975"
            setupText="первый месяц с настройкой"
            renewalPrice="дальше 1 975₽/мес"
            features={startFeatures}
            onSelect={() => onPlanSelect('basic')}
          />

          <PricingCard
            title="Бизнес"
            description="Для растущих компаний"
            price="19 975"
            priceColor="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent"
            setupText="первый месяц с настройкой"
            renewalPrice="дальше 4 975₽/мес"
            features={businessFeatures}
            buttonVariant="default"
            onSelect={() => onPlanSelect('professional')}
            isPopular={true}
            popularBadge="⭐ САМЫЙ ПОПУЛЯРНЫЙ"
            hoverEffect="hover:shadow-2xl hover:-translate-y-2"
            borderStyle="border-2 border-primary"
          />

          <PricingCard
            badge="Максимум возможностей"
            badgeStyle="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700"
            title="Премиум"
            description="Для крупного бизнеса"
            price="49 975"
            setupText="первый месяц с настройкой"
            renewalPrice="дальше 14 975₽/мес"
            features={premiumFeatures}
            onSelect={() => onPlanSelect('enterprise')}
            borderStyle="border-2 border-purple-300"
          />
        </div>
      </div>
    </div>
  );
};