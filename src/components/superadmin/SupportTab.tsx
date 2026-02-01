import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import FUNC_URLS from '../../../backend/func2url.json';

const SUPPORT_ADMIN_URL = FUNC_URLS['support-admin'];
const SUPPORT_CHAT_URL = FUNC_URLS['support-chat'];
const WEBHOOK_SETUP_URL = FUNC_URLS['support-webhook-setup'];

interface Session {
  session_id: string;
  user_name: string;
  user_email: string | null;
  user_phone: string | null;
  last_message: string;
  last_sender: 'user' | 'admin';
  last_message_at: string;
  unread_count: number;
  total_messages: number;
}

interface Message {
  id: number;
  message_text: string;
  sender_type: 'user' | 'admin';
  created_at: string;
}

export const SupportTab = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [webhookInfo, setWebhookInfo] = useState<any>(null);
  const [webhookSetupStatus, setWebhookSetupStatus] = useState<string>('');

  const loadSessions = async () => {
    try {
      const response = await fetch(SUPPORT_ADMIN_URL);
      const data = await response.json();
      if (response.ok) {
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const response = await fetch(`${SUPPORT_CHAT_URL}?session_id=${sessionId}`);
      const data = await response.json();
      if (response.ok) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const markAsRead = async (sessionId: string) => {
    try {
      await fetch(SUPPORT_ADMIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
      });
      loadSessions();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const checkWebhook = async () => {
    try {
      const response = await fetch(WEBHOOK_SETUP_URL);
      const data = await response.json();
      if (response.ok) {
        setWebhookInfo(data);
      }
    } catch (error) {
      console.error('Error checking webhook:', error);
    }
  };

  const setupWebhook = async () => {
    setWebhookSetupStatus('Настройка...');
    try {
      const response = await fetch(WEBHOOK_SETUP_URL, { method: 'POST' });
      const data = await response.json();
      if (response.ok) {
        setWebhookSetupStatus('✅ ' + data.message);
        checkWebhook();
      } else {
        setWebhookSetupStatus('❌ ' + (data.error || 'Ошибка настройки'));
      }
    } catch (error) {
      setWebhookSetupStatus('❌ Ошибка: ' + error);
    }
  };

  useEffect(() => {
    loadSessions();
    checkWebhook();
    const interval = setInterval(loadSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedSession) {
      loadMessages(selectedSession.session_id);
      const interval = setInterval(() => loadMessages(selectedSession.session_id), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedSession]);

  const handleSelectSession = (session: Session) => {
    setSelectedSession(session);
    if (session.unread_count > 0) {
      markAsRead(session.session_id);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Вчера';
    } else if (days < 7) {
      return `${days} дн. назад`;
    } else {
      return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    }
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Icon name="Headphones" size={24} className="text-blue-600" />
              Чат поддержки - Все обращения
            </CardTitle>
            <div className="flex items-center gap-3">
              {webhookInfo && (
                <div className="text-sm text-slate-600">
                  {webhookInfo.webhook_info?.result?.url ? (
                    <span className="flex items-center gap-2">
                      <Icon name="CheckCircle" size={16} className="text-green-600" />
                      Вебхук настроен
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Icon name="AlertCircle" size={16} className="text-orange-600" />
                      Вебхук не настроен
                    </span>
                  )}
                </div>
              )}
              <Button 
                onClick={setupWebhook}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <Icon name="Settings" size={16} />
                Настроить вебхук
              </Button>
            </div>
          </div>
          {webhookSetupStatus && (
            <p className="mt-2 text-sm text-slate-600">{webhookSetupStatus}</p>
          )}
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Диалоги ({sessions.length})</CardTitle>
              <Button size="sm" variant="ghost" onClick={loadSessions}>
                <Icon name="RefreshCw" size={16} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[calc(100vh-350px)] overflow-y-auto">
              {sessions.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <Icon name="MessageSquare" size={48} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-sm">Пока нет обращений</p>
                </div>
              )}
              {sessions.map((session) => (
                <div
                  key={session.session_id}
                  onClick={() => handleSelectSession(session)}
                  className={`p-4 border-b cursor-pointer hover:bg-slate-50 transition-colors ${
                    selectedSession?.session_id === session.session_id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                        {session.user_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{session.user_name}</p>
                        <p className="text-xs text-slate-500">{formatDate(session.last_message_at)}</p>
                      </div>
                    </div>
                    {session.unread_count > 0 && (
                      <Badge className="bg-red-500 text-white">{session.unread_count}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 truncate">
                    {session.last_sender === 'admin' && '✓ '}
                    {session.last_message}
                  </p>
                  <div className="flex gap-2 mt-2 text-xs text-slate-500">
                    {session.user_email && (
                      <span className="flex items-center gap-1">
                        <Icon name="Mail" size={12} />
                        {session.user_email}
                      </span>
                    )}
                    {session.user_phone && (
                      <span className="flex items-center gap-1">
                        <Icon name="Phone" size={12} />
                        {session.user_phone}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-3 border-b">
            {selectedSession ? (
              <div>
                <CardTitle className="text-lg">{selectedSession.user_name}</CardTitle>
                <div className="flex gap-3 mt-2 text-sm text-slate-600">
                  {selectedSession.user_email && (
                    <span className="flex items-center gap-1">
                      <Icon name="Mail" size={14} />
                      {selectedSession.user_email}
                    </span>
                  )}
                  {selectedSession.user_phone && (
                    <span className="flex items-center gap-1">
                      <Icon name="Phone" size={14} />
                      {selectedSession.user_phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Icon name="MessageCircle" size={14} />
                    {selectedSession.total_messages} сообщений
                  </span>
                </div>
              </div>
            ) : (
              <CardTitle className="text-lg text-slate-400">Выберите диалог</CardTitle>
            )}
          </CardHeader>
          <CardContent className="p-4">
            {selectedSession ? (
              <div className="h-[calc(100vh-350px)] overflow-y-auto space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_type === 'user' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        msg.sender_type === 'user'
                          ? 'bg-white border border-slate-200 text-slate-900'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.message_text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.sender_type === 'user' ? 'text-slate-400' : 'text-blue-200'
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
              </div>
            ) : (
              <div className="h-[calc(100vh-350px)] flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <Icon name="MessageSquare" size={64} className="mx-auto mb-4 text-slate-300" />
                  <p>Выберите диалог для просмотра переписки</p>
                  <p className="text-sm mt-2">Отвечайте через Telegram - ответы появятся здесь автоматически</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};
