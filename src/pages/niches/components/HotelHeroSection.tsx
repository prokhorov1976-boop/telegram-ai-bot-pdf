import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

export const HotelHeroSection = () => {
  const benefits = [
    {
      icon: 'Clock',
      title: 'Работает 24/7/365',
      description: 'Ваш AI-консьерж отвечает гостям круглосуточно, даже когда администратор спит или занят',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: 'Zap',
      title: 'Мгновенные ответы',
      description: 'Никаких ожиданий! Гости получают информацию о номерах, ценах и услугах за секунды',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: 'Users',
      title: 'Неограниченная работа',
      description: 'Одновременная работа с любым количеством гостей без потери качества',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: 'TrendingUp',
      title: 'Рост конверсии в бронирования',
      description: 'Быстрые ответы = довольные гости = больше броней',
      color: 'from-orange-500 to-orange-600'
    },
    {
      icon: 'MessageCircle',
      title: 'Все мессенджеры в одном месте',
      description: 'Telegram, VK, MAX и веб-чат на сайте — управляйте всем из единой панели',
      color: 'from-pink-500 to-pink-600'
    },
    {
      icon: 'Settings',
      title: 'Настройка под ключ',
      description: 'Мы настроим всё сами — вы только даёте информацию об отеле',
      color: 'from-indigo-500 to-indigo-600'
    }
  ];

  const painPoints = [
    {
      icon: 'Phone',
      problem: 'Администратор не успевает отвечать на звонки',
      solution: 'AI-консьерж разгрузит персонал, отвечая на типовые вопросы автоматически'
    },
    {
      icon: 'Moon',
      problem: 'Теряете броски ночью и в выходные',
      solution: 'Бот работает круглосуточно — вы не пропустите ни одного потенциального гостя'
    },
    {
      icon: 'DollarSign',
      problem: 'Нанимать дополнительный персонал дорого',
      solution: 'AI-консьерж работает без выходных и больничных'
    },
    {
      icon: 'MessageSquare',
      problem: 'Гости задают одни и те же вопросы',
      solution: 'Бот мгновенно отвечает на FAQ, освобождая время для важных задач'
    }
  ];

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 opacity-95" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium mb-6">
              <Icon name="Sparkles" size={16} />
              <span>Готовое решение для гостиничного бизнеса</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              AI-консьерж для вашего отеля
            </h1>
            
            <p className="text-xl md:text-2xl text-blue-100 mb-4 max-w-3xl mx-auto">
              Умный помощник, который отвечает гостям 24/7, увеличивает бронирования и освобождает ваших администраторов для важных задач
            </p>
            
            <p className="text-lg text-blue-200 mb-10 max-w-2xl mx-auto">
              Работает в Telegram, VK, MAX и на вашем сайте. Полная настройка под ключ
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-blue-50 shadow-2xl text-lg px-8 py-6 h-auto group"
                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Icon name="Play" size={20} className="mr-2 group-hover:scale-110 transition-transform" />
                Посмотреть демо
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20 text-lg px-8 py-6 h-auto"
                onClick={() => window.open('https://max.ru/u/f9LHodD0cOIrknUlAYx1LxuVyfuHRhIq-OHhkpPMbwJ_WcjW4dhTFpEEez0', '_blank')}
              >
                <Icon name="MessageCircle" size={20} className="mr-2" />
                Получить консультацию
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-8 text-white/90 text-sm">
              <div className="flex items-center gap-2">
                <Icon name="Check" size={16} className="text-green-300" />
                <span>Запуск за 24 часа</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="Check" size={16} className="text-green-300" />
                <span>Без программирования</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="Check" size={16} className="text-green-300" />
                <span>Полная настройка под ключ</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
              Знакомо?
            </h2>
            <p className="text-xl text-slate-600">
              AI-консьерж решает эти проблемы автоматически
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {painPoints.map((point, idx) => (
              <Card key={idx} className="border-2 border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all">
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                        <Icon name={point.icon} size={24} className="text-red-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900 mb-2">
                        {point.problem}
                      </h3>
                      <div className="flex items-start gap-2 mt-4">
                        <Icon name="ArrowRight" size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                        <p className="text-slate-600">{point.solution}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
              Почему владельцы отелей выбирают AI-консьержа
            </h2>
            <p className="text-xl text-slate-600">
              Результаты, которые вы увидите уже в первую неделю
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, idx) => (
              <Card key={idx} className="border-none shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 bg-white">
                <CardContent className="p-8">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${benefit.color} flex items-center justify-center mb-6`}>
                    <Icon name={benefit.icon} size={28} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};
