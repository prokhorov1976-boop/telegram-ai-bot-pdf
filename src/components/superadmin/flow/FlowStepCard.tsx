import Icon from '@/components/ui/icon';
import { LucideIcon } from 'lucide-react';

interface FlowStepCardProps {
  stepNumber: number;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'indigo' | 'pink' | 'amber' | 'rose';
  icon: string;
  title: string;
  children: React.ReactNode;
}

const colorClasses = {
  blue: {
    border: 'border-blue-500',
    bg: 'bg-blue-500',
    contentBg: 'bg-blue-50',
    contentBorder: 'border-blue-200',
    title: 'text-blue-900'
  },
  green: {
    border: 'border-green-500',
    bg: 'bg-green-500',
    contentBg: 'bg-green-50',
    contentBorder: 'border-green-200',
    title: 'text-green-900'
  },
  yellow: {
    border: 'border-yellow-500',
    bg: 'bg-yellow-500',
    contentBg: 'bg-yellow-50',
    contentBorder: 'border-yellow-200',
    title: 'text-yellow-900'
  },
  purple: {
    border: 'border-purple-500',
    bg: 'bg-purple-500',
    contentBg: 'bg-purple-50',
    contentBorder: 'border-purple-200',
    title: 'text-purple-900'
  },
  indigo: {
    border: 'border-indigo-500',
    bg: 'bg-indigo-500',
    contentBg: 'bg-indigo-50',
    contentBorder: 'border-indigo-200',
    title: 'text-indigo-900'
  },
  pink: {
    border: 'border-pink-500',
    bg: 'bg-pink-500',
    contentBg: 'bg-pink-50',
    contentBorder: 'border-pink-200',
    title: 'text-pink-900'
  },
  amber: {
    border: 'border-amber-500',
    bg: 'bg-amber-500',
    contentBg: 'bg-amber-50',
    contentBorder: 'border-amber-200',
    title: 'text-amber-900'
  },
  rose: {
    border: 'border-rose-500',
    bg: 'bg-rose-500',
    contentBg: 'bg-rose-50',
    contentBorder: 'border-rose-200',
    title: 'text-rose-900'
  }
};

const FlowStepCard = ({ stepNumber, color, icon, title, children }: FlowStepCardProps) => {
  const colors = colorClasses[color];
  
  return (
    <div className={`relative pl-8 pb-8 border-l-4 ${colors.border}`}>
      <div className={`absolute -left-4 top-0 w-8 h-8 ${colors.bg} rounded-full flex items-center justify-center text-white font-bold shadow-lg`}>
        {stepNumber}
      </div>
      <div className={`${colors.contentBg} p-6 rounded-lg border-2 ${colors.contentBorder}`}>
        <h3 className={`text-xl font-bold ${colors.title} mb-3 flex items-center gap-2`}>
          <Icon name={icon} size={20} />
          {title}
        </h3>
        <div className="space-y-2 text-sm">
          {children}
        </div>
      </div>
    </div>
  );
};

export default FlowStepCard;
