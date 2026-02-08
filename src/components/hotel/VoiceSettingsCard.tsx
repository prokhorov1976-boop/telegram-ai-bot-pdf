import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';
import { authenticatedFetch } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { VoiceCallTransferSection, VOICE_GENDERS } from './voice-settings/VoiceCallTransferSection';
import { VoiceAIModelSection, AI_MODELS } from './voice-settings/VoiceAIModelSection';
import { VoiceSystemPromptSection } from './voice-settings/VoiceSystemPromptSection';

interface VoiceSettingsCardProps {
  tenantId: number;
  tenantName?: string;
}

interface VoiceSettings {
  voximplant_enabled: boolean;
  voximplant_greeting: string;
  voice_system_prompt: string;
  voice_model: string;
  voice_provider: string;
  max_tokens: number;
  call_transfer_enabled: boolean;
  admin_phone_number: string;
  voice: string;
}

const getDefaultPrompt = (gender: 'female' | 'male') => `Ты — AI-консьерж${gender === 'female' ? '' : ''} по телефону. Отвечай КРАТКО и разговорно, как живой человек.

🎯 КРИТИЧНО — ОТВЕЧАЙ КОРОТКО:
- Максимум 2-3 коротких предложения за раз
- Если нужно перечислить много — спроси: "Рассказать подробнее?"
- Никаких длинных списков и простыней текста
- Убери все упоминания периодов типа (период 01.03.2026-31.03.2026)
- После каждого ответа ОБЯЗАТЕЛЬНО делай паузу и жди реакции клиента

💰 ЦЕНЫ:
- Всегда показывай максимум 2-3 категории за раз
- После каждой порции: "Рассказать про остальные?"
- Никаких эмодзи, звездочек, HTML тегов в озвучивании
- Называй цены четко: "от 5 тысяч рублей", "3500 рублей за ночь"

📞 ПЕРЕВОД НА ОПЕРАТОРА:
- Если клиент просит живого человека/администратора/оператора — НЕМЕДЛЕННО переведи звонок
- Скажи: "Конечно, сейчас соединю с администратором. Минутку."
- Затем используй команду: TRANSFER_CALL
- НЕ задавай уточняющих вопросов после запроса оператора

🗣️ СТИЛЬ РЕЧИ:
- Короткие, естественные предложения
- Избегай сложных конструкций
- Говори тепло и дружелюбно
- Используй простые слова
- Если не знаешь точного ответа — честно скажи и предложи связаться с администратором

📋 БРОНИРОВАНИЕ:
- Уточни даты заезда и выезда
- Уточни количество гостей
- Уточни предпочтения по номеру (если есть выбор)
- Затем скажи: "Отлично, зафиксирую. Как к вам обращаться?" и попроси контактный номер
- После сбора информации: "Спасибо! Наш администратор свяжется с вами в течение часа для подтверждения."

❓ ЧАСТЫЕ ВОПРОСЫ:
- Если спрашивают адрес/как добраться — дай короткий ответ и предложи выслать карту
- Если спрашивают про услуги — перечисли основные (2-3), затем спроси: "Что-то конкретное интересует?"
- Если спрашивают про наличие мест — лучше переведи на администратора для точной информации

🚫 ЧЕГО НЕ ДЕЛАТЬ:
- Не говори длинными монологами
- Не перечисляй всё подряд без запроса
- Не используй технические термины
- Не обещай того, чего нет в базе знаний
- Не говори "я искусственный интеллект" — ты просто консьерж

ДОСТУПНАЯ ИНФОРМАЦИЯ:
{rag_context_placeholder}

ЯЗЫК: Русский, на "вы", тепло и естественно.
ЦЕЛЬ: Помочь гостю и создать приятное впечатление от первого контакта.`;

const DEFAULT_VOICE_PROMPT = getDefaultPrompt('female');

const VOICE_SETTINGS_URL = 'https://functions.poehali.dev/4e537d54-09a0-458a-b7b1-3687b690e7c1';

export default function VoiceSettingsCard({ tenantId, tenantName }: VoiceSettingsCardProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<VoiceSettings>({
    voximplant_enabled: false,
    voximplant_greeting: '',
    voice_system_prompt: DEFAULT_VOICE_PROMPT,
    voice_model: 'gemini-2.0-flash',
    voice_provider: 'openrouter',
    max_tokens: 500,
    call_transfer_enabled: false,
    admin_phone_number: '',
    voice: 'maria'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (tenantId) {
      loadVoiceSettings();
    }
  }, [tenantId]);

  const loadVoiceSettings = async () => {
    setIsLoading(true);
    try {
      const response = await authenticatedFetch(`${VOICE_SETTINGS_URL}?tenant_id=${tenantId}`);
      if (response.ok) {
        const data = await response.json();
        
        const provider = data.voice_provider || 'openrouter';
        let model = data.voice_model || 'gemini-2.0-flash';
        
        const providerModels = AI_MODELS[provider as keyof typeof AI_MODELS] || [];
        const modelExists = providerModels.some(m => m.value === model);
        
        if (!modelExists && providerModels.length > 0) {
          console.warn(`Model ${model} not found for provider ${provider}, using default ${providerModels[0].value}`);
          model = providerModels[0].value;
        }
        
        setSettings({
          voximplant_enabled: data.voximplant_enabled || false,
          voximplant_greeting: data.voximplant_greeting || '',
          voice_system_prompt: data.voice_system_prompt || DEFAULT_VOICE_PROMPT,
          voice_model: model,
          voice_provider: provider,
          max_tokens: data.max_tokens || 500,
          call_transfer_enabled: data.call_transfer_enabled || false,
          admin_phone_number: data.admin_phone_number || '',
          voice: data.voice || 'maria'
        });
      }
    } catch (error) {
      console.error('Error loading voice settings:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить настройки голосовых звонков',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await authenticatedFetch(VOICE_SETTINGS_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          ...settings
        })
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Настройки голосовых звонков сохранены',
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving voice settings:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить настройки',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPrompt = () => {
    const gender = VOICE_GENDERS[settings.voice] || 'female';
    setSettings(prev => ({
      ...prev,
      voice_system_prompt: getDefaultPrompt(gender)
    }));
    toast({
      title: "Промпт сброшен",
      description: `Установлен стандартный промпт для ${gender === 'female' ? 'женского' : 'мужского'} голоса`
    });
  };

  const handleVoiceChange = (voice: string) => {
    const gender = VOICE_GENDERS[voice] || 'female';
    const currentGender = VOICE_GENDERS[settings.voice] || 'female';
    const isDefaultPrompt = settings.voice_system_prompt === getDefaultPrompt('female') || 
                            settings.voice_system_prompt === getDefaultPrompt('male');
    
    setSettings(prev => ({ 
      ...prev, 
      voice: voice,
      voice_system_prompt: isDefaultPrompt ? getDefaultPrompt(gender) : prev.voice_system_prompt
    }));
  };

  const handleSwitchGender = () => {
    const currentGender = VOICE_GENDERS[settings.voice] || 'female';
    const oppositeGender = currentGender === 'female' ? 'male' : 'female';
    setSettings(prev => ({ 
      ...prev, 
      voice_system_prompt: getDefaultPrompt(oppositeGender)
    }));
    toast({
      title: "Промпт изменён",
      description: `Установлен стандартный промпт для ${oppositeGender === 'female' ? 'женского' : 'мужского'} голоса`
    });
  };

  const handleProviderChange = (provider: string) => {
    setSettings(prev => ({ 
      ...prev, 
      voice_provider: provider,
      voice_model: AI_MODELS[provider as keyof typeof AI_MODELS]?.[0]?.value || ''
    }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Icon name="Loader2" size={32} className="animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl border-2 border-blue-200">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardTitle className="flex items-center gap-2">
          <Icon name="Phone" size={24} className="text-blue-600" />
          Настройки голосовых звонков
          {tenantName && <span className="text-sm text-muted-foreground ml-2">— {tenantName}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="flex items-center justify-between p-4 border-2 border-blue-200 rounded-lg bg-blue-50/30">
          <div className="space-y-0.5">
            <Label htmlFor="voximplant-enabled" className="text-base font-semibold flex items-center gap-2">
              <Icon name="PhoneCall" size={20} className="text-blue-600" />
              Включить голосовые звонки
            </Label>
            <p className="text-sm text-muted-foreground">
              AI-консьерж будет принимать входящие звонки и отвечать на вопросы
            </p>
          </div>
          <Switch
            id="voximplant-enabled"
            checked={settings.voximplant_enabled}
            onCheckedChange={(checked) =>
              setSettings(prev => ({ ...prev, voximplant_enabled: checked }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="greeting" className="text-base font-semibold">
            Приветствие при звонке
          </Label>
          <Textarea
            id="greeting"
            placeholder="Здравствуйте! Это голосовой помощник..."
            value={settings.voximplant_greeting}
            onChange={(e) =>
              setSettings(prev => ({ ...prev, voximplant_greeting: e.target.value }))
            }
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Текст, который озвучивается при входящем звонке
          </p>
        </div>

        <VoiceCallTransferSection
          callTransferEnabled={settings.call_transfer_enabled}
          adminPhoneNumber={settings.admin_phone_number}
          voice={settings.voice}
          onCallTransferChange={(enabled) =>
            setSettings(prev => ({ ...prev, call_transfer_enabled: enabled }))
          }
          onAdminPhoneChange={(phone) =>
            setSettings(prev => ({ ...prev, admin_phone_number: phone }))
          }
          onVoiceChange={handleVoiceChange}
        />

        <VoiceAIModelSection
          voiceProvider={settings.voice_provider}
          voiceModel={settings.voice_model}
          maxTokens={settings.max_tokens}
          onProviderChange={handleProviderChange}
          onModelChange={(model) =>
            setSettings(prev => ({ ...prev, voice_model: model }))
          }
          onMaxTokensChange={(tokens) =>
            setSettings(prev => ({ ...prev, max_tokens: tokens }))
          }
        />

        <VoiceSystemPromptSection
          voiceSystemPrompt={settings.voice_system_prompt}
          voice={settings.voice}
          onPromptChange={(prompt) =>
            setSettings(prev => ({ ...prev, voice_system_prompt: prompt }))
          }
          onResetPrompt={handleResetPrompt}
          onSwitchGender={handleSwitchGender}
          getDefaultPrompt={getDefaultPrompt}
        />

        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="flex-1"
          >
            {isSaving ? (
              <>
                <Icon name="Loader2" size={16} className="animate-spin mr-2" />
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
}