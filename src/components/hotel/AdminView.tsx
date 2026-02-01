import { useState } from 'react';
import TelegramSettingsCard from './TelegramSettingsCard';
import VKSettingsCard from './VKSettingsCard';
import MAXSettingsCard from './MAXSettingsCard';
import PageSettingsCard from './PageSettingsCard';
import WidgetSettingsCard from './WidgetSettingsCard';
import AiSettingsCard from './AiSettingsCard';
import QualityGateSettingsCard from './QualityGateSettingsCard';
import BackupManagementCard from './BackupManagementCard';
import SubscriptionWidget from './SubscriptionWidget';
import MessengerAutoMessages from './MessengerAutoMessages';
import FormattingSettingsCard from './FormattingSettingsCard';
import EmojiMappingCard from './EmojiMappingCard';
import AdminHeader from './AdminHeader';
import UpgradeCard from './UpgradeCard';
import TenantUrlEditor from './TenantUrlEditor';
import TenantApiKeysCard from './TenantApiKeysCard';
import ApiKeysGuideCard from './ApiKeysGuideCard';
import ChatTestCard from './ChatTestCard';
import ConsentSettingsCard from './ConsentSettingsCard';
import { DocumentStatsCards } from './DocumentStatsCards';
import { DocumentsPanel } from './DocumentsPanel';
import ChatStatsCard from './ChatStatsCard';
import TokenCostCard from './TokenCostCard';
import EmbeddingsSettings from './EmbeddingsSettings';
import SupportChat from '@/components/SupportChat';
import PublicChatLinkCard from './PublicChatLinkCard';
import SpeechSettingsCard from './SpeechSettingsCard';
import ProxySettingsCard from './ProxySettingsCard';
import { Document, BACKEND_URLS } from './types';
import { getTenantId, getTariffId, isSuperAdmin, getAdminUser, exitTenantView } from '@/lib/auth';
import { useNavigate, useParams } from 'react-router-dom';
import { hasFeatureAccess } from '@/lib/tariff-limits';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface AdminViewProps {
  documents: Document[];
  isLoading: boolean;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteDocument: (documentId: number) => Promise<any>;
  currentTenantId: number | null;
  tenantName?: string;
  fz152Enabled?: boolean;
}

const AdminView = ({ documents, isLoading, onFileUpload, onDeleteDocument, currentTenantId, tenantName, fz152Enabled = false }: AdminViewProps) => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const tenantId = getTenantId();
  const tariffId = getTariffId();
  const superAdmin = isSuperAdmin();
  const currentUser = getAdminUser();
  const isViewingOtherTenant = sessionStorage.getItem('superadmin_viewing_tenant') === 'true';
  const [activeTab, setActiveTab] = useState('documents');
  const [currentSlug, setCurrentSlug] = useState(tenantSlug || '');

  // Подсчёт количества видимых вкладок
  const tabsCount = 
    4 + // Документы, Мессенджеры, Страница, Виджет (всегда)
    ((superAdmin || fz152Enabled) ? 1 : 0) + // AI
    (fz152Enabled ? 1 : 0) + // 152-ФЗ
    (superAdmin ? 1 : 0); // Эмбеддинги

  const handleExitTenantView = () => {
    exitTenantView();
    sessionStorage.setItem('superadmin_active_tab', 'users');
    navigate('/super-admin');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <AdminHeader
        currentUser={currentUser}
        superAdmin={superAdmin}
        isViewingOtherTenant={isViewingOtherTenant}
        tenantId={tenantId}
        tariffId={tariffId}
        fz152Enabled={fz152Enabled}
        onExitTenantView={handleExitTenantView}
      />

      {tenantId !== null && tenantId !== undefined && (
        <SubscriptionWidget tenantId={tenantId} />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className={`bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg p-2 grid gap-2 h-auto grid-cols-3 lg:grid-cols-${tabsCount}`}>
          <TabsTrigger value="documents" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=inactive]:text-white py-3 px-4 text-base font-semibold">
            <Icon name="FileText" size={20} className="mr-2" />
            <span>Документы</span>
          </TabsTrigger>
          <TabsTrigger value="messengers" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=inactive]:text-white py-3 px-4 text-base font-semibold">
            <Icon name="MessageCircle" size={20} className="mr-2" />
            <span>Мессенджеры</span>
          </TabsTrigger>
          {(superAdmin || fz152Enabled) && (
            <TabsTrigger value="ai" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=inactive]:text-white py-3 px-4 text-base font-semibold">
              <Icon name="Brain" size={20} className="mr-2" />
              <span>AI</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="page" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=inactive]:text-white py-3 px-4 text-base font-semibold">
            <Icon name="Layout" size={20} className="mr-2" />
            <span>Страница</span>
          </TabsTrigger>
          <TabsTrigger value="widget" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=inactive]:text-white py-3 px-4 text-base font-semibold">
            <Icon name="Code" size={20} className="mr-2" />
            <span>Виджет</span>
          </TabsTrigger>
          {fz152Enabled && (
            <TabsTrigger value="consent" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=inactive]:text-white py-3 px-4 text-base font-semibold">
              <Icon name="ShieldCheck" size={20} className="mr-2" />
              <span>152-ФЗ</span>
            </TabsTrigger>
          )}
          {superAdmin && (
            <TabsTrigger value="embeddings" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=inactive]:text-white py-3 px-4 text-base font-semibold">
              <Icon name="BrainCircuit" size={20} className="mr-2" />
              <span>Эмбеддинги</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="documents" className="space-y-6">
          <DocumentsPanel
            documents={documents}
            isLoading={isLoading}
            onFileUpload={onFileUpload}
            onDeleteDocument={onDeleteDocument}
          />
          <DocumentStatsCards documents={documents} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChatStatsCard currentTenantId={currentTenantId} />
            {fz152Enabled && <TokenCostCard currentTenantId={currentTenantId} />}
          </div>
        </TabsContent>

        <TabsContent value="messengers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {(superAdmin || hasFeatureAccess('hasTelegram', tariffId)) ? (
              <TelegramSettingsCard
                webhookUrl={BACKEND_URLS.telegramWebhook}
                chatFunctionUrl={BACKEND_URLS.chat}
              />
            ) : (
              <UpgradeCard feature="Интеграция с Telegram" />
            )}

            {(superAdmin || hasFeatureAccess('hasVK', tariffId)) ? (
              <VKSettingsCard
                webhookUrl={BACKEND_URLS.vkWebhook}
                chatFunctionUrl={BACKEND_URLS.chat}
              />
            ) : (
              <UpgradeCard feature="Интеграция с VK" />
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {(superAdmin || hasFeatureAccess('hasMAX', tariffId)) ? (
              <MAXSettingsCard
                webhookUrl={BACKEND_URLS.maxWebhook}
                chatFunctionUrl={BACKEND_URLS.chat}
              />
            ) : (
              <UpgradeCard feature="Интеграция с MAX.ru" />
            )}
          </div>

          <MessengerAutoMessages isSuperAdmin={superAdmin} />
          
          {/* Форматирование доступно всем, у кого есть мессенджеры */}
          {(superAdmin || hasFeatureAccess('hasTelegram', tariffId) || hasFeatureAccess('hasVK', tariffId) || hasFeatureAccess('hasMAX', tariffId)) && (
            <FormattingSettingsCard />
          )}
          
          {superAdmin && <EmojiMappingCard />}
          
          {!superAdmin && !hasFeatureAccess('hasTelegram', tariffId) && !hasFeatureAccess('hasVK', tariffId) && !hasFeatureAccess('hasMAX', tariffId) && (
            <Card className="shadow-xl border-2 border-orange-200">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50">
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Zap" size={20} />
                  Больше возможностей
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-slate-600 mb-4">
                  Ваш тариф <strong>Старт</strong> включает базовый функционал. Чтобы подключить интеграции с мессенджерами:
                </p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Icon name="Check" size={16} className="text-green-600" />
                    <span className="text-sm"><strong>Бизнес:</strong> Telegram + Статистика</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="Check" size={16} className="text-purple-600" />
                    <span className="text-sm"><strong>Премиум:</strong> Telegram + VK + MAX + Персональный менеджер</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          {(superAdmin || fz152Enabled) ? (
            <div className="space-y-6">
              {superAdmin && (
                <AiSettingsCard
                  currentTenantId={currentTenantId}
                  isSuperAdmin={superAdmin}
                />
              )}
              {superAdmin && currentTenantId && (
                <SpeechSettingsCard
                  tenantId={currentTenantId}
                  tenantName={tenantName}
                  fz152Enabled={fz152Enabled}
                />
              )}
              {currentTenantId && tenantName && (fz152Enabled || superAdmin) && (
                <>
                  {(superAdmin || !fz152Enabled) && <ApiKeysGuideCard />}
                  <TenantApiKeysCard
                    tenantId={currentTenantId}
                    tenantName={tenantName}
                    fz152Enabled={fz152Enabled && !superAdmin}
                  />
                  {!fz152Enabled && (
                    <ProxySettingsCard
                      tenantId={currentTenantId}
                      tenantName={tenantName}
                    />
                  )}
                  {superAdmin && (
                    <ChatTestCard
                      tenantId={currentTenantId}
                      tenantName={tenantName}
                    />
                  )}
                </>
              )}
              {superAdmin && currentTenantId && currentSlug && tenantName && (
                <TenantUrlEditor
                  tenantId={currentTenantId}
                  currentSlug={currentSlug}
                  tenantName={tenantName}
                  onSlugUpdated={(newSlug) => setCurrentSlug(newSlug)}
                />
              )}
              {superAdmin && currentTenantId && (
                <QualityGateSettingsCard currentTenantId={currentTenantId} />
              )}
              {superAdmin && currentTenantId && (
                <BackupManagementCard currentTenantId={currentTenantId} />
              )}
            </div>
          ) : (
            <UpgradeCard feature="Настройки AI доступны при включенном 152-ФЗ" />
          )}
        </TabsContent>

        <TabsContent value="page" className="space-y-6">
          <PageSettingsCard
            currentTenantId={currentTenantId}
            currentTenantName={tenantName || null}
          />
        </TabsContent>

        <TabsContent value="widget" className="space-y-6">
          <WidgetSettingsCard
            getSettingsUrl={BACKEND_URLS.getWidgetSettings}
            updateSettingsUrl={BACKEND_URLS.updateWidgetSettings}
          />
          <PublicChatLinkCard tenantSlug={tenantSlug} />
        </TabsContent>

        {fz152Enabled && (
          <TabsContent value="consent" className="space-y-6">
            {currentTenantId && <ConsentSettingsCard tenantId={currentTenantId} />}
          </TabsContent>
        )}

        {superAdmin && (
          <TabsContent value="embeddings" className="space-y-6">
            <EmbeddingsSettings
              currentTenantId={currentTenantId}
              tenantName={tenantName}
              fz152Enabled={fz152Enabled}
            />
          </TabsContent>
        )}
      </Tabs>
      <SupportChat 
        userName={currentUser?.name} 
        userEmail={currentUser?.email}
      />
    </div>
  );
};

export default AdminView;