import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { authenticatedFetch } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Tenant, BACKEND_URLS } from './types';

interface VoiceCallsTabProps {
  tenants: Tenant[];
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
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (fast, free)' },
    { value: 'llama-3.3-70b', label: 'Llama 3.3 70B (free)' },
    { value: 'deepseek-v3', label: 'DeepSeek V3 (free)' },
    { value: 'gemini-flash-1.5', label: 'Gemini Flash 1.5 (платный)' },
    { value: 'gpt-4o', label: 'GPT-4o (платный)' }
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

export const VoiceCallsTab = ({ tenants }: VoiceCallsTabProps) => {
  const { toast } = useToast();
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
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

  const selectedTenant = tenants.find(t => t.id === selectedTenantId);

  useEffect(() => {
    if (selectedTenantId) {
      loadVoiceSettings(selectedTenantId);
    }
  }, [selectedTenantId]);

  const loadVoiceSettings = async (tenantId: number) => {
    setIsLoading(true);
    try {
      const response = await authenticatedFetch(`${BACKEND_URLS.voice_settings}?tenant_id=${tenantId}`);
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
    if (!selectedTenantId) return;

    setIsSaving(true);
    try {
      const response = await authenticatedFetch(BACKEND_URLS.voice_settings, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: selectedTenantId,
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Phone" size={24} />
            Настройки голосовых звонков
          </CardTitle>
          <CardDescription>
            Управление Voximplant интеграцией и настройками AI для телефонных звонков
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Выбор клиента */}
          <div className="space-y-2">
            <Label htmlFor="tenant-select">Выберите клиента</Label>
            <Select
              value={selectedTenantId?.toString()}
              onValueChange={(value) => setSelectedTenantId(Number(value))}
            >
              <SelectTrigger id="tenant-select">
                <SelectValue placeholder="Выберите клиента..." />
              </SelectTrigger>
              <SelectContent>
                {tenants.filter(t => t.id !== 1).map(tenant => (
                  <SelectItem key={tenant.id} value={tenant.id.toString()}>
                    {tenant.name} ({tenant.slug})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTenantId && (
            <>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Icon name="Loader2" size={32} className="animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Включение Voximplant */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="voximplant-enabled">Голосовые звонки</Label>
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
                    <Label htmlFor="greeting">Приветствие при звонке</Label>
                    <Textarea
                      id="greeting"
                      placeholder="Здравствуйте! Это голосовой помощник..."
                      value={settings.voximplant_greeting}
                      onChange={(e) =>
                        setSettings(prev => ({ ...prev, voximplant_greeting: e.target.value }))
                      }
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Текст, который озвучивается при входящем звонке
                    </p>
                  </div>

                  {/* Выбор AI модели */}
                  <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
                    <div className="flex items-center gap-2">
                      <Icon name="Sparkles" size={20} />
                      <h3 className="font-semibold">AI модель для голосовых ответов</h3>
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

                    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <Icon name="Info" size={16} className="text-blue-600" />
                      <p className="text-xs text-blue-900">
                        <strong>Gemini 2.0 Flash</strong> — оптимальный выбор: быстрый (2-4 сек), бесплатный, качественный
                      </p>
                    </div>
                  </div>

                  {/* System Prompt для голоса */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="voice-prompt">System Prompt для голосовых звонков</Label>
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
                      rows={12}
                      className="font-mono text-sm"
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
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Статистика звонков */}
      {selectedTenant && settings.voximplant_enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="BarChart3" size={20} />
              Статистика звонков
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Всего звонков</div>
                <div className="text-2xl font-bold">—</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Средняя длительность</div>
                <div className="text-2xl font-bold">—</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Активных звонков</div>
                <div className="text-2xl font-bold">—</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Статистика будет доступна после подключения к базе данных звонков
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
