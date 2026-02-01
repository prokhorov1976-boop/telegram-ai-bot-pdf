export const COLOR_SCHEMES = {
  purple: {
    name: 'Фиолетовый',
    button_color: '#a855f7',
    button_color_end: '#7c3aed',
    header_color: '#a855f7',
    header_color_end: '#7c3aed'
  },
  ocean: {
    name: 'Океан',
    button_color: '#06b6d4',
    button_color_end: '#0891b2',
    header_color: '#06b6d4',
    header_color_end: '#0891b2'
  },
  sunset: {
    name: 'Закат',
    button_color: '#f59e0b',
    button_color_end: '#f97316',
    header_color: '#f59e0b',
    header_color_end: '#f97316'
  },
  emerald: {
    name: 'Изумруд',
    button_color: '#10b981',
    button_color_end: '#059669',
    header_color: '#10b981',
    header_color_end: '#059669'
  },
  rose: {
    name: 'Роза',
    button_color: '#f43f5e',
    button_color_end: '#e11d48',
    header_color: '#f43f5e',
    header_color_end: '#e11d48'
  },
  night: {
    name: 'Ночь',
    button_color: '#4f46e5',
    button_color_end: '#4338ca',
    header_color: '#4f46e5',
    header_color_end: '#4338ca'
  },
  slate: {
    name: 'Графит',
    button_color: '#475569',
    button_color_end: '#334155',
    header_color: '#475569',
    header_color_end: '#334155'
  }
};

export interface WidgetSettings {
  button_color: string;
  button_color_end: string;
  button_size: number;
  button_position: string;
  button_icon: string;
  window_width: number;
  window_height: number;
  header_title: string;
  header_color: string;
  header_color_end: string;
  border_radius: number;
  show_branding: boolean;
  custom_css: string | null;
  chat_url: string | null;
}

export const applyColorScheme = (
  scheme: string,
  currentSettings: WidgetSettings
): WidgetSettings => {
  const colors = COLOR_SCHEMES[scheme as keyof typeof COLOR_SCHEMES];
  if (colors) {
    return {
      ...currentSettings,
      button_color: colors.button_color,
      button_color_end: colors.button_color_end,
      header_color: colors.header_color,
      header_color_end: colors.header_color_end
    };
  }
  return currentSettings;
};

export const detectColorScheme = (settings: WidgetSettings): string => {
  for (const [key, scheme] of Object.entries(COLOR_SCHEMES)) {
    if (
      scheme.button_color.toLowerCase() === settings.button_color?.toLowerCase() &&
      scheme.button_color_end.toLowerCase() === settings.button_color_end?.toLowerCase()
    ) {
      return key;
    }
  }
  return 'purple';
};