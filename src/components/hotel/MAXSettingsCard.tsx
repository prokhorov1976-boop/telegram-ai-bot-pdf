import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch, getTenantId } from '@/lib/auth';
import { BACKEND_URLS } from './types';

interface MAXSettingsCardProps {
  webhookUrl: string;
  chatFunctionUrl: string;
}

const MAXSettingsCard = ({ webhookUrl, chatFunctionUrl }: MAXSettingsCardProps) => {
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
        const token = data.keys.find((k: any) => k.provider === 'max' && k.key_name === 'bot_token');
        if (token?.has_value) {
          setBotToken('********');
          setWebhookStatus('active');
        }
      }
    } catch (error) {
      console.error('Error loading MAX settings:', error);
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
          provider: 'max',
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
      const response = await authenticatedFetch(
        `${BACKEND_URLS.maxSetup}?action=verify&tenant_id=${tenantId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bot_token: botToken })
        }
      );
      const data = await response.json();

      if (data.ok) {
        await saveSettings(botToken);
        
        const webhookResponse = await authenticatedFetch(
          `${BACKEND_URLS.maxSetup}?action=setup_webhook&tenant_id=${tenantId}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              bot_token: botToken,
              webhook_url: webhookUrl
            })
          }
        );
        const webhookData = await webhookResponse.json();

        if (webhookData.ok) {
          setWebhookStatus('active');
          toast({
            title: 'Успешно!',
            description: 'MAX-бот подключен и готов к работе'
          });
          
          // Автоматически проверяем статус через 2 секунды
          setTimeout(() => {
            handleCheckWebhook();
          }, 2000);
        } else {
          throw new Error(webhookData.description || 'Ошибка настройки webhook');
        }
      } else {
        throw new Error(data.error || 'Ошибка проверки токена');
      }
    } catch (error: any) {
      setWebhookStatus('error');
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось настроить MAX бота',
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
        `${BACKEND_URLS.checkMessengerWebhook}?tenant_id=${tenantId}&messenger=max&webhook_url=${encodeURIComponent(webhookUrl)}`
      );
      const data = await response.json();

      if (data.status === 'active') {
        setWebhookStatus('active');
        toast({
          title: '✓ MAX бот настроен',
          description: data.message || 'Токен сохранен и активен'
        });
      } else if (data.status === 'error') {
        setWebhookStatus('error');
        toast({
          title: 'Ошибка настройки',
          description: data.message || 'Проверьте токен',
          variant: 'destructive'
        });
      } else if (data.status === 'not_configured') {
        setWebhookStatus('not_set');
        toast({
          title: 'Токен не найден',
          description: 'Введите токен и нажмите "Подключить бота"',
          variant: 'destructive'
        });
      } else {
        setWebhookStatus('not_set');
        toast({
          title: 'Не настроено',
          description: 'Нажмите "Подключить бота" для настройки',
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
      <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-purple-50">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="Bot" size={20} />
            MAX-бот
          </div>
          {getStatusBadge()}
        </CardTitle>
        <CardDescription>Подключите бота для работы через MAX (max.ru)</CardDescription>
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
            Получите токен у <a href="https://max.ru/developers/bots" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@MaxBotFather</a>
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
                {botToken === '********' ? 'Подключение...' : 'Сохранение и подключение...'}
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
            disabled={isLoading}
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

        <div className="bg-purple-50 p-4 rounded-lg text-sm space-y-2">
          <div className="flex items-start gap-2">
            <Icon name="Info" size={16} className="text-purple-600 mt-0.5" />
            <div>
              <p className="font-medium text-purple-900">Как подключить:</p>
              <ol className="text-purple-800 mt-2 space-y-1 list-decimal list-inside">
                <li>Зарегистрируйтесь на платформе MAX</li>
                <li>Создайте бота через @MaxBotFather</li>
                <li>Скопируйте токен и вставьте выше</li>
                <li>Нажмите "Подключить бота"</li>
                <li>Готово! Напишите боту в MAX</li>
              </ol>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MAXSettingsCard;