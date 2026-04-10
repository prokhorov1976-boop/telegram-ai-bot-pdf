import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { getCompanyInfo } from '@/lib/company-info';

export const ContactSection = () => {
  const company = getCompanyInfo();
  const phoneTel = company.phone.replace(/\D/g, '');

  return (
    <div id="pricing" className="bg-slate-50 py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <div className="inline-block mb-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
            <p className="text-sm font-semibold text-primary flex items-center gap-2">
              <Icon name="Sparkles" size={16} />
              Подключение по заявке
            </p>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
            Свяжитесь с нами
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Расскажите о задаче — подберём решение, обучим бота на ваших документах
            и запустим его за 24 часа. Настройку и подключение делаем мы.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-10">
          <Card className="border-2 border-blue-100 hover:border-primary hover:shadow-xl transition-all">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon name="Mail" size={28} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Email</h3>
              <p className="text-slate-600 mb-4">Ответим в течение часа</p>
              <Button asChild className="w-full" size="lg">
                <a href={`mailto:${company.email}`}>
                  <Icon name="Send" size={18} className="mr-2" />
                  {company.email}
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-100 hover:border-green-500 hover:shadow-xl transition-all">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon name="Phone" size={28} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Телефон</h3>
              <p className="text-slate-600 mb-4">Пн–Пт с 9:00 до 19:00 МСК</p>
              <Button asChild variant="outline" className="w-full border-2" size="lg">
                <a href={`tel:${phoneTel}`}>
                  <Icon name="PhoneCall" size={18} className="mr-2" />
                  {company.phone}
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-100 hover:border-purple-500 hover:shadow-xl transition-all">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon name="MessageSquare" size={28} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">MAX</h3>
              <p className="text-slate-600 mb-4">Отвечаем в течение 10 минут</p>
              <Button asChild variant="outline" className="w-full border-2" size="lg">
                <a
                  href="https://max.ru/u/f9LHodD0cOIrknUlAYx1LxuVyfuHRhIq-OHhkpPMbwJ_WcjW4dhTFpEEez0"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon name="ExternalLink" size={18} className="mr-2" />
                  Написать в MAX
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-100 hover:border-orange-500 hover:shadow-xl transition-all">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon name="MessageCircle" size={28} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Попробовать бота</h3>
              <p className="text-slate-600 mb-4">Демо-чат работает прямо сейчас</p>
              <Button asChild variant="outline" className="w-full border-2" size="lg">
                <a href="/try-bot">
                  <Icon name="Play" size={18} className="mr-2" />
                  Открыть демо
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="bg-white border-2 border-slate-200">
            <CardContent className="pt-8 pb-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center">
                Как мы работаем
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 text-primary rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                    1
                  </div>
                  <h4 className="font-semibold text-slate-900 mb-2">Заявка</h4>
                  <p className="text-sm text-slate-600">
                    Вы пишете нам на почту или в MAX, рассказываете о задаче
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 text-primary rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                    2
                  </div>
                  <h4 className="font-semibold text-slate-900 mb-2">Обсуждение</h4>
                  <p className="text-sm text-slate-600">
                    Согласовываем условия, вы передаёте документы для обучения бота
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 text-primary rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                    3
                  </div>
                  <h4 className="font-semibold text-slate-900 mb-2">Запуск</h4>
                  <p className="text-sm text-slate-600">
                    За 24 часа настраиваем бота и передаём доступ к личному кабинету
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ContactSection;
