import { Message, Document, PageSettings, QuickQuestion } from '@/components/hotel/types';

export interface IndexState {
  tenantSlug?: string;
  location: any;
  view: 'guest' | 'admin';
  setView: (view: 'guest' | 'admin') => void;
  isAdminAuthenticated: boolean;
  setIsAdminAuthenticated: (value: boolean) => void;
  currentTenantId: number | null;
  setCurrentTenantId: (id: number | null) => void;
  currentTenantName: string;
  setCurrentTenantName: (name: string) => void;
  messages: Message[];
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  inputMessage: string;
  setInputMessage: (value: string) => void;
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
  documents: Document[];
  setDocuments: (docs: Document[]) => void;
  sessionId: string;
  pageSettings?: PageSettings;
  setPageSettings: (settings: PageSettings | undefined) => void;
  quickQuestions: QuickQuestion[];
  setQuickQuestions: (questions: QuickQuestion[]) => void;
  consentEnabled: boolean;
  setConsentEnabled: (value: boolean) => void;
  consentText: string;
  setConsentText: (value: string) => void;
  fz152Enabled: boolean;
  setFz152Enabled: (value: boolean) => void;
}

export interface IndexActions {
  loadTenantInfo: (tenantSlug?: string) => Promise<void>;
  loadPageSettings: () => Promise<void>;
  loadConsentSettings: () => Promise<void>;
  loadDocuments: () => Promise<void>;
  handleSendMessage: () => Promise<void>;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleQuickQuestion: (question: string) => void;
  handleDeleteDocument: (documentId: number) => Promise<void>;
  handleAdminLoginSuccess: () => void;
  handleLogout: () => void;
}

export interface UseIndexActionsParams {
  messages: Message[];
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  inputMessage: string;
  setInputMessage: (value: string) => void;
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
  sessionId: string;
  currentTenantId: number | null;
  setDocuments: (docs: Document[]) => void;
  setPageSettings: (settings: PageSettings | undefined) => void;
  setQuickQuestions: (questions: QuickQuestion[]) => void;
  setConsentEnabled: (value: boolean) => void;
  setConsentText: (value: string) => void;
  setFz152Enabled: (value: boolean) => void;
  setCurrentTenantId: (id: number | null) => void;
  setCurrentTenantName: (name: string) => void;
  setIsAdminAuthenticated: (value: boolean) => void;
  setView: (view: 'guest' | 'admin') => void;
  toast: any;
}

export interface UseIndexEffectsParams {
  tenantSlug?: string;
  currentTenantId: number | null;
  view: 'guest' | 'admin';
  isAdminAuthenticated: boolean;
  loadTenantInfo: (slug?: string) => Promise<void>;
  loadPageSettings: () => Promise<void>;
  loadConsentSettings: () => Promise<void>;
  loadDocuments: () => Promise<void>;
}

export interface ConsentSettings {
  webchat_enabled: boolean;
  messenger_enabled: boolean;
  text: string;
  messenger_text: string;
  privacy_policy_text: string;
}

export interface PublicContentResponse {
  name: string;
  fz152_enabled: boolean;
  public_description: string;
  consent_settings: ConsentSettings;
  welcome_text: string;
  faq: any[];
  contact_info: {
    phone: string;
    email: string;
    address: string;
  };
}
