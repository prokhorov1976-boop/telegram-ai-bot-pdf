import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { isSuperAdmin, authenticatedFetch } from '@/lib/auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FUNC_URLS from '../../../backend/func2url.json';

const BACKEND_URL = FUNC_URLS['subscription-manager'];
const TARIFF_CHANGE_URL = FUNC_URLS['tariff-management'];

interface SubscriptionInfo {
  status: string;
  end_date: string | null;
  tariff_id: string | null;
  tariff_name: string;
  renewal_price: number;
  days_left: number;
}

const SubscriptionWidget = ({ tenantId }: { tenantId: number }) => {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRenewalDialog, setShowRenewalDialog] = useState(false);
  const [showTariffDialog, setShowTariffDialog] = useState(false);
  const [renewalMonths, setRenewalMonths] = useState(1);
  const [newTariffId, setNewTariffId] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const superAdmin = isSuperAdmin();

  useEffect(() => {
    loadSubscription();
  }, [tenantId]);

  const loadSubscription = async () => {
    try {
      const response = await authenticatedFetch(`${BACKEND_URL}?action=get_subscription&tenant_id=${tenantId}`);
      const data = await response.json();
      setSubscription(data.subscription);
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenewal = async () => {
    setIsUpdating(true);
    try {
      // Если суперадмин — продлить напрямую без оплаты
      if (superAdmin) {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(BACKEND_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            tenant_id: tenantId,
            months: renewalMonths
          })
        });

        const data = await response.json();
        
        if (data.success) {
          toast({ title: 'Успешно', description: data.message });
          setShowRenewalDialog(false);
          await loadSubscription();
          window.location.reload();
        } else {
          throw new Error(data.error || 'Не удалось продлить подписку');
        }
      } else {
        // Обычный клиент — перенаправить на оплату
        const response = await authenticatedFetch(`${BACKEND_URL}?action=create_payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: subscription!.renewal_price * renewalMonths,
            description: `Продление подписки "${subscription!.tariff_name}" на ${renewalMonths} мес.`,
            metadata: {
              tenant_id: tenantId,
              payment_type: 'renewal',
              months: renewalMonths
            }
          })
        });

        const data = await response.json();
        
        if (data.confirmation_url) {
          window.location.href = data.confirmation_url;
        } else {
          throw new Error('Не получен URL для оплаты');
        }
      }
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangeTariff = async () => {
    if (!newTariffId) return;
    
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${TARIFF_CHANGE_URL}?action=change_tariff`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          new_tariff_id: newTariffId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast({ title: 'Успешно', description: 'Тарифный план изменен' });
        setShowTariffDialog(false);
        await loadSubscription();
        window.location.reload();
      } else {
        throw new Error(data.error || 'Не удалось изменить тариф');
      }
    } catch (error: any) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Icon name="Loader2" className="animate-spin" size={24} />
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return null;
  }

  const getStatusBadge = () => {
    switch (subscription.status) {
      case 'active':
        return <Badge className="bg-green-500">Активна</Badge>;
      case 'expired':
        return <Badge variant="destructive">Истекла</Badge>;
      default:
        return <Badge variant="outline">{subscription.status}</Badge>;
    }
  };

  const daysProgress = subscription.end_date 
    ? Math.max(0, Math.min(100, (subscription.days_left / 30) * 100))
    : 0;

  return (
    <>
      <Card className={subscription.status === 'expired' ? 'border-red-500' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Icon name="CreditCard" size={20} />
              Подписка
            </CardTitle>
            {getStatusBadge()}
          </div>
          <CardDescription>
            Тариф: {subscription.tariff_name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription.end_date && (
            <>
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Осталось дней:</span>
                  <span className="font-semibold">{subscription.days_left}</span>
                </div>
                <Progress value={daysProgress} className="h-2" />
              </div>

              <div className="text-sm text-muted-foreground">
                Активна до: {new Date(subscription.end_date).toLocaleDateString('ru-RU')}
              </div>
            </>
          )}

          {subscription.status === 'expired' && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
              <Icon name="AlertCircle" className="inline mr-2" size={16} />
              Подписка истекла. Продлите для продолжения работы.
            </div>
          )}

          {subscription.status === 'active' && subscription.days_left < 7 && (
            <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-800">
              <Icon name="Clock" className="inline mr-2" size={16} />
              Подписка скоро истечет. Рекомендуем продлить заранее.
            </div>
          )}

          <div className="flex gap-2">
            <Button
              className="flex-1"
              variant={subscription.status === 'expired' ? 'default' : 'outline'}
              onClick={() => setShowRenewalDialog(true)}
            >
              <Icon name="RefreshCw" className="mr-2" size={16} />
              Продлить подписку
            </Button>
            
            {superAdmin && (
              <Button
                variant="secondary"
                onClick={() => {
                  setNewTariffId(subscription.tariff_id || 'basic');
                  setShowTariffDialog(true);
                }}
              >
                <Icon name="Settings" className="mr-2" size={16} />
                Сменить тариф
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showRenewalDialog} onOpenChange={setShowRenewalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Продление подписки</DialogTitle>
            <DialogDescription>
              Выберите период продления подписки
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="renewal_months">Количество месяцев</Label>
              <Input
                id="renewal_months"
                type="number"
                min="1"
                max="12"
                value={renewalMonths}
                onChange={(e) => setRenewalMonths(parseInt(e.target.value) || 1)}
              />
            </div>

            {!superAdmin && (
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Стоимость за месяц:</span>
                  <span className="font-semibold">{subscription.renewal_price.toLocaleString('ru-RU')} ₽</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Итого к оплате:</span>
                  <span className="text-xl font-bold">
                    {(subscription.renewal_price * renewalMonths).toLocaleString('ru-RU')} ₽
                  </span>
              </div>
            </div>
            )}

            {superAdmin && (
              <div className="bg-green-50 border border-green-200 rounded p-4 text-sm text-green-800">
                <Icon name="Shield" className="inline mr-2" size={16} />
                Режим суперадмина: продление без оплаты
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleRenewal} className="flex-1" disabled={isUpdating}>
                <Icon name={superAdmin ? "Check" : "CreditCard"} className="mr-2" size={16} />
                {superAdmin ? 'Продлить' : 'Перейти к оплате'}
              </Button>
              <Button variant="outline" onClick={() => setShowRenewalDialog(false)} disabled={isUpdating}>
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTariffDialog} onOpenChange={setShowTariffDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Смена тарифного плана</DialogTitle>
            <DialogDescription>
              Изменение тарифа без оплаты (режим суперадмина)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new_tariff">Новый тарифный план</Label>
              <Select value={newTariffId} onValueChange={setNewTariffId}>
                <SelectTrigger id="new_tariff">
                  <SelectValue placeholder="Выберите тариф" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Старт</SelectItem>
                  <SelectItem value="professional">Бизнес</SelectItem>
                  <SelectItem value="enterprise">Премиум</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded p-4 text-sm text-amber-800">
              <Icon name="AlertCircle" className="inline mr-2" size={16} />
              Смена тарифа произойдет без подтверждения оплаты. Изменения вступят в силу немедленно.
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleChangeTariff} 
                className="flex-1"
                disabled={isUpdating || !newTariffId}
              >
                {isUpdating ? (
                  <Icon name="Loader2" className="mr-2 animate-spin" size={16} />
                ) : (
                  <Icon name="Check" className="mr-2" size={16} />
                )}
                Применить
              </Button>
              <Button variant="outline" onClick={() => setShowTariffDialog(false)} disabled={isUpdating}>
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SubscriptionWidget;