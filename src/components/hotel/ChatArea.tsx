import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import ChatMessage from './ChatMessage';
import { Message, PageSettings, QuickQuestion } from './types';

interface ChatAreaProps {
  messages: Message[];
  inputMessage: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  pageSettings?: PageSettings;
  consentEnabled?: boolean;
  consentText?: string;
  isWidget?: boolean;
  quickQuestions?: QuickQuestion[];
  onQuickQuestion?: (question: string) => void;
}

const ChatArea = ({
  messages,
  inputMessage,
  isLoading,
  onInputChange,
  onSendMessage,
  pageSettings,
  consentEnabled = false,
  consentText = 'Я согласен на обработку персональных данных',
  isWidget = false,
  quickQuestions = [],
  onQuickQuestion
}: ChatAreaProps) => {
  const [consentGiven, setConsentGiven] = useState(false);
  const [showConsentWarning, setShowConsentWarning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const hasUserMessages = messages.some(msg => msg.role === 'user');
  const showConsent = consentEnabled && !hasUserMessages && !consentGiven;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = () => {
    if (consentEnabled && !hasUserMessages && !consentGiven) {
      setShowConsentWarning(true);
      return;
    }
    setShowConsentWarning(false);
    onSendMessage();
  };

  return (
    <Card className={isWidget ? "h-full rounded-none border-0 shadow-none flex flex-col" : "shadow-xl animate-scale-in h-[calc(100vh-200px)]"}>
      {!isWidget && (
        <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-blue-50">
          <CardTitle className="flex items-center gap-2">
            <Icon name="MessageCircle" size={20} />
            {pageSettings?.page_title || 'AI-консультант'}
          </CardTitle>
          <CardDescription>{pageSettings?.page_subtitle || 'Задайте любой вопрос о наших услугах'}</CardDescription>
        </CardHeader>
      )}
      <CardContent className={isWidget ? "p-0 flex flex-col flex-1" : "p-0 flex flex-col h-[calc(100%-100px)]"}>
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Icon name="Loader2" size={16} className="text-white animate-spin" />
                </div>
                <div className="bg-slate-100 px-4 py-3 rounded-2xl">
                  <p className="text-sm text-slate-600">Думаю...</p>
                </div>
              </div>
            )}
            {!isLoading && messages.length === 0 && !isWidget && quickQuestions && quickQuestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-slate-600 font-medium">Популярные вопросы:</p>
                <div className="grid gap-2">
                  {quickQuestions.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => onQuickQuestion?.(q.question)}
                      className="text-left p-3 rounded-lg border border-slate-200 hover:border-primary hover:bg-primary/5 transition-colors text-sm"
                    >
                      {q.question}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        <div className="p-4 border-t bg-slate-50/50 space-y-3">
          {showConsent && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => {
                    setConsentGiven(e.target.checked);
                    setShowConsentWarning(false);
                  }}
                  className="mt-0.5 w-4 h-4 flex-shrink-0"
                />
                <span 
                  className="text-xs text-slate-700"
                  dangerouslySetInnerHTML={{ __html: consentText }}
                />
              </label>
              {showConsentWarning && (
                <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                  <Icon name="AlertCircle" size={12} />
                  Для продолжения необходимо согласиться с обработкой данных
                </p>
              )}
            </div>
          )}
          
          <div className="flex gap-2">
            <Input
              placeholder={pageSettings?.input_placeholder || 'Задайте вопрос...'}
              value={inputMessage}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
              disabled={isLoading}
              className="flex-1 bg-white"
            />
            <Button onClick={handleSend} size="icon" disabled={isLoading}>
              <Icon name="Send" size={18} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatArea;