import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/lib/auth';
import Icon from '@/components/ui/icon';
import { BACKEND_URLS } from './types';

interface SystemStats {
  tenants: {
    total: number;
    active: number;
    expired: number;
    trial: number;
  };
  messages: {
    total: number;
    last_24h: number;
    last_1h: number;
  };
  documents: {
    total: number;
  };
  expiring_subscriptions: number;
  tariff_distribution: Array<{
    tariff_name: string;
    tenant_count: number;
  }>;
  database: {
    max_connections: number;
    tables: number;
  };
  capacity: {
    recommended_max_tenants: number;
    current_usage_percent: number;
  };
}

export const SystemMonitoringTab = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const response = await authenticatedFetch(BACKEND_URLS.systemMonitoring);
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setLastUpdate(new Date(data.timestamp).toLocaleString('ru-RU'));
      } else {
        throw new Error('Failed to load stats');
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить статистику',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 60000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading && !stats) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Icon name="Loader2" className="animate-spin mx-auto mb-2" size={32} />
          <p className="text-slate-600">Загрузка статистики...</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-slate-600">
          Нет данных для отображения
        </CardContent>
      </Card>
    );
  }

  const usageColor = stats.capacity.current_usage_percent > 75 ? 'text-red-600' : stats.capacity.current_usage_percent > 50 ? 'text-orange-600' : 'text-green-600';

  return (
    <div className="space-y-6">
      {/* Заголовок с временем обновления */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Мониторинг системы</h2>
          <p className="text-sm text-slate-600">Последнее обновление: {lastUpdate}</p>
        </div>
        <button
          onClick={loadStats}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Icon name={isLoading ? "Loader2" : "RefreshCw"} size={16} className={isLoading ? "animate-spin" : ""} />
          Обновить
        </button>
      </div>

      {/* Основные метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Активные тенанты */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Активные тенанты</CardDescription>
            <CardTitle className="text-3xl">{stats.tenants.active}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-600">
              Всего: {stats.tenants.total} (истекло: {stats.tenants.expired})
            </p>
          </CardContent>
        </Card>

        {/* Сообщения за 24ч */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Сообщений за 24ч</CardDescription>
            <CardTitle className="text-3xl">{stats.messages.last_24h}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-600">
              Всего сообщений: {stats.messages.total}
            </p>
          </CardContent>
        </Card>

        {/* Документы */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Документов загружено</CardDescription>
            <CardTitle className="text-3xl">{stats.documents.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-600">
              PDF-файлы в системе
            </p>
          </CardContent>
        </Card>

        {/* Истекающие подписки */}
        <Card className={stats.expiring_subscriptions > 0 ? 'border-orange-300 bg-orange-50' : ''}>
          <CardHeader className="pb-2">
            <CardDescription>Истекают в течение 7 дней</CardDescription>
            <CardTitle className="text-3xl text-orange-600">{stats.expiring_subscriptions}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-600">
              Требуют продления
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Загрузка системы */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Gauge" size={20} />
            Загрузка системы
          </CardTitle>
          <CardDescription>Текущее использование ресурсов</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Активные тенанты</span>
              <span className={`text-sm font-bold ${usageColor}`}>
                {stats.tenants.active} / {stats.capacity.recommended_max_tenants} ({stats.capacity.current_usage_percent}%)
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  stats.capacity.current_usage_percent > 75 ? 'bg-red-500' :
                  stats.capacity.current_usage_percent > 50 ? 'bg-orange-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(stats.capacity.current_usage_percent, 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-600 mt-2">
              Рекомендуемый максимум на текущем тарифе: {stats.capacity.recommended_max_tenants} тенантов
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-slate-600">Макс. подключений к БД</p>
              <p className="text-2xl font-bold">{stats.database.max_connections}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Таблиц в БД</p>
              <p className="text-2xl font-bold">{stats.database.tables}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Распределение по тарифам */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="PieChart" size={20} />
            Распределение по тарифам
          </CardTitle>
          <CardDescription>Активные подписки по тарифным планам</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.tariff_distribution.map((tariff, index) => {
              const percentage = stats.tenants.active > 0 
                ? Math.round((tariff.tenant_count / stats.tenants.active) * 100) 
                : 0;
              
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{tariff.tariff_name}</span>
                    <span className="text-sm text-slate-600">{tariff.tenant_count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-500 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Рекомендации */}
      {stats.capacity.current_usage_percent > 60 && (
        <Card className="border-orange-300 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <Icon name="AlertTriangle" size={20} />
              Рекомендации по масштабированию
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {stats.capacity.current_usage_percent > 75 && (
              <p className="text-red-700 font-medium">
                ⚠️ Система близка к лимиту! Рекомендуется апгрейд БД или оптимизация нагрузки.
              </p>
            )}
            {stats.capacity.current_usage_percent > 60 && stats.capacity.current_usage_percent <= 75 && (
              <p className="text-orange-700">
                Нагрузка выше среднего. Следите за производительностью и планируйте апгрейд.
              </p>
            )}
            <ul className="list-disc list-inside text-slate-700 space-y-1 ml-2">
              <li>Увеличить тариф БД (больше vCPU, больше подключений)</li>
              <li>Добавить connection pooling (PgBouncer)</li>
              <li>Настроить кэширование (Redis для частых запросов)</li>
              <li>Рассмотреть read replicas для PostgreSQL</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
