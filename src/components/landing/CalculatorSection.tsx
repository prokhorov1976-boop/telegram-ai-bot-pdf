import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useState } from 'react';

export const CalculatorSection = () => {
  const [operatorSalary, setOperatorSalary] = useState(45000);
  const [operatorsCount, setOperatorsCount] = useState(2);
  const [workHours, setWorkHours] = useState(12);

  const monthlyOperatorCost = operatorSalary * operatorsCount;
  const yearlyOperatorCost = monthlyOperatorCost * 12;
  
  // Стоимость AI зависит от тарифа, берём средний Бизнес: 19975 первый месяц + 4975*11
  const aiFirstMonth = 19975;
  const aiRenewal = 4975;
  const yearlyAICost = aiFirstMonth + (aiRenewal * 11);
  
  const monthlySavings = monthlyOperatorCost - ((aiFirstMonth + aiRenewal * 11) / 12);
  const yearlySavings = yearlyOperatorCost - yearlyAICost;
  const efficiency = workHours >= 24 ? 100 : Math.round((24 / workHours) * 100);

  const scrollToPricing = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-white py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block mb-4 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full shadow-lg">
              <p className="text-sm font-bold text-white flex items-center gap-2">
                <Icon name="Calculator" size={18} />
                Узнайте свою экономию
              </p>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
              Калькулятор экономии
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Посчитайте, сколько вы сэкономите, заменив операторов на AI-консультанта
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-2 border-blue-200 shadow-xl">
              <CardContent className="pt-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Icon name="Settings" size={24} className="text-primary" />
                  Параметры вашего бизнеса
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Зарплата одного оператора (₽/мес)
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="20000"
                        max="100000"
                        step="5000"
                        value={operatorSalary}
                        onChange={(e) => setOperatorSalary(Number(e.target.value))}
                        className="flex-1 h-3 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <div className="w-32 px-4 py-2 bg-blue-50 rounded-lg text-center">
                        <span className="text-xl font-bold text-primary">
                          {operatorSalary.toLocaleString()}₽
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Количество операторов
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={operatorsCount}
                        onChange={(e) => setOperatorsCount(Number(e.target.value))}
                        className="flex-1 h-3 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <div className="w-32 px-4 py-2 bg-blue-50 rounded-lg text-center">
                        <span className="text-xl font-bold text-primary">{operatorsCount}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Часов работы в сутки
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="8"
                        max="24"
                        step="1"
                        value={workHours}
                        onChange={(e) => setWorkHours(Number(e.target.value))}
                        className="flex-1 h-3 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <div className="w-32 px-4 py-2 bg-blue-50 rounded-lg text-center">
                        <span className="text-xl font-bold text-primary">{workHours}ч</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-slate-50 rounded-xl">
                  <h4 className="text-lg font-bold text-slate-900 mb-4">
                    Текущие расходы на операторов:
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">В месяц:</span>
                      <span className="text-2xl font-bold text-red-600">
                        {monthlyOperatorCost.toLocaleString()}₽
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-slate-600">В год:</span>
                      <span className="text-3xl font-bold text-red-600">
                        {yearlyOperatorCost.toLocaleString()}₽
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-300 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="pt-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Icon name="TrendingDown" size={24} className="text-green-600" />
                  Ваша экономия с AI
                </h3>

                <div className="space-y-6">
                  <div className="p-6 bg-white rounded-xl shadow-md">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                        <Icon name="Wallet" size={24} className="text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Экономия в месяц</p>
                        <p className="text-3xl font-bold text-green-600">
                          {monthlySavings > 0 ? monthlySavings.toLocaleString() : '0'}₽
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-white rounded-xl shadow-md">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                        <Icon name="TrendingUp" size={24} className="text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Экономия в год</p>
                        <p className="text-4xl font-bold text-green-600">
                          {yearlySavings > 0 ? yearlySavings.toLocaleString() : '0'}₽
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-md text-white">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                        <Icon name="Zap" size={24} className="text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-white/90">Эффективность</p>
                        <p className="text-4xl font-bold text-white">{efficiency}%</p>
                      </div>
                    </div>
                    <p className="text-sm text-white/90">
                      {workHours >= 24 
                        ? 'AI работает 24/7 без выходных!' 
                        : `AI может работать ${24 - workHours} часов дополнительно`
                      }
                    </p>
                  </div>

                  <div className="p-6 bg-white rounded-xl shadow-md">
                    <h4 className="font-bold text-slate-900 mb-3">Дополнительные бонусы:</h4>
                    <ul className="space-y-2 text-sm text-slate-700">
                      <li className="flex items-start gap-2">
                        <Icon name="Check" size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Работает 24/7 без больничных и отпусков</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon name="Check" size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Обрабатывает неограниченное количество клиентов одновременно</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon name="Check" size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Не требует обучения, всегда точные ответы</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon name="Check" size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Увеличение конверсии на 40-70%</span>
                      </li>
                    </ul>
                  </div>

                  <Button
                    size="lg"
                    onClick={scrollToPricing}
                    className="w-full text-lg py-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-emerald-600 hover:to-green-600 shadow-xl"
                  >
                    <Icon name="Rocket" className="mr-2" size={20} />
                    Начать экономить прямо сейчас
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 max-w-4xl mx-auto">
              <CardContent className="py-8">
                <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-slate-900 mb-2">
                      {Math.round(yearlySavings / 12).toLocaleString()}₽
                    </div>
                    <div className="text-slate-600">средняя экономия в месяц</div>
                  </div>
                  <div className="hidden md:block w-px h-16 bg-slate-300" />
                  <div className="text-center">
                    <div className="text-5xl font-bold text-slate-900 mb-2">
                      {Math.ceil(aiFirstMonth / (monthlySavings > 0 ? monthlySavings : 1))} мес
                    </div>
                    <div className="text-slate-600">срок окупаемости</div>
                  </div>
                  <div className="hidden md:block w-px h-16 bg-slate-300" />
                  <div className="text-center">
                    <div className="text-5xl font-bold text-green-600 mb-2">×{operatorsCount}</div>
                    <div className="text-slate-600">сэкономите на операторах</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
