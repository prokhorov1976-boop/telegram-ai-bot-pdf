import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { authenticatedFetch } from '@/lib/auth';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  debug?: {
    context_ok?: boolean;
    gate_reason?: string;
    gate_info?: any;
    rag_context?: string;
  };
}

export const VoiceTestTab = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(`test_voice_${Date.now()}`);
  const [showDebug, setShowDebug] = useState(true);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const chatUrl = 'https://functions.poehali.dev/7b58f4fb-5db0-4f85-bb3b-55bafa4cbf73';
      
      const response = await fetch(chatUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantSlug: 'dinasty-crimea',
          sessionId: sessionId,
          message: userMessage.content,
          channel: 'voice'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message || 'Ошибка: нет ответа',
        timestamp: new Date(),
        debug: data.debug || {}
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    toast({
      title: 'Чат очищен',
      description: 'История диалога удалена'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Тест голосового бота (Династия)</CardTitle>
          <CardDescription>
            Симуляция разговора с телефонным ботом отеля Династия
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScrollArea className="h-[500px] border rounded-lg p-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Icon name="Phone" size={48} className="mb-4 opacity-20" />
                <p>Начните диалог с ботом</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {msg.timestamp.toLocaleTimeString('ru-RU')}
                      </p>
                      
                      {msg.role === 'assistant' && msg.debug && showDebug && (
                        <div className="mt-3 pt-3 border-t border-border/50 text-xs space-y-2">
                          <div className="flex items-center gap-2">
                            <Icon name="Bug" size={12} />
                            <span className="font-semibold">Debug:</span>
                          </div>
                          
                          {msg.debug.gate_reason && (
                            <div className="space-y-1">
                              <p>
                                <span className="opacity-70">Quality Gate:</span>{' '}
                                <span className={`font-mono ${
                                  msg.debug.context_ok ? 'text-green-600' : 'text-orange-600'
                                }`}>
                                  {msg.debug.gate_reason}
                                </span>
                              </p>
                              {msg.debug.gate_info && (
                                <>
                                  {msg.debug.gate_info.query_type && (
                                    <p>
                                      <span className="opacity-70">Тип запроса:</span>{' '}
                                      <span className="font-mono">{msg.debug.gate_info.query_type}</span>
                                    </p>
                                  )}
                                  {msg.debug.gate_info.best_score !== undefined && (
                                    <p>
                                      <span className="opacity-70">Лучший score:</span>{' '}
                                      <span className="font-mono">{msg.debug.gate_info.best_score.toFixed(3)}</span>
                                    </p>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                          
                          {msg.debug.rag_context && (
                            <details className="mt-2">
                              <summary className="cursor-pointer opacity-70 hover:opacity-100">
                                RAG контекст ({msg.debug.rag_context.length} символов)
                              </summary>
                              <pre className="mt-2 p-2 bg-background/50 rounded text-[10px] overflow-auto max-h-32">
                                {msg.debug.rag_context}
                              </pre>
                            </details>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDebug(!showDebug)}
                className="text-xs"
              >
                <Icon name={showDebug ? "EyeOff" : "Eye"} size={14} className="mr-1" />
                {showDebug ? 'Скрыть debug' : 'Показать debug'}
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Введите сообщение..."
                disabled={isLoading}
              />
              <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
                {isLoading ? (
                  <Icon name="Loader2" className="animate-spin" />
                ) : (
                  <Icon name="Send" />
                )}
              </Button>
              <Button onClick={clearChat} variant="outline" disabled={messages.length === 0}>
                <Icon name="Trash2" />
              </Button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>Примеры запросов для теста:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Есть ли бассейн? (должен ответить сразу)</li>
              <li>Сколько стоит номер на 11 марта на 2 ночи? (уточнит количество гостей)</li>
              <li>Двое (должен понять как 2 гостя и дать цену)</li>
              <li>Работает ли SPA? (должен ответить сразу без дат)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};