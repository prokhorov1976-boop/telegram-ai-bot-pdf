import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/lib/auth';
import Icon from '@/components/ui/icon';
import { BACKEND_URLS } from './types';
import { ApiKeyCard } from './automation/ApiKeyCard';
import { SubscriptionCheckCard } from './automation/SubscriptionCheckCard';
import { CronJobCard } from './automation/CronJobCard';

interface CronJob {
  jobId: number;
  enabled: boolean;
  title: string;
  url: string;
  schedule: {
    hours: number[];
    minutes: number[];
    timezone: string;
  };
  lastExecution?: string;
  nextExecution?: string;
}

interface AutomationSettings {
  cronjob_api_key: string;
  cronjob_enabled: boolean;
  check_subscriptions_job?: CronJob;
  cleanup_embeddings_job?: CronJob;
  db_backup_job?: CronJob;
  analytics_report_job?: CronJob;
  daily_analytics_job?: CronJob;
  error_monitoring_job?: CronJob;
  cleanup_logs_job?: CronJob;
  subscription_reminders_job?: CronJob;
  admin_alerts_job?: CronJob;
  security_audit_job?: CronJob;
}

export const AutomationTab = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AutomationSettings | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingSubscriptions, setIsTestingSubscriptions] = useState(false);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await authenticatedFetch(BACKEND_URLS.automationSettings);
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setApiKey(data.cronjob_api_key || '');
      } else {
        throw new Error('Ошибка загрузки настроек');
      }
    } catch (error) {
      console.error('Error loading automation settings:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить настройки автоматизации',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
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
        await loadSettings();
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

  const enableSubscriptionCheck = async () => {
    setIsSaving(true);
    try {
      const response = await authenticatedFetch(BACKEND_URLS.automationSettings, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'enable_subscription_check'
        })
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Автоматическая проверка подписок включена (ежедневно в 9:00 МСК)'
        });
        await loadSettings();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Ошибка настройки');
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось настроить автоматическую проверку',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const disableSubscriptionCheck = async () => {
    setIsSaving(true);
    try {
      const response = await authenticatedFetch(BACKEND_URLS.automationSettings, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'disable_subscription_check'
        })
      });

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: 'Автоматическая проверка подписок отключена'
        });
        await loadSettings();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Ошибка отключения');
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось отключить автоматическую проверку',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testSubscriptionCheck = async () => {
    setIsTestingSubscriptions(true);
    try {
      const response = await authenticatedFetch(BACKEND_URLS.automationSettings, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_subscription_check'
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Проверка выполнена',
          description: `Найдено истекших: ${result.expired_count}, уведомлений отправлено: ${result.notifications_sent}`
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Ошибка проверки');
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось выполнить проверку',
        variant: 'destructive'
      });
    } finally {
      setIsTestingSubscriptions(false);
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
        await loadSettings();
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

  useEffect(() => {
    loadSettings();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Icon name="Loader2" className="animate-spin mx-auto mb-2" size={32} />
          <p className="text-slate-600">Загрузка настроек...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Автоматизация</h2>
        <p className="text-slate-600">Настройка автоматических задач и интеграций</p>
      </div>

      <ApiKeyCard
        apiKey={apiKey}
        setApiKey={setApiKey}
        onSave={saveApiKey}
        isSaving={isSaving}
        isEnabled={settings?.cronjob_enabled || false}
      />

      <SubscriptionCheckCard
        cronjobEnabled={settings?.cronjob_enabled || false}
        subscriptionJob={settings?.check_subscriptions_job}
        onEnable={enableSubscriptionCheck}
        onDisable={disableSubscriptionCheck}
        onTest={testSubscriptionCheck}
        isSaving={isSaving}
        isTesting={isTestingSubscriptions}
      />

      {settings?.cronjob_enabled && (
        <>
          <CronJobCard
            icon="Trash2"
            title="Очистка устаревших эмбеддингов"
            description="Автоматическое удаление эмбеддингов удалённых документов (экономия места в БД)"
            job={settings.cleanup_embeddings_job}
            scheduleText="Ежедневно в 3:00 (МСК)"
            onToggle={() => toggleJob('cleanup_embeddings', !settings.cleanup_embeddings_job?.enabled)}
            isSaving={isSaving}
          />

          <CronJobCard
            icon="Database"
            title="Резервное копирование БД"
            description="Ежедневный автоматический бэкап базы данных в S3 хранилище"
            job={settings.db_backup_job}
            scheduleText="Ежедневно в 2:00 (МСК)"
            onToggle={() => toggleJob('db_backup', !settings.db_backup_job?.enabled)}
            isSaving={isSaving}
          />

          <CronJobCard
            icon="BarChart3"
            title="Еженедельный отчёт по аналитике"
            description="Автоматическая отправка отчёта по всем тенантам на email суперадмина (по понедельникам)"
            job={settings.analytics_report_job}
            scheduleText="Каждый понедельник в 10:00 (МСК)"
            onToggle={() => toggleJob('analytics_report', !settings.analytics_report_job?.enabled)}
            isSaving={isSaving}
          />

          <CronJobCard
            icon="TrendingUp"
            title="Ежедневная аналитика активности"
            description="Отчёт по новым пользователям, активным тенантам и сообщениям за вчера"
            job={settings.daily_analytics_job}
            scheduleText="Ежедневно в 9:00 (МСК)"
            onToggle={() => toggleJob('daily_analytics', !settings.daily_analytics_job?.enabled)}
            isSaving={isSaving}
          />

          <CronJobCard
            icon="AlertTriangle"
            title="Мониторинг ошибок системы"
            description="Отслеживание ошибок и падений функций (каждые 6 часов)"
            job={settings.error_monitoring_job}
            scheduleText="Каждые 6 часов (0:00, 6:00, 12:00, 18:00 МСК)"
            onToggle={() => toggleJob('error_monitoring', !settings.error_monitoring_job?.enabled)}
            isSaving={isSaving}
          />

          <CronJobCard
            icon="Archive"
            title="Очистка старых логов"
            description="Удаление логов старше 30 дней для экономии места в БД"
            job={settings.cleanup_logs_job}
            scheduleText="Каждое воскресенье в 4:00 (МСК)"
            onToggle={() => toggleJob('cleanup_logs', !settings.cleanup_logs_job?.enabled)}
            isSaving={isSaving}
          />

          <CronJobCard
            icon="BellRing"
            title="Напоминания о продлении подписки"
            description="Отправка напоминаний тенантам перед истечением подписки"
            job={settings.subscription_reminders_job}
            scheduleText="Ежедневно в 10:00 (МСК)"
            onToggle={() => toggleJob('subscription_reminders', !settings.subscription_reminders_job?.enabled)}
            isSaving={isSaving}
          />

          <CronJobCard
            icon="MessageSquare"
            title="Алерты для админа"
            description="Уведомления о критических событиях (новые тенанты, ошибки, превышения лимитов)"
            job={settings.admin_alerts_job}
            scheduleText="Каждый час"
            onToggle={() => toggleJob('admin_alerts', !settings.admin_alerts_job?.enabled)}
            isSaving={isSaving}
          />

          <CronJobCard
            icon="Shield"
            title="Аудит безопасности"
            description="Проверка подозрительной активности, неудачных попыток входа, необычных паттернов"
            job={settings.security_audit_job}
            scheduleText="Каждые 12 часов (0:00, 12:00 МСК)"
            onToggle={() => toggleJob('security_audit', !settings.security_audit_job?.enabled)}
            isSaving={isSaving}
          />
        </>
      )}
    </div>
  );
};
