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

interface CronJobCardProps {
  icon: string;
  title: string;
  description: string;
  job?: CronJob;
  scheduleText: string;
  onToggle: () => void;
  isSaving: boolean;
}

export const CronJobCard = ({
  icon,
  title,
  description,
  job,
  scheduleText,
  onToggle,
  isSaving
}: CronJobCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name={icon} size={20} />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium">Статус</p>
              <p className="text-sm text-slate-600">
                {job?.enabled ? 'Включено' : 'Отключено'}
              </p>
            </div>
            {job?.enabled ? (
              <Icon name="CheckCircle2" size={24} className="text-green-600" />
            ) : (
              <Icon name="XCircle" size={24} className="text-slate-400" />
            )}
          </div>

          {job?.enabled && (
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium">Расписание</p>
                <p className="text-sm text-slate-600">{scheduleText}</p>
              </div>
              <Icon name="Clock" size={24} className="text-blue-600" />
            </div>
          )}
        </div>

        <Button
          onClick={onToggle}
          disabled={isSaving}
          variant={job?.enabled ? 'outline' : 'default'}
          className="w-full"
        >
          {isSaving ? <Icon name="Loader2" className="animate-spin mr-2" size={16} /> : null}
          {job?.enabled ? 'Отключить' : 'Включить'}
        </Button>
      </CardContent>
    </Card>
  );
};