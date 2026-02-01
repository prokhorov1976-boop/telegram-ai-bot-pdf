import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
}

const COMMON_ICONS = [
  { name: 'MessageCircle', label: '💬 Чат круглый', category: 'chat' },
  { name: 'MessageSquare', label: '💭 Чат квадрат', category: 'chat' },
  { name: 'MessagesSquare', label: '💬 Беседа', category: 'chat' },
  { name: 'Bot', label: '🤖 Робот', category: 'chat' },
  { name: 'Sparkles', label: '✨ Искры', category: 'chat' },
  { name: 'Zap', label: '⚡ Молния', category: 'chat' },
  { name: 'Mail', label: '📧 Почта', category: 'contact' },
  { name: 'Phone', label: '📞 Телефон', category: 'contact' },
  { name: 'Send', label: '📤 Отправить', category: 'contact' },
  { name: 'Headphones', label: '🎧 Поддержка', category: 'contact' },
  { name: 'HelpCircle', label: '❓ Помощь', category: 'contact' },
  { name: 'Info', label: 'ℹ️ Инфо', category: 'contact' },
  { name: 'Heart', label: '❤️ Сердце', category: 'other' },
  { name: 'Star', label: '⭐ Звезда', category: 'other' },
  { name: 'User', label: '👤 Профиль', category: 'other' },
  { name: 'Settings', label: '⚙️ Настройки', category: 'other' },
  { name: 'Building2', label: '🏭 Здание', category: 'business' },
  { name: 'Store', label: '🏪 Магазин', category: 'business' },
  { name: 'UtensilsCrossed', label: '🍴 Ресторан', category: 'business' },
  { name: 'Coffee', label: '☕ Кофе', category: 'business' },
  { name: 'Wifi', label: '📶 Wi-Fi', category: 'business' },
  { name: 'Car', label: '🚗 Машина', category: 'business' },
  { name: 'Dumbbell', label: '🏋️ Фитнес', category: 'business' },
  { name: 'Waves', label: '🌊 Бассейн', category: 'business' },
  { name: 'Plane', label: '✈️ Самолёт', category: 'business' },
  { name: 'Calendar', label: '📅 Календарь', category: 'business' },
  { name: 'Clock', label: '🕐 Часы', category: 'business' },
  { name: 'MapPin', label: '📍 Локация', category: 'business' },
  { name: 'Shield', label: '🛡️ Защита', category: 'business' },
  { name: 'CreditCard', label: '💳 Оплата', category: 'business' }
];

const IconPicker = ({ value, onChange }: IconPickerProps) => {
  const selectedIcon = COMMON_ICONS.find(icon => icon.name === value);
  
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-md">
              <Icon name={value} size={18} className="text-white" />
            </div>
            <span className="font-medium">{selectedIcon?.label || value}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[400px]">
        <div className="space-y-1">
          {COMMON_ICONS.map((icon) => (
            <SelectItem key={icon.name} value={icon.name} className="cursor-pointer">
              <div className="flex items-center gap-3 py-1">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-all ${
                  value === icon.name 
                    ? 'bg-gradient-to-br from-blue-500 to-purple-500' 
                    : 'bg-gradient-to-br from-slate-100 to-slate-200 hover:from-blue-100 hover:to-purple-100'
                }`}>
                  <Icon name={icon.name} size={20} className={value === icon.name ? 'text-white' : 'text-slate-600'} />
                </div>
                <span className="font-medium text-sm">{icon.label}</span>
              </div>
            </SelectItem>
          ))}
        </div>
      </SelectContent>
    </Select>
  );
};

export default IconPicker;