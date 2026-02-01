import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { QuickQuestion, PageSettings } from './types';

interface SidebarInfoProps {
  quickQuestions: QuickQuestion[];
  pageSettings?: PageSettings;
  isLoading: boolean;
  onQuickQuestion: (question: string) => void;
}

const SidebarInfo = ({
  quickQuestions,
  pageSettings,
  isLoading,
  onQuickQuestion
}: SidebarInfoProps) => {
  return (
    <div className="space-y-6">
      <Card className="shadow-xl animate-scale-in" style={{ animationDelay: '0.1s' }}>
        <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-blue-50">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Icon name="Lightbulb" size={18} />
            {pageSettings?.quick_questions_title || 'Быстрые вопросы'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-2">
            {quickQuestions.map((q, idx) => (
              <Button
                key={idx}
                variant="outline"
                className="h-auto py-3 px-3 flex flex-col items-center gap-2 hover:bg-blue-50 hover:border-primary transition-all"
                onClick={() => onQuickQuestion(q.question)}
                disabled={isLoading}
              >
                <Icon name={q.icon as any} size={20} className="text-primary" />
                <span className="text-xs font-medium text-center">{q.text}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {pageSettings?.public_description && (
        <Card className="shadow-xl animate-scale-in" style={{ animationDelay: '0.15s' }}>
          <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-blue-50">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Icon name="FileText" size={18} />
              О нас
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{pageSettings.public_description}</p>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-xl animate-scale-in" style={{ animationDelay: '0.2s' }}>
        <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-blue-50">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Icon name="Info" size={18} />
            {pageSettings?.contacts_title || 'Контакты'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Icon name="Phone" size={16} className="text-primary" />
            </div>
            <div>
              <p className="font-medium text-slate-900">{pageSettings?.contact_phone_label || 'Ресепшн'}</p>
              <p className="text-slate-600">{pageSettings?.contact_phone_value || '+7 (495) 123-45-67'}</p>
            </div>
          </div>
          {pageSettings?.contact_email_value && (
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Icon name="Mail" size={16} className="text-green-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">{pageSettings?.contact_email_label || 'Email'}</p>
                <p className="text-slate-600">{pageSettings.contact_email_value}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Icon name="MapPin" size={16} className="text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">{pageSettings?.contact_address_label || 'Адрес'}</p>
              <p className="text-slate-600">{pageSettings?.contact_address_value || 'Москва, ул. Примерная, 1'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SidebarInfo;