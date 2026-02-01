import Icon from '@/components/ui/icon';

interface OrderFormFieldsProps {
  formData: {
    name: string;
    email: string;
    phone: string;
    tariff: string;
    comment: string;
  };
  setFormData: (data: any) => void;
  tariffs: {
    [key: string]: { name: string; price: number; description: string; renewal: number };
  };
  error: string;
}

const OrderFormFields = ({ formData, setFormData, tariffs, error }: OrderFormFieldsProps) => {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Ваше имя (необязательно)
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Иван Иванов"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Email *
        </label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="ivan@example.com"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Телефон *
        </label>
        <input
          type="tel"
          required
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="+7 999 123-45-67"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Тариф
        </label>
        <select 
          value={formData.tariff}
          onChange={(e) => setFormData({ ...formData, tariff: e.target.value })}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="basic">{tariffs.basic.description} + продление 1975₽/мес</option>
          <option value="professional">{tariffs.professional.description} + продление 4975₽/мес</option>
          <option value="enterprise">{tariffs.enterprise.description} + продление 14975₽/мес</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Комментарий (опционально)
        </label>
        <textarea
          value={formData.comment}
          onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent min-h-[100px]"
          placeholder="Расскажите о вашем проекте..."
        />
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
          {error}
        </div>
      )}
    </>
  );
};

export default OrderFormFields;
