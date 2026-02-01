import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { BACKEND_URLS } from './types';
import { authenticatedFetch, getTenantId } from '@/lib/auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TokenStats {
  tenantId: number;
  period: string;
  totalTokens: number;
  totalCost: number;
  totalOperations: number;
  breakdown: Array<{
    operationType: string;
    model: string;
    totalTokens: number;
    totalCost: number;
    operationsCount: number;
    avgTokens: number;
  }>;
  dailyStats: Array<{
    date: string;
    cost: number;
    tokens: number;
  }>;
}

interface TokenCostCardProps {
  currentTenantId?: number | null;
}

const TokenCostCard = ({ currentTenantId }: TokenCostCardProps) => {
  const [stats, setStats] = useState<TokenStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    const tenantId = currentTenantId || getTenantId();
    if (tenantId) {
      loadStats(tenantId);
    } else {
      setError('Не удалось определить ID клиента');
      setIsLoading(false);
    }
  }, [currentTenantId, period]);

  const loadStats = async (tenantId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const url = `${BACKEND_URLS.getTenantTokenStats}?period=${period}`;
      const response = await authenticatedFetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error loading token stats:', error);
      setError(error instanceof Error ? error.message : 'Не удалось загрузить статистику');
    } finally {
      setIsLoading(false);
    }
  };

  const getOperationLabel = (type: string) => {
    const labels: Record<string, string> = {
      'embedding_create': 'Индексация документов',
      'embedding_query': 'Поиск по базе',
      'gpt_response': 'Ответы чата'
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <Card className="shadow-xl">
        <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="flex items-center gap-2">
            <Icon name="DollarSign" size={20} />
            Расходы на API
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 flex items-center justify-center h-64">
          <Icon name="Loader2" size={32} className="animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-xl">
        <CardHeader className="border-b bg-gradient-to-r from-red-50 to-orange-50">
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Icon name="AlertCircle" size={20} />
            Ошибка загрузки статистики
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-sm text-slate-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Card className="shadow-xl">
      <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Icon name="DollarSign" size={20} />
              Расходы на API
            </CardTitle>
            <CardDescription>Стоимость использования Yandex Cloud AI</CardDescription>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 дней</SelectItem>
              <SelectItem value="30">30 дней</SelectItem>
              <SelectItem value="90">90 дней</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="DollarSign" size={16} className="text-purple-700" />
              <span className="text-xs text-purple-800 font-medium">Общая стоимость</span>
            </div>
            <p className="text-3xl font-bold text-purple-900">{stats.totalCost.toFixed(2)} ₽</p>
            <p className="text-xs text-purple-700 mt-1">{stats.period}</p>
          </div>

          <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="Hash" size={16} className="text-blue-700" />
              <span className="text-xs text-blue-800 font-medium">Токенов использовано</span>
            </div>
            <p className="text-3xl font-bold text-blue-900">{stats.totalTokens.toLocaleString()}</p>
            <p className="text-xs text-blue-700 mt-1">{stats.totalOperations} операций</p>
          </div>

          <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="TrendingDown" size={16} className="text-green-700" />
              <span className="text-xs text-green-800 font-medium">Средняя стоимость</span>
            </div>
            <p className="text-3xl font-bold text-green-900">
              {stats.totalOperations > 0 
                ? (stats.totalCost / stats.totalOperations).toFixed(2) 
                : '0.00'} ₽
            </p>
            <p className="text-xs text-green-700 mt-1">за операцию</p>
          </div>
        </div>

        {stats.breakdown && stats.breakdown.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Icon name="BarChart3" size={18} />
              Детализация расходов
            </h3>
            <ScrollArea className="h-64 border rounded-lg">
              <div className="p-3 space-y-3">
                {stats.breakdown.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-slate-900">{getOperationLabel(item.operationType)}</p>
                        <p className="text-xs text-slate-600 mt-1">Модель: {item.model}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-purple-600">{item.totalCost.toFixed(2)} ₽</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-600">
                      <div>
                        <span className="font-medium">{item.totalTokens.toLocaleString()}</span>
                        <p className="text-slate-500">токенов</p>
                      </div>
                      <div>
                        <span className="font-medium">{item.operationsCount}</span>
                        <p className="text-slate-500">операций</p>
                      </div>
                      <div>
                        <span className="font-medium">{Math.round(item.avgTokens)}</span>
                        <p className="text-slate-500">средний запрос</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {stats.dailyStats && stats.dailyStats.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Icon name="Calendar" size={18} />
              Расходы по дням
            </h3>
            <ScrollArea className="h-48 border rounded-lg">
              <div className="p-3 space-y-2">
                {stats.dailyStats.map((day, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <Icon name="Calendar" size={14} className="text-slate-500" />
                      <span className="text-sm text-slate-700 font-medium">{day.date}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-purple-600">{day.cost.toFixed(2)} ₽</p>
                      <p className="text-xs text-slate-500">{day.tokens.toLocaleString()} токенов</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Icon name="Info" size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">О расходах</p>
              <p className="text-blue-700">
                Статистика показывает реальные расходы на использование Yandex Cloud AI: 
                индексацию документов, поиск по базе знаний и генерацию ответов чата.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TokenCostCard;
