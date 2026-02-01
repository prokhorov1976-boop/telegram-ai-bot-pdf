import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

const SEOResourcesCard = () => {
  const seoResources = [
    {
      icon: 'Search',
      title: 'Google Search Console',
      description: 'Отправьте sitemap и запросите индексацию',
      url: 'https://search.google.com/search-console',
      color: 'text-blue-600'
    },
    {
      icon: 'Globe',
      title: 'Яндекс.Вебмастер',
      description: 'Добавьте сайт и отправьте sitemap',
      url: 'https://webmaster.yandex.ru',
      color: 'text-red-600'
    },
    {
      icon: 'Search',
      title: 'Bing Webmaster Tools',
      description: 'Можно импортировать из Google',
      url: 'https://www.bing.com/webmasters',
      color: 'text-cyan-600'
    },
    {
      icon: 'Zap',
      title: 'IndexNow',
      description: 'Мгновенная индексация (автоматически)',
      url: 'https://www.indexnow.org',
      color: 'text-purple-600'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="ExternalLink" size={24} />
          Полезные SEO сервисы
        </CardTitle>
        <CardDescription>
          Ресурсы для управления индексацией и мониторинга сайта
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {seoResources.map((resource, index) => (
            <a
              key={index}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-4 p-4 rounded-lg border border-slate-200 hover:border-primary hover:bg-slate-50 transition-all"
            >
              <div className={`w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center ${resource.color}`}>
                <Icon name={resource.icon as any} size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
                  {resource.title}
                  <Icon name="ExternalLink" size={14} className="text-slate-400" />
                </h4>
                <p className="text-sm text-slate-600">{resource.description}</p>
              </div>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SEOResourcesCard;
