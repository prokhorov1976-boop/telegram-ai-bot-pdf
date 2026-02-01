import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

export const HotelFooterSection = () => {
  const messengers = [
    {
      name: 'Telegram',
      icon: 'Send',
      color: 'bg-[#0088cc]',
      description: 'Самый популярный мессенджер'
    },
    {
      name: 'MAX',
      icon: 'Shield',
      color: 'bg-purple-600',
      description: 'Российский защищённый'
    },
    {
      name: 'VK',
      icon: 'MessageCircle',
      color: 'bg-blue-600',
      description: 'Крупнейшая соцсеть России'
    },
    {
      name: 'Веб-чат',
      icon: 'Globe',
      color: 'bg-green-600',
      description: 'Прямо на вашем сайте'
    }
  ];

  const faqs = [
    {
      question: 'Как быстро можно запустить бота?',
      answer: 'При тарифе Старт или Бизнес — за 24 часа. На Премиуме с полной интеграцией — до 3 рабочих дней. Вы даёте информацию об отеле, мы делаем всё остальное.'
    },
    {
      question: 'Нужны ли технические знания?',
      answer: 'Нет! Мы настроим всё под ключ. От вас нужна только информация: прайс-лист, фото номеров, описание услуг. Вы получаете готовое решение.'
    },
    {
      question: 'Можно ли обучить бота под специфику моего отеля?',
      answer: 'Да! Мы обучаем бота на ваших документах: прайсах, правилах бронирования, информации об услугах. Бот будет отвечать именно так, как вы хотите.'
    },
    {
      question: 'Что делать, если бот не знает ответа?',
      answer: 'Бот даст контакты оператора или перенаправит на сайт или мессенджер.'
    },
    {
      question: 'Как бот интегрируется с системой бронирования?',
      answer: 'Бот может работать автономно, информируя гостей, но с целью избежания утечек персональных данных, направит гостя на сайт или оператора для бронирования.'
    },
    {
      question: 'Можно ли изменить тариф в будущем?',
      answer: 'Конечно! Вы можете перейти на другой тариф в любое время. При переходе на более высокий тариф — доплачиваете разницу, на более низкий — пересчёт при следующем платеже.'
    }
  ];

  return (
    <>
      <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
              Работает во всех мессенджерах
            </h2>
            <p className="text-xl text-slate-600">
              Ваши гости выбирают удобный канал связи
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {messengers.map((messenger, idx) => (
              <Card key={idx} className="border-2 border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all group">
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 ${messenger.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon name={messenger.icon} size={32} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {messenger.name}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {messenger.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
              Частые вопросы
            </h2>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, idx) => (
              <Card key={idx} className="border-2 border-slate-100 hover:border-blue-200 transition-colors">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-start gap-3">
                    <Icon name="HelpCircle" size={24} className="text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>{faq.question}</span>
                  </h3>
                  <p className="text-slate-600 leading-relaxed ml-9">
                    {faq.answer}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium mb-6">
            <Icon name="Rocket" size={16} />
            <span>Начните сегодня</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Готовы автоматизировать работу с гостями?
          </h2>
          
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Запустим AI-консьержа для вашего отеля за 24 часа. Без программирования, с полной настройкой под ключ
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-blue-50 shadow-2xl text-lg px-8 py-6 h-auto group"
              onClick={() => window.open('https://max.ru/u/f9LHodD0cOIrknUlAYx1LxuVyfuHRhIq-OHhkpPMbwJ_WcjW4dhTFpEEez0', '_blank')}
            >
              <Icon name="MessageCircle" size={20} className="mr-2 group-hover:scale-110 transition-transform" />
              Получить консультацию
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20 text-lg px-8 py-6 h-auto"
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Icon name="Play" size={20} className="mr-2" />
              Попробовать демо
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-white/90 text-sm mt-12">
            <div className="flex items-center gap-2">
              <Icon name="Check" size={16} className="text-green-300" />
              <span>Запуск за 24 часа</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="Check" size={16} className="text-green-300" />
              <span>Первый месяц с настройкой</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="Check" size={16} className="text-green-300" />
              <span>Без технических знаний</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};