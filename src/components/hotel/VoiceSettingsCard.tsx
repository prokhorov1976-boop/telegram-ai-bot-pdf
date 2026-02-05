import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';
import { authenticatedFetch } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

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
}

const AI_MODELS = {
  yandex: [
    { value: 'yandexgpt', label: 'YandexGPT' },
    { value: 'yandexgpt-lite', label: 'YandexGPT Lite' }
  ],
  deepseek: [
    { value: 'deepseek-chat', label: 'DeepSeek Chat' },
    { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner' }
  ],
  openrouter: [
    { value: 'gemini-2.0-flash', label: '🚀 Gemini 2.0 Flash (быстрый, бесплатный)' },
    { value: 'llama-3.3-70b', label: 'Llama 3.3 70B (бесплатный)' },
    { value: 'deepseek-v3', label: 'DeepSeek V3 (бесплатный)' },
    { value: 'gemini-flash-1.5', label: 'Gemini Flash 1.5' },
    { value: 'gpt-4o', label: 'GPT-4o' }
  ],
  proxyapi: [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'claude-3-haiku', label: 'Claude 3 Haiku' },
    { value: 'gpt-4o', label: 'GPT-4o' }
  ]
};

const DEFAULT_VOICE_PROMPT = `Ты — AI-консьерж по телефону. Отвечай КРАТКО и разговорно, как живой человек.

КРИТИЧНО — ОТВЕЧАЙ КОРОТКО:
- Максимум 2-3 коротких предложения за раз
- Если нужно перечислить много — спроси: Рассказать подробнее?
- Никаких длинных списков и простыней текста
- Убери все упоминания периодов типа (период 01.03.2026-31.03.2026)

ЦЕНЫ:
- Всегда показывай максимум 2-3 категории за раз
- После каждой порции: Рассказать про остальные?
- Никаких эмодзи, звездочек, HTML тегов

ДОСТУПНАЯ ИНФОРМАЦИЯ:
{rag_context_placeholder}

ЯЗЫК: Русский, на вы, тепло и естественно.`;

const VOICE_SETTINGS_URL = 'https://functions.poehali.dev/4e537d54-09a0-458a-b7b1-3687b690e7c1';

export default function VoiceSettingsCard({ tenantId, tenantName }: VoiceSettingsCardProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<VoiceSettings>({
    voximplant_enabled: false,
    voximplant_greeting: '',
    voice_system_prompt: DEFAULT_VOICE_PROMPT,
    voice_model: 'gemini-2.0-flash',
    voice_provider: 'openrouter',
    max_tokens: 500
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
        setSettings({
          voximplant_enabled: data.voximplant_enabled || false,
          voximplant_greeting: data.voximplant_greeting || '',
          voice_system_prompt: data.voice_system_prompt || DEFAULT_VOICE_PROMPT,
          voice_model: data.voice_model || 'gemini-2.0-flash',
          voice_provider: data.voice_provider || 'openrouter',
          max_tokens: data.max_tokens || 500
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
    setSettings(prev => ({
      ...prev,
      voice_system_prompt: DEFAULT_VOICE_PROMPT
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
        <CardDescription>
          Управление Voximplant интеграцией и AI для телефонных звонков
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Включение Voximplant */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
          <div className="space-y-0.5">
            <Label htmlFor="voximplant-enabled" className="text-base font-semibold">
              Голосовые звонки
            </Label>
            <p className="text-sm text-muted-foreground">
              Включить обработку входящих звонков через Voximplant
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

        {/* Приветствие */}
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

        {/* Выбор AI модели */}
        <div className="space-y-4 p-4 border-2 border-purple-200 rounded-lg bg-purple-50/30">
          <div className="flex items-center gap-2">
            <Icon name="Sparkles" size={20} className="text-purple-600" />
            <h3 className="font-semibold text-lg">AI модель для голосовых ответов</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="voice-provider">Провайдер</Label>
              <Select
                value={settings.voice_provider}
                onValueChange={(value) =>
                  setSettings(prev => ({ 
                    ...prev, 
                    voice_provider: value,
                    voice_model: AI_MODELS[value as keyof typeof AI_MODELS]?.[0]?.value || ''
                  }))
                }
              >
                <SelectTrigger id="voice-provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openrouter">OpenRouter (рекомендуется)</SelectItem>
                  <SelectItem value="yandex">Yandex</SelectItem>
                  <SelectItem value="deepseek">DeepSeek</SelectItem>
                  <SelectItem value="proxyapi">ProxyAPI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="voice-model">Модель</Label>
              <Select
                value={settings.voice_model}
                onValueChange={(value) =>
                  setSettings(prev => ({ ...prev, voice_model: value }))
                }
              >
                <SelectTrigger id="voice-model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_MODELS[settings.voice_provider as keyof typeof AI_MODELS]?.map(model => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-tokens">Максимум токенов ответа</Label>
            <Input
              id="max-tokens"
              type="number"
              min={100}
              max={2000}
              step={50}
              value={settings.max_tokens}
              onChange={(e) =>
                setSettings(prev => ({ ...prev, max_tokens: Number(e.target.value) }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Меньше токенов = быстрее ответ (рекомендуется 500 для голоса)
            </p>
          </div>

          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Icon name="Info" size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-900">
              <strong>Gemini 2.0 Flash</strong> — оптимальный выбор для голоса: быстрый (2-4 сек), бесплатный, качественный
            </p>
          </div>
        </div>

        {/* System Prompt для голоса */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="voice-prompt" className="text-base font-semibold">
              System Prompt для голосовых звонков
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetPrompt}
            >
              <Icon name="RotateCcw" size={14} className="mr-1" />
              Сбросить
            </Button>
          </div>
          <Textarea
            id="voice-prompt"
            value={settings.voice_system_prompt}
            onChange={(e) =>
              setSettings(prev => ({ ...prev, voice_system_prompt: e.target.value }))
            }
            rows={14}
            className="font-mono text-sm resize-none"
          />
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <Icon name="AlertTriangle" size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-900 space-y-1">
              <p><strong>Обязательно:</strong> Промпт должен содержать <code className="bg-amber-100 px-1 py-0.5 rounded">{'{rag_context_placeholder}'}</code></p>
              <p>Для голоса важна краткость: max 2-3 предложения, никаких эмодзи и HTML</p>
            </div>
          </div>
        </div>

        {/* Кнопка сохранения */}
        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={handleSaveSettings}
            disabled={isSaving}
            size="lg"
            className="w-full sm:w-auto"
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
}
