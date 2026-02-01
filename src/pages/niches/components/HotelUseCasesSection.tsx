import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

export const HotelUseCasesSection = () => {
  const useCases = [
    {
      title: 'Информация о номерах',
      description: 'Бот расскажет о типах номеров, удобствах, ценах и покажет фотографии',
      icon: 'Home'
    },
    {
      title: 'Прайс-лист и тарифы',
      description: 'Актуальные цены на проживание, сезонные скидки и спецпредложения',
      icon: 'Receipt'
    },
    {
      title: 'Услуги и инфраструктура',
      description: 'Бассейн, парковка, завтрак, трансфер — вся информация всегда под рукой',
      icon: 'Briefcase'
    },
    {
      title: 'Условия бронирования',
      description: 'Правила заезда/выезда, политика отмены, требования к оплате',
      icon: 'FileCheck'
    },
    {
      title: 'Расположение и как добраться',
      description: 'Адрес, координаты, маршруты от аэропорта, вокзала или на машине',
      icon: 'MapPin'
    },
    {
      title: 'Достопримечательности рядом',
      description: 'Что посмотреть в округе, пляжи, рестораны, экскурсии',
      icon: 'Compass'
    }
  ];

  return (
    <>
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
              Что умеет AI-консьерж для отелей
            </h2>
            <p className="text-xl text-slate-600">
              Бот знает всё о вашем отеле и отвечает гостям мгновенно
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((useCase, idx) => (
              <Card key={idx} className="border-2 border-slate-100 hover:border-blue-300 hover:shadow-lg transition-all group">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center transition-colors">
                        <Icon name={useCase.icon} size={24} className="text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900 mb-2">
                        {useCase.title}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {useCase.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="demo" className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
              Попробуйте прямо сейчас
            </h2>
            <p className="text-xl text-slate-600 mb-2">
              Напишите боту отеля «Династия» и убедитесь сами
            </p>
            <p className="text-lg text-slate-500">
              Спросите о номерах, ценах, услугах — бот ответит мгновенно
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-blue-200 shadow-2xl overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Icon name="Building2" size={32} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">Отель Династия</h3>
                      <p className="text-blue-100">AI-консьерж онлайн 24/7</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-8 bg-white">
                  <div className="space-y-6 mb-8">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <Icon name="Sparkles" size={20} className="text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="bg-slate-100 rounded-2xl rounded-tl-sm p-4">
                          <p className="text-slate-800">
                            Здравствуйте! Я AI-консьерж отеля Династия. Могу рассказать о номерах, ценах, услугах и забронировать для вас проживание. Чем могу помочь?
                          </p>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 ml-2">только что</p>
                      </div>
                    </div>

                    <div className="flex gap-4 justify-end">
                      <div className="flex-1 max-w-md">
                        <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm p-4">
                          <p>Какие у вас номера и сколько стоят?</p>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 mr-2 text-right">только что</p>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center">
                          <Icon name="User" size={20} className="text-slate-600" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                      className="flex-1 bg-[#0088cc] hover:bg-[#0077b3] text-white py-4 px-6 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 group"
                      onClick={() => window.open('https://t.me/dynastiya_bot', '_blank')}
                    >
                      <Icon name="Send" size={20} className="group-hover:translate-x-1 transition-transform" />
                      Открыть в Telegram
                    </button>
                    <button 
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-4 px-6 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 group"
                      onClick={() => window.open('https://max.ru/id9108121649_bot', '_blank')}
                    >
                      <Icon name="Shield" size={20} className="group-hover:scale-110 transition-transform" />
                      Открыть в MAX
                    </button>
                    <button 
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 group"
                      onClick={() => window.open('https://ai-ru.ru/dinasty-crimea/chat', '_blank')}
                    >
                      <Icon name="Globe" size={20} className="group-hover:scale-110 transition-transform" />
                      Веб-чат
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
};