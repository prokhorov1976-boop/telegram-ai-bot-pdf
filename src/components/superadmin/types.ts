export interface Tariff {
  id: string;
  name: string;
  price: number;
  period: string;
  setup_fee: number;
  renewal_price: number;
  first_month_included: boolean;
  is_active: boolean;
}

export interface Tenant {
  id: number;
  slug: string;
  name: string;
  description: string;
  tariff_id: string;
  subscription_end_date: string;
  documents_count: number;
  admins_count: number;
  admin_emails: string;
  created_at: string;
  fz152_enabled: boolean;
}

export const BACKEND_URLS = {
  tariffs: 'https://functions.poehali.dev/9aaca202-0192-4234-9f65-591df1552960',
  tenants: 'https://functions.poehali.dev/b1bdd2fb-cf88-4093-a3d7-15d273763e4c',
  adminTenants: 'https://functions.poehali.dev/b1bdd2fb-cf88-4093-a3d7-15d273763e4c',
  emailTemplates: 'https://functions.poehali.dev/b58124ce-188b-4335-9dbd-46f9849954da',
  sendEmail: 'https://functions.poehali.dev/5c84ca37-0a0b-4a3f-99ec-880d3a33bcdc',
  systemMonitoring: 'https://functions.poehali.dev/f15b151c-8058-4206-aec0-26d1e438b1f5',
  consentSettings: 'https://functions.poehali.dev/2f7a79a2-87ef-4692-b9a6-1e23f408edaa',
  automationSettings: 'https://functions.poehali.dev/a56d419e-8694-4b5f-836e-3e7351155c7f',
  tokenStats: 'https://functions.poehali.dev/c88cb0c9-4dd7-47a7-b4dc-0d381a8207e1',
  chatStats: 'https://functions.poehali.dev/61fc762a-0e98-41b4-b1b4-406c5e73f78a'
};