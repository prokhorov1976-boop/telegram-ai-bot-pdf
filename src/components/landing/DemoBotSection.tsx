import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Card, CardContent } from '@/components/ui/card';

export const DemoBotSection = () => {
  const [showBot, setShowBot] = useState(false);

  return (
    <section id="demo" className="py-20 px-4 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold mb-4">
            <Icon name="Play" size={16} className="inline mr-2" />
            Попробуйте прямо сейчас
          </div>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Демо AI-консультант для бизнеса
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Протестируйте работу AI-бота на реальном примере. Задавайте вопросы про услуги, 
            узнавайте цены, условия и правила — всё как для ваших клиентов
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Icon name="Sparkles" size={24} className="text-purple-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Реальная база знаний</h3>
                    <p className="text-sm text-slate-600">
                      Бот обучен на документах реального бизнеса: тарифы, правила, услуги, контакты
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Icon name="MessageSquare" size={24} className="text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Умные ответы</h3>
                    <p className="text-sm text-slate-600">
                      Отвечает на русском языке, учитывает контекст, рассчитывает цены по датам
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Icon name="Zap" size={24} className="text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Быстрая настройка</h3>
                    <p className="text-sm text-slate-600">
                      Загрузите свои документы — и бот готов отвечать клиентам по вашим правилам
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Icon name="Info" size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-900">
                  <strong>Примеры вопросов:</strong> "Сколько стоит стандартный номер на 3 ночи?", 
                  "Есть ли парковка?", "До какого времени завтрак?"
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            {!showBot ? (
              <div className="aspect-[9/16] max-w-md mx-auto bg-gradient-to-br from-purple-100 to-blue-100 rounded-3xl shadow-2xl p-8 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-lg">
                  <Icon name="Bot" size={40} className="text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                  AI-консультант для бизнеса
                </h3>
                <p className="text-slate-600 mb-6">
                  Нажмите кнопку ниже, чтобы открыть демо-чат и пообщаться с AI-ботом
                </p>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  onClick={() => setShowBot(true)}
                >
                  <Icon name="MessageCircle" size={20} className="mr-2" />
                  Запустить демо
                </Button>
              </div>
            ) : (
              <div className="aspect-[9/16] max-w-md mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-purple-200">
                <div className="h-full flex flex-col">
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                      <Icon name="Bot" size={20} />
                      <span className="font-semibold">Демо AI-консультант</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                      onClick={() => setShowBot(false)}
                    >
                      <Icon name="X" size={18} />
                    </Button>
                  </div>
                  <div className="flex-1 relative">
                    <iframe
                      src="/sales"
                      className="w-full h-full border-0"
                      title="Демо AI-консультант"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-600 mb-4">
            Понравилось? Создайте своего AI-консультанта за 5 минут
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <Icon name="Rocket" size={20} className="mr-2" />
            Выбрать тариф
          </Button>
        </div>
      </div>
    </section>
  );
};