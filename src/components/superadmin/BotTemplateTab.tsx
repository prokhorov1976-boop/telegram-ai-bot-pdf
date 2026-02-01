import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AiSettingsCard from '../hotel/AiSettingsCard';
import TelegramSettingsCard from '../hotel/TelegramSettingsCard';
import VKSettingsCard from '../hotel/VKSettingsCard';
import MAXSettingsCard from '../hotel/MAXSettingsCard';
import WidgetSettingsCard from '../hotel/WidgetSettingsCard';
import PageSettingsCard from '../hotel/PageSettingsCard';
import MessengerAutoMessages from '../hotel/MessengerAutoMessages';
import { ConsentTemplateCard } from './ConsentTemplateCard';
import { BACKEND_URLS } from '../hotel/types';

export const BotTemplateTab = () => {
  const [activeTab, setActiveTab] = useState('ai');

  return (
    <div className="space-y-6">
      <Card className="border-purple-500 bg-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <Icon name="Package" size={24} />
            Шаблон для новых ботов (Template ID: 1)
          </CardTitle>
          <CardDescription className="text-purple-800">
            Настройте параметры по умолчанию, которые будут копироваться при создании новых ботов через оплату
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Icon name="Info" size={20} className="text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-2">Как работает шаблон:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Все настройки отсюда копируются новым клиентам при оплате через ЮKassa</li>
                    <li>Изменения шаблона НЕ влияют на уже созданные боты</li>
                    <li>Включает: AI промпт, мессенджеры, виджет, автосообщения, настройки страницы</li>
                    <li>Это отдельный бот — можете тестировать настройки перед применением</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Icon name="Wand2" size={20} className="text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-900">
                  <p className="font-semibold mb-2">Автоматическая подстановка данных:</p>
                  <p className="mb-2">При создании нового бота некоторые поля автоматически заполняются данными из формы оплаты:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Название бота</strong> (header_title) → название из формы оплаты</li>
                    <li><strong>Email контакт</strong> → email клиента</li>
                    <li><strong>Телефон контакт</strong> → телефон клиента</li>
                  </ul>
                  <p className="mt-2 text-amber-700 italic">Поля с автозаполнением отмечены янтарной рамкой в настройках страницы</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.open('/template/admin', '_blank')}
            >
              <Icon name="ExternalLink" size={16} className="mr-2" />
              Открыть админку шаблона
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.open('/template', '_blank')}
            >
              <Icon name="Eye" size={16} className="mr-2" />
              Посмотреть публичную страницу
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Settings" size={20} />
            Настройки шаблона
          </CardTitle>
          <CardDescription>
            Редактируйте все параметры, которые будут применены к новым ботам
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-4 lg:grid-cols-9 gap-2">
              <TabsTrigger value="ai" className="text-xs">
                <Icon name="Brain" size={14} className="mr-1" />
                AI
              </TabsTrigger>
              <TabsTrigger value="telegram" className="text-xs">
                <Icon name="Send" size={14} className="mr-1" />
                Telegram
              </TabsTrigger>
              <TabsTrigger value="vk" className="text-xs">
                <Icon name="Users" size={14} className="mr-1" />
                VK
              </TabsTrigger>
              <TabsTrigger value="max" className="text-xs">
                <Icon name="MessageSquare" size={14} className="mr-1" />
                MAX
              </TabsTrigger>
              <TabsTrigger value="widget" className="text-xs">
                <Icon name="Code" size={14} className="mr-1" />
                Виджет
              </TabsTrigger>
              <TabsTrigger value="page" className="text-xs">
                <Icon name="Layout" size={14} className="mr-1" />
                Страница
              </TabsTrigger>
              <TabsTrigger value="automessages" className="text-xs">
                <Icon name="Clock" size={14} className="mr-1" />
                Авто
              </TabsTrigger>
              <TabsTrigger value="consent" className="text-xs">
                <Icon name="ShieldCheck" size={14} className="mr-1" />
                152-ФЗ
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ai" className="space-y-4">
              <AiSettingsCard currentTenantId={1} isSuperAdmin={true} />
            </TabsContent>

            <TabsContent value="telegram" className="space-y-4">
              <TelegramSettingsCard
                webhookUrl={BACKEND_URLS.telegramWebhook}
                chatFunctionUrl={BACKEND_URLS.chat}
              />
            </TabsContent>

            <TabsContent value="vk" className="space-y-4">
              <VKSettingsCard
                webhookUrl={BACKEND_URLS.vkWebhook}
                chatFunctionUrl={BACKEND_URLS.chat}
              />
            </TabsContent>

            <TabsContent value="max" className="space-y-4">
              <MAXSettingsCard
                webhookUrl={BACKEND_URLS.maxWebhook}
                chatFunctionUrl={BACKEND_URLS.chat}
              />
            </TabsContent>

            <TabsContent value="widget" className="space-y-4">
              <WidgetSettingsCard />
            </TabsContent>

            <TabsContent value="page" className="space-y-4">
              <PageSettingsCard />
            </TabsContent>

            <TabsContent value="automessages" className="space-y-4">
              <MessengerAutoMessages isSuperAdmin={true} />
            </TabsContent>

            <TabsContent value="consent" className="space-y-4">
              <ConsentTemplateCard />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};