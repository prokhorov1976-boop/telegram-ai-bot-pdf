import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

export const WeDoEverythingSection = () => {
  const clientDoes = [
    {
      icon: 'FileUp',
      title: 'Загружаете документы',
      description: 'В личном кабинете: прайсы, инструкции, FAQ, описания услуг',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: 'Phone',
      title: 'Указываете контакты',
      description: 'Телефоны, email, адреса — чтобы бот знал, куда направлять клиентов',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: 'Key',
      title: 'Получаете ключи',
      description: 'По нашей инструкции — для Telegram, VK, MAX. Это ВАШ бот!',
      gradient: 'from-purple-500 to-pink-500'
    }
  ];

  const weDo = [
    {
      icon: 'Brain',
      title: 'Подбираем AI-модель',
      description: 'Оптимальную под вашу нишу с учётом 152-ФЗ',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      icon: 'Cpu',
      title: 'Обучаем бота',
      description: 'Загружаем документы в векторную базу данных для AI, тестируем точность ответов',
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      icon: 'Link',
      title: 'Подключаем каналы',
      description: 'Web-чат, виджет, мессенджеры — всё настроено',
      gradient: 'from-pink-500 to-rose-500'
    },
    {
      icon: 'TestTube',
      title: 'Тестируем работу',
      description: 'Проверяем каждый сценарий, доводим до идеала',
      gradient: 'from-teal-500 to-cyan-500'
    },
    {
      icon: 'Rocket',
      title: 'Запускаем в работу',
      description: 'Вы получаете готового консультанта + инструкцию',
      gradient: 'from-amber-500 to-orange-500'
    },
    {
      icon: 'Headphones',
      title: 'Поддерживаем 24/7',
      description: 'Отвечаем на вопросы, помогаем добавлять документы',
      gradient: 'from-lime-500 to-green-500'
    }
  ];

  return (
    <div className="bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50 py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-block mb-4 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg">
            <p className="text-sm font-bold text-white flex items-center gap-2">
              <Icon name="Sparkles" size={18} />
              Разделение обязанностей
            </p>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
            От вас — информация,<br/>от нас — всё остальное
          </h2>
          <p className="text-2xl text-slate-700 max-w-4xl mx-auto font-medium">
            Вы управляете контентом через простой ЛК. Мы занимаемся технологиями.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto mb-12">
          <div>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 bg-blue-100 px-6 py-3 rounded-full">
                <Icon name="User" size={24} className="text-primary" />
                <h3 className="text-2xl font-bold text-primary">Вы делаете (10 минут)</h3>
              </div>
            </div>
            <div className="space-y-4">
              {clientDoes.map((item, index) => (
                <Card key={index} className="hover:shadow-lg transition-all">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <Icon name={item.icon as any} size={28} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-slate-900 mb-1">{item.title}</h4>
                        <p className="text-slate-600 text-sm">{item.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 bg-purple-100 px-6 py-3 rounded-full">
                <Icon name="Users" size={24} className="text-purple-600" />
                <h3 className="text-2xl font-bold text-purple-600">Мы делаем (24 часа)</h3>
              </div>
            </div>
            <div className="space-y-4">
              {weDo.map((item, index) => (
                <Card key={index} className="hover:shadow-lg transition-all border-2 border-purple-100">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <Icon name={item.icon as any} size={28} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-slate-900 mb-1">{item.title}</h4>
                        <p className="text-slate-600 text-sm">{item.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <Card className="bg-gradient-to-r from-purple-600 to-pink-600 border-0 shadow-2xl max-w-4xl mx-auto">
          <CardContent className="py-12">
            <div className="text-center">
              <Icon name="CheckCircle2" size={64} className="mx-auto text-white mb-6" />
              <h3 className="text-4xl font-bold text-white mb-4">
                Результат: готовый AI-консультант за 24 часа
              </h3>
              <p className="text-xl text-purple-100 mb-6 max-w-2xl mx-auto">
                Без программистов. Без настройки серверов. Без головной боли.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center text-white">
                <div className="flex items-center gap-2 bg-white/20 px-6 py-3 rounded-lg backdrop-blur">
                  <Icon name="Shield" size={20} />
                  <span className="font-semibold">Ваш бот навсегда</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 px-6 py-3 rounded-lg backdrop-blur">
                  <Icon name="Zap" size={20} />
                  <span className="font-semibold">Запуск за сутки</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 px-6 py-3 rounded-lg backdrop-blur">
                  <Icon name="Star" size={20} />
                  <span className="font-semibold">Поддержка 24/7</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};