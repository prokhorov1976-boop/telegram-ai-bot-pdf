import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { BACKEND_URLS } from '@/components/hotel/types';

interface TariffPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  setup_fee: number;
  renewal_price: number;
  first_month_included: boolean;
  features: string[];
  is_popular?: boolean;
  is_active?: boolean;
}

const PaymentPage = () => {
  const [tariffs, setTariffs] = useState<TariffPlan[]>([]);
  const [selectedTariff, setSelectedTariff] = useState<string>('professional');
  const [formData, setFormData] = useState({
    tenant_name: '',
    tenant_slug: '',
    owner_email: '',
    owner_phone: ''
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [requiresFz152, setRequiresFz152] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTariffs, setIsLoadingTariffs] = useState(true);
  const { toast} = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadTariffs();
  }, []);

  const loadTariffs = async () => {
    try {
      const response = await fetch(`${BACKEND_URLS.tariffManagement}?action=tariffs`);
      const data = await response.json();
      const activeTariffs = (data.tariffs || []).filter((t: TariffPlan) => t.is_active);
      setTariffs(activeTariffs);
      if (activeTariffs.length > 0) {
        const popular = activeTariffs.find((t: TariffPlan) => t.is_popular);
        setSelectedTariff(popular?.id || activeTariffs[0].id);
      }
    } catch (error) {
      console.error('Error loading tariffs:', error);
      toast({ title: 'Ошибка', description: 'Не удалось загрузить тарифы', variant: 'destructive' });
    } finally {
      setIsLoadingTariffs(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tenant_name || !formData.owner_email) {
      toast({
        title: 'Ошибка',
        description: 'Заполните обязательные поля',
        variant: 'destructive'
      });
      return;
    }

    if (!agreedToTerms || !agreedToPrivacy) {
      toast({
        title: 'Ошибка',
        description: 'Необходимо согласие с условиями и политикой конфиденциальности',
        variant: 'destructive'
      });
      return;
    }

    const selectedPlan = tariffs.find(t => t.id === selectedTariff);
    if (!selectedPlan) return;

    setIsLoading(true);

    try {
      const slug = formData.tenant_slug || formData.tenant_name.toLowerCase()
        .replace(/[^а-яa-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      // Расчет первого платежа:
      // Если first_month_included=true: первый платеж = setup_fee (первый месяц уже включен)
      // Если first_month_included=false: первый платеж = setup_fee + renewal_price
      const firstPaymentAmount = selectedPlan.first_month_included 
        ? selectedPlan.setup_fee 
        : selectedPlan.setup_fee + selectedPlan.renewal_price;

      const paymentData = {
        amount: firstPaymentAmount,
        description: `Подписка "${selectedPlan.name}" для ${formData.tenant_name}`,
        metadata: {
          tenant_name: formData.tenant_name,
          tenant_slug: slug,
          owner_email: formData.owner_email,
          owner_phone: formData.owner_phone,
          tariff_id: selectedTariff,
          tariff_name: selectedPlan.name,
          first_month_included: selectedPlan.first_month_included,
          requires_fz152: requiresFz152
        }
      };

      const response = await fetch(BACKEND_URLS.yookassaCreatePayment, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });

      const data = await response.json();

      if (data.confirmation_url) {
        window.location.href = data.confirmation_url;
      } else {
        throw new Error('Не получен URL для оплаты');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось создать платеж',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = () => {
    if (formData.tenant_name) {
      const slug = formData.tenant_name.toLowerCase()
        .replace(/[^а-яa-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData({ ...formData, tenant_slug: slug });
    }
  };

  if (isLoadingTariffs) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Icon name="Loader2" className="animate-spin" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Выберите тариф</h1>
          <p className="text-lg text-muted-foreground">
            Начните использовать AI-консультанта для вашего бизнеса уже сегодня
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {tariffs.map((tariff) => (
            <Card
              key={tariff.id}
              className={`relative cursor-pointer transition-all hover:shadow-lg ${
                selectedTariff === tariff.id ? 'ring-2 ring-primary' : ''
              } ${tariff.is_popular ? 'border-primary' : ''}`}
              onClick={() => setSelectedTariff(tariff.id)}
            >
              {tariff.is_popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                    Популярный
                  </span>
                </div>
              )}
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-2xl">{tariff.name}</CardTitle>
                  <RadioGroup value={selectedTariff} onValueChange={setSelectedTariff}>
                    <RadioGroupItem value={tariff.id} />
                  </RadioGroup>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{tariff.price.toLocaleString('ru-RU')}</span>
                  <span className="text-muted-foreground">₽</span>
                  <span className="text-sm text-muted-foreground">/ {tariff.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {tariff.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Icon name="Check" size={16} className="text-green-600 mt-1 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Данные для регистрации</CardTitle>
            <CardDescription>
              После оплаты на указанный email придет письмо с доступами к системе
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="tenant_name">
                  Название вашей компании <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tenant_name"
                  value={formData.tenant_name}
                  onChange={(e) => setFormData({ ...formData, tenant_name: e.target.value })}
                  placeholder="Моя Компания"
                  required
                />
              </div>

              <div>
                <Label htmlFor="tenant_slug">Slug (техническое название)</Label>
                <div className="flex gap-2">
                  <Input
                    id="tenant_slug"
                    value={formData.tenant_slug}
                    onChange={(e) => setFormData({ ...formData, tenant_slug: e.target.value })}
                    placeholder="my-business"
                  />
                  <Button type="button" variant="outline" onClick={generateSlug}>
                    <Icon name="Wand2" size={16} />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Если не заполнено, сгенерируется автоматически из названия
                </p>
              </div>

              <div>
                <Label htmlFor="owner_email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="owner_email"
                  type="email"
                  value={formData.owner_email}
                  onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                  placeholder="admin@company.ru"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  На этот email придут доступы к системе
                </p>
              </div>

              <div>
                <Label htmlFor="owner_phone">Телефон</Label>
                <Input
                  id="owner_phone"
                  type="tel"
                  value={formData.owner_phone}
                  onChange={(e) => setFormData({ ...formData, owner_phone: e.target.value })}
                  placeholder="+7 (999) 123-45-67"
                />
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-start gap-3">
                  <Checkbox 
                    id="agree_privacy" 
                    checked={agreedToPrivacy}
                    onCheckedChange={(checked) => setAgreedToPrivacy(checked as boolean)}
                  />
                  <Label htmlFor="agree_privacy" className="text-sm leading-relaxed cursor-pointer">
                    Я согласен(на) на обработку персональных данных в соответствии с{' '}
                    <Link to="/privacy-policy" target="_blank" className="text-blue-600 hover:underline">
                      Политикой конфиденциальности
                    </Link>
                  </Label>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox 
                    id="agree_terms" 
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                  />
                  <Label htmlFor="agree_terms" className="text-sm leading-relaxed cursor-pointer">
                    Я принимаю условия{' '}
                    <Link to="/terms-of-service" target="_blank" className="text-blue-600 hover:underline">
                      Пользовательского соглашения
                    </Link>
                  </Label>
                </div>

                {(selectedTariff === 'professional' || selectedTariff === 'enterprise') && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox 
                        id="requires_fz152" 
                        checked={requiresFz152}
                        onCheckedChange={(checked) => setRequiresFz152(checked as boolean)}
                      />
                      <Label htmlFor="requires_fz152" className="text-sm leading-relaxed cursor-pointer">
                        <span className="font-semibold text-amber-900">Я буду обрабатывать персональные данные клиентов</span>
                        <p className="text-xs text-amber-800 mt-1">
                          При выборе этой опции вам потребуется использовать собственный API ключ YandexGPT для соответствия 152-ФЗ. 
                          Будут активированы специальные настройки безопасности и логирование согласий.
                        </p>
                      </Label>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-lg font-semibold">Итого к оплате:</span>
                  <span className="text-2xl font-bold">
                    {tariffs.find(t => t.id === selectedTariff)?.price.toLocaleString('ru-RU')} ₽
                  </span>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading || !agreedToTerms || !agreedToPrivacy}>
                  {isLoading ? (
                    <>
                      <Icon name="Loader2" className="animate-spin mr-2" size={20} />
                      Переход к оплате...
                    </>
                  ) : (
                    <>
                      <Icon name="CreditCard" className="mr-2" size={20} />
                      Перейти к оплате
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground mt-4">
                  Нажимая кнопку, вы соглашаетесь с условиями оферты и политикой конфиденциальности
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="max-w-2xl mx-auto mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Оплата защищена ЮKassa. Принимаем банковские карты, Apple Pay, Google Pay
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;