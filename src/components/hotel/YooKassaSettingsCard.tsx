import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/lib/auth';

interface YooKassaSettingsCardProps {
  createPaymentUrl: string;
  webhookUrl: string;
}

const YooKassaSettingsCard = ({ createPaymentUrl, webhookUrl }: YooKassaSettingsCardProps) => {
  const [testAmount, setTestAmount] = useState('100');
  const [testDescription, setTestDescription] = useState('Тестовый платеж');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'not_set' | 'active' | 'error'>('not_set');
  const { toast } = useToast();

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const response = await authenticatedFetch(createPaymentUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 1, description: 'Status check' })
      });
      
      const data = await response.json();
      
      if (data.error?.includes('not configured')) {
        setStatus('not_set');
      } else if (response.ok) {
        setStatus('active');
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  const handleTestPayment = async () => {
    setIsLoading(true);
    try {
      const amount = parseFloat(testAmount);
      
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Введите корректную сумму');
      }

      const response = await authenticatedFetch(createPaymentUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          description: testDescription,
          return_url: window.location.origin + '/admin'
        })
      });

      const data = await response.json();

      if (response.ok && data.confirmation_url) {
        toast({
          title: '✓ Платеж создан!',
          description: 'Сейчас откроется страница оплаты ЮKassa'
        });
        
        setTimeout(() => {
          window.open(data.confirmation_url, '_blank');
        }, 1000);
        
        setStatus('active');
      } else {
        throw new Error(data.error || 'Не удалось создать платеж');
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-xl">
      <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="CreditCard" size={20} />
            <CardTitle>ЮKassa</CardTitle>
          </div>
          <Badge variant={
            status === 'active' ? 'default' :
            status === 'error' ? 'destructive' :
            'secondary'
          }>
            {status === 'active' ? 'Активна' : 
             status === 'error' ? 'Ошибка' : 
             'Не настроена'}
          </Badge>
        </div>
        <CardDescription>Прием платежей от клиентов</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Icon name="Info" size={16} className="text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Настройка ЮKassa:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-800">
                  <li>Зарегистрируйтесь на <a href="https://yookassa.ru" target="_blank" rel="noopener noreferrer" className="underline">yookassa.ru</a></li>
                  <li>Добавьте секреты YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY</li>
                  <li>В личном кабинете ЮKassa укажите webhook URL для уведомлений</li>
                  <li>Протестируйте платеж ниже</li>
                </ol>
              </div>
            </div>
          </div>

          <div>
            <Label>Webhook URL для ЮKassa</Label>
            <div className="flex gap-2">
              <Input
                value={webhookUrl}
                readOnly
                className="bg-slate-50 font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(webhookUrl);
                  toast({ title: 'Скопировано!' });
                }}
              >
                <Icon name="Copy" size={16} />
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Укажите этот URL в настройках уведомлений в личном кабинете ЮKassa
            </p>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Тестовый платеж</h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="test_amount">Сумма (₽)</Label>
                <Input
                  id="test_amount"
                  type="number"
                  value={testAmount}
                  onChange={(e) => setTestAmount(e.target.value)}
                  placeholder="100"
                />
              </div>
              <div>
                <Label htmlFor="test_description">Описание</Label>
                <Input
                  id="test_description"
                  value={testDescription}
                  onChange={(e) => setTestDescription(e.target.value)}
                  placeholder="Тестовый платеж"
                />
              </div>
              <Button
                onClick={handleTestPayment}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Icon name="Loader2" size={16} className="animate-spin mr-2" />
                    Создание платежа...
                  </>
                ) : (
                  <>
                    <Icon name="Send" size={16} className="mr-2" />
                    Создать тестовый платеж
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Icon name="AlertCircle" size={16} className="text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-900">
                <p className="font-medium">Важно:</p>
                <p className="text-amber-800">
                  Используйте тестовые карты ЮKassa для проверки интеграции. Реальные средства не списываются в тестовом режиме.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default YooKassaSettingsCard;