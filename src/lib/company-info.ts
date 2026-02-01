export interface CompanyInfo {
  name: string;
  inn: string;
  email: string;
  phone: string;
  address: string;
  legalForm: string;
}

const STORAGE_KEY = 'company_info';

const DEFAULT_COMPANY_INFO: CompanyInfo = {
  name: 'Прохоров С. В.',
  inn: '910800040469',
  email: 'info@298100.ru',
  phone: '+7 (978) 723-60-35',
  address: 'Республика Крым, г. Феодосия',
  legalForm: 'Плательщик НПД'
};

export const getCompanyInfo = (): CompanyInfo => {
  if (typeof window === 'undefined') {
    return DEFAULT_COMPANY_INFO;
  }
  
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return DEFAULT_COMPANY_INFO;
    }
  }
  return DEFAULT_COMPANY_INFO;
};

export const saveCompanyInfo = (info: CompanyInfo): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
  }
};
