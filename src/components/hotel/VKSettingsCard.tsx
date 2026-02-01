import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch, getTenantId } from '@/lib/auth';
import { BACKEND_URLS } from './types';

interface VKSettingsCardProps {
  webhookUrl: string;
  chatFunctionUrl: string;
}

const VKSettingsCard = ({ webhookUrl, chatFunctionUrl }: VKSettingsCardProps) => {
  const [groupToken, setGroupToken] = useState('');
  const [groupId, setGroupId] = useState('');
  const [secretKey, setSecretKey] = useState('');
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
        const gId = data.keys.find((k: any) => k.provider === 'vk' && k.key_name === 'group_id');
        const gToken = data.keys.find((k: any) => k.provider === 'vk' && k.key_name === 'group_token');
        const sKey = data.keys.find((k: any) => k.provider === 'vk' && k.key_name === 'secret_key');
        if (gId?.has_value) setGroupId('********');
        if (gToken?.has_value) setGroupToken('********');
        if (sKey?.has_value) setSecretKey('********');
        
        // Если все ключи заполнены, показываем как настроено
        if (gId?.has_value && gToken?.has_value && sKey?.has_value) {
          setWebhookStatus('active');
        }
      }
    } catch (error) {
      console.error('Error loading VK settings:', error);
    }
  };

  const saveSettings = async (gId: string, gToken: string, sKey: string) => {
    if (gId === '********' || gToken === '********') {
      return;
    }
    const keysToSave = [
      { provider: 'vk', key_name: 'group_id', key_value: gId },
      { provider: 'vk', key_name: 'group_token', key_value: gToken }
    ];
    
    if (sKey && sKey !== '********') {
      keysToSave.push({ provider: 'vk', key_name: 'secret_key', key_value: sKey });
    }
    
    await authenticatedFetch(`${BACKEND_URLS.manageApiKeys}?tenant_id=${tenantId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: keysToSave })
    });
  };

  const handleSetupBot = async () => {
    if (!groupToken.trim() || !groupId.trim() || groupToken === '********' || groupId === '********') {
      toast({
        title: 'Ошибка',
        description: 'Введите новые значения',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`https://api.vk.com/method/groups.getById?group_id=${groupId}&access_token=${groupToken}&v=5.131`);
      const data = await response.json();

      if (data.response && data.response.length > 0) {
        await saveSettings(groupId, groupToken, secretKey);
        setWebhookStatus('active');
        toast({
          title: 'Успешно!',
          description: 'VK-бот подключен и сохранен'
        });
      } else {
        throw new Error(data.error?.error_msg || 'Ошибка проверки токена');
      }
    } catch (error: any) {
      setWebhookStatus('error');
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось настроить VK бота',
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
        `${BACKEND_URLS.checkMessengerWebhook}?tenant_id=${tenantId}&messenger=vk&webhook_url=${encodeURIComponent(webhookUrl)}`
      );
      const data = await response.json();

      if (data.status === 'active') {
        setWebhookStatus('active');
        toast({
          title: '✓ VK бот настроен',
          description: data.message || 'Все ключи сохранены и активны'
        });
      } else if (data.status === 'error') {
        setWebhookStatus('error');
        toast({
          title: 'Ошибка настройки',
          description: data.message || 'Проверьте ключи',
          variant: 'destructive'
        });
      } else if (data.status === 'not_configured') {
        setWebhookStatus('not_set');
        toast({
          title: 'Ключи не найдены',
          description: 'Введите все ключи и нажмите "Подключить бота"',
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
      <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-blue-50">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="Send" size={20} />
            VK-бот
          </div>
          {getStatusBadge()}
        </CardTitle>
        <CardDescription>Подключите бота для работы через ВКонтакте</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            Токен группы
          </label>
          <Input
            type="password"
            value={groupToken}
            onChange={(e) => setGroupToken(e.target.value)}
            placeholder="vk1.a.xxxxxxxx..."
            className="font-mono text-sm"
          />
          <p className="text-xs text-slate-500 mt-2">
            Получите токен в разделе "Настройки → Работа с API" вашей группы VK
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            ID группы
          </label>
          <Input
            type="text"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            placeholder="123456789"
            className="font-mono text-sm"
          />
          <p className="text-xs text-slate-500 mt-2">
            Укажите без знака минус (только цифры)
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            Секретный ключ (опционально)
          </label>
          <Input
            type="password"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            placeholder="secret_key_123"
            className="font-mono text-sm"
          />
          <p className="text-xs text-slate-500 mt-2">
            Секретный ключ из настроек Callback API группы
          </p>
        </div>

        <div className="space-y-2">
          <Button
            onClick={handleSetupBot}
            disabled={isLoading || !groupToken.trim() || !groupId.trim()}
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
                    : 'Проверьте токен и ID группы'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="border-t pt-4 space-y-2">
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-xs font-medium text-slate-700 mb-1">Callback API URL:</p>
            <code className="text-xs text-slate-600 break-all">{webhookUrl}?tenant_id={tenantId}</code>
          </div>
          <p className="text-xs text-slate-500">
            Используйте этот URL в настройках Callback API вашей группы VK
          </p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg text-sm space-y-3">
          <div className="flex items-start gap-2">
            <Icon name="Info" size={16} className="text-purple-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-purple-900 mb-2">📋 Инструкция по подключению VK-бота:</p>
              <ol className="text-purple-800 space-y-2 list-decimal list-inside">
                <li className="pl-1"><strong>Создайте группу:</strong> зайдите на <a href="https://vk.com/groups" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-950">vk.com/groups</a> → "Создать сообщество" → выберите тип (Компания/Бизнес)</li>
                <li className="pl-1"><strong>Включите сообщения:</strong> Настройки → Сообщения → включите "Сообщения сообщества"</li>
                <li className="pl-1"><strong>Получите токен:</strong> Настройки → Работа с API → "Создать ключ доступа" → дайте права "Управление сообществом" и "Сообщения"</li>
                <li className="pl-1"><strong>Узнайте ID группы:</strong> скопируйте цифры из адреса страницы <code className="bg-purple-100 px-1 rounded">vk.com/club123456789</code> (без минуса!)</li>
                <li className="pl-1"><strong>Настройте Callback API:</strong> Настройки → Callback API → включите API → вставьте Callback API URL (указан выше) → подтвердите</li>
                <li className="pl-1"><strong>Включите события:</strong> в разделе "Типы событий" отметьте <code className="bg-purple-100 px-1 rounded">message_new</code> (Новое сообщение)</li>
                <li className="pl-1"><strong>Запустите:</strong> вставьте токен и ID группы в поля выше → нажмите "Подключить бота" → напишите сообщение группе</li>
              </ol>
              <div className="mt-3 pt-3 border-t border-purple-200">
                <p className="text-purple-900 font-medium mb-1">💡 Полезные ссылки:</p>
                <ul className="text-purple-700 text-xs space-y-1">
                  <li>• <a href="https://vk.com/groups" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-900">Создать сообщество</a> — новая группа ВК</li>
                  <li>• <a href="https://dev.vk.com/api/callback/getting-started" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-900">Официальная документация</a> Callback API</li>
                  <li>• <a href="https://dev.vk.com/api/bots/getting-started" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-900">Руководство</a> по ботам VK</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VKSettingsCard;