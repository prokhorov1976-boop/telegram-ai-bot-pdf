import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

export const VectorTechSection = () => {
  const benefits = [
    {
      icon: 'Zap',
      title: 'Мгновенный поиск',
      description: 'Векторная база данных находит нужную информацию за миллисекунды среди тысяч документов',
      gradient: 'from-yellow-500 to-orange-500',
      metric: '< 0.1 сек',
      metricLabel: 'поиск ответа'
    },
    {
      icon: 'Target',
      title: 'Точность контекста',
      description: 'AI понимает смысл вопроса, а не просто ключевые слова — отвечает именно на то, что спросили',
      gradient: 'from-purple-500 to-pink-500',
      metric: '97%',
      metricLabel: 'точность'
    },
    {
      icon: 'TrendingUp',
      title: 'Умнеет со временем',
      description: 'Чем больше документов загружаете — тем умнее становится бот. Без переобучения и перенастройки',
      gradient: 'from-green-500 to-emerald-500',
      metric: '∞',
      metricLabel: 'масштабируемость'
    },
    {
      icon: 'Database',
      title: 'Хранит всё',
      description: 'Прайсы, инструкции, FAQ, политики — всё в одном месте. Обновили документ — бот сразу знает',
      gradient: 'from-blue-500 to-cyan-500',
      metric: '100+',
      metricLabel: 'документов'
    }
  ];

  return (
    <div id="vector-tech" className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 py-20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-500 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-block mb-4 px-6 py-3 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full shadow-lg">
            <p className="text-sm font-bold text-white flex items-center gap-2">
              <Icon name="Cpu" size={18} />
              Технология нового поколения
            </p>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Векторные базы данных для AI
          </h2>
          <p className="text-2xl text-purple-100 max-w-4xl mx-auto font-medium">
            Не просто поиск по ключевым словам — бот понимает <span className="text-cyan-300 font-bold">смысл</span> вопроса
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-16">
          {benefits.map((benefit, index) => (
            <Card key={index} className="bg-white/10 backdrop-blur-lg border-2 border-white/20 hover:border-white/40 transition-all hover:-translate-y-2 hover:shadow-2xl">
              <CardContent className="pt-8">
                <div className="flex items-start gap-6">
                  <div className={`w-16 h-16 bg-gradient-to-br ${benefit.gradient} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <Icon name={benefit.icon as any} size={32} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="mb-3">
                      <div className="text-3xl font-bold text-white">{benefit.metric}</div>
                      <div className="text-xs text-purple-200 uppercase tracking-wide">{benefit.metricLabel}</div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-purple-100 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 border-0 shadow-2xl max-w-5xl mx-auto">
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur">
                <Icon name="Sparkles" size={40} className="text-white" />
              </div>
              <h3 className="text-4xl font-bold text-white mb-4">
                Как обычный поиск vs Векторный поиск AI
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                <div className="bg-red-500/20 backdrop-blur rounded-2xl p-6 border-2 border-red-300/50">
                  <div className="flex items-center gap-3 mb-4">
                    <Icon name="X" size={32} className="text-red-300" />
                    <h4 className="text-2xl font-bold text-white">Обычный поиск</h4>
                  </div>
                  <ul className="text-left text-white/90 space-y-3">
                    <li className="flex gap-2">
                      <span className="text-red-300">•</span>
                      <span>Ищет точные слова в документах</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-red-300">•</span>
                      <span>Не понимает синонимы и контекст</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-red-300">•</span>
                      <span>Выдаёт кучу неподходящих результатов</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-red-300">•</span>
                      <span>Пользователь сам ищет ответ в куче текста</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-green-500/20 backdrop-blur rounded-2xl p-6 border-2 border-green-300/50">
                  <div className="flex items-center gap-3 mb-4">
                    <Icon name="CheckCircle2" size={32} className="text-green-300" />
                    <h4 className="text-2xl font-bold text-white">Векторный AI</h4>
                  </div>
                  <ul className="text-left text-white/90 space-y-3">
                    <li className="flex gap-2">
                      <span className="text-green-300">✓</span>
                      <span>Понимает <strong>смысл</strong> вопроса клиента</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-300">✓</span>
                      <span>Находит ответ даже при другой формулировке</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-300">✓</span>
                      <span>Даёт точный ответ, а не список ссылок</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-300">✓</span>
                      <span>Клиент получает готовый ответ за 3 секунды</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 p-6 bg-white/10 backdrop-blur rounded-2xl">
                <p className="text-xl text-white font-semibold">
                  <Icon name="Lightbulb" size={24} className="inline mr-2" />
                  Вопрос "Сколько стоит доставка в Москву?" найдёт ответ даже если в документах написано "цена перевозки в столицу"
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};