import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';
import IconPicker from './IconPicker';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'react-router-dom';
import { BACKEND_URLS } from './types';
import { COLOR_SCHEMES, WidgetSettings, applyColorScheme, detectColorScheme } from './WidgetColorSchemes';
import WidgetPreview from './WidgetPreview';
import WidgetCodeGenerator from './WidgetCodeGenerator';
import { authenticatedFetch, getTenantId } from '@/lib/auth';

const WidgetSettingsCard = () => {
  const { toast } = useToast();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [settings, setSettings] = useState<WidgetSettings>({
    button_color: '#a855f7',
    button_color_end: '#7c3aed',
    button_size: 60,
    button_position: 'bottom-right',
    button_icon: 'MessageCircle',
    window_width: 380,
    window_height: 600,
    header_title: 'AI Ассистент',
    header_color: '#a855f7',
    header_color_end: '#7c3aed',
    border_radius: 16,
    show_branding: true,
    custom_css: null,
    chat_url: null
  });
  const [selectedScheme, setSelectedScheme] = useState<string>('purple');
  const [isLoading, setIsLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [needsCodeUpdate, setNeedsCodeUpdate] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const tenantId = getTenantId();
      const url = tenantId ? `${BACKEND_URLS.getWidgetSettings}?tenant_id=${tenantId}` : BACKEND_URLS.getWidgetSettings;
      const response = await authenticatedFetch(url);
      const data = await response.json();
      if (!data.button_icon) {
        data.button_icon = 'MessageCircle';
      }
      setSettings(data);
      
      // Автоматически определяем какая цветовая схема используется
      const detectedScheme = detectColorScheme(data);
      setSelectedScheme(detectedScheme);
    } catch (error) {
      console.error('Error loading widget settings:', error);
    }
  };

  const handleColorSchemeChange = (scheme: string) => {
    const newSettings = applyColorScheme(scheme, settings);
    setSettings(newSettings);
    setSelectedScheme(scheme);
    setNeedsCodeUpdate(true);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const tenantId = getTenantId();
      console.log('[WidgetSettings] tenantId from getTenantId():', tenantId);
      console.log('[WidgetSettings] sessionStorage tenant_id:', sessionStorage.getItem('superadmin_viewing_tenant_id'));
      
      // Автоматически формируем chat_url с продакшен доменом ai-ru.ru
      let chatUrl = settings.chat_url;
      if (!chatUrl && tenantSlug) {
        chatUrl = `https://ai-ru.ru/chat/${tenantSlug}`;
      }
      
      const bodyToSend = { ...settings, chat_url: chatUrl, tenant_id: tenantId };
      console.log('[WidgetSettings] Sending body with tenant_id:', bodyToSend.tenant_id);
      
      const response = await authenticatedFetch(BACKEND_URLS.updateWidgetSettings, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyToSend)
      });

      if (response.ok) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const tenantId = getTenantId();
        const verifyUrl = tenantId ? `${BACKEND_URLS.getWidgetSettings}?tenant_id=${tenantId}` : BACKEND_URLS.getWidgetSettings;
        const verifyResponse = await authenticatedFetch(verifyUrl);
        const verifyData = await verifyResponse.json();
        
        const savedCorrectly = 
          verifyData.button_color === settings.button_color &&
          verifyData.header_title === settings.header_title &&
          verifyData.button_position === settings.button_position &&
          verifyData.button_size === settings.button_size;
        
        if (savedCorrectly) {
          // Обновляем settings из базы данных
          setSettings(verifyData);
          
          toast({
            title: '✓ Сохранено!',
            description: needsCodeUpdate 
              ? '⚠️ ВАЖНО: Скопируйте новый код виджета и обновите его на вашем сайте!'
              : 'Настройки виджета успешно обновлены'
          });
          if (needsCodeUpdate) {
            setShowCode(true);
          }
        } else {
          toast({
            title: '⚠️ Частично сохранено',
            description: 'Данные записаны, но проверка показала расхождения',
            variant: 'destructive'
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить настройки',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-xl">
      <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-blue-50">
        <CardTitle className="flex items-center gap-2">
          <Icon name="Palette" size={20} />
          Настройки виджета
        </CardTitle>
        <CardDescription>Кнопка чата для встройки на любой сайт</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="space-y-4">
          <div>
            <Label>Цветовая схема</Label>
            <Select value={selectedScheme} onValueChange={handleColorSchemeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(COLOR_SCHEMES).map(([key, scheme]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{
                          background: `linear-gradient(135deg, ${scheme.button_color} 0%, ${scheme.button_color_end} 100%)`
                        }}
                      />
                      {scheme.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <WidgetPreview settings={settings} />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Иконка кнопки</Label>
              <IconPicker
                value={settings.button_icon}
                onChange={(value) => setSettings({ ...settings, button_icon: value })}
              />
            </div>
            <div>
              <Label>Размер кнопки (px)</Label>
              <Input
                type="number"
                value={settings.button_size}
                onChange={(e) => setSettings({ ...settings, button_size: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <Label>Позиция на странице</Label>
            <Select
              value={settings.button_position}
              onValueChange={(value) => setSettings({ ...settings, button_position: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bottom-right">Справа внизу</SelectItem>
                <SelectItem value="bottom-left">Слева внизу</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Ширина окна (px)</Label>
              <Input
                type="number"
                value={settings.window_width}
                onChange={(e) => setSettings({ ...settings, window_width: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Высота окна (px)</Label>
              <Input
                type="number"
                value={settings.window_height}
                onChange={(e) => setSettings({ ...settings, window_height: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <Label>Заголовок окна</Label>
            <Input
              value={settings.header_title}
              onChange={(e) => setSettings({ ...settings, header_title: e.target.value })}
            />
          </div>

          <div>
            <Label>Скругление углов (px)</Label>
            <Input
              type="number"
              value={settings.border_radius}
              onChange={(e) => setSettings({ ...settings, border_radius: Number(e.target.value) })}
            />
          </div>


        </div>

        <div className="pt-4 border-t space-y-4">
          <Button onClick={handleSave} disabled={isLoading} className="w-full">
            {isLoading ? 'Сохранение...' : 'Сохранить настройки'}
          </Button>

          {needsCodeUpdate && (
            <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-lg">
              <div className="flex items-start gap-3">
                <Icon name="AlertTriangle" className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1 space-y-3">
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-amber-900">
                      Требуется обновление кода на сайте!
                    </div>
                    <div className="text-xs text-amber-800">
                      Вы изменили настройки виджета. Чтобы изменения вступили в силу:
                    </div>
                    <ol className="text-xs text-amber-800 space-y-1 list-decimal list-inside">
                      <li>Нажмите "Сохранить настройки" выше</li>
                      <li>Скопируйте новый код встройки ниже</li>
                      <li>Замените старый код виджета на вашем сайте</li>
                    </ol>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setNeedsCodeUpdate(false)}
                    className="w-full bg-white hover:bg-amber-100 border-amber-400"
                  >
                    <Icon name="Check" size={14} className="mr-2" />
                    Я обновил код на сайте
                  </Button>
                </div>
              </div>
            </div>
          )}

          {settings.chat_url && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-1">URL страницы чата:</div>
              <div className="text-sm text-muted-foreground break-all">{settings.chat_url}</div>
            </div>
          )}

          <WidgetCodeGenerator
            settings={settings}
            showCode={showCode}
            onToggleCode={() => setShowCode(!showCode)}
            tenantSlug={tenantSlug}
            needsUpdate={needsCodeUpdate}
            onCodeCopied={() => setNeedsCodeUpdate(false)}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default WidgetSettingsCard;