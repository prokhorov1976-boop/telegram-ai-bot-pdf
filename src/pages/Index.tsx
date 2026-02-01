import GuestView from '@/components/hotel/GuestView';
import AdminView from '@/components/hotel/AdminView';
import AdminLoginForm from '@/components/hotel/AdminLoginForm';
import ChatArea from '@/components/hotel/ChatArea';
import { useToast } from '@/hooks/use-toast';
import { useIndexState } from './hooks/useIndexState';
import { useIndexActions } from './hooks/useIndexActions';
import { useIndexEffects } from './hooks/useIndexEffects';
import { IndexHeader } from './components/IndexHeader';

const Index = () => {
  const { toast } = useToast();
  const state = useIndexState();
  
  // Определяем режим виджета
  const searchParams = new URLSearchParams(window.location.search);
  const isWidget = searchParams.get('widget') === '1';
  
  const actions = useIndexActions({
    messages: state.messages,
    setMessages: state.setMessages,
    inputMessage: state.inputMessage,
    setInputMessage: state.setInputMessage,
    isLoading: state.isLoading,
    setIsLoading: state.setIsLoading,
    sessionId: state.sessionId,
    currentTenantId: state.currentTenantId,
    setDocuments: state.setDocuments,
    setPageSettings: state.setPageSettings,
    setQuickQuestions: state.setQuickQuestions,
    setConsentEnabled: state.setConsentEnabled,
    setConsentText: state.setConsentText,
    setFz152Enabled: state.setFz152Enabled,
    setCurrentTenantId: state.setCurrentTenantId,
    setCurrentTenantName: state.setCurrentTenantName,
    setIsAdminAuthenticated: state.setIsAdminAuthenticated,
    setView: state.setView,
    toast
  });

  useIndexEffects({
    tenantSlug: state.tenantSlug,
    currentTenantId: state.currentTenantId,
    view: state.view,
    isAdminAuthenticated: state.isAdminAuthenticated,
    loadTenantInfo: actions.loadTenantInfo,
    loadPageSettings: actions.loadPageSettings,
    loadConsentSettings: actions.loadConsentSettings,
    loadDocuments: actions.loadDocuments
  });

  if (state.view === 'admin' && !state.isAdminAuthenticated) {
    return <AdminLoginForm onLoginSuccess={actions.handleAdminLoginSuccess} />;
  }

  // Режим виджета - только чат без брендинга
  if (isWidget) {
    return (
      <div className="h-screen w-full">
        <ChatArea
          messages={state.messages}
          inputMessage={state.inputMessage}
          isLoading={state.isLoading}
          onInputChange={state.setInputMessage}
          onSendMessage={actions.handleSendMessage}
          pageSettings={state.pageSettings}
          consentEnabled={state.consentEnabled}
          consentText={state.consentText}
          isWidget={true}
          quickQuestions={state.quickQuestions}
          onQuickQuestion={actions.handleQuickQuestion}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto p-4 lg:p-8 max-w-6xl">
        <IndexHeader
          pageSettings={state.pageSettings}
          view={state.view}
          isAdminAuthenticated={state.isAdminAuthenticated}
          onViewChange={state.setView}
          onLogout={actions.handleLogout}
        />

        {state.view === 'guest' ? (
          <GuestView
            messages={state.messages}
            inputMessage={state.inputMessage}
            isLoading={state.isLoading}
            onInputChange={state.setInputMessage}
            onSendMessage={actions.handleSendMessage}
            onQuickQuestion={actions.handleQuickQuestion}
            pageSettings={state.pageSettings}
            quickQuestions={state.quickQuestions}
            consentEnabled={state.consentEnabled}
            consentText={state.consentText}
          />
        ) : (
          <AdminView
            documents={state.documents}
            onFileUpload={actions.handleFileUpload}
            onDeleteDocument={actions.handleDeleteDocument}
            isLoading={state.isLoading}
            currentTenantId={state.currentTenantId}
            tenantName={state.currentTenantName}
            fz152Enabled={state.fz152Enabled}
          />
        )}
      </div>
    </div>
  );
};

export default Index;