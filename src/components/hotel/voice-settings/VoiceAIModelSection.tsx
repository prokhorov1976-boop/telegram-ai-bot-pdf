import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

interface VoiceAIModelSectionProps {
  voiceProvider: string;
  voiceModel: string;
  maxTokens: number;
  onProviderChange: (provider: string) => void;
  onModelChange: (model: string) => void;
  onMaxTokensChange: (tokens: number) => void;
}

export const AI_MODELS = {
  yandex: [
    { value: 'yandexgpt', label: 'YandexGPT', price: '₽1 вх / ₽2 вых (1K)' },
    { value: 'yandexgpt-lite', label: 'YandexGPT Lite', price: '₽0.12 вх / ₽0.24 вых (1K)' }
  ],
  deepseek: [
    { value: 'deepseek-chat', label: 'DeepSeek V3', price: '$0.14 вх / $0.28 вых (1M)' },
    { value: 'deepseek-reasoner', label: 'DeepSeek R1', price: '$0.55 вх / $2.19 вых (1M)' }
  ],
  openai: [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini', price: '$0.15 вх / $0.60 вых (1M)' },
    { value: 'gpt-4o', label: 'GPT-4o', price: '$2.50 вх / $10.00 вых (1M)' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', price: '$10 вх / $30 вых (1M)' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', price: '$0.50 вх / $1.50 вых (1M)' },
    { value: 'o1-preview', label: 'O1 Preview', price: '$15 вх / $60 вых (1M)' },
    { value: 'o1-mini', label: 'O1 Mini', price: '$3 вх / $12 вых (1M)' }
  ],
  openrouter: [
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', price: 'Бесплатно (1M контекст)' },
    { value: 'llama-3.3-70b', label: 'Llama 3.3 70B', price: 'Бесплатно' },
    { value: 'deepseek-v3', label: 'DeepSeek V3', price: 'Бесплатно' },
    { value: 'deepseek-r1', label: 'DeepSeek R1', price: 'Бесплатно (рассуждения)' },
    { value: 'qwen-2.5-72b', label: 'Qwen 2.5 72B', price: 'Бесплатно' },
    { value: 'gemini-flash-1.5', label: 'Gemini Flash 1.5', price: '$0.075 вх / $0.30 вых (1M)' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini', price: '$0.15 вх / $0.60 вых (1M)' },
    { value: 'claude-3-haiku', label: 'Claude 3 Haiku', price: '$0.25 вх / $1.25 вых (1M)' },
    { value: 'gemini-pro-1.5', label: 'Gemini Pro 1.5', price: '$1.25 вх / $5.00 вых (1M)' },
    { value: 'gpt-4o', label: 'GPT-4o', price: '$2.50 вх / $10.00 вых (1M)' },
    { value: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet', price: '$3.00 вх / $15.00 вых (1M)' }
  ],
  proxyapi: [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini', price: '₽39 вх / ₽155 вых (1M)' },
    { value: 'claude-3.5-haiku', label: 'Claude 3.5 Haiku', price: '₽258 вх / ₽1289 вых (1M)' },
    { value: 'gpt-5', label: 'GPT-5', price: '₽323 вх / ₽2577 вых (1M)' },
    { value: 'gpt-4o', label: 'GPT-4o', price: '₽645 вх / ₽2577 вых (1M)' },
    { value: 'claude-sonnet-4.5', label: 'Claude Sonnet 4.5', price: '₽774 вх / ₽3866 вых (1M)' }
  ]
};

export function VoiceAIModelSection({
  voiceProvider,
  voiceModel,
  maxTokens,
  onProviderChange,
  onModelChange,
  onMaxTokensChange
}: VoiceAIModelSectionProps) {
  return (
    <div className="space-y-4 p-4 border-2 border-purple-200 rounded-lg bg-purple-50/30">
      <div className="flex items-center gap-2">
        <Icon name="Sparkles" size={20} className="text-purple-600" />
        <h3 className="text-base font-semibold">Выбор AI модели</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="voice-provider">Провайдер</Label>
          <Select value={voiceProvider} onValueChange={onProviderChange}>
            <SelectTrigger id="voice-provider">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openrouter">OpenRouter (рекомендуется)</SelectItem>
              <SelectItem value="openai">OpenAI напрямую (через прокси)</SelectItem>
              <SelectItem value="yandex">Yandex</SelectItem>
              <SelectItem value="deepseek">DeepSeek</SelectItem>
              <SelectItem value="proxyapi">ProxyAPI</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="voice-model">Модель</Label>
          <Select value={voiceModel} onValueChange={onModelChange}>
            <SelectTrigger id="voice-model">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AI_MODELS[voiceProvider as keyof typeof AI_MODELS]?.map(model => (
                <SelectItem key={model.value} value={model.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{model.label}</span>
                    <span className="text-xs text-muted-foreground">{model.price}</span>
                  </div>
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
          value={maxTokens}
          onChange={(e) => onMaxTokensChange(parseInt(e.target.value) || 500)}
        />
        <p className="text-xs text-muted-foreground">
          Рекомендуется 300-800 токенов для коротких ответов по телефону
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Icon name="Info" size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-900">
            <strong>Gemini 2.0 Flash</strong> — оптимальный выбор для голоса: быстрый (2-4 сек), бесплатный, качественный
          </p>
        </div>

        {voiceProvider === 'openai' && (
          <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <Icon name="AlertTriangle" size={16} className="text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-orange-900 space-y-1">
              <p><strong>⚠️ Для OpenAI напрямую нужно:</strong></p>
              <ol className="list-decimal list-inside space-y-0.5 ml-2">
                <li>Настроить прокси в разделе "Настройки прокси"</li>
                <li>Добавить OpenAI API ключ в "API ключи"</li>
              </ol>
              <p className="mt-2">GPT-4o Mini через прокси: $0.15 вх / $0.60 вых (1M)</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
