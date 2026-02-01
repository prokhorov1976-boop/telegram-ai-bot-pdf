import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getAppUrl } from '@/config/app';

interface PublicChatLinkCardProps {
  tenantSlug?: string;
}

const PublicChatLinkCard = ({ tenantSlug }: PublicChatLinkCardProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  const publicChatUrl = tenantSlug 
    ? `https://ai-ru.ru/${tenantSlug}/chat`
    : 'https://ai-ru.ru/your-slug/chat';

  const handleCopy = () => {
    navigator.clipboard.writeText(publicChatUrl);
    setCopied(true);
    toast({
      title: 'Скопировано',
      description: 'Ссылка скопирована в буфер обмена'
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpen = () => {
    window.open(publicChatUrl, '_blank');
  };

  return (
    <Card className="shadow-xl border-2 border-blue-200">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <CardTitle className="flex items-center gap-2">
          <Icon name="ExternalLink" size={20} />
          Публичная страница чата
        </CardTitle>
        <CardDescription>
          Прямая ссылка на чат без виджета для встройки или распространения
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-slate-600">
            Эту ссылку можно использовать для:
          </p>
          <ul className="text-sm text-slate-600 space-y-1 ml-4">
            <li className="flex items-start gap-2">
              <Icon name="Check" size={16} className="text-green-600 mt-0.5" />
              <span>Размещения в соцсетях и мессенджерах</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="Check" size={16} className="text-green-600 mt-0.5" />
              <span>Встройки в iframe на другие сайты</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="Check" size={16} className="text-green-600 mt-0.5" />
              <span>QR-кода для быстрого доступа</span>
            </li>
          </ul>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Ссылка на чат</label>
          <div className="flex gap-2">
            <Input
              value={publicChatUrl}
              readOnly
              className="font-mono text-sm bg-slate-50"
            />
            <Button
              onClick={handleCopy}
              variant="outline"
              className="flex-shrink-0"
            >
              <Icon name={copied ? "Check" : "Copy"} size={16} />
            </Button>
            <Button
              onClick={handleOpen}
              variant="default"
              className="flex-shrink-0"
            >
              <Icon name="ExternalLink" size={16} />
            </Button>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800 flex items-start gap-2">
            <Icon name="Info" size={16} className="mt-0.5 flex-shrink-0" />
            <span>
              Эта страница доступна всем по прямой ссылке. Для встройки виджета на свой сайт используйте код из раздела выше.
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PublicChatLinkCard;