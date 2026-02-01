import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SpeechSettingsCardProps {
  tenantId: number | null;
  tenantName?: string;
  fz152Enabled?: boolean;
}

const SpeechSettingsCard = ({ tenantId, tenantName, fz152Enabled = false }: SpeechSettingsCardProps) => {
  const { toast } = useToast();
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [speechProvider, setSpeechProvider] = useState('yandex');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showYandexGuide, setShowYandexGuide] = useState(false);
  const [showOpenAIGuide, setShowOpenAIGuide] = useState(false);
  const [showGoogleGuide, setShowGoogleGuide] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [tenantId]);

  const loadSettings = async () => {
    if (!tenantId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/66ab8736-2781-4c63-9c2e-09f2061f7c7a', {
        method: 'GET',
        headers: {
          'X-Tenant-Id': tenantId.toString()
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSpeechEnabled(data.enabled || false);
        setSpeechProvider(data.provider || 'yandex');
      }
    } catch (error) {
      console.error('Failed to load speech settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSpeechSettings = async () => {
    if (!tenantId) return;

    setIsSaving(true);
    try {
      const response = await fetch('https://functions.poehali.dev/66ab8736-2781-4c63-9c2e-09f2061f7c7a', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': tenantId.toString()
        },
        body: JSON.stringify({
          enabled: speechEnabled,
          provider: speechProvider
        })
      });

      if (response.ok) {
        toast({
          title: 'Настройки сохранены',
          description: 'Настройки распознавания речи успешно обновлены'
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save speech settings:', error);
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
      <Card className="shadow-xl">
        <CardContent className="py-8 text-center text-slate-500">
          Загрузка настроек...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl border-2 border-purple-200">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Mic" size={24} />
              Распознавание голосовых сообщений
            </CardTitle>
            <CardDescription>
              Бот будет понимать аудио и видео-сообщения от пользователей
            </CardDescription>
          </div>
          {fz152Enabled && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              <Icon name="ShieldCheck" size={14} className="mr-1" />
              152-ФЗ: только Яндекс
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="speech-enabled" className="text-base font-semibold cursor-pointer">
              Включить распознавание речи
            </Label>
            <p className="text-sm text-slate-600">
              {speechEnabled 
                ? 'Бот будет распознавать голосовые и видео-сообщения' 
                : 'Бот ответит "Извините, я понимаю только текстовые сообщения"'}
            </p>
          </div>
          <Switch
            id="speech-enabled"
            checked={speechEnabled}
            onCheckedChange={setSpeechEnabled}
          />
        </div>

        {speechEnabled && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="speech-provider" className="text-base font-semibold">
                Провайдер распознавания
              </Label>
              <Select
                value={fz152Enabled ? 'yandex' : speechProvider}
                onValueChange={setSpeechProvider}
                disabled={fz152Enabled}
              >
                <SelectTrigger id="speech-provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yandex">
                    <div className="flex items-center gap-2">
                      <span>Yandex SpeechKit</span>
                      <Badge variant="outline" className="text-xs">1₽/15 сек</Badge>
                    </div>
                  </SelectItem>
                  {!fz152Enabled && (
                    <>
                      <SelectItem value="openai_whisper">
                        <div className="flex items-center gap-2">
                          <span>OpenAI Whisper</span>
                          <Badge variant="outline" className="text-xs">$0.006/мин</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="google">
                        <div className="flex items-center gap-2">
                          <span>Google Speech-to-Text</span>
                          <Badge variant="outline" className="text-xs">$0.006/15 сек</Badge>
                        </div>
                      </SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              {fz152Enabled && (
                <p className="text-sm text-green-700 flex items-center gap-1">
                  <Icon name="Info" size={14} />
                  При включенном 152-ФЗ автоматически используется Яндекс (данные остаются в РФ)
                </p>
              )}
            </div>

            <div className="border-t pt-4 space-y-3">
              <h4 className="font-semibold text-sm text-slate-700">Инструкции по получению API ключей:</h4>
              
              {/* Яндекс */}
              <Collapsible open={showYandexGuide} onOpenChange={setShowYandexGuide}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
                  <div className="flex items-center gap-2">
                    <Icon name="Cloud" size={18} className="text-purple-600" />
                    <span className="font-medium">Yandex SpeechKit</span>
                    <Badge variant="secondary" className="text-xs">Россия</Badge>
                  </div>
                  <Icon name={showYandexGuide ? "ChevronUp" : "ChevronDown"} size={18} />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 p-4 bg-white border rounded-lg space-y-2 text-sm">
                  <ol className="list-decimal list-inside space-y-1 text-slate-700">
                    <li>Перейдите на <a href="https://console.cloud.yandex.ru" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">console.cloud.yandex.ru</a></li>
                    <li>Создайте сервисный аккаунт в разделе "IAM"</li>
                    <li>Выдайте роль <code className="bg-slate-100 px-1 rounded">ai.speechkit-stt.user</code></li>
                    <li>Создайте API-ключ для сервисного аккаунта</li>
                    <li>Скопируйте Folder ID из настроек облака</li>
                    <li>Добавьте ключи во вкладке "AI" → "API ключи":
                      <ul className="list-disc list-inside ml-4 mt-1">
                        <li><code className="bg-slate-100 px-1 rounded">YANDEX_SPEECHKIT_API_KEY</code></li>
                        <li><code className="bg-slate-100 px-1 rounded">YANDEX_FOLDER_ID</code></li>
                      </ul>
                    </li>
                  </ol>
                  <p className="text-xs text-slate-500 mt-2">Стоимость: ~1₽ за 15 секунд аудио</p>
                </CollapsibleContent>
              </Collapsible>

              {/* OpenAI */}
              {!fz152Enabled && (
                <Collapsible open={showOpenAIGuide} onOpenChange={setShowOpenAIGuide}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
                    <div className="flex items-center gap-2">
                      <Icon name="Sparkles" size={18} className="text-green-600" />
                      <span className="font-medium">OpenAI Whisper</span>
                      <Badge variant="secondary" className="text-xs">США</Badge>
                    </div>
                    <Icon name={showOpenAIGuide ? "ChevronUp" : "ChevronDown"} size={18} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 p-4 bg-white border rounded-lg space-y-2 text-sm">
                    <ol className="list-decimal list-inside space-y-1 text-slate-700">
                      <li>Перейдите на <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">platform.openai.com/api-keys</a></li>
                      <li>Нажмите "Create new secret key"</li>
                      <li>Скопируйте ключ (показывается один раз!)</li>
                      <li>Добавьте во вкладке "AI" → "API ключи" как <code className="bg-slate-100 px-1 rounded">OPENAI_API_KEY</code></li>
                    </ol>
                    <p className="text-xs text-orange-600 mt-2">⚠️ Требуется VPN для доступа из России</p>
                    <p className="text-xs text-slate-500">Стоимость: $0.006 за минуту аудио</p>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Google */}
              {!fz152Enabled && (
                <Collapsible open={showGoogleGuide} onOpenChange={setShowGoogleGuide}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
                    <div className="flex items-center gap-2">
                      <Icon name="Globe" size={18} className="text-blue-600" />
                      <span className="font-medium">Google Speech-to-Text</span>
                      <Badge variant="secondary" className="text-xs">США</Badge>
                    </div>
                    <Icon name={showGoogleGuide ? "ChevronUp" : "ChevronDown"} size={18} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 p-4 bg-white border rounded-lg space-y-2 text-sm">
                    <ol className="list-decimal list-inside space-y-1 text-slate-700">
                      <li>Перейдите в <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Cloud Console</a></li>
                      <li>Создайте проект или выберите существующий</li>
                      <li>Включите API "Cloud Speech-to-Text"</li>
                      <li>Создайте API ключ в разделе "APIs & Services" → "Credentials"</li>
                      <li>Добавьте во вкладке "AI" → "API ключи" как <code className="bg-slate-100 px-1 rounded">GOOGLE_SPEECH_API_KEY</code></li>
                    </ol>
                    <p className="text-xs text-orange-600 mt-2">⚠️ Требуется иностранная карта для регистрации</p>
                    <p className="text-xs text-slate-500">Стоимость: $0.006 за 15 секунд аудио</p>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={saveSpeechSettings}
            disabled={isSaving}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
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
        </div>
      </CardContent>
    </Card>
  );
};

export default SpeechSettingsCard;
