import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

const ApiKeysGuideCard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Info" size={20} />
          Как настроить API ключи
        </CardTitle>
        <CardDescription>
          Выберите провайдера в настройках AI и добавьте соответствующие ключи
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
            <Icon name="CloudCog" size={20} className="mt-0.5 text-blue-600 dark:text-blue-400" />
            <div className="flex-1 space-y-1">
              <h4 className="font-semibold text-sm">Yandex GPT</h4>
              <p className="text-sm text-muted-foreground">
                Для работы с моделями YandexGPT и Yandex Lite нужны два ключа:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 mt-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-xs mt-0.5">•</span>
                  <span><strong>API Key</strong> — авторизационный ключ сервисного аккаунта</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-xs mt-0.5">•</span>
                  <span><strong>Folder ID</strong> — идентификатор каталога в Yandex Cloud</span>
                </li>
              </ul>
              <a 
                href="https://yandex.cloud/ru/docs/iam/operations/api-key/create" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mt-2"
              >
                <Icon name="ExternalLink" size={14} />
                Как получить ключи Yandex Cloud
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
            <Icon name="Cpu" size={20} className="mt-0.5 text-purple-600 dark:text-purple-400" />
            <div className="flex-1 space-y-1">
              <h4 className="font-semibold text-sm">OpenRouter</h4>
              <p className="text-sm text-muted-foreground">
                Для работы с моделями через OpenRouter нужен один ключ:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 mt-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-xs mt-0.5">•</span>
                  <span><strong>API Key</strong> — ключ доступа к OpenRouter API</span>
                </li>
              </ul>
              <div className="text-sm text-muted-foreground mt-2 space-y-1">
                <p><strong>⚡ Бесплатные:</strong> Meta Llama 3.1 8B, Google Gemma 2 9B, Qwen 2.5 7B, Microsoft Phi-3 Medium, DeepSeek R1</p>
                <p><strong>💎 Топовые:</strong> GPT-4o, GPT-4 Turbo, Claude 3.5 Sonnet, Claude 3 Opus, Gemini Pro 1.5</p>
                <p><strong>💰 Дешевые:</strong> GPT-3.5 Turbo, Claude 3 Haiku, Gemini Flash 1.5, Mixtral 8x7B, Llama 3.1 70B</p>
              </div>
              <a 
                href="https://openrouter.ai/keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 mt-2"
              >
                <Icon name="ExternalLink" size={14} />
                Получить ключ OpenRouter
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
            <Icon name="Zap" size={20} className="mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <div className="flex-1 space-y-1">
              <h4 className="font-semibold text-sm">ProxyAPI</h4>
              <p className="text-sm text-muted-foreground">
                Российский прокси для доступа к OpenAI и Anthropic. Нужен один ключ:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 mt-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-xs mt-0.5">•</span>
                  <span><strong>API Key</strong> — ключ доступа к ProxyAPI</span>
                </li>
              </ul>
              <div className="text-sm text-muted-foreground mt-2 space-y-1">
                <p><strong>🚀 Доступные модели:</strong> GPT-4o Mini, O1 Mini, O1, Claude 3 Haiku, Claude 3.5 Sonnet, Claude 3 Opus</p>
                <p><strong>🇷🇺 Работает из России:</strong> без VPN, оплата в рублях</p>
              </div>
              <a 
                href="https://proxyapi.ru" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 mt-2"
              >
                <Icon name="ExternalLink" size={14} />
                Получить ключ ProxyAPI
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
          <Icon name="AlertCircle" size={18} className="text-amber-600 dark:text-amber-500 mt-0.5" />
          <div className="flex-1 text-sm text-amber-900 dark:text-amber-200">
            <strong>Важно:</strong> Добавьте ключи для провайдера, который выбран в настройках AI. Если провайдер Yandex — нужны Yandex ключи. Если OpenRouter — нужен OpenRouter ключ. Если ProxyAPI — нужен ProxyAPI ключ.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiKeysGuideCard;