import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link, useLocation } from 'react-router-dom';
import Icon from '@/components/ui/icon';

const COOKIE_CONSENT_KEY = 'cookie_consent_accepted';

export const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Не показываем баннер на страницах виджета
    if (location.pathname.includes('/chat')) {
      return;
    }

    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Показываем баннер через 1 секунду после загрузки страницы
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'false');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <Card className="max-w-4xl mx-auto shadow-2xl border-2">
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Icon name="Cookie" size={24} className="text-blue-600" />
              </div>
            </div>
            
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-lg">Мы используем cookies</h3>
              <p className="text-sm text-muted-foreground">
                Этот сайт использует файлы cookie для обеспечения функционирования, 
                улучшения производительности и персонализации. Продолжая использовать сайт, 
                вы соглашаетесь с использованием cookies в соответствии с нашей{' '}
                <Link to="/privacy-policy" className="text-blue-600 hover:underline">
                  Политикой конфиденциальности
                </Link>.
              </p>
              <p className="text-xs text-muted-foreground">
                Мы используем cookies для сохранения вашей авторизации и улучшения работы сайта. 
                Также мы используем Яндекс.Метрику для анализа посещаемости и улучшения сервиса.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Button 
                onClick={handleAccept}
                className="whitespace-nowrap"
                size="lg"
              >
                <Icon name="Check" className="mr-2" size={16} />
                Принять
              </Button>
              <Button 
                onClick={handleDecline}
                variant="outline"
                className="whitespace-nowrap"
                size="lg"
              >
                <Icon name="X" className="mr-2" size={16} />
                Отклонить
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};