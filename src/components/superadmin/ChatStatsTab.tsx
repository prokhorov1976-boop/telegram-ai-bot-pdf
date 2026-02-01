import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { authenticatedFetch } from '@/lib/auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tenant, BACKEND_URLS } from './types';

interface ChatStats {
  tenantId?: number;
  period: string;
  totalMessages: number;
  totalTokens: number;
  totalCost: number;
  avgTokensPerMessage: number;
  topChats?: Array<{
    chatId: string;
    userName: string;
    messageCount: number;
    totalTokens: number;
    totalCost: number;
  }>;
  tenants?: Array<{
    tenantId: number;
    slug: string;
    name: string;
    totalMessages: number;
    totalTokens: number;
    totalCost: number;
  }>;
}

interface ChatStatsTabProps {
  tenants: Tenant[];
}

export function ChatStatsTab({ tenants }: ChatStatsTabProps) {
  const { toast } = useToast();
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<string>('all');
  const [period, setPeriod] = useState<string>('30');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadStats();
  }, [selectedTenant, period]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const url = selectedTenant === 'all'
        ? `${BACKEND_URLS.chatStats}?period=${period}`
        : `${BACKEND_URLS.chatStats}?tenantId=${selectedTenant}&period=${period}`;
      
      console.log('Loading chat stats from:', url);
      const response = await authenticatedFetch(url);
      console.log('Chat stats response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Chat stats data:', data);
        setStats(data);
      } else {
        const errorText = await response.text();
        console.error('Chat stats error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (error: any) {
      console.error('Error loading chat stats:', error);
      toast({
        title: 'Ошибка загрузки статистики',
        description: error.message || 'Не удалось загрузить статистику чатов',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="MessageSquare" size={24} />
            Статистика расходов токенов в чатах
          </CardTitle>
          <CardDescription>
            Отслеживайте расходы на ИИ-ответы в диалогах с пользователями
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Тенант</label>
              <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все тенанты</SelectItem>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id.toString()}>
                      {tenant.name} ({tenant.slug})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <label className="block text-sm font-medium mb-2">Период</label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 дней</SelectItem>
                  <SelectItem value="30">30 дней</SelectItem>
                  <SelectItem value="90">90 дней</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={loadStats} disabled={isLoading}>
                <Icon name="RefreshCw" size={16} className="mr-2" />
                Обновить
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-slate-500">
              Загрузка статистики...
            </div>
          ) : stats ? (
            <div className="space-y-6">
              {selectedTenant === 'all' ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Статистика по всем тенантам</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stats.tenants?.map((tenant) => (
                      <Card key={tenant.tenantId}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">{tenant.name}</CardTitle>
                          <CardDescription className="text-xs">{tenant.slug} (ID: {tenant.tenantId})</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Сообщений:</span>
                            <span className="font-semibold">{tenant.totalMessages.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Токенов:</span>
                            <span className="font-semibold">{tenant.totalTokens.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-lg font-bold text-purple-600 pt-2 border-t">
                            <span>Расход:</span>
                            <span>{tenant.totalCost.toFixed(2)} ₽</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-slate-600">Всего сообщений</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{stats.totalMessages.toLocaleString()}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-slate-600">Всего токенов</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{stats.totalTokens.toLocaleString()}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-slate-600">Общий расход</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-purple-600">{stats.totalCost.toFixed(2)} ₽</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-slate-600">Токенов/сообщение</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{stats.avgTokensPerMessage.toFixed(0)}</div>
                      </CardContent>
                    </Card>
                  </div>

                  {stats.topChats && stats.topChats.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Топ чатов по расходам</h3>
                      <div className="space-y-3">
                        {stats.topChats.map((chat, idx) => (
                          <Card key={chat.chatId}>
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-600">
                                    {idx + 1}
                                  </div>
                                  <div>
                                    <div className="font-semibold">{chat.userName}</div>
                                    <div className="text-xs text-slate-500">Chat ID: {chat.chatId}</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-purple-600">{chat.totalCost.toFixed(2)} ₽</div>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-slate-600">Сообщений:</span>
                                  <span className="font-medium">{chat.messageCount}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-600">Токенов:</span>
                                  <span className="font-medium">{chat.totalTokens.toLocaleString()}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              Нет данных для отображения
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}