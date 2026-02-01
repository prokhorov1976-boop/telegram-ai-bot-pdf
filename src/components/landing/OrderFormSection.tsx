import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import OrderFormFields from './OrderFormFields';
import PremiumTariffNotice from './PremiumTariffNotice';
import { BACKEND_URLS } from '@/components/hotel/types';

interface OrderFormSectionProps {
  selectedTariff?: string;
}

export const OrderFormSection = ({ selectedTariff }: OrderFormSectionProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    tariff: selectedTariff || 'basic',
    comment: ''
  });

  useEffect(() => {
    if (selectedTariff) {
      setFormData(prev => ({ ...prev, tariff: selectedTariff }));
    }
  }, [selectedTariff]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const tariffs = {
    basic: { name: 'Старт', price: 9975, description: 'Старт (9 975₽/мес)', renewal: 1975 },
    professional: { name: 'Бизнес', price: 19975, description: 'Бизнес (19 975₽/мес)', renewal: 4975 },
    enterprise: { name: 'Премиум', price: 49975, description: 'Премиум (49 975₽/мес)', renewal: 14975 }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.phone) {
      setError('Заполните email и телефон');
      return;
    }

    setIsLoading(true);

    try {
      const selectedTariff = tariffs[formData.tariff as keyof typeof tariffs];
      const tenantSlug = formData.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

      const response = await fetch(BACKEND_URLS.yookassaCreatePayment, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: selectedTariff.price,
          description: `Подписка ${selectedTariff.name} - ${formData.name || formData.email}`,
          return_url: `${window.location.origin}/payment/success`,
          metadata: {
            tenant_name: formData.name || formData.email.split('@')[0],
            tenant_slug: tenantSlug,
            owner_email: formData.email,
            owner_phone: formData.phone,
            tariff_id: formData.tariff,
            comment: formData.comment
          }
        })
      });

      const data = await response.json();

      if (response.ok && data.confirmation_url) {
        window.location.href = data.confirmation_url;
      } else {
        throw new Error(data.error || 'Не удалось создать платёж');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="order-form" className="bg-gradient-to-b from-white to-slate-50 py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block mb-4 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
              <p className="text-sm font-semibold text-green-700 flex items-center gap-2">
                <Icon name="Zap" size={16} />
                Запуск за 24 часа после оплаты
              </p>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Начните увеличивать продажи уже завтра
            </h2>
            <p className="text-xl text-slate-600">
              Заполните форму → Оплатите → Получите AI-консультанта
            </p>
          </div>
          <Card className="shadow-2xl border-2 border-primary/20">
            <CardContent className="pt-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <OrderFormFields
                formData={formData}
                setFormData={setFormData}
                tariffs={tariffs}
                error={error}
              />
              {formData.tariff === 'enterprise' && <PremiumTariffNotice />}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-6 text-lg font-semibold"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                    Создание платежа...
                  </>
                ) : (
                  <>
                    <Icon name="CreditCard" size={20} className="mr-2" />
                    Перейти к оплате {tariffs[formData.tariff as keyof typeof tariffs].price}₽
                  </>
                )}
              </Button>
              <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Icon name="Shield" size={16} className="text-green-600" />
                  <span>Безопасная оплата через ЮKassa</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="Clock" size={16} className="text-blue-600" />
                  <span>Доступ к системе в течение 30 секунд после оплаты</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="Mail" size={16} className="text-purple-600" />
                  <span>Логин и пароль придут на email</span>
                </div>
              </div>
            </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderFormSection;