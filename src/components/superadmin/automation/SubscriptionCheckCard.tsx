import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

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

interface SubscriptionCheckCardProps {
  cronjobEnabled: boolean;
  subscriptionJob?: CronJob;
  onEnable: () => void;
  onDisable: () => void;
  onTest: () => void;
  isSaving: boolean;
  isTesting: boolean;
}

export const SubscriptionCheckCard = ({
  cronjobEnabled,
  subscriptionJob,
  onEnable,
  onDisable,
  onTest,
  isSaving,
  isTesting
}: SubscriptionCheckCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Bell" size={20} />
          Проверка истечения подписок
        </CardTitle>
        <CardDescription>
          Автоматическая проверка подписок и отправка уведомлений владельцам тенантов
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!cronjobEnabled ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              Сначала настройте API ключ Cron-job.org выше
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium">Статус</p>
                  <p className="text-sm text-slate-600">
                    {subscriptionJob?.enabled ? 'Включено' : 'Отключено'}
                  </p>
                </div>
                {subscriptionJob?.enabled ? (
                  <Icon name="CheckCircle2" size={24} className="text-green-600" />
                ) : (
                  <Icon name="XCircle" size={24} className="text-slate-400" />
                )}
              </div>

              {subscriptionJob?.enabled && (
                <>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium">Расписание</p>
                      <p className="text-sm text-slate-600">Ежедневно в 9:00 (МСК)</p>
                    </div>
                    <Icon name="Clock" size={24} className="text-blue-600" />
                  </div>

                  {subscriptionJob.nextExecution && (
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium">Следующий запуск</p>
                        <p className="text-sm text-slate-600">
                          {new Date(subscriptionJob.nextExecution).toLocaleString('ru-RU')}
                        </p>
                      </div>
                      <Icon name="Calendar" size={24} className="text-blue-600" />
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex gap-2">
              {subscriptionJob?.enabled ? (
                <Button
                  variant="outline"
                  onClick={onDisable}
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving ? <Icon name="Loader2" className="animate-spin mr-2" size={16} /> : null}
                  Отключить автопроверку
                </Button>
              ) : (
                <Button
                  onClick={onEnable}
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving ? <Icon name="Loader2" className="animate-spin mr-2" size={16} /> : null}
                  Включить автопроверку
                </Button>
              )}

              <Button
                variant="secondary"
                onClick={onTest}
                disabled={isTesting}
                className="flex-1"
              >
                {isTesting ? (
                  <Icon name="Loader2" className="animate-spin mr-2" size={16} />
                ) : (
                  <Icon name="Play" className="mr-2" size={16} />
                )}
                Запустить сейчас
              </Button>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Что делает автопроверка:</strong>
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                <li>Проверяет подписки с истёкшим сроком и меняет статус на "expired"</li>
                <li>Отправляет уведомления владельцам за 7, 3 и 1 день до истечения</li>
                <li>Использует email шаблоны из базы данных</li>
                <li>Логирует все действия для мониторинга</li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
