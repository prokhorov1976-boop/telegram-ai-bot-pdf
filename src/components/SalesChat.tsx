import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

const CHAT_API = 'https://functions.poehali.dev/7b58f4fb-5db0-4f85-bb3b-55bafa4cbf73';
const TENANT_SLUG = 'sales'; // ID 777 - бот-продажник

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Функция для рендеринга сообщения с HTML и кликабельными ссылками
const renderMessage = (text: string) => {
  // Сначала обрабатываем URL в тексте (вне HTML тегов)
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  const processedText = text.replace(urlRegex, (url) => {
    // Если URL уже внутри <a> тега, не трогаем
    if (text.indexOf(`<a`) !== -1 && text.indexOf(url) > text.lastIndexOf(`<a`, text.indexOf(url))) {
      return url;
    }
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="underline hover:opacity-80 font-medium">${url}</a>`;
  });
  
  // Рендерим как HTML (поддерживает <b>, <i>, <a> теги)
  return <span dangerouslySetInnerHTML={{ __html: processedText }} />;
};

export const SalesChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `sales-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Прокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Приветственное сообщение при открытии
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: '👋 Здравствуйте! Я AI-консультант. Расскажу о наших тарифах, возможностях и помогу выбрать подходящий план. Задайте любой вопрос!',
        timestamp: new Date()
      }]);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      console.log('[SalesChat] Sending request:', {
        url: CHAT_API,
        tenantSlug: TENANT_SLUG,
        sessionId: sessionId,
        message: userMessage.content
      });

      const response = await fetch(CHAT_API, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Session-Id': sessionId
        },
        body: JSON.stringify({
          tenantSlug: TENANT_SLUG,
          message: userMessage.content,
          sessionId: sessionId,
          channel: 'widget'
        })
      });

      console.log('[SalesChat] Response status:', response.status);
      const data = await response.json();
      console.log('[SalesChat] Response data:', data);

      if (response.ok && data.message) {
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.message,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Ошибка получения ответа');
      }
    } catch (error) {
      console.error('[SalesChat] Error sending message:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '😔 Извините, произошла ошибка. Попробуйте еще раз или напишите нам в MAX: https://max.ru/u/f9LHodD0cOIrknUlAYx1LxuVyfuHRhIq-OHhkpPMbwJ_WcjW4dhTFpEEEz0',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          onClick={() => setIsOpen(true)}
          className="relative h-16 w-16 rounded-full shadow-2xl bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all hover:scale-110"
        >
          <Icon name="Bot" size={28} />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]">
      <Card className="shadow-2xl border-2 border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Icon name="Bot" size={20} />
              AI-консультант
            </CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0 hover:bg-white/20 text-white"
            >
              <Icon name="X" size={20} />
            </Button>
          </div>
          <p className="text-xs text-blue-100 mt-1">
            Помогу выбрать тариф и ответ на вопросы
          </p>
        </CardHeader>

        <CardContent className="p-0">
          {/* Область сообщений */}
          <div className="h-96 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">{renderMessage(msg.content)}</div>
                  <p
                    className={`text-xs mt-1.5 ${
                      msg.role === 'user' ? 'text-blue-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Icon name="Loader2" size={16} className="animate-spin text-blue-600" />
                    <span className="text-sm text-slate-600">Печатаю ответ...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Поле ввода */}
          <div className="p-4 bg-white border-t">
            <div className="flex gap-2">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Задайте вопрос о тарифах..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !inputText.trim()}
                size="icon"
                className="bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Icon name={isLoading ? 'Loader2' : 'Send'} size={18} className={isLoading ? 'animate-spin' : ''} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesChat;