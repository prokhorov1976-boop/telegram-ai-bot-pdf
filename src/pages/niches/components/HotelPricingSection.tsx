import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

export const HotelPricingSection = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-slate-900">
            Прозрачные цены
          </h2>
          <p className="text-xl text-slate-600">
            Дешевле, чем один администратор на полставки
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              name: 'Старт',
              price: '9 975',
              period: 'первый месяц с настройкой',
              renewal: 'дальше 1 975₽/мес',
              features: [
                'Настроим Web-чат и виджет для сайта',
                'Обучим бота на 10 ваших документах',
                'Подберём оптимальную AI-модель',
                'Запуск за 24 часа',
                'Без мессенджеров'
              ],
              bgColor: 'bg-white',
              borderColor: 'border-slate-200',
              accentColor: 'from-slate-600 to-slate-700',
              popular: false
            },
            {
              name: 'Бизнес',
              price: '19 975',
              period: 'первый месяц с настройкой',
              renewal: 'дальше 4 975₽/мес',
              features: [
                'Всё из тарифа Старт',
                'Подключим Telegram (ваш ключ + наша инструкция)',
                'Обучим бота на 25 документах',
                'Оптимизируем модель под вашу нишу',
                'Приоритетная поддержка'
              ],
              bgColor: 'bg-gradient-to-br from-teal-500 to-emerald-600',
              borderColor: 'border-teal-400',
              accentColor: 'from-teal-600 to-emerald-600',
              popular: true
            },
            {
              name: 'Премиум',
              price: '49 975',
              period: 'первый месяц с настройкой',
              renewal: 'дальше 14 975₽/мес',
              features: [
                'Всё из тарифа Бизнес',
                'Подключим VK, MAX (даём инструкции для ключей)',
                'Подберём лучшую модель с учётом 152-ФЗ',
                'Обучим бота на 100 документах',
                'ВСЮ настройку делаем МЫ — вы только даёте информацию',
                'Личный менеджер на связи 24/7',
                'Кастомизация логики под вашу нишу'
              ],
              bgColor: 'bg-white',
              borderColor: 'border-cyan-200',
              accentColor: 'from-cyan-600 to-blue-600',
              popular: false
            }
          ].map((plan, idx) => (
            <Card key={idx} className={`relative border-2 ${plan.borderColor} ${plan.bgColor} ${plan.popular ? 'shadow-2xl scale-105 ring-4 ring-teal-200' : ''} hover:scale-110 hover:shadow-xl transition-all`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-6 py-1.5 rounded-full text-sm font-bold shadow-lg">
                    ⭐ Популярный
                  </div>
                </div>
              )}
              <CardContent className={`p-8 ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <div>
                    <span className="text-5xl font-bold">{plan.price}</span>
                    <span className="text-xl">₽</span>
                  </div>
                  <div className={`text-sm mt-1 ${plan.popular ? 'text-teal-50' : 'text-slate-600'}`}>{plan.period}</div>
                  <div className={`text-xs mt-2 ${plan.popular ? 'text-teal-100' : 'text-slate-500'}`}>{plan.renewal}</div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2">
                      <Icon name="Check" size={20} className={`flex-shrink-0 mt-0.5 ${plan.popular ? 'text-white' : 'text-emerald-600'}`} />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full ${plan.popular ? 'bg-white text-teal-600 hover:bg-teal-50 font-bold' : 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700'}`}
                  size="lg"
                  onClick={() => window.open('https://max.ru/u/f9LHodD0cOIrknUlAYx1LxuVyfuHRhIq-OHhkpPMbwJ_WcjW4dhTFpEEez0', '_blank')}
                >
                  Начать работу
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-slate-700 mb-2 font-medium">Первый месяц — полная настройка под ключ</p>
          <p className="text-sm text-slate-600">Дальше платите только за поддержку и работу бота</p>
        </div>
      </div>
    </section>
  );
};
