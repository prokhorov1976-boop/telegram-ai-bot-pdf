import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

interface VoiceCallTransferSectionProps {
  callTransferEnabled: boolean;
  adminPhoneNumber: string;
  voice: string;
  isTestCalling: boolean;
  onCallTransferChange: (enabled: boolean) => void;
  onAdminPhoneChange: (phone: string) => void;
  onVoiceChange: (voice: string) => void;
  onTestCall: () => void;
}

const VOICE_GENDERS: Record<string, 'female' | 'male'> = {
  maria: 'female',
  alexander: 'male',
  oksana: 'female',
  pavel: 'male'
};

export function VoiceCallTransferSection({
  callTransferEnabled,
  adminPhoneNumber,
  voice,
  isTestCalling,
  onCallTransferChange,
  onAdminPhoneChange,
  onVoiceChange,
  onTestCall
}: VoiceCallTransferSectionProps) {
  return (
    <div className="space-y-4 p-4 border-2 border-green-200 rounded-lg bg-green-50/30">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="call-transfer" className="text-base font-semibold flex items-center gap-2">
            <Icon name="PhoneForwarded" size={20} className="text-green-600" />
            Перевод на оператора
          </Label>
          <p className="text-sm text-muted-foreground">
            AI автоматически переведет звонок, если клиент попросит живого человека
          </p>
        </div>
        <Switch
          id="call-transfer"
          checked={callTransferEnabled}
          onCheckedChange={onCallTransferChange}
        />
      </div>

      {callTransferEnabled && (
        <div className="space-y-2">
          <Label htmlFor="admin-phone">Номер телефона администратора</Label>
          <Input
            id="admin-phone"
            type="tel"
            placeholder="+79991234567"
            value={adminPhoneNumber}
            onChange={(e) => onAdminPhoneChange(e.target.value)}
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            На этот номер будут переводиться звонки при запросе оператора
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="voice-select">Голос для озвучивания</Label>
        <Select value={voice} onValueChange={onVoiceChange}>
          <SelectTrigger id="voice-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="maria">Maria (женский, нейтральный)</SelectItem>
            <SelectItem value="alexander">Alexander (мужской, нейтральный)</SelectItem>
            <SelectItem value="oksana">Oksana (женский, эмоциональный)</SelectItem>
            <SelectItem value="pavel">Pavel (мужской, эмоциональный)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Выберите голос для синтеза речи в звонках (промпт автоматически подстроится под пол)
        </p>
      </div>

      {callTransferEnabled && adminPhoneNumber && (
        <div className="space-y-2 pt-2 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onTestCall}
            disabled={isTestCalling}
            className="w-full"
          >
            {isTestCalling ? (
              <>
                <Icon name="Loader2" size={16} className="animate-spin mr-2" />
                Звоним...
              </>
            ) : (
              <>
                <Icon name="Phone" size={16} className="mr-2" />
                Тестовый звонок
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Позвоним на номер администратора для проверки голоса
          </p>
        </div>
      )}
    </div>
  );
}

export { VOICE_GENDERS };
