import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { BACKEND_URLS } from './types';
import { authenticatedFetch, getTenantId, getTariffId, isSuperAdmin as checkSuperAdmin } from '@/lib/auth';
import { hasFeatureAccess } from '@/lib/tariff-limits';

interface MessengerAutoMessagesProps {
  isSuperAdmin: boolean;
}

interface MessengerConfig {
  enabled: boolean;
  delay_seconds: number;
  message_text: string;
  repeat_enabled: boolean;
  repeat_delay_seconds: number;
}

type MessengerType = 'telegram' | 'vk' | 'max' | 'widget';

interface MessengerSettings {
  [key: string]: MessengerConfig;
}

const MESSENGERS: Array<{ id: MessengerType; label: string; icon: string }> = [
  { id: 'widget', label: 'Виджет', icon: 'MessageCircle' },
  { id: 'telegram', label: 'Telegram', icon: 'Send' },
  { id: 'vk', label: 'VK', icon: 'Users' },
  { id: 'max', label: 'MAX', icon: 'Mail' }
];

const MessengerAutoMessages = ({ isSuperAdmin }: MessengerAutoMessagesProps) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<MessengerSettings>({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<MessengerType>('widget');
  const tenantId = getTenantId();
  const tariffId = getTariffId();
  const superAdmin = checkSuperAdmin();

  const availableMessengers = MESSENGERS.filter(m => {
    if (m.id === 'widget') return true; // Виджет доступен всем
    if (superAdmin) return true; // Суперадмин видит всё
    if (m.id === 'telegram') return hasFeatureAccess('hasTelegram', tariffId);
    if (m.id === 'vk') return hasFeatureAccess('hasVK', tariffId);
    if (m.id === 'max') return hasFeatureAccess('hasMAX', tariffId);
    return false;
  });

  useEffect(() => {
    if (superAdmin) {
      loadSettings();
    }
  }, [superAdmin]);

  const loadSettings = async () => {
    try {
      const response = await authenticatedFetch(`${BACKEND_URLS.messengerAutoMessages}?tenant_id=${tenantId}`);
      const data = await response.json();
      setSettings(data.settings || {});
    } catch (error) {
      console.error('Error loading messenger auto-message settings:', error);
    }
  };

  const handleSave = async (messengerType: MessengerType) => {
    setIsLoading(true);
    try {
      const config = settings[messengerType] || getDefaultConfig();
      
      const response = await authenticatedFetch(`${BACKEND_URLS.messengerAutoMessages}?tenant_id=${tenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messenger_type: messengerType,
          ...config
        })
      });

      if (response.ok) {
        toast({
          title: '✓ Сохранено!',
          description: `Настройки автосообщений для ${MESSENGERS.find(m => m.id === messengerType)?.label} обновлены`
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить настройки',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultConfig = (): MessengerConfig => ({
    enabled: false,
    delay_seconds: 30,
    message_text: 'Могу помочь с выбором? 😊',
    repeat_enabled: true,
    repeat_delay_seconds: 60
  });

  const getCurrentConfig = (messengerType: MessengerType): MessengerConfig => {
    return settings[messengerType] || getDefaultConfig();
  };

  const updateConfig = (messengerType: MessengerType, updates: Partial<MessengerConfig>) => {
    setSettings(prev => ({
      ...prev,
      [messengerType]: {
        ...getCurrentConfig(messengerType),
        ...updates
      }
    }));
  };

  if (availableMessengers.length === 0) {
    return null;
  }

  if (!superAdmin) {
    return (
      <Card className="shadow-xl border-2 border-blue-200">
        <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardTitle className="flex items-center gap-2">
            <Icon name="Info" size={20} />
            Автосообщения
          </CardTitle>
          <CardDescription>
            Автоматическая отправка сообщений при бездействии пользователя
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Icon name="Clock" size={24} className="text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Автосообщения по умолчанию выключены</h4>
                <p className="text-sm text-blue-800 mb-3">
                  Функция автосообщений позволяет системе автоматически отправлять приветственные сообщения 
                  в виджет, Telegram, VK или MAX при бездействии пользователя.
                </p>
                <div className="bg-white rounded p-3 border border-blue-100">
                  <p className="text-sm text-slate-700 mb-2">
                    <strong>Как включить:</strong>
                  </p>
                  <p className="text-sm text-slate-600">
                    Для настройки автосообщений обратитесь к администратору системы или в службу поддержки. 
                    После активации вы сможете настроить задержку отправки и текст сообщений для каждого канала отдельно.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl border-2 border-purple-200">
      <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
        <CardTitle className="flex items-center gap-2">
          <Icon name="Clock" size={20} />
          Автосообщения (SuperAdmin)
        </CardTitle>
        <CardDescription>
          Настройка автосообщений при бездействии пользователя для каждого канала отдельно. По умолчанию выключены для всех клиентов.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MessengerType)}>
          <TabsList className={`grid w-full grid-cols-${availableMessengers.length}`}>
            {availableMessengers.map(messenger => (
              <TabsTrigger key={messenger.id} value={messenger.id} className="flex items-center gap-1">
                <Icon name={messenger.icon as any} size={14} />
                <span className="hidden sm:inline">{messenger.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {availableMessengers.map(messenger => {
            const config = getCurrentConfig(messenger.id);

            return (
              <TabsContent key={messenger.id} value={messenger.id} className="space-y-6 mt-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Icon name="Info" size={18} className="text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-1">Настройка для {messenger.label}</p>
                      <p>При бездействии пользователя система автоматически отправит сообщение в этот канал.</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <Label htmlFor={`${messenger.id}-enabled`} className="text-base font-semibold">
                      Включить автосообщения
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Активировать таймер бездействия для {messenger.label}
                    </p>
                  </div>
                  <Switch
                    id={`${messenger.id}-enabled`}
                    checked={config.enabled}
                    onCheckedChange={(checked) =>
                      updateConfig(messenger.id, { enabled: checked })
                    }
                  />
                </div>

                {config.enabled && (
                  <div className="space-y-4 border-l-4 border-purple-300 pl-4">
                    <div>
                      <Label htmlFor={`${messenger.id}-delay`}>Задержка первого сообщения (сек)</Label>
                      <Input
                        id={`${messenger.id}-delay`}
                        type="number"
                        min="5"
                        max="300"
                        value={config.delay_seconds}
                        onChange={(e) =>
                          updateConfig(messenger.id, { delay_seconds: Number(e.target.value) })
                        }
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Рекомендуется 20-60 секунд
                      </p>
                    </div>

                    <div>
                      <Label htmlFor={`${messenger.id}-message`}>Текст автосообщения</Label>
                      <Textarea
                        id={`${messenger.id}-message`}
                        value={config.message_text}
                        onChange={(e) =>
                          updateConfig(messenger.id, { message_text: e.target.value })
                        }
                        rows={3}
                        placeholder="Могу помочь с выбором? 😊"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Поддерживаются эмодзи
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <Label htmlFor={`${messenger.id}-repeat`} className="text-base">
                          Повторять автосообщения
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">
                          Если пользователь продолжает молчать
                        </p>
                      </div>
                      <Switch
                        id={`${messenger.id}-repeat`}
                        checked={config.repeat_enabled}
                        onCheckedChange={(checked) =>
                          updateConfig(messenger.id, { repeat_enabled: checked })
                        }
                      />
                    </div>

                    {config.repeat_enabled && (
                      <div>
                        <Label htmlFor={`${messenger.id}-repeat-delay`}>
                          Интервал повторных сообщений (сек)
                        </Label>
                        <Input
                          id={`${messenger.id}-repeat-delay`}
                          type="number"
                          min="30"
                          max="600"
                          value={config.repeat_delay_seconds}
                          onChange={(e) =>
                            updateConfig(messenger.id, {
                              repeat_delay_seconds: Number(e.target.value)
                            })
                          }
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Рекомендуется 60-120 секунд
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  onClick={() => handleSave(messenger.id)}
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  <Icon name="Save" size={18} className="mr-2" />
                  {isLoading ? 'Сохранение...' : `Сохранить для ${messenger.label}`}
                </Button>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MessengerAutoMessages;