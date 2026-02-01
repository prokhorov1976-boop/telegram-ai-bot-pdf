import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import IconPicker from './IconPicker';
import { PageSettings } from './types';
import { isSuperAdmin } from '@/lib/auth';

interface HeaderSettingsSectionProps {
  settings: PageSettings;
  onSettingsChange: (settings: PageSettings) => void;
}

export const HeaderSettingsSection = ({
  settings,
  onSettingsChange
}: HeaderSettingsSectionProps) => {
  return (
    <div className="border-b pb-4">
      <h3 className="text-sm font-semibold text-slate-900 mb-3">Шапка страницы</h3>
      <div className="space-y-3">
        <div>
          <Label htmlFor="header_icon">Иконка</Label>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Icon name={settings.header_icon} size={20} className="text-primary" />
            </div>
            <IconPicker
              selectedIcon={settings.header_icon}
              onSelectIcon={(icon) => onSettingsChange({ ...settings, header_icon: icon })}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="header_title" className="flex items-center gap-2">
            Название
            {isSuperAdmin() && (
              <span className="text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                автозаполнение из формы оплаты
              </span>
            )}
          </Label>
          <Input
            id="header_title"
            value={settings.header_title}
            onChange={(e) => onSettingsChange({ ...settings, header_title: e.target.value })}
            placeholder="Отель Пушкин"
            className={isSuperAdmin() ? "border-amber-300 bg-amber-50/30" : ""}
          />
        </div>
        <div>
          <Label htmlFor="header_subtitle">Слоган</Label>
          <Input
            id="header_subtitle"
            value={settings.header_subtitle}
            onChange={(e) => onSettingsChange({ ...settings, header_subtitle: e.target.value })}
            placeholder="AI Консьерж"
          />
        </div>
      </div>
    </div>
  );
};