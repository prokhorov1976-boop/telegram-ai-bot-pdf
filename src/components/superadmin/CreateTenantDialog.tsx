import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';
import { Tariff } from './types';

interface CreateTenantDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tariffs: Tariff[];
}

export const CreateTenantDialog = ({ isOpen, onClose, onSuccess, tariffs }: CreateTenantDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{username: string; password: string; login_url: string} | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    owner_email: '',
    owner_phone: '',
    tariff_id: 'basic',
    subscription_months: 1
  });
  const [fz152Enabled, setFz152Enabled] = useState(false);

  const handleCreate = async () => {
    if (!formData.name || !formData.slug || !formData.owner_email) {
      alert('Заполните обязательные поля: Название, Slug, Email');
      return;
    }

    setIsLoading(true);
    try {
      const { authenticatedFetch } = await import('@/lib/auth');
      const { BACKEND_URLS } = await import('./types');
      
      const response = await authenticatedFetch(BACKEND_URLS.tenants, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, fz152_enabled: fz152Enabled })
      });

      if (response.ok) {
        const data = await response.json();
        setResult({
          username: data.username,
          password: data.password,
          login_url: data.login_url
        });
        onSuccess();
      } else {
        const error = await response.json();
        alert(`Ошибка: ${error.error || 'Не удалось создать клиента'}`);
      }
    } catch (error) {
      console.error('Error creating tenant:', error);
      alert('Ошибка при создании клиента');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      slug: '',
      owner_email: '',
      owner_phone: '',
      tariff_id: 'basic',
      subscription_months: 1
    });
    setFz152Enabled(false);
    setResult(null);
    onClose();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Создать нового клиента</DialogTitle>
          <DialogDescription>
            Создание тенанта вручную без оплаты (для тестов, подарков, VIP-клиентов)
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Название бота *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Мой AI Бот"
              />
            </div>

            <div>
              <Label htmlFor="slug">Slug (для URL) *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                placeholder="my-bot"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Только латиница, цифры и дефисы. Используется в URL
              </p>
            </div>

            <div>
              <Label htmlFor="email">Email владельца *</Label>
              <Input
                id="email"
                type="email"
                value={formData.owner_email}
                onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                placeholder="owner@example.com"
              />
            </div>

            <div>
              <Label htmlFor="phone">Телефон владельца</Label>
              <Input
                id="phone"
                value={formData.owner_phone}
                onChange={(e) => setFormData({ ...formData, owner_phone: e.target.value })}
                placeholder="+7 999 123-45-67"
              />
            </div>

            <div>
              <Label htmlFor="tariff">Тариф</Label>
              <Select value={formData.tariff_id} onValueChange={(value) => setFormData({ ...formData, tariff_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тариф" />
                </SelectTrigger>
                <SelectContent>
                  {tariffs.map(tariff => (
                    <SelectItem key={tariff.id} value={tariff.id}>
                      {tariff.name} ({tariff.renewal_price} ₽/мес)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="months">Период подписки (месяцев)</Label>
              <Input
                id="months"
                type="number"
                min="1"
                max="12"
                value={formData.subscription_months}
                onChange={(e) => setFormData({ ...formData, subscription_months: parseInt(e.target.value) || 1 })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                На сколько месяцев выдать доступ (1-12)
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Checkbox 
                  id="fz152_enabled" 
                  checked={fz152Enabled}
                  onCheckedChange={(checked) => setFz152Enabled(checked as boolean)}
                />
                <Label htmlFor="fz152_enabled" className="cursor-pointer">
                  <span className="font-semibold text-amber-900">Клиент будет обрабатывать персональные данные (152-ФЗ)</span>
                  <p className="text-xs text-amber-800 mt-1">
                    При активации будут доступны: вкладка "152-ФЗ", настройки согласий, настройки AI с YandexGPT, логирование обработки данных
                  </p>
                </Label>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleCreate} disabled={isLoading} className="flex-1">
                {isLoading ? 'Создание...' : 'Создать клиента'}
              </Button>
              <Button variant="outline" onClick={handleClose}>
                Отмена
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Icon name="CheckCircle2" className="text-green-600" size={24} />
                <h3 className="font-semibold text-green-900">Клиент успешно создан!</h3>
              </div>
              
              <div className="space-y-3 text-sm">
                <div>
                  <Label className="text-slate-600">Логин</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input value={result.username} readOnly className="bg-white" />
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(result.username)}>
                      <Icon name="Copy" size={14} />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-slate-600">Пароль</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input value={result.password} readOnly className="bg-white" />
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(result.password)}>
                      <Icon name="Copy" size={14} />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-slate-600">Ссылка для входа</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input value={result.login_url} readOnly className="bg-white text-xs" />
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(result.login_url)}>
                      <Icon name="Copy" size={14} />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-green-200">
                <p className="text-xs text-slate-600">
                  ⚠️ <strong>Сохраните эти данные!</strong> Пароль больше не будет показан.
                  Отправьте логин и пароль клиенту для входа в админ-панель.
                </p>
              </div>
            </div>

            <Button onClick={handleClose} className="w-full">
              Готово
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};