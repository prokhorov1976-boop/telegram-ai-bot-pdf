import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

export const FeaturesSection = () => {
  const problems = [
    {
      icon: 'X',
      title: 'Клиенты уходят',
      description: 'Потому что ждут ответа по 8 часов',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      icon: 'X',
      title: 'Звонки по ночам',
      description: 'Сотрудники выгорают, а клиенты недовольны',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      icon: 'X',
      title: 'Одни вопросы',
      description: '90% вопросов одинаковые, но тратите время',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ];

  const features = [
    {
      icon: 'Clock',
      title: 'Работает 24/7/365',
      description: 'Даже в 3 ночи, в выходные, в праздники. Никогда не устаёт, не заболеет, не уйдёт в отпуск',
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      value: '∞',
      valueLabel: 'клиентов одновременно'
    },
    {
      icon: 'Brain',
      title: 'Знает ВСЁ о вас',
      description: 'Бот работает на векторной базе данных для AI — загружаете прайсы, инструкции, правила и он мгновенно находит точные ответы',
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
      value: '97%',
      valueLabel: 'точность'
    },
    {
      icon: 'MessageSquare',
      title: 'Все каналы + голос',
      description: 'Web-чат, виджет, Telegram, VK, MAX — отвечает везде. В Telegram и MAX понимает голосовые сообщения и отвечает текстом',
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600',
      value: '5',
      valueLabel: 'каналов'
    },
    {
      icon: 'Shield',
      title: 'Безопасность 152-ФЗ',
      description: 'Данные хранятся в России. Полное соответствие законодательству РФ',
      bgColor: 'bg-red-100',
      iconColor: 'text-red-600',
      value: '100%',
      valueLabel: 'защита'
    },
    {
      icon: 'Rocket',
      title: 'Запуск за 1 день',
      description: 'Вы даёте информацию — мы настраиваем, обучаем, подключаем. Без программистов.',
      bgColor: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      value: '24ч',
      valueLabel: 'до запуска'
    },
    {
      icon: 'Mic',
      title: 'Голосовые сообщения',
      description: 'В Telegram и MAX бот понимает голос — клиенты отправляют аудио, бот распознаёт речь и отвечает текстом. Удобно для мобильных пользователей',
      bgColor: 'bg-cyan-100',
      iconColor: 'text-cyan-600',
      value: '🎤',
      valueLabel: 'распознавание речи'
    }
  ];

  return (
    <>
      <div id="features" className="bg-gradient-to-br from-red-50 via-orange-50 to-red-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-block mb-4 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-full shadow-lg">
              <p className="text-sm font-bold text-white flex items-center gap-2">
                <Icon name="AlertTriangle" size={18} />
                Проблемы, которые убивают ваши продажи
              </p>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
              Знакомая ситуация?
            </h2>
            <p className="text-2xl text-slate-700 max-w-4xl mx-auto font-medium">
              Каждый день вы теряете клиентов и деньги из-за того, что...
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {problems.map((problem, index) => (
              <div key={index} className="bg-white border-2 border-red-300 rounded-2xl p-8 text-center shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all">
                <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Icon name={problem.icon as any} size={40} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">
                  {problem.title}
                </h3>
                <p className="text-lg text-slate-700 leading-relaxed">
                  {problem.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-5xl font-bold text-center text-slate-900 mb-4">
          Решение готово
        </h2>
        <p className="text-xl text-slate-600 text-center mb-16 max-w-3xl mx-auto">
          AI-консультант решает эти проблемы за 1 день
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-2xl transition-all hover:-translate-y-1">
              <CardContent className="pt-8">
                <div className={`w-16 h-16 ${feature.bgColor} rounded-2xl flex items-center justify-center mb-4`}>
                  <Icon name={feature.icon as any} size={32} className={feature.iconColor} />
                </div>
                <div className="mb-3">
                  <div className="text-3xl font-bold text-primary">{feature.value}</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide">{feature.valueLabel}</div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
};