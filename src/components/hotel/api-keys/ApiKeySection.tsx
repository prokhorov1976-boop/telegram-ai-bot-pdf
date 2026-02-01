import Icon from '@/components/ui/icon';
import { LucideIcon } from 'lucide-react';

interface ApiKeySectionProps {
  icon: string;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  title: string;
  description: string | React.ReactNode;
  children: React.ReactNode;
}

const ApiKeySection = ({
  icon,
  iconColor,
  bgColor,
  borderColor,
  title,
  description,
  children
}: ApiKeySectionProps) => {
  return (
    <div className="space-y-4">
      <div className={`${bgColor} border ${borderColor} rounded-lg p-4`}>
        <div className="flex items-start gap-2">
          <Icon name={icon} size={16} className={`${iconColor} mt-0.5`} />
          <div className="text-sm">
            <p className="font-medium mb-1">{title}</p>
            {typeof description === 'string' ? (
              <p className={iconColor.replace('text-', 'text-').replace('-600', '-800')}>{description}</p>
            ) : (
              description
            )}
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
};

export default ApiKeySection;
