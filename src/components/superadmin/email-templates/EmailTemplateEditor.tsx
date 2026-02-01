import { useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/lib/auth';
import Icon from '@/components/ui/icon';
import { BACKEND_URLS } from '../types';

interface EmailTemplate {
  id: number;
  template_key: string;
  subject: string;
  body: string;
  description: string;
  updated_at: string;
}

interface EmailTemplateEditorProps {
  template: EmailTemplate;
  onUpdate: (template: EmailTemplate) => void;
  onSaveSuccess: () => void;
  onShowPreview: () => void;
}

export const EmailTemplateEditor = ({ 
  template, 
  onUpdate, 
  onSaveSuccess,
  onShowPreview 
}: EmailTemplateEditorProps) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [showVariablesEditor, setShowVariablesEditor] = useState(false);
  const [testVariables, setTestVariables] = useState<Record<string, string>>({});
  const bodyInputRef = useRef<HTMLTextAreaElement>(null);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await authenticatedFetch(BACKEND_URLS.emailTemplates, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: template.id,
          subject: template.subject,
          body: template.body
        })
      });

      if (response.ok) {
        toast({
          title: 'Сохранено',
          description: 'Шаблон письма успешно обновлён'
        });
        onSaveSuccess();
      } else {
        throw new Error('Failed to save template');
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить шаблон',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail) {
      toast({
        title: 'Ошибка',
        description: 'Укажите email для отправки',
        variant: 'destructive'
      });
      return;
    }

    setIsSendingTest(true);
    try {
      const isSubscriptionReminder = template.template_key.startsWith('subscription_reminder_');
      
      const defaultData = isSubscriptionReminder 
        ? {
            tenant_name: 'Тестовый проект',
            tariff_name: 'Бизнес',
            renewal_price: '7990.00',
            renewal_url: 'https://example.com/content-editor?tenant_id=123'
          }
        : {
            email: 'test@example.com',
            password: 'demo123456',
            login_url: 'https://example.com/login'
          };
      
      const testData = Object.keys(testVariables).length > 0 
        ? { ...defaultData, ...testVariables }
        : defaultData;

      const response = await authenticatedFetch(BACKEND_URLS.emailTemplates, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          template_id: template.id,
          test_email: testEmail,
          test_data: testData
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Отправлено',
          description: `Тестовое письмо отправлено на ${testEmail}`
        });
      } else {
        throw new Error(data.error || 'Failed to send test email');
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось отправить тестовое письмо',
        variant: 'destructive'
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = bodyInputRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = template.body;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newText = before + `{{ ${variable} }}` + after;
      
      onUpdate({ ...template, body: newText });
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length + 6, start + variable.length + 6);
      }, 0);
    }
  };

  const getAvailableVariables = () => {
    if (template.template_key.startsWith('subscription_reminder_')) {
      return ['tenant_name', 'tariff_name', 'renewal_price', 'renewal_url'];
    }
    return ['email', 'password', 'login_url', 'tariff_name'];
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Редактирование: {template.template_key}</CardTitle>
        <CardDescription>{template.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Тема письма</Label>
          <Input
            value={template.subject}
            onChange={(e) => onUpdate({ ...template, subject: e.target.value })}
            placeholder="Тема письма"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Текст письма (HTML)</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={onShowPreview}
            >
              <Icon name="Eye" size={14} className="mr-1" />
              Предпросмотр
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-2">
            {getAvailableVariables().map((variable) => (
              <Button
                key={variable}
                variant="secondary"
                size="sm"
                onClick={() => insertVariable(variable)}
              >
                <Icon name="Plus" size={12} className="mr-1" />
                {variable}
              </Button>
            ))}
          </div>
          
          <Textarea
            ref={bodyInputRef}
            value={template.body}
            onChange={(e) => onUpdate({ ...template, body: e.target.value })}
            placeholder="HTML код письма"
            rows={15}
            className="font-mono text-sm"
          />
          <p className="text-xs text-slate-500">
            Нажмите на переменную выше, чтобы вставить её в нужное место
          </p>
        </div>

        <div className="flex gap-4">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Icon name="Loader2" className="animate-spin mr-2" size={16} />
                Сохранение...
              </>
            ) : (
              <>
                <Icon name="Save" size={16} className="mr-2" />
                Сохранить
              </>
            )}
          </Button>
        </div>

        <div className="border-t pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <Label>Отправить тестовое письмо</Label>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowVariablesEditor(!showVariablesEditor)}
            >
              <Icon name="Settings" size={14} className="mr-1" />
              Настроить переменные
            </Button>
          </div>

          {showVariablesEditor && (
            <div className="bg-slate-50 p-4 rounded-lg space-y-3">
              <p className="text-sm text-slate-600">Укажите тестовые значения для переменных:</p>
              {getAvailableVariables().map((variable) => (
                <div key={variable} className="space-y-1">
                  <Label className="text-xs">{variable}</Label>
                  <Input
                    value={testVariables[variable] || ''}
                    onChange={(e) => setTestVariables({ ...testVariables, [variable]: e.target.value })}
                    placeholder={`Значение для {{ ${variable} }}`}
                    size={1}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Email для теста"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleSendTest} 
              disabled={isSendingTest || !testEmail}
              variant="secondary"
            >
              {isSendingTest ? (
                <>
                  <Icon name="Loader2" className="animate-spin mr-2" size={16} />
                  Отправка...
                </>
              ) : (
                <>
                  <Icon name="Send" size={16} className="mr-2" />
                  Отправить тест
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
