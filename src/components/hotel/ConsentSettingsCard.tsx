import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/lib/auth';
import Icon from '@/components/ui/icon';
import { BACKEND_URLS } from './types';

interface ConsentSettings {
  webchat_enabled: boolean;
  messenger_enabled: boolean;
  text: string;
  messenger_text: string;
  privacy_policy_text: string;
}

interface ConsentSettingsCardProps {
  tenantId: number;
}

export const ConsentSettingsCard = ({ tenantId }: ConsentSettingsCardProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [consentSettings, setConsentSettings] = useState<ConsentSettings>({
    webchat_enabled: false,
    messenger_enabled: false,
    text: 'Я согласен на обработку персональных данных в соответствии с <a href="/privacy-policy" target="_blank">Политикой конфиденциальности</a>',
    messenger_text: `Продолжая диалог, вы соглашаетесь на обработку персональных данных согласно Политике конфиденциальности: ${typeof window !== 'undefined' ? window.location.origin : 'https://ai-ru.ru'}/ваш-slug/privacy-policy`,
    privacy_policy_text: ''
  });

  useEffect(() => {
    loadSettings();
  }, [tenantId]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await authenticatedFetch(`${BACKEND_URLS.manageConsentSettings}?action=public_content&tenant_id=${tenantId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.consent_settings) {
          setConsentSettings(data.consent_settings);
        }
      }
    } catch (error) {
      console.error('Error loading consent settings:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить настройки согласия',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await authenticatedFetch(`${BACKEND_URLS.manageConsentSettings}?action=public_content&tenant_id=${tenantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consent_settings: consentSettings
        })
      });

      if (response.ok) {
        toast({
          title: 'Сохранено',
          description: 'Настройки согласия обновлены'
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить настройки',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Icon name="Loader2" className="animate-spin mx-auto mb-2" size={32} />
          <p className="text-slate-600">Загрузка настроек...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="ShieldCheck" size={24} />
          Согласие на обработку данных (152-ФЗ)
        </CardTitle>
        <CardDescription>
          Настройте текст согласия для ваших посетителей в веб-чате и мессенджерах
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="space-y-1">
              <Label className="text-base font-semibold">Согласие в веб-чате</Label>
              <p className="text-sm text-slate-600">
                Посетители увидят чекбокс перед первым сообщением
              </p>
            </div>
            <input
              type="checkbox"
              checked={consentSettings.webchat_enabled}
              onChange={(e) => setConsentSettings({ ...consentSettings, webchat_enabled: e.target.checked })}
              className="w-5 h-5"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="space-y-1">
              <Label className="text-base font-semibold">Согласие в мессенджерах</Label>
              <p className="text-sm text-slate-600">
                Текст будет добавлен в первое сообщение Telegram/VK/MAX
              </p>
            </div>
            <input
              type="checkbox"
              checked={consentSettings.messenger_enabled}
              onChange={(e) => setConsentSettings({ ...consentSettings, messenger_enabled: e.target.checked })}
              className="w-5 h-5"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Текст согласия для веб-чата</Label>
          <Textarea
            value={consentSettings.text}
            onChange={(e) => setConsentSettings({ ...consentSettings, text: e.target.value })}
            rows={4}
            placeholder="Текст согласия на обработку персональных данных..."
          />
          <div className="space-y-2">
            <p className="text-xs text-slate-500">
              Поддерживается HTML. Используйте абсолютные ссылки:
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded p-2 space-y-1">
              <p className="text-xs font-mono text-slate-700">
                Я согласен на обработку данных согласно &lt;a href="<span className="text-blue-600">https://ваш-сайт.ru/privacy</span>" target="_blank"&gt;Политике конфиденциальности&lt;/a&gt;
              </p>
              <p className="text-xs text-amber-700 font-semibold mt-2">
                ⚠️ Для виджетов на сторонних сайтах: указывайте полный URL политики вашего клиента!
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Текст для мессенджеров (Telegram, VK, MAX)</Label>
          <Textarea
            value={consentSettings.messenger_text}
            onChange={(e) => setConsentSettings({ ...consentSettings, messenger_text: e.target.value })}
            rows={3}
            placeholder="Продолжая диалог, вы соглашаетесь на обработку персональных данных..."
          />
          <p className="text-xs text-slate-500">
            Этот текст будет добавлен в первое приветственное сообщение бота в мессенджерах. Добавьте ссылку на политику, например: "...согласно Политике конфиденциальности: {window.location.origin}/ваш-slug/privacy-policy"
          </p>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Icon name="FileText" size={18} />
            Политика конфиденциальности
          </Label>
          <Textarea
            value={consentSettings.privacy_policy_text}
            onChange={(e) => setConsentSettings({ ...consentSettings, privacy_policy_text: e.target.value })}
            rows={10}
            placeholder="Введите текст Политики конфиденциальности..."
            className="font-mono text-sm"
          />
          <p className="text-xs text-slate-500">
            Этот текст будет отображаться на странице /privacy-policy вашего сайта. Используйте HTML для форматирования.
          </p>
        </div>

        {(consentSettings.webchat_enabled || consentSettings.messenger_enabled) && (
          <div className="space-y-4">
            {consentSettings.webchat_enabled && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Icon name="Info" size={20} className="text-blue-600 mt-0.5" />
                  <div className="space-y-2 text-sm text-blue-900">
                    <p className="font-semibold">Предварительный просмотр (веб-чат):</p>
                    <div className="bg-white rounded p-3 border border-blue-200">
                      <div className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" disabled />
                        <span className="text-sm" dangerouslySetInnerHTML={{ __html: consentSettings.text }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {consentSettings.messenger_enabled && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Icon name="MessageSquare" size={20} className="text-green-600 mt-0.5" />
                  <div className="space-y-2 text-sm text-green-900">
                    <p className="font-semibold">Предварительный просмотр (мессенджер):</p>
                    <div className="bg-white rounded p-3 border border-green-200">
                      <p className="text-sm mb-2">👋 Здравствуйте! Чем могу помочь?</p>
                      <p className="text-xs text-slate-600 italic">{consentSettings.messenger_text}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? (
            <>
              <Icon name="Loader2" className="animate-spin mr-2" size={16} />
              Сохранение...
            </>
          ) : (
            <>
              <Icon name="Save" size={16} className="mr-2" />
              Сохранить настройки
            </>
          )}
        </Button>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Icon name="AlertCircle" size={20} className="text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-900">
              <p className="font-semibold mb-2">Важно о 152-ФЗ:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Требуйте согласие ДО сбора персональных данных</li>
                <li>Ссылка на Политику конфиденциальности встроена в текст согласия</li>
                <li>У каждого клиента своя страница /privacy-policy с уникальным текстом</li>
                <li>Суперадмин регулирует доступ к 152-ФЗ для каждого клиента</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConsentSettingsCard;