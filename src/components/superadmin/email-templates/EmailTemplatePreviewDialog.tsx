import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface EmailTemplate {
  id: number;
  template_key: string;
  subject: string;
  body: string;
  description: string;
  updated_at: string;
}

interface EmailTemplatePreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  template: EmailTemplate | null;
}

export const EmailTemplatePreviewDialog = ({ 
  isOpen, 
  onClose, 
  template 
}: EmailTemplatePreviewDialogProps) => {
  const [previewMode, setPreviewMode] = useState<'code' | 'visual'>('visual');
  const [testVariables, setTestVariables] = useState<Record<string, string>>({});

  const getAvailableVariables = () => {
    if (!template) return [];
    
    if (template.template_key.startsWith('subscription_reminder_')) {
      return ['tenant_name', 'tariff_name', 'renewal_price', 'renewal_url'];
    }
    return ['email', 'password', 'login_url', 'tariff_name'];
  };

  const renderPreview = () => {
    if (!template) return { html: '', subject: '' };
    
    const testData = template.template_key.startsWith('subscription_reminder_') 
      ? {
          tenant_name: testVariables.tenant_name || 'Тестовый проект',
          tariff_name: testVariables.tariff_name || 'Бизнес',
          renewal_price: testVariables.renewal_price || '7990.00',
          renewal_url: testVariables.renewal_url || 'https://example.com/content-editor?tenant_id=123'
        }
      : {
          email: testVariables.email || 'test@example.com',
          password: testVariables.password || 'demo123456',
          login_url: testVariables.login_url || 'https://example.com/admin-login',
          tariff_name: testVariables.tariff_name || 'Базовый'
        };
    
    let html = template.body;
    let subject = template.subject;
    
    Object.entries(testData).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      html = html.replace(regex, value);
      subject = subject.replace(regex, value);
    });
    
    return { html, subject };
  };

  const preview = renderPreview();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Предпросмотр шаблона</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-semibold">Тема письма:</Label>
            <p className="text-sm text-slate-700 mt-1">{preview.subject}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Тестовые переменные (опционально):</Label>
            <div className="grid grid-cols-2 gap-3">
              {getAvailableVariables().map((variable) => (
                <div key={variable}>
                  <Label className="text-xs text-slate-600">{variable}</Label>
                  <Input
                    size={1}
                    value={testVariables[variable] || ''}
                    onChange={(e) => setTestVariables({ ...testVariables, [variable]: e.target.value })}
                    placeholder={`Значение для ${variable}`}
                    className="text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as 'code' | 'visual')}>
            <TabsList>
              <TabsTrigger value="visual">
                <Icon name="Eye" size={14} className="mr-1" />
                Визуальный
              </TabsTrigger>
              <TabsTrigger value="code">
                <Icon name="Code" size={14} className="mr-1" />
                HTML код
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="visual">
              <div className="border rounded-lg p-4 bg-white">
                <div dangerouslySetInnerHTML={{ __html: preview.html }} />
              </div>
            </TabsContent>
            
            <TabsContent value="code">
              <pre className="border rounded-lg p-4 bg-slate-50 text-xs overflow-x-auto">
                <code>{preview.html}</code>
              </pre>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
