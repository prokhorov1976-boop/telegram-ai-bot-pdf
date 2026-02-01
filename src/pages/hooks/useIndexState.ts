import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Message, Document, PageSettings, QuickQuestion } from '@/components/hotel/types';
import { isAuthenticated, getTenantId, isSuperAdmin } from '@/lib/auth';
import { IndexState } from '../types/index.types';

export const useIndexState = (): IndexState => {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const location = useLocation();
  const [view, setView] = useState<'guest' | 'admin'>('guest');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [currentTenantId, setCurrentTenantId] = useState<number | null>(null);
  const [currentTenantName, setCurrentTenantName] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      role: 'assistant', 
      content: 'Здравствуйте! Я ваш виртуальный помощник. Чем могу помочь?', 
      timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const [pageSettings, setPageSettings] = useState<PageSettings | undefined>();
  const [quickQuestions, setQuickQuestions] = useState<QuickQuestion[]>([]);
  const [consentEnabled, setConsentEnabled] = useState(false);
  const [consentText, setConsentText] = useState('');
  const [fz152Enabled, setFz152Enabled] = useState(false);

  // Слушатель автосообщений от виджета
  useEffect(() => {
    const handleAutoMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'AUTO_MESSAGE') {
        const autoMessage: Message = {
          id: `auto-${Date.now()}`,
          role: 'assistant',
          content: event.data.text,
          timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, autoMessage]);
      }
    };

    window.addEventListener('message', handleAutoMessage);
    return () => window.removeEventListener('message', handleAutoMessage);
  }, []);

  useEffect(() => {
    if (isAuthenticated()) {
      setIsAdminAuthenticated(true);
      console.log('[Index] User is authenticated. isSuperAdmin:', isSuperAdmin());
      
      const isViewingOtherTenant = sessionStorage.getItem('superadmin_viewing_tenant') === 'true';
      
      if (isSuperAdmin() && !isViewingOtherTenant && location.pathname.endsWith('/admin')) {
        console.log('[Index] Super admin detected (not viewing tenant), redirecting to /super-admin');
        window.location.href = '/super-admin';
        return;
      }
    }
    if (location.pathname.endsWith('/admin')) {
      setView('admin');
    }
  }, [location.pathname]);

  return {
    tenantSlug,
    location,
    view,
    setView,
    isAdminAuthenticated,
    setIsAdminAuthenticated,
    currentTenantId,
    setCurrentTenantId,
    currentTenantName,
    setCurrentTenantName,
    messages,
    setMessages,
    inputMessage,
    setInputMessage,
    isLoading,
    setIsLoading,
    documents,
    setDocuments,
    sessionId,
    pageSettings,
    setPageSettings,
    quickQuestions,
    setQuickQuestions,
    consentEnabled,
    setConsentEnabled,
    consentText,
    setConsentText,
    fz152Enabled,
    setFz152Enabled
  };
};