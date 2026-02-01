// Конфигурация приложения для работы на любом домене
export const APP_CONFIG = {
  // Базовый URL - всегда текущий домен (ai-ru.ru или poehali.dev)
  baseUrl: typeof window !== 'undefined' ? window.location.origin : 'https://ai-ru.ru',
  
  // API endpoints - всегда абсолютные
  apiUrl: 'https://functions.poehali.dev',
  
  // CDN для файлов
  cdnUrl: 'https://cdn.poehali.dev'
};

// Хелпер для создания внутренних ссылок
export const getAppUrl = (path: string = '') => {
  const base = APP_CONFIG.baseUrl;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
};
