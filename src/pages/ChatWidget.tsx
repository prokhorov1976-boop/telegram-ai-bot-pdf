import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { Send } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface PageSettings {
  header_title?: string;
  header_subtitle?: string;
  input_placeholder?: string;
  consent_enabled?: boolean;
  consent_text?: string;
  page_title?: string;
  footer_link_1_text?: string;
  footer_link_1_url?: string;
  footer_link_2_text?: string;
  footer_link_2_url?: string;
  footer_link_3_text?: string;
  footer_link_3_url?: string;
  show_bot_promo?: boolean;
}

interface QuickQuestion {
  text: string;
  question: string;
  icon: string;
}

const CHAT_API = import.meta.env.VITE_CHAT_API_URL || 'https://functions.poehali.dev/7b58f4fb-5db0-4f85-bb3b-55bafa4cbf73';
const SETTINGS_API = import.meta.env.VITE_SETTINGS_API_URL || 'https://functions.poehali.dev/0534411b-d900-45d2-9082-a9485b33cf20';

const ChatWidget = () => {
  const { tenantSlug } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pageSettings, setPageSettings] = useState<PageSettings | null>(null);
  const [quickQuestions, setQuickQuestions] = useState<QuickQuestion[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [consentGiven, setConsentGiven] = useState(false);
  
  // Получаем цвета из URL параметров (для виджета)
  const searchParams = new URLSearchParams(window.location.search);
  const headerColor = searchParams.get('header_color') || '#3b82f6';
  const headerColorEnd = searchParams.get('header_color_end') || '#4f46e5';
  const [tenantNotFound, setTenantNotFound] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tenantNotFound && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (tenantNotFound && redirectCountdown === 0) {
      window.location.href = '/';
    }
  }, [tenantNotFound, redirectCountdown]);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Загружаем настройки страницы
        let welcomeMessage = 'Здравствуйте! Я AI-консультант. Чем могу помочь?';
        
        if (tenantSlug) {
          const response = await fetch(`${SETTINGS_API}?slug=${tenantSlug}`);
          if (response.ok) {
            const data = await response.json();
            setPageSettings(data.settings || data);
            setQuickQuestions(data.quickQuestions || []);
            
            // Используем page_title как приветствие, если оно есть
            if (data.settings?.page_title) {
              welcomeMessage = data.settings.page_title;
            }
          } else if (response.status === 404) {
            // Тенант не найден
            setTenantNotFound(true);
            setIsInitializing(false);
            return;
          }
        }

        // Добавляем приветственное сообщение
        setMessages([{
          id: '1',
          role: 'assistant',
          content: welcomeMessage,
          timestamp: new Date()
        }]);
      } catch (error) {
        console.error('Ошибка инициализации:', error);
      } finally {
        setIsInitializing(false);
      }
    };
    initialize();
  }, [tenantSlug]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        setTimeout(() => {
          viewport.scrollTo({
            top: viewport.scrollHeight,
            behavior: 'smooth'
          });
        }, 100);
      }
    }
  }, [messages, isLoading]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !tenantSlug) return;

    // Проверка согласия
    const hasUserMessages = messages.some(msg => msg.role === 'user');
    if (pageSettings?.consent_enabled && !hasUserMessages && !consentGiven) {
      alert('Пожалуйста, дайте согласие на обработку персональных данных');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(CHAT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage,
          tenantSlug: tenantSlug,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || data.response || 'Извините, не удалось получить ответ.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Произошла ошибка. Попробуйте позже.',
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

  if (isInitializing) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Icon name="Bot" className="w-12 h-12 text-blue-600 animate-pulse" />
          <span className="text-blue-600 font-medium">Загрузка...</span>
        </div>
      </div>
    );
  }

  if (tenantNotFound) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl">
          <CardHeader className="text-center border-b">
            <div className="flex justify-center mb-4">
              <Icon name="AlertCircle" className="w-16 h-16 text-red-500" />
            </div>
            <CardTitle className="text-2xl text-gray-900">Страница не найдена</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-gray-600 text-center mb-4">
              AI-консультант с адресом <span className="font-mono bg-gray-100 px-2 py-1 rounded">{tenantSlug}</span> не существует или был удалён.
            </p>
            <div className="text-center mb-4">
              <p className="text-sm text-gray-500">
                Перенаправление на главную через <span className="font-bold text-blue-600">{redirectCountdown}</span> сек...
              </p>
            </div>
            <div className="flex justify-center">
              <Button
                onClick={() => window.location.href = '/'}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Icon name="Home" size={16} className="mr-2" />
                Перейти сейчас
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasUserMessages = messages.some(msg => msg.role === 'user');
  const showConsent = pageSettings?.consent_enabled && !hasUserMessages && !consentGiven;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-start p-4 gap-4 py-8">
      <Card className="w-full max-w-3xl h-[85vh] flex flex-col shadow-2xl">
        <CardHeader 
          className="border-b text-white"
          style={{ background: `linear-gradient(135deg, ${headerColor} 0%, ${headerColorEnd} 100%)` }}
        >
          <div className="flex items-center gap-3">
            <Icon name="Bot" className="w-8 h-8" />
            <CardTitle className="text-2xl">
              {pageSettings?.header_title || 'AI Консультант'}
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
            {quickQuestions.length > 0 && !hasUserMessages && (
              <div className="mb-6 flex flex-wrap gap-2 sticky top-0 bg-gradient-to-b from-white via-white to-transparent pb-4 z-10">
                {quickQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputMessage(q.question);
                      setTimeout(() => sendMessage(), 100);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 rounded-full text-sm text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-colors shadow-sm"
                  >
                    <Icon name={q.icon} size={16} />
                    {q.text}
                  </button>
                ))}
              </div>
            )}
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div 
                      className="whitespace-pre-wrap break-words"
                      dangerouslySetInnerHTML={{
                        __html: msg.content
                          .replace(/<b>(.*?)<\/b>/gi, '<strong>$1</strong>')
                          .replace(/\n/g, '<br />')
                          .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">$1</a>')
                      }}
                    />
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl px-4 py-3 flex items-center gap-2">
                    <span className="text-gray-600">печатает</span>
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="border-t p-4 bg-white">
            {showConsent && (
              <div className="mb-4 flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="consent" className="text-sm text-gray-700 cursor-pointer">
                  {pageSettings?.consent_text || 'Я согласен на обработку персональных данных'}
                </label>
              </div>
            )}

            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={pageSettings?.input_placeholder || 'Напишите ваш вопрос...'}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim()}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>

            {(pageSettings?.footer_link_1_text && pageSettings?.footer_link_1_url) ||
             (pageSettings?.footer_link_2_text && pageSettings?.footer_link_2_url) ||
             (pageSettings?.footer_link_3_text && pageSettings?.footer_link_3_url) ? (
              <div className="mt-3 pt-3 border-t flex flex-wrap justify-center gap-3">
                {pageSettings?.footer_link_1_text && pageSettings?.footer_link_1_url && (
                  <a
                    href={pageSettings.footer_link_1_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-600 hover:text-blue-600 transition-colors underline"
                  >
                    {pageSettings.footer_link_1_text}
                  </a>
                )}
                {pageSettings?.footer_link_2_text && pageSettings?.footer_link_2_url && (
                  <a
                    href={pageSettings.footer_link_2_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-600 hover:text-blue-600 transition-colors underline"
                  >
                    {pageSettings.footer_link_2_text}
                  </a>
                )}
                {pageSettings?.footer_link_3_text && pageSettings?.footer_link_3_url && (
                  <a
                    href={pageSettings.footer_link_3_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-600 hover:text-blue-600 transition-colors underline"
                  >
                    {pageSettings.footer_link_3_text}
                  </a>
                )}
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {pageSettings?.show_bot_promo !== false && (
        <div className="text-center">
          <a
            href="https://max.ru/u/f9LHodD0cOIrknUlAYx1LxuVyfuHRhIq-OHhkpPMbwJ_WcjW4dhTFpEEez0"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-600 hover:text-blue-600 transition-colors inline-flex items-center gap-2"
          >
            <Icon name="Sparkles" size={16} />
            Хочу такого бота!
          </a>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;