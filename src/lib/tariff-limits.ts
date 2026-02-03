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

export const TARIFF_LIMITS: Record<string, TariffLimits> = {
  basic: {
    id: 'basic',
    name: 'Старт',
    maxPdfDocuments: 10,
    hasWebChat: true,
    hasTelegram: false,
    hasVK: false,
    hasMAX: false,
    hasVoice: false,
    hasAISettings: false,
    hasAdvancedAISettings: false,
    hasCustomization: false,
    hasPersonalManager: false,
    hasWidget: true,
    hasPageSettings: true,
    hasStats: true
  },
  professional: {
    id: 'professional',
    name: 'Бизнес',
    maxPdfDocuments: 25,
    hasWebChat: true,
    hasTelegram: true,
    hasVK: false,
    hasMAX: false,
    hasVoice: false,
    hasAISettings: false,
    hasAdvancedAISettings: false,
    hasCustomization: false,
    hasPersonalManager: false,
    hasWidget: true,
    hasPageSettings: true,
    hasStats: true
  },
  enterprise: {
    id: 'enterprise',
    name: 'Премиум',
    maxPdfDocuments: 100,
    hasWebChat: true,
    hasTelegram: true,
    hasVK: true,
    hasMAX: true,
    hasVoice: true,
    hasAISettings: false,
    hasAdvancedAISettings: false,
    hasCustomization: true,
    hasPersonalManager: true,
    hasWidget: true,
    hasPageSettings: true,
    hasStats: true
  }
};

export function getTariffLimits(tariffId: string | null): TariffLimits {
  if (!tariffId || !TARIFF_LIMITS[tariffId]) {
    return TARIFF_LIMITS.basic;
  }
  return TARIFF_LIMITS[tariffId];
}

export function canUploadMoreDocuments(currentCount: number, tariffId: string | null): boolean {
  const isSuperAdminViewing = sessionStorage.getItem('superadmin_viewing_tenant') === 'true';
  if (isSuperAdminViewing) return true;
  
  const limits = getTariffLimits(tariffId);
  if (limits.maxPdfDocuments === -1) return true;
  return currentCount < limits.maxPdfDocuments;
}

export function hasFeatureAccess(feature: keyof Omit<TariffLimits, 'id' | 'name' | 'maxPdfDocuments'>, tariffId: string | null): boolean {
  const isSuperAdminViewing = sessionStorage.getItem('superadmin_viewing_tenant') === 'true';
  if (isSuperAdminViewing) return true;
  
  const limits = getTariffLimits(tariffId);
  return limits[feature];
}