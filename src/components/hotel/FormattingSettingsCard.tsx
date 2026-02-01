import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch, getTenantId } from '@/lib/auth';
import { BACKEND_URLS } from './types';

interface FormattingSettings {
  messenger: string;
  use_emoji: boolean;
  use_markdown: boolean;
  use_lists_formatting: boolean;
  custom_emoji_map?: Record<string, string>;
  list_bullet_char?: string;
  numbered_list_char?: string;
}

const MESSENGERS = [
  { id: 'telegram', label: 'Telegram', icon: 'Send', description: 'Markdown форматирование' },
  { id: 'widget', label: 'Виджет', icon: 'Code', description: 'HTML форматирование' },
  { id: 'vk', label: 'VK', icon: 'Users', description: 'Чистый текст' },
  { id: 'max', label: 'MAX', icon: 'Mail', description: 'Чистый текст' }
];

const FormattingSettingsCard = () => {
  const { toast } = useToast();
  const tenantId = getTenantId();
  const [settings, setSettings] = useState<Record<string, FormattingSettings>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('telegram');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await authenticatedFetch(
        `${BACKEND_URLS.manageFormattingSettings}?tenant_id=${tenantId}`
      );
      const data = await response.json();
      
      if (data.settings) {
        const settingsMap: Record<string, FormattingSettings> = {};
        data.settings.forEach((s: FormattingSettings) => {
          settingsMap[s.messenger] = s;
        });
        setSettings(settingsMap);
      }
    } catch (error) {
      console.error('Error loading formatting settings:', error);
    }
  };

  const handleToggle = (messenger: string, field: keyof Omit<FormattingSettings, 'messenger'>) => {
    setSettings(prev => ({
      ...prev,
      [messenger]: {
        ...prev[messenger],
        [field]: !prev[messenger]?.[field]
      }
    }));
  };

  const handleSave = async (messenger: string) => {
    setIsLoading(true);
    try {
      const config = settings[messenger] || {
        messenger,
        use_emoji: true,
        use_markdown: true,
        use_lists_formatting: true
      };

      await authenticatedFetch(
        `${BACKEND_URLS.manageFormattingSettings}?tenant_id=${tenantId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messenger,
            ...config
          })
        }
      );

      toast({
        title: 'Сохранено',
        description: `Настройки форматирования для ${MESSENGERS.find(m => m.id === messenger)?.label} обновлены`
      });
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось сохранить настройки',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessengerSettings = (messenger: string) => {
    const config = settings[messenger] || {
      messenger,
      use_emoji: true,
      use_markdown: messenger === 'telegram',
      use_lists_formatting: true
    };

    const messengerInfo = MESSENGERS.find(m => m.id === messenger);

    return (
      <div className="space-y-6">
        {/* Инфо-блок про канал */}
        <div className={`border-l-4 p-4 rounded ${
          messenger === 'telegram' ? 'bg-blue-50 border-blue-500' :
          messenger === 'widget' ? 'bg-cyan-50 border-cyan-500' :
          messenger === 'vk' ? 'bg-indigo-50 border-indigo-500' :
          'bg-purple-50 border-purple-500'
        }`}>
          <div className="flex items-start gap-3">
            <Icon name="Info" size={20} className={`mt-0.5 ${
              messenger === 'telegram' ? 'text-blue-600' :
              messenger === 'widget' ? 'text-cyan-600' :
              messenger === 'vk' ? 'text-indigo-600' :
              'text-purple-600'
            }`} />
            <div className="flex-1">
              <p className={`font-semibold mb-1 ${
                messenger === 'telegram' ? 'text-blue-900' :
                messenger === 'widget' ? 'text-cyan-900' :
                messenger === 'vk' ? 'text-indigo-900' :
                'text-purple-900'
              }`}>{messengerInfo?.description}</p>
              <p className={`text-sm ${
                messenger === 'telegram' ? 'text-blue-800' :
                messenger === 'widget' ? 'text-cyan-800' :
                messenger === 'vk' ? 'text-indigo-800' :
                'text-purple-800'
              }`}>
                {messenger === 'telegram' && '✅ Markdown: **жирный**, *курсив* • Ссылки с превью'}
                {messenger === 'widget' && '✅ HTML: <b>жирный</b>, <i>курсив</i>, <a>ссылки</a> • Рендеринг в браузере'}
                {messenger === 'vk' && '❌ HTML теги удаляются • VK автоматически делает ссылки кликабельными'}
                {messenger === 'max' && '❌ HTML теги удаляются • MAX автоматически делает ссылки кликабельными'}
              </p>
              <p className={`text-xs mt-2 ${
                messenger === 'telegram' ? 'text-blue-700' :
                messenger === 'widget' ? 'text-cyan-700' :
                messenger === 'vk' ? 'text-indigo-700' :
                'text-purple-700'
              }`}>
                <Icon name="Lightbulb" size={14} className="inline mr-1" />
                {messenger === 'telegram' && 'AI будет конвертировать HTML в Markdown автоматически'}
                {messenger === 'widget' && 'HTML теги из AI отобразятся корректно в виджете'}
                {messenger === 'vk' && 'AI отправит чистый текст, VK сам обработает URL'}
                {messenger === 'max' && 'AI отправит чистый текст, MAX сам обработает URL'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <Label htmlFor={`${messenger}-emoji`} className="text-base font-medium">
              Использовать эмодзи
            </Label>
            <p className="text-sm text-slate-500">
              AI будет добавлять эмодзи для улучшения восприятия
            </p>
          </div>
          <Switch
            id={`${messenger}-emoji`}
            checked={config.use_emoji}
            onCheckedChange={() => handleToggle(messenger, 'use_emoji')}
          />
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <Label htmlFor={`${messenger}-markdown`} className="text-base font-medium flex items-center gap-2">
              Использовать Markdown
              {messenger !== 'telegram' && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Только Telegram</span>
              )}
            </Label>
            <p className="text-sm text-slate-500">
              {messenger === 'telegram' 
                ? 'Markdown: **жирный**, *курсив* — поддерживается нативно'
                : 'Markdown не поддерживается этим каналом'}
            </p>
          </div>
          <Switch
            id={`${messenger}-markdown`}
            checked={config.use_markdown}
            onCheckedChange={() => handleToggle(messenger, 'use_markdown')}
            disabled={messenger !== 'telegram'}
          />
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <Label htmlFor={`${messenger}-lists`} className="text-base font-medium">
              Форматировать списки
            </Label>
            <p className="text-sm text-slate-500">
              Структурированные списки с маркерами и нумерацией
            </p>
          </div>
          <Switch
            id={`${messenger}-lists`}
            checked={config.use_lists_formatting}
            onCheckedChange={() => handleToggle(messenger, 'use_lists_formatting')}
          />
        </div>

        <Button
          onClick={() => handleSave(messenger)}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
              Сохранение...
            </>
          ) : (
            <>
              <Icon name="Save" size={16} className="mr-2" />
              Сохранить настройки
            </>
          )}
        </Button>
      </div>
    );
  };

  return (
    <Card className="shadow-xl border-2 border-purple-200">
      <CardHeader className="border-b bg-gradient-to-r from-purple-50 via-blue-50 to-cyan-50">
        <CardTitle className="flex items-center gap-2">
          <Icon name="Palette" size={20} className="text-purple-600" />
          Форматирование сообщений
        </CardTitle>
        <CardDescription>
          Настройте стиль ответов AI для каждого канала. Форматирование применяется автоматически — AI получает текст, система адаптирует его под канал.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            {MESSENGERS.map((messenger) => (
              <TabsTrigger key={messenger.id} value={messenger.id}>
                <Icon name={messenger.icon as any} size={16} className="mr-2" />
                {messenger.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {MESSENGERS.map((messenger) => (
            <TabsContent key={messenger.id} value={messenger.id} className="space-y-4 mt-4">
              {renderMessengerSettings(messenger.id)}
            </TabsContent>
          ))}
        </Tabs>
        
        <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-4 rounded">
          <div className="flex items-start gap-3">
            <Icon name="CheckCircle" size={20} className="text-green-600 mt-0.5" />
            <div className="text-sm text-green-900">
              <p className="font-semibold mb-2">Как работает форматирование:</p>
              <ol className="space-y-1 list-decimal list-inside">
                <li>Пользователь отправляет сообщение в канал (Telegram/VK/MAX/Виджет)</li>
                <li>AI генерирует ответ в универсальном формате</li>
                <li>Система автоматически применяет форматирование под канал</li>
                <li>Пользователь получает оптимально оформленный ответ</li>
              </ol>
              <p className="mt-3 text-xs text-green-800">
                <Icon name="Info" size={14} className="inline mr-1" />
                Настройки применяются моментально ко всем новым сообщениям. История не изменяется.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FormattingSettingsCard;