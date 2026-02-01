import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/lib/auth';
import Icon from '@/components/ui/icon';
import { Tenant, Tariff, BACKEND_URLS } from './types';

interface DashboardTabProps {
  tenants: Tenant[];
  tariffs: Tariff[];
}

export const DashboardTab = ({ tenants, tariffs }: DashboardTabProps) => {
  const { toast } = useToast();
  const [automationSettings, setAutomationSettings] = useState<any>(null);
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKeyForm, setShowApiKeyForm] = useState(false);

  useEffect(() => {
    loadAutomationSettings();
  }, []);

  const loadAutomationSettings = async () => {
    try {
      const response = await authenticatedFetch(BACKEND_URLS.automationSettings);
      if (response.ok) {
        const data = await response.json();
        setAutomationSettings(data);
      } else {
        console.warn('Automation settings not available:', response.status);
        setAutomationSettings(null);
      }
    } catch (error) {
      console.error('Error loading automation settings:', error);
      setAutomationSettings(null);
    }
  };

  const saveApiKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: 'Ошибка',
        description: 'API ключ не может быть пустым',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await authenticatedFetch(BACKEND_URLS.automationSettings, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_api_key',
          api_key: apiKey
        })
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'API ключ сохранён'
        });
        setShowApiKeyForm(false);
        await loadAutomationSettings();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Ошибка сохранения');
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось сохранить API ключ',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleJob = async (jobName: string, enable: boolean) => {
    setIsSaving(true);
    try {
      const action = enable ? `enable_${jobName}` : `disable_${jobName}`;
      const response = await authenticatedFetch(BACKEND_URLS.automationSettings, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Успешно',
          description: result.message
        });
        await loadAutomationSettings();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка переключения');
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось переключить задание',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Всего клиентов</CardDescription>
            <CardTitle className="text-4xl">{tenants.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Icon name="TrendingUp" size={16} className="mr-1 text-green-600" />
              <span>Активные</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Тарифных планов</CardDescription>
            <CardTitle className="text-4xl">{tariffs.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Icon name="Package" size={16} className="mr-1" />
              <span>Доступно</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Документов в системе</CardDescription>
            <CardTitle className="text-4xl">
              {tenants.reduce((sum, t) => sum + t.documents_count, 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Icon name="FileText" size={16} className="mr-1" />
              <span>Обработано</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Последние клиенты</CardTitle>
            <CardDescription>Недавно созданные боты</CardDescription>
          </CardHeader>
          <CardContent>
            {tenants.slice(0, 5).map(tenant => (
              <div key={tenant.id} className="flex items-center justify-between py-3 border-b last:border-0">
                <div>
                  <div className="font-medium">{tenant.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {tenant.slug} • {tenant.documents_count} документов
                  </div>
                </div>
                <Badge variant={tenant.tariff_id === 'enterprise' ? 'default' : 'secondary'}>
                  {tenant.tariff_id}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Bot" size={20} />
              Автоматизация
            </CardTitle>
            <CardDescription>Управление автоматическими задачами</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {automationSettings === null ? (
              <div className="text-center py-4">
                <Icon name="Loader2" className="animate-spin mx-auto mb-2" size={24} />
                <p className="text-sm text-slate-600">Загрузка...</p>
              </div>
            ) : !automationSettings?.cronjob_enabled ? (
              <>
                {!showApiKeyForm ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-slate-600 mb-4">
                      Для автоматических задач нужен API ключ Cron-job.org
                    </p>
                    <Button onClick={() => setShowApiKeyForm(true)} size="sm">
                      <Icon name="Key" size={16} className="mr-2" />
                      Настроить
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Label htmlFor="api-key-dash">API ключ Cron-job.org</Label>
                    <Input
                      id="api-key-dash"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Введите API ключ"
                    />
                    <div className="flex gap-2">
                      <Button onClick={saveApiKey} disabled={isSaving} size="sm" className="flex-1">
                        {isSaving ? <Icon name="Loader2" className="animate-spin mr-2" size={14} /> : null}
                        Сохранить
                      </Button>
                      <Button variant="outline" onClick={() => setShowApiKeyForm(false)} size="sm">
                        Отмена
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Icon name="CheckCircle2" size={18} className="text-green-600" />
                    <span className="text-sm font-medium text-green-700">API ключ настроен</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon name="Bell" size={16} className="text-blue-600" />
                        <span className="font-medium text-sm">Проверка подписок</span>
                      </div>
                      <Button
                        size="sm"
                        variant={automationSettings.check_subscriptions_job?.enabled ? 'outline' : 'default'}
                        onClick={() => toggleJob('subscription_check', !automationSettings.check_subscriptions_job?.enabled)}
                        disabled={isSaving}
                      >
                        {automationSettings.check_subscriptions_job?.enabled ? (
                          <Icon name="Power" size={14} className="text-green-600" />
                        ) : (
                          <Icon name="PowerOff" size={14} />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Ежедневно в 9:00 проверяет истекшие подписки клиентов и отправляет email-уведомления владельцам ботов за 7, 3 и 1 день до окончания подписки
                    </p>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon name="Trash2" size={16} className="text-orange-600" />
                        <span className="font-medium text-sm">Очистка эмбеддингов</span>
                      </div>
                      <Button
                        size="sm"
                        variant={automationSettings.cleanup_embeddings_job?.enabled ? 'outline' : 'default'}
                        onClick={() => toggleJob('embeddings_cleanup', !automationSettings.cleanup_embeddings_job?.enabled)}
                        disabled={isSaving}
                      >
                        {automationSettings.cleanup_embeddings_job?.enabled ? (
                          <Icon name="Power" size={14} className="text-green-600" />
                        ) : (
                          <Icon name="PowerOff" size={14} />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Каждую ночь в 3:00 удаляет из БД векторные представления удалённых документов, освобождая место и оптимизируя производительность поиска
                    </p>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon name="Database" size={16} className="text-purple-600" />
                        <span className="font-medium text-sm">Бэкап БД</span>
                      </div>
                      <Button
                        size="sm"
                        variant={automationSettings.db_backup_job?.enabled ? 'outline' : 'default'}
                        onClick={() => toggleJob('db_backup', !automationSettings.db_backup_job?.enabled)}
                        disabled={isSaving}
                      >
                        {automationSettings.db_backup_job?.enabled ? (
                          <Icon name="Power" size={14} className="text-green-600" />
                        ) : (
                          <Icon name="PowerOff" size={14} />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Ежедневно в 2:00 создаёт резервную копию всей базы данных (схемы, таблицы, данные) и сохраняет в S3 хранилище с датой в названии файла
                    </p>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon name="BarChart3" size={16} className="text-green-600" />
                        <span className="font-medium text-sm">Еженедельный отчёт</span>
                      </div>
                      <Button
                        size="sm"
                        variant={automationSettings.analytics_report_job?.enabled ? 'outline' : 'default'}
                        onClick={() => toggleJob('analytics_report', !automationSettings.analytics_report_job?.enabled)}
                        disabled={isSaving}
                      >
                        {automationSettings.analytics_report_job?.enabled ? (
                          <Icon name="Power" size={14} className="text-green-600" />
                        ) : (
                          <Icon name="PowerOff" size={14} />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Каждый понедельник в 10:00 формирует статистику по всем клиентам (активность, сообщения, документы) и отправляет на email суперадмина
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};