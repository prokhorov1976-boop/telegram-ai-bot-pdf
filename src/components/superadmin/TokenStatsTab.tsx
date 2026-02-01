import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { authenticatedFetch } from '@/lib/auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tenant, BACKEND_URLS } from './types';

interface TokenStats {
  tenantId?: number;
  period: string;
  totalTokens: number;
  totalCost: number;
  breakdown?: Array<{
    operationType: string;
    model: string;
    totalTokens: number;
    totalCost: number;
    operationsCount: number;
  }>;
  tenants?: Array<{
    tenantId: number;
    slug: string;
    name: string;
    totalTokens: number;
    totalCost: number;
    operationsCount: number;
  }>;
}

interface TokenStatsTabProps {
  tenants: Tenant[];
}

export function TokenStatsTab({ tenants }: TokenStatsTabProps) {
  const { toast } = useToast();
  const [stats, setStats] = useState<TokenStats | null>(null);
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
        ? `${BACKEND_URLS.tokenStats}?period=${period}`
        : `${BACKEND_URLS.tokenStats}?tenantId=${selectedTenant}&period=${period}`;
      
      console.log('Loading token stats from:', url);
      const response = await authenticatedFetch(url);
      console.log('Token stats response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Token stats data:', data);
        setStats(data);
      } else {
        const errorText = await response.text();
        console.error('Token stats error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (error: any) {
      console.error('Error loading token stats:', error);
      toast({
        title: 'Ошибка загрузки статистики',
        description: error.message || 'Не удалось загрузить статистику токенов',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getOperationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      embedding_create: 'Создание базы (эмбеддинги)',
      embedding_query: 'Запросы пользователей',
      gpt_response: 'Генерация ответов GPT',
      speech_recognition: 'Распознавание речи'
    };
    return labels[type] || type;
  };

  const getOperationIcon = (type: string) => {
    const icons: Record<string, string> = {
      embedding_create: 'Database',
      embedding_query: 'Search',
      gpt_response: 'MessageSquare',
      speech_recognition: 'Mic'
    };
    return icons[type] || 'Activity';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="BarChart3" size={24} />
            Статистика использования токенов
          </CardTitle>
          <CardDescription>
            Отслеживайте расходы на API (эмбеддинги, GPT, распознавание речи) по каждому тенанту
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
                            <span className="text-slate-600">Токенов:</span>
                            <span className="font-semibold">{tenant.totalTokens.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Операций:</span>
                            <span className="font-semibold">{tenant.operationsCount}</span>
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <CardTitle className="text-sm text-slate-600">Период</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{stats.period}</div>
                      </CardContent>
                    </Card>
                  </div>

                  {stats.breakdown && stats.breakdown.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Детализация по операциям</h3>
                      <div className="space-y-3">
                        {stats.breakdown.map((item, idx) => (
                          <Card key={idx}>
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg ${
                                    item.operationType === 'speech_recognition' 
                                      ? 'bg-purple-100' 
                                      : item.operationType === 'gpt_response'
                                      ? 'bg-blue-100'
                                      : 'bg-green-100'
                                  }`}>
                                    <Icon 
                                      name={getOperationIcon(item.operationType)} 
                                      size={20} 
                                      className={
                                        item.operationType === 'speech_recognition' 
                                          ? 'text-purple-600' 
                                          : item.operationType === 'gpt_response'
                                          ? 'text-blue-600'
                                          : 'text-green-600'
                                      }
                                    />
                                  </div>
                                  <div>
                                    <div className="font-semibold">{getOperationTypeLabel(item.operationType)}</div>
                                    <div className="text-sm text-slate-500">{item.model}</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-purple-600">{item.totalCost.toFixed(2)} ₽</div>
                                  <div className="text-sm text-slate-500">{item.operationsCount} операций</div>
                                </div>
                              </div>
                              <div className="text-sm text-slate-600">
                                {item.totalTokens.toLocaleString()} {item.operationType === 'speech_recognition' ? 'секунд' : 'токенов'}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!stats.breakdown || stats.breakdown.length === 0) && (
                    <div className="text-center py-8 text-slate-500">
                      За выбранный период нет данных об использовании токенов
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              Выберите тенанта и период для просмотра статистики
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}