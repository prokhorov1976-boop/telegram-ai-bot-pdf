import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface ApiKeyCardProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  onSave: () => void;
  isSaving: boolean;
  isEnabled: boolean;
}

export const ApiKeyCard = ({ apiKey, setApiKey, onSave, isSaving, isEnabled }: ApiKeyCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Key" size={20} />
          API ключ Cron-job.org
        </CardTitle>
        <CardDescription>
          Для автоматического запуска задач используется сервис cron-job.org
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api-key">API ключ</Label>
          <div className="flex gap-2">
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Вставьте API ключ от cron-job.org"
            />
            <Button onClick={onSave} disabled={isSaving || !apiKey.trim()}>
              {isSaving ? <Icon name="Loader2" className="animate-spin" size={16} /> : 'Сохранить'}
            </Button>
          </div>
          <p className="text-xs text-slate-600">
            Получить ключ можно на{' '}
            <a
              href="https://console.cron-job.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              console.cron-job.org
            </a>
            {' '}в разделе Account → API
          </p>
        </div>

        {isEnabled && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <Icon name="CheckCircle2" size={20} className="text-green-600" />
            <span className="text-sm text-green-700 font-medium">API ключ настроен</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
