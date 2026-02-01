import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

export const YourBotSection = () => {
  return (
    <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <Card className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 border-0 shadow-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Левая часть - главный месседж */}
                <div className="p-12 text-white">
                  <div className="inline-block mb-6 px-4 py-2 bg-white/20 backdrop-blur rounded-full">
                    <span className="text-sm font-bold flex items-center gap-2">
                      <Icon name="Shield" size={16} />
                      ВАЖНОЕ ПРЕИМУЩЕСТВО
                    </span>
                  </div>
                  
                  <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                    Это ВАШ бот.<br/>
                    Навсегда с вами.
                  </h2>
                  
                  <p className="text-xl text-purple-100 mb-8 leading-relaxed">
                    Мы подключаем бота на ВАШИ ключи от Telegram, VK, MAX. 
                    Все подписчики принадлежат вам. Даже если перестанете с нами работать — 
                    бот и подписчики останутся с вами.
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <Icon name="Key" size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-1">Ваши ключи API</h4>
                        <p className="text-purple-100 text-sm">
                          Даём инструкцию, как получить. Всё оформлено на вас.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <Icon name="Users" size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-1">Ваши подписчики</h4>
                        <p className="text-purple-100 text-sm">
                          Не потеряются ни при каких обстоятельствах. Это ваша база.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <Icon name="Database" size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-1">Ваши данные</h4>
                        <p className="text-purple-100 text-sm">
                          Полный контроль. Можете экспортировать в любой момент.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Правая часть - контраст с арендой */}
                <div className="bg-white p-12">
                  <div className="mb-8">
                    <div className="inline-block mb-4 px-4 py-2 bg-red-100 rounded-full">
                      <span className="text-sm font-bold text-red-600 flex items-center gap-2">
                        <Icon name="AlertTriangle" size={16} />
                        Чем мы отличаемся
                      </span>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 mb-4">
                      Не аренда!<br/>Не посредник!
                    </h3>
                    <p className="text-slate-600 text-lg leading-relaxed">
                      Многие сервисы дают доступ к "их" боту — подписчики остаются у них. 
                      Перестали платить — потеряли всё.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border-2 border-red-200">
                      <Icon name="X" size={20} className="text-red-600 flex-shrink-0 mt-1" />
                      <div className="text-sm">
                        <span className="font-bold text-slate-900">У других:</span>
                        <span className="text-slate-700"> Бот на их ключах → перестали платить → потеряли подписчиков</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border-2 border-green-200">
                      <Icon name="Check" size={20} className="text-green-600 flex-shrink-0 mt-1" />
                      <div className="text-sm">
                        <span className="font-bold text-slate-900">У нас:</span>
                        <span className="text-slate-700"> Бот на ваших ключах → подписчики навсегда ваши → полная независимость</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
                    <div className="flex items-start gap-3">
                      <Icon name="Lightbulb" size={24} className="text-primary flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-slate-900 mb-2">Почему так?</h4>
                        <p className="text-sm text-slate-700 leading-relaxed">
                          Мы продаём <strong>технологию и настройку</strong>, а не аренду бота. 
                          Вы платите за нашу работу по созданию и поддержке, но сам бот — ваш. 
                          Честно и прозрачно.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <p className="text-slate-600 text-sm">
              🔒 В редких случаях требуются ключи AI (например, OpenAI). 
              Тоже на ваше имя — даём инструкцию.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
