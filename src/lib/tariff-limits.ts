export interface TariffLimits {
  id: string;
  name: string;
  maxPdfDocuments: number;
  hasWebChat: boolean;
  hasTelegram: boolean;
  hasVK: boolean;
  hasMAX: boolean;
  hasVoice: boolean;
  hasAISettings: boolean;
  hasAdvancedAISettings: boolean;
  hasCustomization: boolean;
  hasPersonalManager: boolean;
  hasWidget: boolean;
  hasPageSettings: boolean;
  hasStats: boolean;
}

// Все функции доступны всем тенантам.
// Тарифы оставлены только как метки для обратной совместимости —
// по возможностям они идентичны.
const ALL_FEATURES_ENABLED = {
  maxPdfDocuments: -1,
  hasWebChat: true,
  hasTelegram: true,
  hasVK: true,
  hasMAX: true,
  hasVoice: true,
  hasAISettings: true,
  hasAdvancedAISettings: true,
  hasCustomization: true,
  hasPersonalManager: true,
  hasWidget: true,
  hasPageSettings: true,
  hasStats: true
} as const;

export const TARIFF_LIMITS: Record<string, TariffLimits> = {
  basic: {
    id: 'basic',
    name: 'Старт',
    ...ALL_FEATURES_ENABLED
  },
  professional: {
    id: 'professional',
    name: 'Бизнес',
    ...ALL_FEATURES_ENABLED
  },
  enterprise: {
    id: 'enterprise',
    name: 'Премиум',
    ...ALL_FEATURES_ENABLED
  }
};

export function getTariffLimits(tariffId: string | null): TariffLimits {
  if (!tariffId || !TARIFF_LIMITS[tariffId]) {
    return TARIFF_LIMITS.basic;
  }
  return TARIFF_LIMITS[tariffId];
}

export function canUploadMoreDocuments(_currentCount: number, _tariffId: string | null): boolean {
  // Все функции доступны всем тенантам — лимитов на документы нет.
  return true;
}

export function hasFeatureAccess(
  _feature: keyof Omit<TariffLimits, 'id' | 'name' | 'maxPdfDocuments'>,
  _tariffId: string | null
): boolean {
  // Все функции доступны всем тенантам.
  return true;
}
