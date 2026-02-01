import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

export const CasesSection = () => {
  const cases = [
    {
      company: 'Интернет-магазин электроники',
      industry: 'E-commerce',
      icon: 'ShoppingCart',
      problem: 'Клиенты уходили из-за долгих ответов на вопросы о характеристиках товаров',
      solution: 'Подключили AI-консультанта с загруженными спецификациями всех товаров',
      results: [
        'Конверсия выросла на 43%',
        'Время ответа снизилось с 4 часов до 3 секунд',
        'Сэкономили 180 000₽/мес на зарплате операторов'
      ],
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      company: 'Стоматологическая клиника',
      industry: 'Медицина',
      icon: 'Heart',
      problem: 'Администраторы не успевали отвечать на однотипные вопросы о ценах и услугах',
      solution: 'Внедрили AI-бота с прайсом, описаниями услуг и FAQ',
      results: [
        'Количество записей выросло на 67%',
        'Освободили 8 часов/день администраторов',
        'Работа с клиентами 24/7, даже ночью'
      ],
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      company: 'Отель на 40 номеров',
      industry: 'Гостиничный бизнес',
      icon: 'Hotel',
      problem: 'Администраторы не успевали отвечать на вопросы о номерах, ценах, бронировании 24/7',
      solution: 'Внедрили AI-консультанта с информацией о номерах, услугах, правилах отеля',
      results: [
        'Бронирований стало больше на 52%',
        'Ответы на вопросы даже ночью и в выходные',
        'Освободили администраторов от 80% рутинных вопросов'
      ],
      gradient: 'from-purple-500 to-pink-500'
    }
  ];

  return (
    <div id="cases" className="bg-slate-50 py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-block mb-4 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
            <p className="text-sm font-semibold text-green-700 flex items-center gap-2">
              <Icon name="TrendingUp" size={16} />
              Реальные результаты наших клиентов
            </p>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
            Как AI-консультант помогает бизнесу
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Компании из разных сфер уже увеличили продажи и сократили расходы
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
          {cases.map((caseItem, index) => (
            <Card key={index} className="hover:shadow-2xl transition-all hover:-translate-y-2">
              <CardContent className="pt-8">
                <div className={`w-16 h-16 bg-gradient-to-br ${caseItem.gradient} rounded-2xl flex items-center justify-center mb-4`}>
                  <Icon name={caseItem.icon as any} size={32} className="text-white" />
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">
                    {caseItem.company}
                  </h3>
                  <p className="text-sm text-slate-500">{caseItem.industry}</p>
                </div>
                
                <div className="mb-4 pb-4 border-b border-slate-200">
                  <p className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-2">
                    <Icon name="AlertCircle" size={16} />
                    Проблема:
                  </p>
                  <p className="text-sm text-slate-700">{caseItem.problem}</p>
                </div>

                <div className="mb-4 pb-4 border-b border-slate-200">
                  <p className="text-sm font-semibold text-blue-600 mb-2 flex items-center gap-2">
                    <Icon name="Lightbulb" size={16} />
                    Решение:
                  </p>
                  <p className="text-sm text-slate-700">{caseItem.solution}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-green-600 mb-3 flex items-center gap-2">
                    <Icon name="CheckCircle" size={16} />
                    Результаты:
                  </p>
                  <ul className="space-y-2">
                    {caseItem.results.map((result, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                        <Icon name="ArrowRight" size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{result}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};