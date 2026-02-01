import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface UpgradeCardProps {
  feature: string;
}

const UpgradeCard = ({ feature }: UpgradeCardProps) => (
  <Card className="border-amber-500 bg-amber-50">
    <CardContent className="py-8 text-center">
      <Icon name="Lock" size={32} className="mx-auto text-amber-600 mb-3" />
      <h3 className="text-lg font-semibold text-amber-900 mb-2">
        Недоступно в вашем тарифе
      </h3>
      <p className="text-sm text-amber-800 mb-4">
        {feature} доступен в тарифах Бизнес и Премиум
      </p>
      <a 
        href="/#pricing" 
        className="inline-flex items-center gap-2 text-sm font-medium text-amber-900 hover:underline"
      >
        <Icon name="ArrowUpRight" size={16} />
        Сравнить тарифы
      </a>
    </CardContent>
  </Card>
);

export default UpgradeCard;
