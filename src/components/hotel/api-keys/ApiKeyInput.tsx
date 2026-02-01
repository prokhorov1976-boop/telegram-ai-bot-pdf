import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface ApiKeyInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  isSaving: boolean;
  placeholder: string;
  type?: 'text' | 'password';
  description?: string;
  maskKey?: (key: string) => string;
}

const ApiKeyInput = ({
  id,
  label,
  value,
  onChange,
  onSave,
  isSaving,
  placeholder,
  type = 'password',
  description,
  maskKey
}: ApiKeyInputProps) => {
  const hasValue = value && value.length > 0;
  const isMasked = value.startsWith('***');

  return (
    <div className="space-y-2 border rounded-lg p-3 bg-slate-50">
      <Label htmlFor={id} className="flex items-center gap-2">
        {label}
        {hasValue && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Icon name="CheckCircle2" size={12} />
            Настроен
          </span>
        )}
        {!hasValue && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            <Icon name="CircleDashed" size={12} />
            Не настроен
          </span>
        )}
      </Label>
      <div className="flex gap-2">
        <Input
          id={id}
          type={type}
          value={isMasked ? '' : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="font-mono text-sm"
        />
        <Button
          onClick={onSave}
          disabled={isSaving}
          size="sm"
          className="whitespace-nowrap"
        >
          {isSaving ? (
            <Icon name="Loader2" size={14} className="animate-spin" />
          ) : (
            <Icon name="Save" size={14} />
          )}
        </Button>
      </div>
      {hasValue && !isMasked && maskKey && (
        <p className="text-xs text-muted-foreground">
          Текущий: {maskKey(value)}
        </p>
      )}
      {description && (
        <p className="text-xs text-slate-500">{description}</p>
      )}
    </div>
  );
};

export default ApiKeyInput;
