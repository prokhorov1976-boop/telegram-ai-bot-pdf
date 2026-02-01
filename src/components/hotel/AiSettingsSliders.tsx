import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AiModelSettings } from './types';

interface AiSettingsSlidersProps {
  settings: AiModelSettings;
  selectedModel: string;
  selectedProvider: string;
  onSettingsChange: (settings: AiModelSettings) => void;
}

const AiSettingsSliders = ({ settings, selectedModel, selectedProvider, onSettingsChange }: AiSettingsSlidersProps) => {
  const isYandex = selectedProvider === 'yandex';
  const isOpenRouter = selectedProvider === 'openrouter';
  const isProxyApi = selectedProvider === 'proxyapi';
  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>Temperature</Label>
          <span className="text-sm text-slate-500">{settings.temperature}</span>
        </div>
        <Slider
          value={[settings.temperature]}
          onValueChange={(value) => onSettingsChange({ ...settings, temperature: value[0] })}
          min={0}
          max={1}
          step={0.05}
          className="w-full"
        />
        <p className="text-xs text-slate-500">
          {selectedModel === 'yandexgpt' 
            ? 'Рекомендуется 0.15 для минимума галлюцинаций при RAG'
            : 'Рекомендуется 0.2 для стабильных ответов'}
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>Top P</Label>
          <span className="text-sm text-slate-500">{settings.top_p}</span>
        </div>
        <Slider
          value={[settings.top_p]}
          onValueChange={(value) => onSettingsChange({ ...settings, top_p: value[0] })}
          min={0}
          max={1}
          step={0.05}
          className="w-full"
        />
        <p className="text-xs text-slate-500">
          При низкой температуре влияет слабо, оставьте 1.0
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>Max Tokens</Label>
          <span className="text-sm text-slate-500">{settings.max_tokens}</span>
        </div>
        <Slider
          value={[settings.max_tokens]}
          onValueChange={(value) => onSettingsChange({ ...settings, max_tokens: value[0] })}
          min={100}
          max={1000}
          step={50}
          className="w-full"
        />
        <p className="text-xs text-slate-500">
          {selectedModel === 'yandexgpt'
            ? 'Рекомендуется 400-600, YandexGPT любит "растекаться"'
            : 'Максимальная длина ответа в токенах'}
        </p>
      </div>

      {!isYandex && (
        <>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Frequency Penalty</Label>
              <span className="text-sm text-slate-500">{settings.frequency_penalty}</span>
            </div>
            <Slider
              value={[settings.frequency_penalty]}
              onValueChange={(value) => onSettingsChange({ ...settings, frequency_penalty: value[0] })}
              min={0}
              max={2}
              step={0.1}
              className="w-full"
            />
            <p className="text-xs text-slate-500">
              Штраф за частые повторы слов
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Presence Penalty</Label>
              <span className="text-sm text-slate-500">{settings.presence_penalty}</span>
            </div>
            <Slider
              value={[settings.presence_penalty]}
              onValueChange={(value) => onSettingsChange({ ...settings, presence_penalty: value[0] })}
              min={0}
              max={2}
              step={0.1}
              className="w-full"
            />
            <p className="text-xs text-slate-500">
              Штраф за повтор уже использованных тем
            </p>
          </div>
        </>
      )}

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>RAG Top-K (основной)</Label>
          <span className="text-sm text-slate-500">{settings.rag_topk_default ?? 7}</span>
        </div>
        <Slider
          value={[settings.rag_topk_default ?? 7]}
          onValueChange={(value) => onSettingsChange({ ...settings, rag_topk_default: value[0] })}
          min={3}
          max={20}
          step={1}
          className="w-full"
        />
        <p className="text-xs text-slate-500">
          Сколько чанков искать в документах (рекомендуется 7-12)
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>RAG Top-K (резервный)</Label>
          <span className="text-sm text-slate-500">{settings.rag_topk_fallback ?? 10}</span>
        </div>
        <Slider
          value={[settings.rag_topk_fallback ?? 10]}
          onValueChange={(value) => onSettingsChange({ ...settings, rag_topk_fallback: value[0] })}
          min={5}
          max={25}
          step={1}
          className="w-full"
        />
        <p className="text-xs text-slate-500">
          Если первая попытка неудачна, искать больше чанков (рекомендуется 10-15)
        </p>
      </div>

      {isYandex && (
        <>
          <div className="space-y-2">
            <Label>System Priority</Label>
            <Select
              value={settings.system_priority}
              onValueChange={(value) => onSettingsChange({ ...settings, system_priority: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="strict">Strict (рекомендуется)</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              Strict обязательно — защищает от выбивания промпта пользователем
            </p>
          </div>

          <div className="space-y-2">
            <Label>Creative Mode</Label>
            <Select
              value={settings.creative_mode}
              onValueChange={(value) => onSettingsChange({ ...settings, creative_mode: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="off">Off (рекомендуется)</SelectItem>
                <SelectItem value="on">On</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              Выключите — нужен максимально инструктивный режим
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default AiSettingsSliders;