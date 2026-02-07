import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { VOICE_GENDERS } from './VoiceCallTransferSection';

interface VoiceSystemPromptSectionProps {
  voiceSystemPrompt: string;
  voice: string;
  onPromptChange: (prompt: string) => void;
  onResetPrompt: () => void;
  onSwitchGender: () => void;
  getDefaultPrompt: (gender: 'female' | 'male') => string;
}

export function VoiceSystemPromptSection({
  voiceSystemPrompt,
  voice,
  onPromptChange,
  onResetPrompt,
  onSwitchGender,
  getDefaultPrompt
}: VoiceSystemPromptSectionProps) {
  const currentGender = VOICE_GENDERS[voice] || 'female';
  const oppositeGender = currentGender === 'female' ? 'male' : 'female';
  const isCustomPrompt = voiceSystemPrompt !== getDefaultPrompt(currentGender) && 
                         voiceSystemPrompt !== getDefaultPrompt(oppositeGender);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="voice-prompt" className="text-base font-semibold">
          System Prompt для голосовых звонков
        </Label>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onSwitchGender}>
            <Icon name="RefreshCw" size={14} className="mr-1" />
            {oppositeGender === 'female' ? 'Женский' : 'Мужской'}
          </Button>
          <Button variant="ghost" size="sm" onClick={onResetPrompt}>
            <Icon name="RotateCcw" size={14} className="mr-1" />
            Сбросить
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 p-2 bg-purple-50 border border-purple-200 rounded-lg">
        <Icon name="User" size={16} className="text-purple-600" />
        <span className="text-sm font-medium text-purple-900">
          Текущий пол бота: {currentGender === 'female' ? 'Женский' : 'Мужской'}
        </span>
        {isCustomPrompt && (
          <span className="text-xs text-purple-600 ml-auto">(кастомный промпт)</span>
        )}
      </div>

      <Textarea
        id="voice-prompt"
        value={voiceSystemPrompt}
        onChange={(e) => onPromptChange(e.target.value)}
        rows={14}
        className="font-mono text-sm resize-none"
      />
      
      <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <Icon name="AlertTriangle" size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-amber-900 space-y-1">
          <p><strong>Важно для звонков:</strong></p>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            <li>Используйте КРАТКИЕ инструкции (люди не ждут долго)</li>
            <li>Укажите команду TRANSFER_CALL для перевода на оператора</li>
            <li>Добавьте {'{rag_context_placeholder}'} для подстановки базы знаний</li>
          </ul>
        </div>
      </div>
    </div>
  );
}