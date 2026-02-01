import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/lib/auth';
import Icon from '@/components/ui/icon';
import { BACKEND_URLS } from '../types';

interface EmailTemplateCreatorProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export const EmailTemplateCreator = ({ onCancel, onSuccess }: EmailTemplateCreatorProps) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ 
    template_key: '', 
    subject: '', 
    body: '', 
    description: '' 
  });

  const handleCreate = async () => {
    setIsSaving(true);
    try {
      const response = await authenticatedFetch(BACKEND_URLS.emailTemplates, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          ...newTemplate
        })
      });

      if (response.ok) {
        toast({
          title: 'Создано',
          description: 'Новый шаблон успешно создан'
        });
        setNewTemplate({ template_key: '', subject: '', body: '', description: '' });
        onSuccess();
      } else {
        throw new Error('Failed to create template');
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать шаблон',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Создание нового шаблона</CardTitle>
        <CardDescription>Добавьте новый email-шаблон для рассылок</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Ключ шаблона (латиница, нижнее_подчёркивание)</Label>
          <Input
            value={newTemplate.template_key}
            onChange={(e) => setNewTemplate({ ...newTemplate, template_key: e.target.value })}
            placeholder="subscription_renewal"
          />
        </div>

        <div className="space-y-2">
          <Label>Описание</Label>
          <Input
            value={newTemplate.description}
            onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
            placeholder="Письмо о продлении подписки"
          />
        </div>

        <div className="space-y-2">
          <Label>Тема письма</Label>
          <Input
            value={newTemplate.subject}
            onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
            placeholder="Напоминание о продлении подписки"
          />
        </div>

        <div className="space-y-2">
          <Label>Текст письма (HTML)</Label>
          <Textarea
            value={newTemplate.body}
            onChange={(e) => setNewTemplate({ ...newTemplate, body: e.target.value })}
            placeholder="<h1>Здравствуйте!</h1><p>Ваша подписка истекает...</p>"
            rows={15}
            className="font-mono text-sm"
          />
        </div>

        <div className="flex gap-4">
          <Button 
            onClick={handleCreate}
            disabled={isSaving || !newTemplate.template_key || !newTemplate.subject || !newTemplate.body}
          >
            {isSaving ? (
              <>
                <Icon name="Loader2" className="animate-spin mr-2" size={16} />
                Создание...
              </>
            ) : (
              <>
                <Icon name="Plus" size={16} className="mr-2" />
                Создать шаблон
              </>
            )}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Отмена
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
