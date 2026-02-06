import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/lib/auth';
import FUNC_URLS from '../../../../backend/func2url.json';

const BACKEND_URL = FUNC_URLS['manage-api-keys'];

interface ApiKey {
  provider: 'yandex' | 'deepseek' | 'openrouter' | 'proxyapi' | 'openai' | 'google';
  key_name: string;
  key_value: string;
  is_active: boolean;
}

export const useApiKeys = (tenantId: number) => {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const { toast } = useToast();

  const [yandexApiKey, setYandexApiKey] = useState('');
  const [yandexFolderId, setYandexFolderId] = useState('');
  const [yandexSpeechApiKey, setYandexSpeechApiKey] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [googleSpeechApiKey, setGoogleSpeechApiKey] = useState('');
  const [deepseekApiKey, setDeepseekApiKey] = useState('');
  const [openrouterApiKey, setOpenrouterApiKey] = useState('');
  const [proxyapiApiKey, setProxyapiApiKey] = useState('');

  const loadKeys = async () => {
    setIsLoading(true);
    try {
      console.log('[TenantApiKeysCard] Loading keys for tenant:', tenantId);
      const response = await authenticatedFetch(`${BACKEND_URL}?tenant_id=${tenantId}`, {
        method: 'GET'
      });
      const data = await response.json();
      console.log('[TenantApiKeysCard] Keys response:', data);
      
      if (response.ok && data.keys) {
        setKeys(data.keys);
        
        const yandexApi = data.keys.find((k: ApiKey) => k.provider === 'yandex' && k.key_name === 'api_key');
        const yandexFolder = data.keys.find((k: ApiKey) => k.provider === 'yandex' && k.key_name === 'folder_id');
        const yandexSpeech = data.keys.find((k: ApiKey) => k.provider === 'yandex' && k.key_name === 'YANDEX_SPEECHKIT_API_KEY');
        const openaiApi = data.keys.find((k: ApiKey) => k.provider === 'openai' && k.key_name === 'OPENAI_API_KEY');
        const googleSpeech = data.keys.find((k: ApiKey) => k.provider === 'google' && k.key_name === 'GOOGLE_SPEECH_API_KEY');
        const deepseekApi = data.keys.find((k: ApiKey) => k.provider === 'deepseek' && k.key_name === 'api_key');
        const openrouterApi = data.keys.find((k: ApiKey) => k.provider === 'openrouter' && k.key_name === 'api_key');
        const proxyapiApi = data.keys.find((k: ApiKey) => k.provider === 'proxyapi' && k.key_name === 'api_key');
        
        console.log('[TenantApiKeysCard] Found keys:', {
          yandex: !!yandexApi,
          yandexSpeech: !!yandexSpeech,
          openai: !!openaiApi,
          googleSpeech: !!googleSpeech,
          deepseek: !!deepseekApi,
          openrouter: !!openrouterApi,
          proxyapi: !!proxyapiApi
        });
        
        setYandexApiKey(yandexApi?.key_value || '');
        setYandexFolderId(yandexFolder?.key_value || '');
        setYandexSpeechApiKey(yandexSpeech?.key_value || '');
        setOpenaiApiKey(openaiApi?.key_value || '');
        setGoogleSpeechApiKey(googleSpeech?.key_value || '');
        setDeepseekApiKey(deepseekApi?.key_value || '');
        setOpenrouterApiKey(openrouterApi?.key_value || '');
        setProxyapiApiKey(proxyapiApi?.key_value || '');
      } else {
        console.error('[TenantApiKeysCard] Failed to load keys:', response.status, data);
      }
    } catch (error: any) {
      console.error('[TenantApiKeysCard] Error loading keys:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось загрузить ключи',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveKey = async (provider: string, keyName: string, keyValue: string, savingId: string) => {
    if (!keyValue.trim() || keyValue.startsWith('***')) {
      toast({
        title: 'Внимание',
        description: 'Введите новый ключ для сохранения',
        variant: 'default'
      });
      return;
    }

    setSavingKey(savingId);
    try {
      const response = await authenticatedFetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          keys: [{ provider, key_name: keyName, key_value: keyValue.trim() }]
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: 'Успешно',
          description: `Ключ ${keyName} сохранён`
        });
        await loadKeys();
      } else {
        throw new Error(data.error || 'Не удалось сохранить ключ');
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSavingKey(null);
    }
  };

  const maskKey = (key: string) => {
    if (!key || key.length < 8) return '••••••••';
    return key.substring(0, 4) + '••••' + key.substring(key.length - 4);
  };

  useEffect(() => {
    loadKeys();
  }, [tenantId]);

  return {
    keys,
    isLoading,
    savingKey,
    yandexApiKey,
    setYandexApiKey,
    yandexFolderId,
    setYandexFolderId,
    yandexSpeechApiKey,
    setYandexSpeechApiKey,
    openaiApiKey,
    setOpenaiApiKey,
    googleSpeechApiKey,
    setGoogleSpeechApiKey,
    deepseekApiKey,
    setDeepseekApiKey,
    openrouterApiKey,
    setOpenrouterApiKey,
    proxyapiApiKey,
    setProxyapiApiKey,
    handleSaveKey,
    maskKey,
    loadKeys
  };
};