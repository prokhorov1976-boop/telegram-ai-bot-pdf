import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { BACKEND_URLS } from './types';
import { authenticatedFetch, getTenantId } from '@/lib/auth';

interface ChatStats {
  totalMessages: number;
  totalUsers: number;
  messagesToday: number;
  messagesWeek: number;
  popularQuestions: Array<{ question: string; count: number }>;
  dailyStats: Array<{ date: string; count: number }>;
  topUsers: Array<{ user: string; messages: number }>;
}

interface ChatStatsCardProps {
  currentTenantId?: number | null;
}

const ChatStatsCard = ({ currentTenantId }: ChatStatsCardProps) => {
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tenantId = currentTenantId || getTenantId();
    if (tenantId) {
      loadStats(tenantId);
    } else {
      setError('Не удалось определить ID клиента');
      setIsLoading(false);
    }
  }, [currentTenantId]);

  const loadStats = async (tenantId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const url = `${BACKEND_URLS.getChatStats}?tenant_id=${tenantId}`;
      const response = await authenticatedFetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
      setError(error instanceof Error ? error.message : 'Не удалось загрузить статистику');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-xl">
        <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-blue-50">
          <CardTitle className="flex items-center gap-2">
            <Icon name="BarChart3" size={20} />
            Статистика чата
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
      <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-blue-50">
        <CardTitle className="flex items-center gap-2">
          <Icon name="BarChart3" size={20} />
          Статистика чата
        </CardTitle>
        <CardDescription>Активность пользователей и популярные вопросы</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="MessageSquare" size={16} className="text-blue-600" />
              <span className="text-xs text-blue-700 font-medium">Всего сообщений</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">{stats.totalMessages}</p>
          </div>

          <div className="p-4 rounded-lg bg-green-50 border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="Users" size={16} className="text-green-600" />
              <span className="text-xs text-green-700 font-medium">Пользователей</span>
            </div>
            <p className="text-2xl font-bold text-green-900">{stats.totalUsers}</p>
          </div>

          <div className="p-4 rounded-lg bg-orange-50 border border-orange-100">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="Clock" size={16} className="text-orange-600" />
              <span className="text-xs text-orange-700 font-medium">За сегодня</span>
            </div>
            <p className="text-2xl font-bold text-orange-900">{stats.messagesToday}</p>
          </div>

          <div className="p-4 rounded-lg bg-purple-50 border border-purple-100">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="Calendar" size={16} className="text-purple-600" />
              <span className="text-xs text-purple-700 font-medium">За неделю</span>
            </div>
            <p className="text-2xl font-bold text-purple-900">{stats.messagesWeek}</p>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Icon name="TrendingUp" size={18} />
            Популярные вопросы
          </h3>
          <ScrollArea className="h-64 border rounded-lg">
            <div className="p-3 space-y-2">
              {stats.popularQuestions && stats.popularQuestions.length > 0 ? (
                stats.popularQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">{idx + 1}</span>
                      </div>
                      <p className="text-sm text-slate-700 break-words">{q.question}</p>
                    </div>
                    <span className="ml-3 px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded flex-shrink-0">
                      {q.count}×
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 text-center py-8">Нет данных о популярных вопросах</p>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Icon name="Activity" size={18} />
              Активность по дням
            </h3>
            <ScrollArea className="h-48 border rounded-lg">
              <div className="p-3 space-y-2">
                {stats.dailyStats && stats.dailyStats.length > 0 ? (
                  stats.dailyStats.map((day, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-50">
                      <span className="text-sm text-slate-700">{day.date}</span>
                      <span className="text-sm font-medium text-slate-900">{day.count} сообщ.</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 text-center py-8">Нет данных</p>
                )}
              </div>
            </ScrollArea>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Icon name="Crown" size={18} />
              Самые активные
            </h3>
            <ScrollArea className="h-48 border rounded-lg">
              <div className="p-3 space-y-2">
                {stats.topUsers && stats.topUsers.length > 0 ? (
                  stats.topUsers.map((user, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-50">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                          <span className="text-xs font-bold text-white">{idx + 1}</span>
                        </div>
                        <span className="text-sm text-slate-700 truncate">{user.user}</span>
                      </div>
                      <span className="text-sm font-medium text-slate-900">{user.messages} сообщ.</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 text-center py-8">Нет данных</p>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatStatsCard;