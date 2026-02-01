import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-2xl animate-fade-in">
        <CardHeader className="text-center border-b bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Icon name="CheckCircle" size={48} className="text-green-600" />
          </div>
          <CardTitle className="text-3xl text-green-900">Оплата прошла успешно!</CardTitle>
          <p className="text-slate-600 mt-2">Ваша подписка активирована</p>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Icon name="Mail" size={24} className="text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2 text-lg">
                  Проверьте вашу почту
                </h3>
                <p className="text-blue-800 text-sm leading-relaxed">
                  Мы отправили на ваш email логин и пароль для входа в систему. 
                  Если письмо не пришло в течение 5 минут, проверьте папку "Спам".
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 text-lg flex items-center gap-2">
              <Icon name="ListChecks" size={20} />
              Что дальше?
            </h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <Badge className="bg-primary text-white shrink-0">1</Badge>
                <div>
                  <p className="font-medium text-slate-900">Получите доступы на email</p>
                  <p className="text-sm text-slate-600">
                    Логин и пароль для входа в админ-панель
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Badge className="bg-primary text-white shrink-0">2</Badge>
                <div>
                  <p className="font-medium text-slate-900">Войдите в систему</p>
                  <p className="text-sm text-slate-600">
                    Перейдите в админ-панель по ссылке из письма
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Badge className="bg-primary text-white shrink-0">3</Badge>
                <div>
                  <p className="font-medium text-slate-900">Загрузите документы</p>
                  <p className="text-sm text-slate-600">
                    Добавьте PDF-файлы с информацией о вашем бизнесе
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Badge className="bg-primary text-white shrink-0">4</Badge>
                <div>
                  <p className="font-medium text-slate-900">Настройте каналы связи</p>
                  <p className="text-sm text-slate-600">
                    Подключите Telegram, VK, MAX самостоятельно или с помощью наших специалистов. Бот доступен по прямой ссылке и есть код для встраивания на сайт
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Badge className="bg-primary text-white shrink-0">5</Badge>
                <div>
                  <p className="font-medium text-slate-900">Всё готово!</p>
                  <p className="text-sm text-slate-600">
                    AI-консультант начнёт отвечать на вопросы клиентов
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Icon name="Info" size={18} className="text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-900">
                <p className="font-medium mb-1">Важно:</p>
                <p className="text-amber-800">
                  Ваша подписка активна 30 дней с момента оплаты. 
                  За 3 дня до окончания мы отправим напоминание на email.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-6 space-y-4">
            <h3 className="font-semibold text-slate-900 text-lg flex items-center gap-2">
              <Icon name="HelpCircle" size={20} />
              Нужна помощь?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <a 
                href="https://max.ru/u/f9LHodD0cOIrknUlAYx1LxuVyfuHRhIq-OHhkpPMbwJ_WcjW4dhTFpEEez0" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 border rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Icon name="MessageCircle" size={20} className="text-blue-600" />
                <div>
                  <p className="font-medium text-sm">MAX-чат</p>
                  <p className="text-xs text-slate-600">Быстрая поддержка</p>
                </div>
              </a>
              <a 
                href="mailto:info@298100.ru"
                className="flex items-center gap-2 p-3 border rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Icon name="Mail" size={20} className="text-green-600" />
                <div>
                  <p className="font-medium text-sm">Email</p>
                  <p className="text-xs text-slate-600">info@298100.ru</p>
                </div>
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={() => navigate('/admin')} 
              className="flex-1"
              size="lg"
            >
              <Icon name="LogIn" className="mr-2" size={18} />
              Войти в админ-панель
            </Button>
            <Button 
              onClick={() => navigate('/')} 
              variant="outline"
              className="flex-1"
              size="lg"
            >
              <Icon name="Home" className="mr-2" size={18} />
              На главную ({countdown}с)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;