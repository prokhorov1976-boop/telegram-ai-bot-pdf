import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import FUNC_URLS from '../../backend/func2url.json';

const SUPPORT_CHAT_URL = FUNC_URLS['support-chat'];

interface Message {
  id: number;
  message_text: string;
  sender_type: 'user' | 'admin';
  created_at: string;
}

// Функция для рендеринга сообщения с HTML и кликабельными ссылками
const renderMessage = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  const processedText = text.replace(urlRegex, (url) => {
    if (text.indexOf(`<a`) !== -1 && text.indexOf(url) > text.lastIndexOf(`<a`, text.indexOf(url))) {
      return url;
    }
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="underline hover:opacity-80 font-medium">${url}</a>`;
  });
  
  return <span dangerouslySetInnerHTML={{ __html: processedText }} />;
};

interface SupportChatProps {
  userName?: string;
  userEmail?: string;
  userPhone?: string;
}

export const SupportChat = ({ userName, userEmail, userPhone }: SupportChatProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Генерация уникального session_id при первой загрузке
  useEffect(() => {
    const storedSessionId = localStorage.getItem('support_chat_session_id');
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
      localStorage.setItem('support_chat_session_id', newSessionId);
    }
  }, []);

  // Загрузка истории сообщений
  const loadMessages = async () => {
    if (!sessionId) return;

    try {
      const response = await fetch(`${SUPPORT_CHAT_URL}?session_id=${sessionId}`);
      const data = await response.json();
      
      if (response.ok && data.messages) {
        const wasEmpty = messages.length === 0;
        const hadNewMessages = data.messages.length > messages.length;
        
        setMessages(data.messages);
        
        // Показать индикатор новых сообщений только если чат закрыт
        if (!isOpen && hadNewMessages && !wasEmpty) {
          setHasNewMessages(true);
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Polling новых сообщений каждые 3 секунды
  useEffect(() => {
    if (sessionId) {
      loadMessages();
      
      pollingIntervalRef.current = setInterval(() => {
        loadMessages();
      }, 3000);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [sessionId, isOpen]);

  // Прокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Сброс индикатора при открытии чата
  useEffect(() => {
    if (isOpen) {
      setHasNewMessages(false);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!inputText.trim() || !sessionId) return;

    setIsLoading(true);
    try {
      const response = await fetch(SUPPORT_CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message_text: inputText.trim(),
          user_name: userName,
          user_email: userEmail,
          user_phone: userPhone
        })
      });

      if (response.ok) {
        setInputText('');
        // Перезагрузить сообщения сразу после отправки
        await loadMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
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
          className="relative h-16 w-16 rounded-full shadow-2xl bg-blue-600 hover:bg-blue-700 transition-all hover:scale-110"
        >
          <Icon name="MessageCircle" size={28} />
          {hasNewMessages && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]">
      <Card className="shadow-2xl border-2 border-blue-200">
        <CardHeader className="bg-blue-600 text-white pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Icon name="Headphones" size={20} />
              Поддержка
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
            Обычно отвечаем в течение 5 минут
          </p>
        </CardHeader>

        <CardContent className="p-0">
          {/* Область сообщений */}
          <div className="h-96 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.length === 0 && (
              <div className="text-center text-slate-500 py-12">
                <Icon name="MessageSquare" size={48} className="mx-auto mb-3 text-slate-300" />
                <p className="text-sm">Задайте свой вопрос</p>
                <p className="text-xs text-slate-400 mt-1">Мы ответим в Telegram и здесь</p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.sender_type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap break-words">{renderMessage(msg.message_text)}</div>
                  <p
                    className={`text-xs mt-1 ${
                      msg.sender_type === 'user' ? 'text-blue-200' : 'text-slate-400'
                    }`}
                  >
                    {new Date(msg.created_at).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'Europe/Moscow'
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Поле ввода */}
          <div className="p-4 bg-white border-t">
            <div className="flex gap-2">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Напишите сообщение..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !inputText.trim()}
                size="icon"
                className="bg-blue-600 hover:bg-blue-700"
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

export default SupportChat;