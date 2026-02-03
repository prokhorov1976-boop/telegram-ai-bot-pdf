import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { BACKEND_URLS } from './types';

interface VoiceMessage {
  id: number;
  direction: 'incoming' | 'outgoing';
  text: string;
  created_at: string;
}

interface VoiceCall {
  id: number;
  call_id: string;
  phone_number: string;
  status: 'active' | 'completed' | 'failed';
  started_at: string;
  ended_at: string | null;
  messages: VoiceMessage[];
}

interface VoiceCallsHistoryProps {
  tenantId: number;
}

const VoiceCallsHistory = ({ tenantId }: VoiceCallsHistoryProps) => {
  const [calls, setCalls] = useState<VoiceCall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCallId, setExpandedCallId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [phoneFilter, setPhoneFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCalls();
    const interval = setInterval(loadCalls, 30000);
    return () => clearInterval(interval);
  }, [tenantId, statusFilter, phoneFilter, dateFrom, dateTo]);

  const loadCalls = async () => {
    try {
      const params = new URLSearchParams({ tenant_id: tenantId.toString() });
      
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (phoneFilter) {
        params.append('phone', phoneFilter);
      }
      if (dateFrom) {
        params.append('date_from', dateFrom);
      }
      if (dateTo) {
        params.append('date_to', dateTo);
      }
      
      const response = await fetch(`${BACKEND_URLS.getVoiceCalls}?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to load voice calls');
      const data = await response.json();
      setCalls(data.calls || []);
    } catch (error) {
      console.error('Error loading voice calls:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить историю звонков',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetFilters = () => {
    setStatusFilter('all');
    setPhoneFilter('');
    setDateFrom('');
    setDateTo('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (started: string, ended: string | null) => {
    if (!ended) return 'В процессе...';
    const duration = Math.floor((new Date(ended).getTime() - new Date(started).getTime()) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      completed: 'secondary',
      failed: 'destructive',
    };
    const labels = {
      active: 'Активен',
      completed: 'Завершён',
      failed: 'Ошибка',
    };
    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Phone" size={24} />
            История голосовых звонков
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">Загрузка...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Phone" size={24} />
              История голосовых звонков
            </CardTitle>
            <CardDescription>
              Найдено звонков: {calls.length}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Icon name="Filter" size={18} />
            {showFilters ? 'Скрыть фильтры' : 'Фильтры'}
          </Button>
        </div>
        
        {showFilters && (
          <div className="mt-4 space-y-4 p-4 border rounded-lg bg-muted/50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Статус</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Все статусы" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="active">Активен</SelectItem>
                    <SelectItem value="completed">Завершён</SelectItem>
                    <SelectItem value="failed">Ошибка</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Телефон</Label>
                <Input
                  placeholder="Поиск по номеру"
                  value={phoneFilter}
                  onChange={(e) => setPhoneFilter(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Дата с</Label>
                <Input
                  type="datetime-local"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Дата по</Label>
                <Input
                  type="datetime-local"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="flex items-center gap-2"
              >
                <Icon name="X" size={16} />
                Сбросить
              </Button>
              <Button
                onClick={() => loadCalls()}
                className="flex items-center gap-2"
              >
                <Icon name="Search" size={16} />
                Применить
              </Button>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {calls.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="Phone" size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Пока нет звонков</p>
          </div>
        ) : (
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {calls.map((call) => (
                <Collapsible
                  key={call.id}
                  open={expandedCallId === call.id}
                  onOpenChange={(open) => setExpandedCallId(open ? call.id : null)}
                >
                  <Card className="border-2 hover:border-primary/50 transition-colors">
                    <CollapsibleTrigger asChild>
                      <div className="p-4 cursor-pointer">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-3">
                              <Icon name="Phone" size={20} className="text-blue-600" />
                              <span className="font-semibold text-lg">{call.phone_number}</span>
                              {getStatusBadge(call.status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Icon name="Calendar" size={16} />
                                {formatDate(call.started_at)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Icon name="Clock" size={16} />
                                {formatDuration(call.started_at, call.ended_at)}
                              </span>
                              {call.messages && call.messages.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <Icon name="MessageCircle" size={16} />
                                  {call.messages.length} сообщений
                                </span>
                              )}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Icon 
                              name={expandedCallId === call.id ? "ChevronUp" : "ChevronDown"} 
                              size={20} 
                            />
                          </Button>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4 border-t pt-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Icon name="MessagesSquare" size={18} />
                          Диалог
                        </h4>
                        {call.messages && call.messages.length > 0 ? (
                          <div className="space-y-3">
                            {call.messages.map((message) => (
                              <div
                                key={message.id}
                                className={`flex gap-3 ${
                                  message.direction === 'incoming' ? 'justify-start' : 'justify-end'
                                }`}
                              >
                                <div
                                  className={`max-w-[80%] rounded-lg p-3 ${
                                    message.direction === 'incoming'
                                      ? 'bg-gray-100 text-gray-900'
                                      : 'bg-blue-600 text-white'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <Icon
                                      name={message.direction === 'incoming' ? 'User' : 'Bot'}
                                      size={16}
                                    />
                                    <span className="text-xs opacity-70">
                                      {formatDate(message.created_at)}
                                    </span>
                                  </div>
                                  <p className="text-sm">{message.text}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Нет сообщений</p>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
          </ScrollArea>
        )}
        <div className="mt-4 flex justify-end">
          <Button onClick={loadCalls} variant="outline" size="sm">
            <Icon name="RefreshCw" size={16} className="mr-2" />
            Обновить
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceCallsHistory;