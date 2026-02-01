import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useState, useEffect } from 'react';
import { authenticatedFetch } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BACKEND_URLS } from '@/components/hotel/types';

interface ConsentLog {
  id: number;
  session_id: string;
  email: string;
  tenant_name: string;
  tariff_id: string;
  consent_text: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  requires_fz152: boolean;
}

export const ConsentLogsTab = () => {
  const [consents, setConsents] = useState<ConsentLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadConsents();
  }, []);

  const loadConsents = async () => {
    setIsLoading(true);
    try {
      const response = await authenticatedFetch(`${BACKEND_URLS.consentLogs}?action=list`);
      const data = await response.json();
      
      if (data.consents) {
        setConsents(data.consents);
      }
    } catch (error) {
      console.error('Error loading consents:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить логи согласий',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await authenticatedFetch(`${BACKEND_URLS.consentLogs}?action=export`);
      const csvData = await response.text();
      
      // Создаем blob и скачиваем файл
      const blob = new Blob([csvData], { type: 'text/csv; charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `consent_logs_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Успешно',
        description: 'Логи согласий экспортированы в CSV'
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось экспортировать данные',
        variant: 'destructive'
      });
    }
  };

  const filteredConsents = consents.filter(consent => 
    consent.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (consent.tenant_name && consent.tenant_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (consent.tariff_id && consent.tariff_id.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="ShieldCheck" size={24} />
            Логи согласий продаж
          </CardTitle>
          <CardDescription>
            Все согласия пользователей на обработку персональных данных при покупке подписок
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Поиск по email, тенанту или тарифу..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Button
              onClick={handleExport}
              variant="outline"
            >
              <Icon name="Download" size={16} className="mr-2" />
              Экспорт CSV
            </Button>
            <Button
              onClick={loadConsents}
              variant="outline"
              disabled={isLoading}
            >
              <Icon name="RefreshCw" size={16} className="mr-2" />
              Обновить
            </Button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Icon name="Info" size={20} className="text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">О логах согласий:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Логируются все согласия при покупке через ЮKassa</li>
                  <li>Сохраняются: email, IP-адрес, текст согласия, дата/время</li>
                  <li>Данные используются для соответствия 152-ФЗ</li>
                  <li>Экспорт доступен в формате CSV для архивирования</li>
                </ul>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Icon name="Loader2" className="animate-spin" size={32} />
            </div>
          ) : (
            <>
              <div className="text-sm text-muted-foreground mb-2">
                Найдено записей: {filteredConsents.length} из {consents.length}
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-[600px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white z-10">
                      <TableRow>
                        <TableHead className="w-[50px]">ID</TableHead>
                        <TableHead className="w-[200px]">Email</TableHead>
                        <TableHead className="w-[150px]">Тенант</TableHead>
                        <TableHead className="w-[100px]">Тариф</TableHead>
                        <TableHead className="w-[80px]">152-ФЗ</TableHead>
                        <TableHead className="w-[120px]">IP</TableHead>
                        <TableHead className="w-[150px]">Дата</TableHead>
                        <TableHead className="w-[100px]">Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredConsents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            {searchQuery ? 'Ничего не найдено' : 'Нет логов согласий'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredConsents.map((consent) => (
                          <TableRow key={consent.id}>
                            <TableCell className="font-mono text-xs">
                              {consent.id}
                            </TableCell>
                            <TableCell className="font-medium">
                              {consent.email}
                            </TableCell>
                            <TableCell>
                              {consent.tenant_name || '—'}
                            </TableCell>
                            <TableCell>
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                                {consent.tariff_id || '—'}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              {consent.requires_fz152 ? (
                                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-semibold">Да</span>
                              ) : (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">Нет</span>
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {consent.ip_address || '—'}
                            </TableCell>
                            <TableCell className="text-xs">
                              {formatDate(consent.created_at)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    `Email: ${consent.email}\nТенант: ${consent.tenant_name}\nТариф: ${consent.tariff_id}\nIP: ${consent.ip_address}\nДата: ${formatDate(consent.created_at)}\n\nТекст согласия:\n${consent.consent_text}`
                                  );
                                  toast({
                                    title: 'Скопировано',
                                    description: 'Данные согласия скопированы в буфер обмена'
                                  });
                                }}
                              >
                                <Icon name="Copy" size={14} />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Всего согласий
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{consents.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Уникальных email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {new Set(consents.map(c => c.email)).size}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              За последние 7 дней
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {consents.filter(c => {
                const date = new Date(c.created_at);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return date >= weekAgo;
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};