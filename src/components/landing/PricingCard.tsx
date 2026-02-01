import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface PricingFeature {
  text: string;
  included: boolean;
}

interface PricingCardProps {
  badge?: string;
  badgeStyle?: string;
  title: string;
  description: string;
  price: string;
  priceColor?: string;
  setupText: string;
  renewalPrice: string;
  features: PricingFeature[];
  buttonVariant?: 'default' | 'outline';
  onSelect: () => void;
  isPopular?: boolean;
  popularBadge?: string;
  hoverEffect?: string;
  borderStyle?: string;
}

const PricingCard = ({
  badge,
  badgeStyle = 'bg-blue-50 text-primary',
  title,
  description,
  price,
  priceColor = 'text-slate-900',
  setupText,
  renewalPrice,
  features,
  buttonVariant = 'outline',
  onSelect,
  isPopular = false,
  popularBadge,
  hoverEffect = 'hover:shadow-xl hover:-translate-y-1',
  borderStyle = ''
}: PricingCardProps) => {
  return (
    <Card className={`transition-all ${hoverEffect} ${borderStyle} ${isPopular ? 'relative overflow-hidden' : ''}`}>
      {isPopular && popularBadge && (
        <div className="absolute top-0 right-0 bg-gradient-to-l from-primary to-blue-600 text-white px-6 py-2 text-sm font-bold">
          {popularBadge}
        </div>
      )}
      <CardContent className={isPopular ? 'pt-12' : 'pt-8'}>
        {badge && (
          <div className={`${badgeStyle} inline-block px-3 py-1 rounded-full mb-3`}>
            <span className="text-xs font-semibold">{badge}</span>
          </div>
        )}
        <h3 className="text-3xl font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-600 mb-4">{description}</p>
        <div className="mb-6">
          <div className="flex items-baseline gap-2">
            <span className={`text-5xl font-bold ${priceColor}`}>{price}</span>
            <span className="text-2xl text-slate-600">₽</span>
          </div>
          <div className="text-sm text-slate-500">{setupText}</div>
          <div className="text-lg font-semibold text-green-600 mt-1">{renewalPrice}</div>
        </div>
        <ul className="space-y-3 mb-6">
          {features.map((feature, index) => (
            <li key={index} className={`flex items-center gap-2 ${feature.included ? 'text-slate-600' : 'text-slate-500'}`}>
              <Icon 
                name={feature.included ? 'Check' : 'X'} 
                size={20} 
                className={feature.included ? 'text-green-600' : 'text-slate-400'} 
              />
              {feature.text}
            </li>
          ))}
        </ul>
        <Button className="w-full" variant={buttonVariant} onClick={onSelect}>
          Выбрать
        </Button>
      </CardContent>
    </Card>
  );
};

export default PricingCard;
