import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ProxySettingsCardProps {
  tenantId: number;
  tenantName: string;
}

interface ProxySettings {
  use_proxy_openai: boolean;
  proxy_openai: string;
  use_proxy_google: boolean;
  proxy_google: string;
  use_proxy_deepseek: boolean;
  proxy_deepseek: string;
  use_proxy_openrouter: boolean;
  proxy_openrouter: string;
  use_proxy_proxyapi: boolean;
  proxy_proxyapi: string;
}

const ProxySettingsCard = ({ tenantId, tenantName }: ProxySettingsCardProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  
  const [settings, setSettings] = useState<ProxySettings>({
    use_proxy_openai: false,
    proxy_openai: '',
    use_proxy_google: false,
    proxy_google: '',
    use_proxy_deepseek: false,
    proxy_deepseek: '',
    use_proxy_openrouter: false,
    proxy_openrouter: '',
    use_proxy_proxyapi: false,
    proxy_proxyapi: ''
  });

  useEffect(() => {
    loadSettings();
  }, [tenantId]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://functions.poehali.dev/9e4ccf79-e896-4279-9f09-6bb78ed1b7cc?tenant_id=${tenantId}`);
      if (response.ok) {
        const data = await response.json();
        setSettings({
          use_proxy_openai: data.use_proxy_openai || false,
          proxy_openai: data.proxy_openai || '',
          use_proxy_google: data.use_proxy_google || false,
          proxy_google: data.proxy_google || '',
          use_proxy_deepseek: data.use_proxy_deepseek || false,
          proxy_deepseek: data.proxy_deepseek || '',
          use_proxy_openrouter: data.use_proxy_openrouter || false,
          proxy_openrouter: data.proxy_openrouter || '',
          use_proxy_proxyapi: data.use_proxy_proxyapi || false,
          proxy_proxyapi: data.proxy_proxyapi || ''
        });
      }
    } catch (error) {
      console.error('Failed to load proxy settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('https://functions.poehali.dev/9e4ccf79-e896-4279-9f09-6bb78ed1b7cc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          ...settings
        })
      });

      if (response.ok) {
        toast({
          title: 'Настройки сохранены',
          description: 'Прокси настройки успешно обновлены'
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save proxy settings:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить настройки',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const maskProxy = (proxy: string) => {
    if (!proxy) return '';
    const match = proxy.match(/^(.+):(\d+)@(.+):(.+)$/);
    if (match) {
      const [, ip, port, login] = match;
      return `${ip}:${port}@${login.substring(0, 2)}***:***`;
    }
    return '***';
  };

  if (isLoading) {
    return (
      <Card className="shadow-xl">
        <CardContent className="py-8 text-center text-slate-500">
          Загрузка настроек...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl border-2 border-indigo-200">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Icon name="ShieldCheck" size={24} />
              Настройки прокси для AI сервисов
            </CardTitle>
            <CardDescription>
              Используйте прокси для обхода блокировок OpenAI, Google и других сервисов
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <Collapsible open={showGuide} onOpenChange={setShowGuide}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
            <div className="flex items-center gap-2">
              <Icon name="Info" size={18} className="text-blue-600" />
              <span className="font-medium">Как настроить прокси?</span>
            </div>
            <Icon name={showGuide ? "ChevronUp" : "ChevronDown"} size={18} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 p-4 bg-white border rounded-lg space-y-2 text-sm">
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-slate-700 mb-2">Формат прокси:</p>
                <code className="block bg-slate-100 p-2 rounded">ip:port@login:password</code>
                <p className="text-slate-600 mt-1">Пример: 45.67.89.123:8080@user123:pass456</p>
              </div>
              
              <div>
                <p className="font-semibold text-slate-700 mb-2">Где взять прокси:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li><a href="https://proxy6.net" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Proxy6.net</a> - от 1.5₽/день (рекомендуем)</li>
                  <li><a href="https://youproxy.ru" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">YouProxy.ru</a> - от 50₽/месяц</li>
                  <li><a href="https://proxy-seller.ru" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Proxy-Seller.ru</a> - от 100₽/месяц</li>
                </ul>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded p-3">
                <p className="text-orange-800 text-xs">
                  <strong>⚠️ Важно:</strong> Выбирайте прокси серверы расположенные за пределами РФ (США, Европа). 
                  Для OpenAI и Google лучше использовать прокси из США.
                </p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="space-y-4">
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon name="Sparkles" size={20} className="text-green-600" />
                <div>
                  <Label htmlFor="use_proxy_openai" className="font-medium cursor-pointer">OpenAI (Whisper)</Label>
                  <p className="text-xs text-slate-500">Распознавание речи через OpenAI</p>
                </div>
              </div>
              <Switch
                id="use_proxy_openai"
                checked={settings.use_proxy_openai}
                onCheckedChange={(checked) => setSettings({ ...settings, use_proxy_openai: checked })}
              />
            </div>
            {settings.use_proxy_openai && (
              <div className="space-y-2">
                <Label htmlFor="proxy_openai" className="flex items-center gap-2">
                  Прокси для OpenAI
                  {settings.proxy_openai && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                      <Icon name="CheckCircle2" size={12} className="mr-1" />
                      Настроен
                    </Badge>
                  )}
                </Label>
                <Input
                  id="proxy_openai"
                  type="text"
                  value={settings.proxy_openai}
                  onChange={(e) => setSettings({ ...settings, proxy_openai: e.target.value })}
                  placeholder="ip:port@login:password"
                  className="font-mono text-sm"
                />
                {settings.proxy_openai && (
                  <p className="text-xs text-muted-foreground">
                    Текущий: {maskProxy(settings.proxy_openai)}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon name="Globe" size={20} className="text-blue-600" />
                <div>
                  <Label htmlFor="use_proxy_google" className="font-medium cursor-pointer">Google Speech-to-Text</Label>
                  <p className="text-xs text-slate-500">Распознавание речи через Google</p>
                </div>
              </div>
              <Switch
                id="use_proxy_google"
                checked={settings.use_proxy_google}
                onCheckedChange={(checked) => setSettings({ ...settings, use_proxy_google: checked })}
              />
            </div>
            {settings.use_proxy_google && (
              <div className="space-y-2">
                <Label htmlFor="proxy_google" className="flex items-center gap-2">
                  Прокси для Google
                  {settings.proxy_google && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                      <Icon name="CheckCircle2" size={12} className="mr-1" />
                      Настроен
                    </Badge>
                  )}
                </Label>
                <Input
                  id="proxy_google"
                  type="text"
                  value={settings.proxy_google}
                  onChange={(e) => setSettings({ ...settings, proxy_google: e.target.value })}
                  placeholder="ip:port@login:password"
                  className="font-mono text-sm"
                />
                {settings.proxy_google && (
                  <p className="text-xs text-muted-foreground">
                    Текущий: {maskProxy(settings.proxy_google)}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon name="Zap" size={20} className="text-orange-600" />
                <div>
                  <Label htmlFor="use_proxy_deepseek" className="font-medium cursor-pointer">DeepSeek</Label>
                  <p className="text-xs text-slate-500">DeepSeek V3 / R1 для чата</p>
                </div>
              </div>
              <Switch
                id="use_proxy_deepseek"
                checked={settings.use_proxy_deepseek}
                onCheckedChange={(checked) => setSettings({ ...settings, use_proxy_deepseek: checked })}
              />
            </div>
            {settings.use_proxy_deepseek && (
              <div className="space-y-2">
                <Label htmlFor="proxy_deepseek" className="flex items-center gap-2">
                  Прокси для DeepSeek
                  {settings.proxy_deepseek && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                      <Icon name="CheckCircle2" size={12} className="mr-1" />
                      Настроен
                    </Badge>
                  )}
                </Label>
                <Input
                  id="proxy_deepseek"
                  type="text"
                  value={settings.proxy_deepseek}
                  onChange={(e) => setSettings({ ...settings, proxy_deepseek: e.target.value })}
                  placeholder="ip:port@login:password"
                  className="font-mono text-sm"
                />
                {settings.proxy_deepseek && (
                  <p className="text-xs text-muted-foreground">
                    Текущий: {maskProxy(settings.proxy_deepseek)}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon name="Network" size={20} className="text-purple-600" />
                <div>
                  <Label htmlFor="use_proxy_openrouter" className="font-medium cursor-pointer">OpenRouter</Label>
                  <p className="text-xs text-slate-500">Доступ к множеству AI моделей</p>
                </div>
              </div>
              <Switch
                id="use_proxy_openrouter"
                checked={settings.use_proxy_openrouter}
                onCheckedChange={(checked) => setSettings({ ...settings, use_proxy_openrouter: checked })}
              />
            </div>
            {settings.use_proxy_openrouter && (
              <div className="space-y-2">
                <Label htmlFor="proxy_openrouter" className="flex items-center gap-2">
                  Прокси для OpenRouter
                  {settings.proxy_openrouter && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                      <Icon name="CheckCircle2" size={12} className="mr-1" />
                      Настроен
                    </Badge>
                  )}
                </Label>
                <Input
                  id="proxy_openrouter"
                  type="text"
                  value={settings.proxy_openrouter}
                  onChange={(e) => setSettings({ ...settings, proxy_openrouter: e.target.value })}
                  placeholder="ip:port@login:password"
                  className="font-mono text-sm"
                />
                {settings.proxy_openrouter && (
                  <p className="text-xs text-muted-foreground">
                    Текущий: {maskProxy(settings.proxy_openrouter)}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon name="Shield" size={20} className="text-emerald-600" />
                <div>
                  <Label htmlFor="use_proxy_proxyapi" className="font-medium cursor-pointer">ProxyAPI</Label>
                  <p className="text-xs text-slate-500">Российский прокси для AI моделей</p>
                </div>
              </div>
              <Switch
                id="use_proxy_proxyapi"
                checked={settings.use_proxy_proxyapi}
                onCheckedChange={(checked) => setSettings({ ...settings, use_proxy_proxyapi: checked })}
              />
            </div>
            {settings.use_proxy_proxyapi && (
              <div className="space-y-2">
                <Label htmlFor="proxy_proxyapi" className="flex items-center gap-2">
                  Прокси для ProxyAPI
                  {settings.proxy_proxyapi && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                      <Icon name="CheckCircle2" size={12} className="mr-1" />
                      Настроен
                    </Badge>
                  )}
                </Label>
                <Input
                  id="proxy_proxyapi"
                  type="text"
                  value={settings.proxy_proxyapi}
                  onChange={(e) => setSettings({ ...settings, proxy_proxyapi: e.target.value })}
                  placeholder="ip:port@login:password"
                  className="font-mono text-sm"
                />
                {settings.proxy_proxyapi && (
                  <p className="text-xs text-muted-foreground">
                    Текущий: {maskProxy(settings.proxy_proxyapi)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            {isSaving ? (
              <>
                <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Icon name="Save" size={16} className="mr-2" />
                Сохранить настройки
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProxySettingsCard;