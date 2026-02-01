import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MARKETING_CONTENT } from './marketingContent';

const MarketingContentCard = () => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const exportLandingTexts = () => {
    setIsExporting(true);

    try {
      const blob = new Blob([MARKETING_CONTENT], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'AI-konsultant-marketing-content.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Файл скачан!',
        description: 'Маркетинговый контент готов для создания рекламы',
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать файл',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="FileText" size={24} />
          Маркетинговый контент
        </CardTitle>
        <CardDescription>
          Экспорт всех текстов с лендинга для создания рекламных объявлений
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Icon name="Lightbulb" size={16} />
          <AlertDescription>
            Файл содержит полное описание продукта, тарифы, преимущества, кейсы, отзывы и ключевые слова. 
            Используйте его для создания рекламы в Яндекс.Директ, Google Ads, соцсетях и для обучения AI-копирайтеров.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
            <h4 className="font-semibold text-slate-900 mb-2">Что включено:</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>✓ Полное описание продукта</li>
              <li>✓ Все тарифы и цены</li>
              <li>✓ Ключевые преимущества</li>
              <li>✓ Технология векторных БД</li>
              <li>✓ Кейсы использования</li>
              <li>✓ Отзывы клиентов</li>
              <li>✓ FAQ</li>
              <li>✓ Ключевые слова для рекламы</li>
            </ul>
          </div>

          <div className="p-4 rounded-lg border border-blue-200 bg-blue-50">
            <h4 className="font-semibold text-blue-900 mb-2">Для чего использовать:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Яндекс.Директ объявления</li>
              <li>• Google Ads кампании</li>
              <li>• Посты в соцсетях</li>
              <li>• Email рассылки</li>
              <li>• Обучение ChatGPT/Claude</li>
              <li>• Брифы для копирайтеров</li>
              <li>• Презентации для клиентов</li>
              <li>• Контент-план</li>
            </ul>
          </div>
        </div>

        <Button 
          onClick={exportLandingTexts} 
          disabled={isExporting}
          size="lg"
          variant="default"
          className="w-full"
        >
          {isExporting ? (
            <>
              <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
              Создание файла...
            </>
          ) : (
            <>
              <Icon name="Download" size={20} className="mr-2" />
              Скачать маркетинговый контент (.txt)
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default MarketingContentCard;
