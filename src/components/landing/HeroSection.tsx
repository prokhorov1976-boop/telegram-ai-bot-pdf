import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface HeroSectionProps {
  onOrderClick: () => void;
}

export const HeroSection = ({ }: HeroSectionProps) => {
  const scrollToPricing = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  };
  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-6xl mx-auto">
          <div className="inline-block mb-6 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full shadow-lg">
            <p className="text-sm font-bold text-white flex items-center gap-2">
              <Icon name="Sparkles" size={18} />
              Уже 247 компаний автоматизировали общение с клиентами
            </p>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-slate-900 mb-8 leading-tight">
            Перестаньте терять клиентов
            <br />
            <span className="bg-gradient-to-r from-primary via-blue-600 to-cyan-500 bg-clip-text text-transparent">из-за долгих ответов</span>
          </h1>
          
          <p className="text-2xl md:text-3xl text-slate-700 mb-12 max-w-4xl mx-auto font-medium" style={{ lineHeight: '1.6' }}>
            <span className="text-primary font-bold">Запустим AI-консультанта за 24 часа</span> на ваших документах.
            <br/>
            Отвечает за 3 сек. Работает 24/7. Конверсия +67%.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <Button size="lg" onClick={scrollToPricing} className="text-xl px-12 py-8 shadow-2xl hover:shadow-3xl transition-all bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary">
              <Icon name="Zap" className="mr-3" size={24} />
              Запустить за 1 день
            </Button>
            <Button size="lg" variant="outline" className="text-xl px-12 py-8 border-2 hover:bg-blue-50" asChild>
              <a href="/try-bot">
                <Icon name="MessageCircle" className="mr-3" size={24} />
                Попробовать чат-бота
              </a>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-blue-100 hover:shadow-2xl hover:-translate-y-1 transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Icon name="Target" size={28} className="text-white" />
              </div>
              <div className="text-4xl font-bold text-primary mb-2">97%</div>
              <div className="text-sm text-slate-600 font-medium">точность ответов</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-green-100 hover:shadow-2xl hover:-translate-y-1 transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Icon name="Zap" size={28} className="text-white" />
              </div>
              <div className="text-4xl font-bold text-green-600 mb-2">&lt;3 сек</div>
              <div className="text-sm text-slate-600 font-medium">среднее время ответа</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-purple-100 hover:shadow-2xl hover:-translate-y-1 transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Icon name="Clock" size={28} className="text-white" />
              </div>
              <div className="text-4xl font-bold text-purple-600 mb-2">24/7</div>
              <div className="text-sm text-slate-600 font-medium">без выходных</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-orange-100 hover:shadow-2xl hover:-translate-y-1 transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Icon name="TrendingUp" size={28} className="text-white" />
              </div>
              <div className="text-4xl font-bold text-orange-600 mb-2">+67%</div>
              <div className="text-sm text-slate-600 font-medium">рост конверсии</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};