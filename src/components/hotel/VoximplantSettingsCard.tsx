import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch, getTenantId } from '@/lib/auth';
import { useParams } from 'react-router-dom';
import { BACKEND_URLS } from './types';

interface VoximplantSettings {
  enabled: boolean;
  phoneNumber: string;
  greeting: string;
  ruleId: string;
}

const VoximplantSettingsCard = () => {
  const [settings, setSettings] = useState<VoximplantSettings>({
    enabled: false,
    phoneNumber: '',
    greeting: '',
    ruleId: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const tenantId = getTenantId();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await authenticatedFetch(`${BACKEND_URLS.getTenantBySlug}?tenant_id=${tenantId}`);
      const data = await response.json();
      
      if (data.tenant) {
        setSettings({
          enabled: data.tenant.voximplant_enabled || false,
          phoneNumber: data.tenant.voximplant_phone_number || '',
          greeting: data.tenant.voximplant_greeting || '',
          ruleId: data.tenant.voximplant_rule_id || ''
        });
      }
    } catch (error) {
      console.error('Error loading Voximplant settings:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить настройки Voximplant',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (settings.enabled && !settings.phoneNumber.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Укажите номер телефона для приёма звонков',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await authenticatedFetch(`${BACKEND_URLS.getTenantBySlug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          voximplant_enabled: settings.enabled,
          voximplant_phone_number: settings.phoneNumber,
          voximplant_greeting: settings.greeting,
          voximplant_rule_id: settings.ruleId
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Сохранено!',
          description: 'Настройки Voximplant обновлены'
        });
      } else {
        throw new Error(data.error || 'Ошибка сохранения');
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось сохранить настройки',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const copyWebhookUrl = () => {
    const webhookUrl = BACKEND_URLS.voximplantWebhook;
    navigator.clipboard.writeText(webhookUrl);
    toast({
      title: 'Скопировано!',
      description: 'URL webhook скопирован в буфер обмена'
    });
  };

  return (
    <Card className="shadow-xl">
      <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-indigo-50">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="Phone" size={20} />
            Голосовые звонки (Voximplant)
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
            disabled={isLoading}
          />
        </CardTitle>
        <CardDescription>Настройка приёма звонков с AI-ответами</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Icon name="Loader2" size={24} className="animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Номер телефона
              </label>
              <Input
                type="text"
                value={settings.phoneNumber}
                onChange={(e) => setSettings({ ...settings, phoneNumber: e.target.value })}
                placeholder="+74951234567"
                disabled={!settings.enabled}
                className="font-mono"
              />
              <p className="text-xs text-slate-500 mt-2">
                Номер для входящих звонков из Voximplant
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Приветствие
              </label>
              <Textarea
                value={settings.greeting}
                onChange={(e) => setSettings({ ...settings, greeting: e.target.value })}
                placeholder="Здравствуйте! Это голосовой помощник. Чем могу помочь?"
                disabled={!settings.enabled}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-slate-500 mt-2">
                Текст, который произнесёт бот при начале звонка
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Rule ID (опционально)
              </label>
              <Input
                type="text"
                value={settings.ruleId}
                onChange={(e) => setSettings({ ...settings, ruleId: e.target.value })}
                placeholder="12345"
                disabled={!settings.enabled}
                className="font-mono text-sm"
              />
              <p className="text-xs text-slate-500 mt-2">
                ID правила маршрутизации в Voximplant
              </p>
            </div>

            <div className="border-t pt-4">
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Webhook URL
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={BACKEND_URLS.voximplantWebhook}
                  readOnly
                  className="font-mono text-xs bg-slate-50"
                />
                <Button
                  onClick={copyWebhookUrl}
                  variant="outline"
                  size="sm"
                >
                  <Icon name="Copy" size={16} />
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Укажите этот URL в настройках Voximplant Application
              </p>
            </div>

            <Button
              onClick={saveSettings}
              disabled={isSaving || isLoading}
              className="w-full"
            >
              {isSaving ? (
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

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Icon name="Info" size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <p className="font-medium text-sm text-blue-900">
                    Как настроить Voximplant:
                  </p>
                  <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Создайте аккаунт на voximplant.com</li>
                    <li>Создайте Application в панели управления</li>
                    <li>Добавьте номер телефона и привяжите к Application</li>
                    <li>Создайте Scenario со следующим кодом:</li>
                  </ol>
                  <div className="mt-2 bg-slate-900 text-green-400 p-3 rounded text-xs font-mono overflow-x-auto">
                    <div>var tenant_slug = "{tenantSlug}";</div>
                    <div className="text-slate-500">// Используйте этот slug в сценарии Voximplant</div>
                  </div>
                  <p className="text-xs text-blue-800 mt-2">
                    Webhook URL общий для всех ботов. Изоляция через tenant_slug в коде сценария.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default VoximplantSettingsCard;