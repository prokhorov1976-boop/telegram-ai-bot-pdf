import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { BACKEND_URLS, AI_PROVIDERS, AI_MODELS_BY_PROVIDER, DEFAULT_AI_SETTINGS, AiModelSettings } from './types';
import Icon from '@/components/ui/icon';
import AiSettingsSliders from './AiSettingsSliders';
import { authenticatedFetch, getTenantId } from '@/lib/auth';
import FUNC_URLS from '../../../backend/func2url.json';

const API_KEYS_URL = FUNC_URLS['manage-api-keys'];

interface AiSettingsCardProps {
  currentTenantId?: number | null;
  isSuperAdmin?: boolean;
}

const AiSettingsCard = ({ currentTenantId, isSuperAdmin = false }: AiSettingsCardProps) => {
  const [settings, setSettings] = useState<AiModelSettings>(DEFAULT_AI_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [configStatus, setConfigStatus] = useState<'not_set' | 'active' | 'error'>('not_set');
  const [hasYandexKeys, setHasYandexKeys] = useState(false);
  const [hasDeepseekKeys, setHasDeepseekKeys] = useState(false);
  const [hasQwenKeys, setHasQwenKeys] = useState(false);
  const [hasOpenRouterKeys, setHasOpenRouterKeys] = useState(false);
  const [hasProxyApiKeys, setHasProxyApiKeys] = useState(false);
  const [checkingKeys, setCheckingKeys] = useState(true);


  const { toast } = useToast();

  useEffect(() => {
    // Загружаем настройки только когда currentTenantId определен
    if (isSuperAdmin && !currentTenantId) {
      console.log('[AiSettingsCard] Waiting for currentTenantId...');
      return;
    }
    
    loadSettings();
    checkApiKeys();
  }, [currentTenantId, isSuperAdmin]);

  const getStatusBadge = () => {
    if (configStatus === 'active') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
          <Icon name="CheckCircle" size={12} />
          Настроено
        </span>
      );
    }
    if (configStatus === 'error') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
          <Icon name="XCircle" size={12} />
          Ошибка
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
        <Icon name="Circle" size={12} />
        По умолчанию
      </span>
    );
  };

  const checkApiKeys = async () => {
    setCheckingKeys(true);
    try {
      // Для супер-админа всегда используем currentTenantId
      const tenantId = isSuperAdmin ? currentTenantId : (currentTenantId !== null && currentTenantId !== undefined ? currentTenantId : getTenantId());
      
      if (tenantId === null || tenantId === undefined) {
        console.log('[AiSettingsCard] No tenantId available');
        setCheckingKeys(false);
        return;
      }
      
      const url = `${API_KEYS_URL}?tenant_id=${tenantId}`;
      console.log('[AiSettingsCard] Checking keys for tenant:', tenantId, 'URL:', url);
      const response = await authenticatedFetch(url, { method: 'GET' });
      const data = await response.json();
      console.log('[AiSettingsCard] Keys response:', data);
      
      if (response.ok && data.keys) {
        const yandexApi = data.keys.find((k: any) => k.provider === 'yandex' && k.key_name === 'api_key' && k.key_value && k.key_value.trim() !== '');
        const yandexFolder = data.keys.find((k: any) => k.provider === 'yandex' && k.key_name === 'folder_id' && k.key_value && k.key_value.trim() !== '');
        const deepseekApi = data.keys.find((k: any) => k.provider === 'deepseek' && k.key_name === 'api_key' && k.key_value && k.key_value.trim() !== '');
        const qwenApi = data.keys.find((k: any) => k.provider === 'qwen' && k.key_name === 'api_key' && k.key_value && k.key_value.trim() !== '');
        const openrouterApi = data.keys.find((k: any) => k.provider === 'openrouter' && k.key_name === 'api_key' && k.key_value && k.key_value.trim() !== '');
        const proxyapiApi = data.keys.find((k: any) => k.provider === 'proxyapi' && k.key_name === 'api_key' && k.key_value && k.key_value.trim() !== '');
        
        setHasYandexKeys(!!(yandexApi && yandexFolder));
        setHasDeepseekKeys(!!deepseekApi);
        setHasQwenKeys(!!qwenApi);
        setHasOpenRouterKeys(!!openrouterApi);
        setHasProxyApiKeys(!!proxyapiApi);
      }
    } catch (error) {
      console.error('Error checking API keys:', error);
    } finally {
      setCheckingKeys(false);
    }
  };

  const loadSettings = async () => {
    try {
      // Для супер-админа всегда используем currentTenantId
      const tenantId = isSuperAdmin ? currentTenantId : (currentTenantId !== null && currentTenantId !== undefined ? currentTenantId : getTenantId());
      
      if (tenantId === null || tenantId === undefined) {
        console.log('[AiSettingsCard] No tenantId available for loading settings');
        return;
      }
      
      const url = `${BACKEND_URLS.getAiSettings}?tenant_id=${tenantId}`;
      const response = await authenticatedFetch(url);
      const data = await response.json();
      if (data.settings) {
        const loadedSettings = { ...data.settings };
        
        // Миграция старых настроек: если provider пустой, определяем его по модели
        if (!loadedSettings.provider && loadedSettings.model) {
          const model = loadedSettings.model;
          if (model === 'yandexgpt' || model === 'yandexgpt-lite') {
            loadedSettings.provider = 'yandex';
          } else if (model === 'deepseek-chat' || model === 'deepseek-reasoner') {
            loadedSettings.provider = 'deepseek';
          } else if (model.startsWith('openrouter-')) {
            loadedSettings.provider = 'openrouter';
            loadedSettings.model = model.replace('openrouter-', '');
          } else {
            // Все остальные модели из нового списка - это OpenRouter
            loadedSettings.provider = 'openrouter';
          }
        }
        
        setSettings(loadedSettings);
        setConfigStatus('active');
      }
    } catch (error) {
      console.error('Error loading AI settings:', error);
      setConfigStatus('error');
    }
  };



  const handleProviderChange = (provider: string) => {
    const currentPrompt = settings.system_prompt;
    const firstModel = AI_MODELS_BY_PROVIDER[provider][0].value;
    
    setSettings({
      ...DEFAULT_AI_SETTINGS,
      provider,
      model: firstModel,
      system_prompt: currentPrompt
    });
  };

  const handleModelChange = (model: string) => {
    setSettings({
      ...settings,
      model
    });
  };

  const handleResetToDefaults = () => {
    const currentPrompt = settings.system_prompt;
    setSettings({
      ...DEFAULT_AI_SETTINGS,
      system_prompt: currentPrompt
    });
    toast({
      title: 'Сброшено',
      description: 'Параметры восстановлены по умолчанию'
    });
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // Для супер-админа всегда используем currentTenantId
      const tenantId = isSuperAdmin ? currentTenantId : (currentTenantId !== null && currentTenantId !== undefined ? currentTenantId : getTenantId());
      
      if (tenantId === null || tenantId === undefined) {
        toast({
          title: 'Ошибка',
          description: 'Не удалось определить ID тенанта',
          variant: 'destructive'
        });
        setIsLoading(false);
        return;
      }
      
      const updateUrl = `${BACKEND_URLS.updateAiSettings}?tenant_id=${tenantId}`;
      
      const response = await authenticatedFetch(updateUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      });

      const data = await response.json();

      if (response.ok) {
        setConfigStatus('active');
        toast({
          title: 'Сохранено!',
          description: 'Настройки AI обновлены'
        });
      } else {
        setConfigStatus('error');
        throw new Error(data.error);
      }
    } catch (error: any) {
      setConfigStatus('error');
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось сохранить настройки',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentModels = AI_MODELS_BY_PROVIDER[settings.provider] || [];
  const missingKeys = !checkingKeys && (
    (settings.provider === 'yandex' && !hasYandexKeys) ||
    (settings.provider === 'deepseek' && !hasDeepseekKeys) ||
    (settings.provider === 'openrouter' && !hasOpenRouterKeys) ||
    (settings.provider === 'proxyapi' && !hasProxyApiKeys)
  );

  const providerLabel = AI_PROVIDERS.find(p => p.value === settings.provider)?.label;
  const modelLabel = currentModels.find(m => m.value === settings.model)?.label;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="Brain" size={24} />
            Настройки AI
          </div>
          {getStatusBadge()}
        </CardTitle>
        <CardDescription>
          Выбор модели и параметры генерации ответов
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Icon name="Database" size={20} className="text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-blue-900 mb-2">Эмбеддинги (не изменяются):</p>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Провайдер:</strong> Yandex</p>
                <p><strong>Размерность:</strong> 256D</p>
                <p><strong>doc:</strong> text-search-doc/latest</p>
                <p><strong>query:</strong> text-search-query/latest</p>
              </div>
            </div>
          </div>
        </div>

        {missingKeys && (
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Icon name="AlertTriangle" size={20} className="text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-amber-900 mb-2">Отсутствуют API ключи</p>
                <p className="text-sm text-amber-800">
                  {settings.provider === 'yandex' 
                    ? 'Для провайдера Yandex требуются ключи API Key + Folder ID'
                    : settings.provider === 'proxyapi'
                    ? 'Для провайдера ProxyAPI требуется ключ API Key'
                    : 'Для провайдера OpenRouter требуется ключ API Key'
                  }
                </p>
                <p className="text-sm text-amber-800 mt-2">
                  Добавьте нужные ключи в карточке "API ключи бота" ниже.
                </p>
              </div>
            </div>
          </div>
        )}

        {isSuperAdmin ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Провайдер AI</Label>
              <Select value={settings.provider} onValueChange={handleProviderChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите провайдера">
                    {providerLabel || settings.provider}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {AI_PROVIDERS.map((provider) => {
                    const hasKeys = provider.value === 'yandex' ? hasYandexKeys 
                                  : provider.value === 'proxyapi' ? hasProxyApiKeys
                                  : hasOpenRouterKeys;
                    return (
                      <SelectItem key={provider.value} value={provider.value}>
                        <div className="flex items-center justify-between w-full gap-2">
                          <span className={!hasKeys ? 'text-slate-400' : ''}>{provider.label}</span>
                          {!hasKeys && !checkingKeys && (
                            <Icon name="AlertCircle" size={14} className="text-amber-500" />
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Модель</Label>
              <Select value={settings.model} onValueChange={handleModelChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите модель">
                    {modelLabel || settings.model}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[400px]">
                  {currentModels.map((model, index) => {
                    const prevModel = index > 0 ? currentModels[index - 1] : null;
                    const showCategoryHeader = !prevModel || prevModel.category !== model.category;
                    
                    return (
                      <SelectItem key={model.value} value={model.value}>
                        <div className="flex flex-col py-0.5">
                          {showCategoryHeader && model.category && (
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 -mt-1">
                              {model.category}
                            </div>
                          )}
                          <span className="font-medium">{model.label}</span>
                          {model.price && (
                            <span className="text-xs text-muted-foreground">{model.price}</span>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {settings.provider === 'openrouter' && (
                <p className="text-xs text-muted-foreground">
                  💰 Цены: вход/выход за 1M токенов
                </p>
              )}
              {settings.provider === 'yandex' && (
                <p className="text-xs text-muted-foreground">
                  💰 Актуальные цены на yandex.cloud
                </p>
              )}
              {settings.provider === 'proxyapi' && (
                <p className="text-xs text-muted-foreground">
                  💰 Оплата в рублях • Без VPN • proxyapi.ru
                </p>
              )}
            </div>


          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Icon name="Brain" size={16} className="text-slate-600" />
              <Label className="text-slate-700">Текущая конфигурация</Label>
            </div>
            <p className="text-lg font-semibold text-slate-900">
              {providerLabel} → {modelLabel}
            </p>
            <p className="text-xs text-slate-500">
              Изменение модели доступно только суперадмину
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="system_prompt">Системный промпт (чат, виджет, мессенджеры)</Label>
          <Textarea
            id="system_prompt"
            value={settings.system_prompt || ''}
            onChange={(e) => setSettings({ ...settings, system_prompt: e.target.value })}
            placeholder="Введите системный промпт для AI ассистента..."
            rows={8}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Системный промпт определяет поведение и стиль ответов AI в чате и мессенджерах
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="voice_system_prompt">Системный промпт для голосовых звонков</Label>
          <Textarea
            id="voice_system_prompt"
            value={settings.voice_system_prompt || ''}
            onChange={(e) => setSettings({ ...settings, voice_system_prompt: e.target.value })}
            placeholder="Ты голосовой консьерж отеля. Отвечай коротко и ясно, максимум 2-3 предложения..."
            rows={6}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            💡 Для голосовых звонков важно отвечать кратко (2-3 предложения), без списков и длинных текстов
          </p>
        </div>

        <AiSettingsSliders
          settings={settings}
          selectedModel={settings.model}
          selectedProvider={settings.provider}
          onSettingsChange={(newSettings) => setSettings(newSettings)}
        />

        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleSaveSettings}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Сохранение...' : 'Сохранить'}
          </Button>
          <Button
            onClick={handleResetToDefaults}
            variant="outline"
          >
            Сбросить
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AiSettingsCard;