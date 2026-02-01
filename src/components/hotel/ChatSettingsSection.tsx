import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageSettings } from './types';

interface ChatSettingsSectionProps {
  settings: PageSettings;
  onSettingsChange: (settings: PageSettings) => void;
}

export const ChatSettingsSection = ({
  settings,
  onSettingsChange
}: ChatSettingsSectionProps) => {
  return (
    <div className="border-b pb-4">
      <h3 className="text-sm font-semibold text-slate-900 mb-3">Настройки чата</h3>
      <div className="space-y-3">
        <div>
          <Label htmlFor="page_title">Заголовок чата</Label>
          <Input
            id="page_title"
            value={settings.page_title}
            onChange={(e) => onSettingsChange({ ...settings, page_title: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="input_placeholder">Текст в поле ввода</Label>
          <Input
            id="input_placeholder"
            value={settings.input_placeholder}
            onChange={(e) => onSettingsChange({ ...settings, input_placeholder: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
};