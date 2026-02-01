import { Message, BACKEND_URLS } from '@/components/hotel/types';
import { authenticatedFetch, getTenantId, isSuperAdmin } from '@/lib/auth';
import { UseIndexActionsParams, IndexActions, PublicContentResponse } from '../types/index.types';

export const useIndexActions = (params: UseIndexActionsParams): IndexActions => {
  const {
    messages,
    setMessages,
    inputMessage,
    setInputMessage,
    isLoading,
    setIsLoading,
    sessionId,
    currentTenantId,
    setDocuments,
    setPageSettings,
    setQuickQuestions,
    setConsentEnabled,
    setConsentText,
    setFz152Enabled,
    setCurrentTenantId,
    setCurrentTenantName,
    setIsAdminAuthenticated,
    setView,
    toast
  } = params;

  const loadTenantInfo = async (tenantSlug?: string) => {
    if (!tenantSlug) {
      setCurrentTenantId(getTenantId());
      return;
    }
    
    const reservedRoutes = ['admin', 'super-admin', 'payment', 'privacy-policy', 'terms-of-service'];
    if (reservedRoutes.includes(tenantSlug)) {
      console.log(`[Index] Ignoring reserved route: ${tenantSlug}`);
      setCurrentTenantId(getTenantId());
      return;
    }
    
    try {
      const response = await fetch(`${BACKEND_URLS.getTenantBySlug}?slug=${tenantSlug}`);
      if (!response.ok) {
        console.error('[Index] Tenant not found:', tenantSlug);
        setCurrentTenantId(getTenantId());
        return;
      }
      
      const tenantInfo = await response.json();
      if (tenantInfo) {
        console.log(`[Index] Loaded tenant from backend: slug=${tenantSlug}, ID=${tenantInfo.tenant_id}, name=${tenantInfo.name}`);
        setCurrentTenantId(tenantInfo.tenant_id);
        setCurrentTenantName(tenantInfo.name || '');
        
        if (isSuperAdmin()) {
          sessionStorage.setItem('superadmin_viewing_tenant', 'true');
          sessionStorage.setItem('superadmin_viewing_tenant_id', tenantInfo.tenant_id.toString());
          sessionStorage.setItem('superadmin_viewing_tariff_id', tenantInfo.tariff_id);
          console.log('[Index] Super admin viewing tenant:', tenantInfo.tenant_id);
        }
      }
    } catch (error) {
      console.error('[Index] Error loading tenant info:', error);
      setCurrentTenantId(getTenantId());
    }
  };

  const loadPageSettings = async () => {
    try {
      const tenantId = currentTenantId || getTenantId();
      const url = tenantId ? `${BACKEND_URLS.getPageSettings}?tenant_id=${tenantId}` : BACKEND_URLS.getPageSettings;
      const response = await authenticatedFetch(url);
      const data = await response.json();
      if (data.settings) {
        setPageSettings(data.settings);
      }
      if (data.quickQuestions) {
        setQuickQuestions(data.quickQuestions);
      }
    } catch (error) {
      console.error('Error loading page settings:', error);
    }
  };

  const loadConsentSettings = async () => {
    try {
      const tenantId = currentTenantId || getTenantId();
      if (!tenantId) return;
      
      const response = await authenticatedFetch(`${BACKEND_URLS.manageConsentSettings}?action=public_content&tenant_id=${tenantId}`);
      if (response.ok) {
        const data: PublicContentResponse = await response.json();
        setFz152Enabled(data.fz152_enabled || false);
        if (data.consent_settings) {
          setConsentEnabled(data.consent_settings.webchat_enabled || false);
          setConsentText(data.consent_settings.text || '');
        }
      }
    } catch (error) {
      console.error('Error loading consent settings:', error);
    }
  };

  const loadDocuments = async () => {
    try {
      const tenantId = currentTenantId || getTenantId();
      const url = tenantId ? `${BACKEND_URLS.getDocuments}?tenant_id=${tenantId}` : BACKEND_URLS.getDocuments;
      const response = await authenticatedFetch(url);
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, newMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'USER_MESSAGE_SENT' }, '*');
    }

    try {
      const response = await fetch(BACKEND_URLS.chat, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: inputMessage,
          sessionId,
          tenantId: currentTenantId || getTenantId() || 1,
          channel: 'widget'
        })
      });

      const data = await response.json();

      if (response.ok) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        if (window.parent !== window) {
          window.parent.postMessage({ type: 'USER_MESSAGE_SENT' }, '*');
        }
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось получить ответ',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Ошибка сети',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      toast({
        title: 'Ошибка',
        description: 'Выберите PDF файлы',
        variant: 'destructive'
      });
      return;
    }

    const pdfFiles = Array.from(files).filter(f => f.name.endsWith('.pdf'));
    if (pdfFiles.length === 0) {
      toast({
        title: 'Ошибка',
        description: 'Выберите PDF файлы',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    toast({ title: 'Загрузка...', description: `Загружаем ${pdfFiles.length} файл(ов)` });

    let successCount = 0;
    let errorCount = 0;

    for (const file of pdfFiles) {
      try {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const base64 = e.target?.result as string;
            resolve(base64.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const tenantId = currentTenantId || getTenantId();
        const uploadUrl = tenantId ? `${BACKEND_URLS.uploadPdf}?tenant_id=${tenantId}` : BACKEND_URLS.uploadPdf;
        const uploadResponse = await authenticatedFetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileData: base64Data,
            category: 'Общая'
          })
        });

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok) {
          const errorMsg = uploadData.error || 'Ошибка загрузки';
          toast({
            title: `Ошибка при загрузке ${file.name}`,
            description: errorMsg,
            variant: 'destructive'
          });
          throw new Error(errorMsg);
        }

        const processUrl = tenantId ? `${BACKEND_URLS.processPdf}?tenant_id=${tenantId}` : BACKEND_URLS.processPdf;
        const processResponse = await authenticatedFetch(processUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId: uploadData.documentId })
        });

        let processData;
        try {
          const responseText = await processResponse.text();
          console.log('[PDF Process] Response text:', responseText);
          processData = responseText ? JSON.parse(responseText) : {};
        } catch (parseError) {
          console.error('[PDF Process] JSON parse error:', parseError);
          toast({
            title: `Ошибка при обработке ${file.name}`,
            description: 'Некорректный ответ сервера',
            variant: 'destructive'
          });
          throw new Error('Invalid server response');
        }

        if (processResponse.ok) {
          successCount++;
        } else {
          const errorMsg = processData.error || 'Ошибка обработки';
          toast({
            title: `Ошибка при обработке ${file.name}`,
            description: errorMsg,
            variant: 'destructive'
          });
          throw new Error(errorMsg);
        }
      } catch (error: any) {
        console.error(`Error uploading ${file.name}:`, error);
        errorCount++;
      }
    }

    setIsLoading(false);
    loadDocuments();

    if (successCount > 0 && errorCount === 0) {
      toast({
        title: 'Успешно!',
        description: `Загружено ${successCount} файл(ов)`
      });
    } else if (successCount > 0 && errorCount > 0) {
      toast({
        title: 'Частично загружено',
        description: `Успешно: ${successCount}, ошибки: ${errorCount}`,
        variant: 'default'
      });
    } else {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить файлы',
        variant: 'destructive'
      });
    }

    event.target.value = '';
  };

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
    setTimeout(() => handleSendMessage(), 100);
  };

  const handleDeleteDocument = async (documentId: number) => {
    const tenantId = currentTenantId || getTenantId();
    const deleteUrl = tenantId ? `${BACKEND_URLS.deletePdf}?tenant_id=${tenantId}` : BACKEND_URLS.deletePdf;
    const response = await authenticatedFetch(deleteUrl, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Не удалось удалить документ');
    }
    
    return data;
  };

  const handleAdminLoginSuccess = () => {
    const adminUser = localStorage.getItem('adminUser');
    const userRole = adminUser ? JSON.parse(adminUser).role : null;
    
    // Супер-админа редиректим на /super-admin
    if (userRole === 'super_admin') {
      window.location.href = '/super-admin';
      return;
    }
    
    // Обычного админа оставляем в админке тенанта
    setIsAdminAuthenticated(true);
    setView('admin');
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAdminAuthenticated(false);
    setView('guest');
    toast({
      title: 'Выход выполнен',
      description: 'Вы вышли из админки'
    });
  };

  return {
    loadTenantInfo,
    loadPageSettings,
    loadConsentSettings,
    loadDocuments,
    handleSendMessage,
    handleFileUpload,
    handleQuickQuestion,
    handleDeleteDocument,
    handleAdminLoginSuccess,
    handleLogout
  };
};