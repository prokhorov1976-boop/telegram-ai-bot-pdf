import { useEffect, useRef } from 'react';

const INDEXNOW_URL = 'https://functions.poehali.dev/9f68c535-c71e-4e3d-a71e-dd0f905ae0c4';
const NOTIFY_DELAY = 5000; // 5 секунд после загрузки страницы

export const useSEONotify = () => {
  const hasNotified = useRef(false);

  useEffect(() => {
    // Уведомляем только один раз за сессию
    if (hasNotified.current) return;
    
    // Проверяем, не уведомляли ли мы уже в последние 24 часа
    const lastNotify = localStorage.getItem('seo_last_notify');
    const now = Date.now();
    
    if (lastNotify && now - parseInt(lastNotify) < 24 * 60 * 60 * 1000) {
      // Уведомление было менее 24 часов назад, пропускаем
      return;
    }

    // Запускаем уведомление через 5 секунд после загрузки
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(INDEXNOW_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ SEO: Поисковики автоматически уведомлены', data);
          localStorage.setItem('seo_last_notify', now.toString());
          hasNotified.current = true;
        }
      } catch (error) {
        console.error('❌ SEO: Ошибка автоуведомления', error);
      }
    }, NOTIFY_DELAY);

    return () => clearTimeout(timer);
  }, []);
};
