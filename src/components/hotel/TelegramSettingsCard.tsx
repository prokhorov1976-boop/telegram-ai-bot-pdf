import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch, getTenantId } from '@/lib/auth';
import { BACKEND_URLS } from './types';

interface TelegramSettingsCardProps {
  webhookUrl: string;
  chatFunctionUrl: string;
}

const TelegramSettingsCard = ({ webhookUrl, chatFunctionUrl }: TelegramSettingsCardProps) => {
  const [botToken, setBotToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<'not_set' | 'active' | 'error'>('not_set');
  const { toast } = useToast();
  const tenantId = getTenantId();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await authenticatedFetch(`${BACKEND_URLS.manageApiKeys}?tenant_id=${tenantId}`);
      const data = await response.json();
      if (data.keys) {
        const token = data.keys.find((k: any) => k.provider === 'telegram' && k.key_name === 'bot_token');
        if (token?.has_value) {
          setBotToken('********');
          // Если токен есть, показываем статус как "настроено"
          setWebhookStatus('active');
        }
      }
    } catch (error) {
      console.error('Error loading Telegram settings:', error);
    }
  };

  const saveSettings = async (token: string) => {
    if (token === '********') {
      return;
    }
    await authenticatedFetch(`${BACKEND_URLS.manageApiKeys}?tenant_id=${tenantId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keys: [{
          provider: 'telegram',
          key_name: 'bot_token',
          key_value: token
        }]
      })
    });
  };

  const handleSetupBot = async () => {
    if (!botToken.trim() || botToken === '********') {
      toast({
        title: 'Ошибка',
        description: 'Введите новый токен бота',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const webhookUrlWithToken = `${webhookUrl}?bot_token=${botToken}`;
      const telegramApiUrl = `https://api.telegram.org/bot${botToken}/setWebhook?url=${encodeURIComponent(webhookUrlWithToken)}`;
      
      const response = await fetch(telegramApiUrl);
      const data = await response.json();

      if (data.ok) {
        await saveSettings(botToken);
        setWebhookStatus('active');
        toast({
          title: 'Успешно!',
          description: 'Telegram-бот подключен и сохранен'
        });
      } else {
        throw new Error(data.description || 'Ошибка подключения');
      }
    } catch (error: any) {
      setWebhookStatus('error');
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось настроить webhook',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckWebhook = async () => {
    setIsLoading(true);

    try {
      const response = await authenticatedFetch(
        `${BACKEND_URLS.checkMessengerWebhook}?tenant_id=${tenantId}&messenger=telegram&webhook_url=${encodeURIComponent(webhookUrl)}`
      );
      const data = await response.json();
      
      if (data.status === 'active') {
        setWebhookStatus('active');
        toast({
          title: '✓ Webhook активен',
          description: data.message || 'Бот настроен корректно'
        });
      } else if (data.status === 'error') {
        setWebhookStatus('error');
        toast({
          title: 'Некорректный webhook',
          description: data.message || `URL: ${data.webhook_url}`,
          variant: 'destructive'
        });
      } else if (data.status === 'not_set') {
        setWebhookStatus('not_set');
        toast({
          title: 'Webhook не настроен',
          description: data.message || 'Нажмите "Подключить бота" для настройки',
          variant: 'destructive'
        });
      } else if (data.status === 'not_configured') {
        setWebhookStatus('not_set');
        toast({
          title: 'Токен не найден',
          description: 'Введите токен бота и нажмите "Подключить бота"',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось проверить webhook',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (webhookStatus === 'active') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
          <Icon name="CheckCircle" size={12} />
          Подключено
        </span>
      );
    }
    if (webhookStatus === 'error') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
          <Icon name="XCircle" size={12} />
          Ошибка
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
        <Icon name="Circle" size={12} />
        Не настроено
      </span>
    );
  };

  return (
    <Card className="shadow-xl">
      <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-blue-50">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="MessageCircle" size={20} />
            Telegram-бот
          </div>
          {getStatusBadge()}
        </CardTitle>
        <CardDescription>Подключите бота для работы через Telegram</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            Токен бота
          </label>
          <Input
            type="password"
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
            className="font-mono text-sm"
          />
          <p className="text-xs text-slate-500 mt-2">
            Получите токен у <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@BotFather</a>
          </p>
        </div>

        <div className="space-y-2">
          <Button
            onClick={handleSetupBot}
            disabled={isLoading || !botToken.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                Подключение...
              </>
            ) : (
              <>
                <Icon name="Link" size={16} className="mr-2" />
                Подключить бота
              </>
            )}
          </Button>

          <Button
            onClick={handleCheckWebhook}
            disabled={isLoading || !botToken.trim()}
            variant="outline"
            className="w-full"
          >
            <Icon name="Info" size={16} className="mr-2" />
            Проверить статус
          </Button>
        </div>

        {webhookStatus !== 'not_set' && (
          <div className={`p-4 rounded-lg ${
            webhookStatus === 'active' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start gap-2">
              <Icon 
                name={webhookStatus === 'active' ? 'CheckCircle' : 'XCircle'} 
                size={18} 
                className={webhookStatus === 'active' ? 'text-green-600' : 'text-red-600'} 
              />
              <div className="flex-1">
                <p className={`font-medium text-sm ${
                  webhookStatus === 'active' ? 'text-green-900' : 'text-red-900'
                }`}>
                  {webhookStatus === 'active' ? 'Бот активен' : 'Ошибка подключения'}
                </p>
                <p className={`text-xs mt-1 ${
                  webhookStatus === 'active' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {webhookStatus === 'active' 
                    ? 'Бот готов принимать сообщения' 
                    : 'Проверьте токен и попробуйте снова'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="border-t pt-4 space-y-2">
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-xs font-medium text-slate-700 mb-1">Webhook URL:</p>
            <code className="text-xs text-slate-600 break-all">{webhookUrl}</code>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-xs font-medium text-slate-700 mb-1">Chat Function URL:</p>
            <code className="text-xs text-slate-600 break-all">{chatFunctionUrl}</code>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg text-sm space-y-3">
          <div className="flex items-start gap-2">
            <Icon name="Info" size={16} className="text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-blue-900 mb-2">📋 Инструкция по подключению Telegram-бота:</p>
              <ol className="text-blue-800 space-y-2 list-decimal list-inside">
                <li className="pl-1"><strong>Создайте бота:</strong> напишите @BotFather в Telegram → отправьте команду <code className="bg-blue-100 px-1 rounded">/newbot</code> → придумайте имя и username для бота</li>
                <li className="pl-1"><strong>Получите токен:</strong> BotFather отправит токен вида <code className="bg-blue-100 px-1 rounded">1234567890:ABCdefGHI...</code></li>
                <li className="pl-1"><strong>Вставьте токен:</strong> скопируйте токен и вставьте в поле выше</li>
                <li className="pl-1"><strong>Подключите:</strong> нажмите кнопку "Подключить бота" — webhook будет настроен автоматически</li>
                <li className="pl-1"><strong>Проверьте:</strong> найдите своего бота в Telegram (по username) и напишите ему <code className="bg-blue-100 px-1 rounded">/start</code></li>
              </ol>
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-blue-900 font-medium mb-1">💡 Полезные ссылки:</p>
                <ul className="text-blue-700 text-xs space-y-1">
                  <li>• <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">@BotFather</a> — создание ботов</li>
                  <li>• <a href="https://core.telegram.org/bots#how-do-i-create-a-bot" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">Официальная документация</a> Telegram</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TelegramSettingsCard;