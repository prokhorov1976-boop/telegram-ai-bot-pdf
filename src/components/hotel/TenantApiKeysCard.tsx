import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useApiKeys } from './api-keys/useApiKeys';
import ApiKeyInput from './api-keys/ApiKeyInput';
import ApiKeySection from './api-keys/ApiKeySection';

interface TenantApiKeysCardProps {
  tenantId: number;
  tenantName: string;
  fz152Enabled?: boolean;
}

const TenantApiKeysCard = ({ tenantId, tenantName, fz152Enabled = false }: TenantApiKeysCardProps) => {
  const {
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
    qwenApiKey,
    setQwenApiKey,
    openrouterApiKey,
    setOpenrouterApiKey,
    proxyapiApiKey,
    setProxyapiApiKey,
    handleSaveKey,
    maskKey
  } = useApiKeys(tenantId);

  const hasAnyMaskedKey = 
    yandexApiKey.startsWith('***') || 
    yandexFolderId.startsWith('***') || 
    yandexSpeechApiKey.startsWith('***') || 
    openaiApiKey.startsWith('***') || 
    googleSpeechApiKey.startsWith('***') || 
    deepseekApiKey.startsWith('***') || 
    qwenApiKey.startsWith('***') || 
    openrouterApiKey.startsWith('***') || 
    proxyapiApiKey.startsWith('***');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Key" size={20} />
          API ключи бота
        </CardTitle>
        <CardDescription>
          {fz152Enabled 
            ? `Для соблюдения 152-ФЗ необходимо использовать собственный API ключ YandexGPT для ${tenantName}` 
            : `Управление ключами для ${tenantName}. Каждый бот использует свои ключи.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Icon name="Loader2" size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {hasAnyMaskedKey && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Icon name="ShieldCheck" size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-green-900">
                      <p className="font-semibold mb-2">🔐 Ключи защищены</p>
                      <p className="text-green-800 mb-2">
                        Ваши API ключи сохранены и замаскированы для безопасности. Полные значения скрыты и доступны только серверу.
                      </p>
                      <p className="text-green-800">
                        <strong>Для изменения:</strong> Введите новые ключи в поля ниже и нажмите "Сохранить ключи". Обновятся только те ключи, которые вы измените.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {fz152Enabled && (
                <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Icon name="ShieldCheck" size={16} className="text-amber-600 mt-0.5" />
                    <div className="text-sm text-amber-900">
                      <p className="font-semibold mb-2">Требования 152-ФЗ</p>
                      <p className="text-amber-800 mb-1">
                        Для обработки персональных данных клиентов необходимо использовать собственный API ключ YandexGPT.
                      </p>
                      <p className="text-amber-800">
                        Это обеспечивает соответствие законодательству о защите персональных данных.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <ApiKeySection
                icon="Info"
                iconColor="text-blue-600"
                bgColor="bg-blue-50"
                borderColor="border-blue-200"
                title="Яндекс API"
                description={
                  <p className="text-blue-800">
                    {fz152Enabled 
                      ? 'Используется для чата (YandexGPT Lite) и эмбеддингов (text-search-doc, text-search-query)'
                      : 'Используется моделью YandexGPT и для эмбеддингов всех OpenRouter моделей'}
                  </p>
                }
              >
                <ApiKeyInput
                  id="yandex_api_key"
                  label="Yandex API Key"
                  value={yandexApiKey}
                  onChange={setYandexApiKey}
                  onSave={() => handleSaveKey('yandex', 'api_key', yandexApiKey, 'yandex_api')}
                  isSaving={savingKey === 'yandex_api'}
                  placeholder="AQVN... (введите новый ключ)"
                  type="password"
                  maskKey={maskKey}
                />
                <ApiKeyInput
                  id="yandex_folder_id"
                  label="Yandex Folder ID"
                  value={yandexFolderId}
                  onChange={setYandexFolderId}
                  onSave={() => handleSaveKey('yandex', 'folder_id', yandexFolderId, 'yandex_folder')}
                  isSaving={savingKey === 'yandex_folder'}
                  placeholder="b1g... (введите новый ID)"
                  type="text"
                  maskKey={maskKey}
                />
                <ApiKeyInput
                  id="yandex_speech_api_key"
                  label="Yandex SpeechKit API Key"
                  value={yandexSpeechApiKey}
                  onChange={setYandexSpeechApiKey}
                  onSave={() => handleSaveKey('yandex', 'YANDEX_SPEECHKIT_API_KEY', yandexSpeechApiKey, 'yandex_speech')}
                  isSaving={savingKey === 'yandex_speech'}
                  placeholder="AQVN... (для распознавания речи)"
                  type="password"
                  description="Используется для распознавания голосовых сообщений (Yandex SpeechKit)"
                  maskKey={maskKey}
                />
              </ApiKeySection>
            </div>

            {!fz152Enabled && (
            <>
            <ApiKeySection
              icon="Mic"
              iconColor="text-purple-600"
              bgColor="bg-purple-50"
              borderColor="border-purple-200"
              title="Ключи для распознавания речи"
              description="Необходимы для обработки голосовых и видео-сообщений в чатах"
            >
              <ApiKeyInput
                id="openai_api_key"
                label="OpenAI API Key (Whisper)"
                value={openaiApiKey}
                onChange={setOpenaiApiKey}
                onSave={() => handleSaveKey('openai', 'OPENAI_API_KEY', openaiApiKey, 'openai_api')}
                isSaving={savingKey === 'openai_api'}
                placeholder="sk-proj-... (для Whisper STT)"
                type="password"
                description="Используется для распознавания речи через OpenAI Whisper ($0.006/мин)"
                maskKey={maskKey}
              />
              <ApiKeyInput
                id="google_speech_api_key"
                label="Google Speech API Key"
                value={googleSpeechApiKey}
                onChange={setGoogleSpeechApiKey}
                onSave={() => handleSaveKey('google', 'GOOGLE_SPEECH_API_KEY', googleSpeechApiKey, 'google_speech')}
                isSaving={savingKey === 'google_speech'}
                placeholder="AIzaSy... (для Speech-to-Text)"
                type="password"
                description="Используется для распознавания речи через Google Cloud ($0.006/15 сек)"
                maskKey={maskKey}
              />
            </ApiKeySection>
            </>
            )}

            {!fz152Enabled && (
            <>
            <ApiKeySection
              icon="Info"
              iconColor="text-orange-600"
              bgColor="bg-orange-50"
              borderColor="border-orange-200"
              title="DeepSeek API (прямой доступ)"
              description={
                <div className="text-orange-900">
                  <p className="text-orange-800 mb-2">
                    <strong>DeepSeek V3:</strong> $0.14 вх / $0.28 вых (1M) — основная модель для чата
                  </p>
                  <p className="text-orange-800 mb-3">
                    <strong>DeepSeek R1:</strong> $0.55 вх / $2.19 вых (1M) — модель с рассуждениями
                  </p>
                  <div className="border-t border-orange-300 pt-3 mt-3">
                    <p className="font-medium mb-2">Как получить ключ DeepSeek:</p>
                    <ol className="list-decimal pl-4 space-y-1 text-orange-800">
                      <li>Перейдите на <a href="https://platform.deepseek.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-orange-600">platform.deepseek.com</a></li>
                      <li>Зарегистрируйтесь или войдите в аккаунт</li>
                      <li>Пополните баланс минимум на $5</li>
                      <li>Перейдите в раздел API Keys</li>
                      <li>Создайте новый ключ → скопируйте (начинается с sk-...)</li>
                      <li>Вставьте ключ в поле ниже</li>
                    </ol>
                  </div>
                </div>
              }
            >
              <ApiKeyInput
                id="deepseek_api_key"
                label="DeepSeek API Key"
                value={deepseekApiKey}
                onChange={setDeepseekApiKey}
                onSave={() => handleSaveKey('deepseek', 'api_key', deepseekApiKey, 'deepseek_api')}
                isSaving={savingKey === 'deepseek_api'}
                placeholder="sk-... (введите новый ключ)"
                type="password"
                maskKey={maskKey}
              />
            </ApiKeySection>

            <ApiKeySection
              icon="Info"
              iconColor="text-purple-600"
              bgColor="bg-purple-50"
              borderColor="border-purple-200"
              title="OpenRouter API"
              description={
                <div className="text-purple-900">
                  <p className="text-purple-800 mb-2">
                    <strong>Бесплатные:</strong> Meta Llama 3.1 8B, Google Gemma 2 9B, Qwen 2.5 7B, Microsoft Phi-3 Medium, DeepSeek R1
                  </p>
                  <p className="text-purple-800">
                    <strong>Платные:</strong> GPT-4o, Claude 3.5 Sonnet, GPT-3.5 Turbo, Claude 3 Haiku, Gemini Flash и другие топовые модели
                  </p>
                </div>
              }
            >
              <ApiKeyInput
                id="openrouter_api_key"
                label="OpenRouter API Key"
                value={openrouterApiKey}
                onChange={setOpenrouterApiKey}
                onSave={() => handleSaveKey('openrouter', 'api_key', openrouterApiKey, 'openrouter_api')}
                isSaving={savingKey === 'openrouter_api'}
                placeholder="sk-or-... (введите новый ключ)"
                type="password"
                maskKey={maskKey}
              />
            </ApiKeySection>

            <ApiKeySection
              icon="Info"
              iconColor="text-red-600"
              bgColor="bg-red-50"
              borderColor="border-red-200"
              title="Qwen API (прямой доступ)"
              description={
                <div className="text-red-900">
                  <p className="text-red-800 mb-2">
                    <strong>Qwen Turbo:</strong> ¥0.3 вх / ¥0.6 вых (1M) — быстрая модель
                  </p>
                  <p className="text-red-800 mb-2">
                    <strong>Qwen Plus:</strong> ¥0.8 вх / ¥2.0 вых (1M) — стандартная модель
                  </p>
                  <p className="text-red-800 mb-3">
                    <strong>Qwen Max:</strong> ¥20 вх / ¥60 вых (1M) — топовая модель
                  </p>
                  <div className="border-t border-red-300 pt-3 mt-3">
                    <p className="font-medium mb-2">Как получить ключ Qwen:</p>
                    <ol className="list-decimal pl-4 space-y-1 text-red-800">
                      <li>Перейдите на <a href="https://dashscope.console.aliyun.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-red-600">dashscope.console.aliyun.com</a></li>
                      <li>Зарегистрируйтесь или войдите через Alibaba Cloud</li>
                      <li>Пополните баланс (минимум ¥10)</li>
                      <li>Перейдите в раздел API Keys</li>
                      <li>Создайте новый ключ → скопируйте (начинается с sk-...)</li>
                      <li>Вставьте ключ в поле ниже</li>
                    </ol>
                  </div>
                </div>
              }
            >
              <ApiKeyInput
                id="qwen_api_key"
                label="Qwen API Key"
                value={qwenApiKey}
                onChange={setQwenApiKey}
                onSave={() => handleSaveKey('qwen', 'api_key', qwenApiKey, 'qwen_api')}
                isSaving={savingKey === 'qwen_api'}
                placeholder="sk-... (введите новый ключ)"
                type="password"
                maskKey={maskKey}
              />
            </ApiKeySection>

            <ApiKeySection
              icon="Info"
              iconColor="text-emerald-600"
              bgColor="bg-emerald-50"
              borderColor="border-emerald-200"
              title="ProxyAPI"
              description={
                <div className="text-emerald-900">
                  <p className="text-emerald-800 mb-2">
                    <strong>Доступные модели:</strong> GPT-4o Mini, O1 Mini, O1, Claude 3 Haiku, Claude 3.5 Sonnet, Claude 3 Opus
                  </p>
                  <p className="text-emerald-800">
                    Российский API-прокси для доступа к моделям OpenAI и Anthropic
                  </p>
                </div>
              }
            >
              <ApiKeyInput
                id="proxyapi_api_key"
                label="ProxyAPI Key"
                value={proxyapiApiKey}
                onChange={setProxyapiApiKey}
                onSave={() => handleSaveKey('proxyapi', 'api_key', proxyapiApiKey, 'proxyapi_api')}
                isSaving={savingKey === 'proxyapi_api'}
                placeholder="sk-... (введите новый ключ)"
                type="password"
                maskKey={maskKey}
              />
            </ApiKeySection>
            </>
            )}

          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TenantApiKeysCard;