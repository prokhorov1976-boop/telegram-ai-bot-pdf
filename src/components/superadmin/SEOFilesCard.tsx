import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

const SEOFilesCard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="FileText" size={24} />
          SEO файлы и настройки
        </CardTitle>
        <CardDescription>
          Автоматически созданные файлы для поисковых систем
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
            <div className="flex items-center gap-3">
              <Icon name="FileCode" size={20} className="text-blue-600" />
              <div>
                <div className="font-medium">robots.txt</div>
                <div className="text-xs text-slate-500">Правила для поисковых ботов</div>
              </div>
            </div>
            <a 
              href="https://ai-ru.ru/robots.txt" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Открыть
              <Icon name="ExternalLink" size={14} />
            </a>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
            <div className="flex items-center gap-3">
              <Icon name="Map" size={20} className="text-green-600" />
              <div>
                <div className="font-medium">sitemap.xml</div>
                <div className="text-xs text-slate-500">Карта сайта для индексации</div>
              </div>
            </div>
            <a 
              href="https://ai-ru.ru/sitemap.xml" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Открыть
              <Icon name="ExternalLink" size={14} />
            </a>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
            <div className="flex items-center gap-3">
              <Icon name="Key" size={20} className="text-purple-600" />
              <div>
                <div className="font-medium">indexnow-key.txt</div>
                <div className="text-xs text-slate-500">Ключ для IndexNow API</div>
              </div>
            </div>
            <a 
              href="https://ai-ru.ru/indexnow-key.txt" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Открыть
              <Icon name="ExternalLink" size={14} />
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SEOFilesCard;
