import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { authenticatedFetch } from '@/lib/auth';
import { BACKEND_URLS } from './types';

interface ChatTestCardProps {
  tenantId: number;
  tenantName: string;
}

const ChatTestCard = ({ tenantId, tenantName }: ChatTestCardProps) => {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Europe/Moscow'
    });
  };

  const handleTest = async () => {
    if (!message.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите сообщение для теста',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    setResponse('');
    
    try {
      const testMessage = message.trim();
      const sessionId = `test_${Date.now()}`;
      
      const startTime = new Date().toISOString();
      
      const chatResponse = await authenticatedFetch(BACKEND_URLS.chat, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: testMessage,
          sessionId: sessionId,
          tenantId: tenantId
        })
      });

      const endTime = new Date().toISOString();
      
      const data = await chatResponse.json();

      if (chatResponse.ok && data.message) {
        const duration = new Date(endTime).getTime() - new Date(startTime).getTime();
        setResponse(
          `✅ Успешно (${duration}ms)\n\n` +
          `Время запроса: ${formatTimestamp(startTime)}\n` +
          `Время ответа: ${formatTimestamp(endTime)}\n` +
          `Session ID: ${sessionId}\n\n` +
          `Ответ бота:\n${data.message}`
        );
        toast({
          title: 'Тест пройден',
          description: `Бот ответил за ${duration}ms`
        });
      } else {
        throw new Error(data.error || `HTTP ${chatResponse.status}`);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Неизвестная ошибка';
      setResponse(`❌ Ошибка:\n${errorMessage}`);
      toast({
        title: 'Ошибка теста',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="TestTube" size={20} />
          Тестирование чата
        </CardTitle>
        <CardDescription>
          Проверка работы бота для {tenantName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Тестовое сообщение</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Привет! Чем можете помочь?"
            rows={3}
            disabled={isLoading}
          />
        </div>

        <Button
          onClick={handleTest}
          disabled={isLoading || !message.trim()}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
              Отправка...
            </>
          ) : (
            <>
              <Icon name="Send" size={16} className="mr-2" />
              Отправить тест
            </>
          )}
        </Button>

        {response && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Результат</label>
            <Textarea
              value={response}
              readOnly
              rows={12}
              className="font-mono text-xs"
            />
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Icon name="Info" size={16} className="text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Что проверяется:</p>
              <ul className="text-blue-800 space-y-1 ml-4">
                <li>• Наличие API ключей для выбранной модели</li>
                <li>• Работа функции chat с tenant_id={tenantId}</li>
                <li>• Генерация ответа от AI модели</li>
                <li>• Время отклика (отображается в МСК, UTC+3)</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatTestCard;