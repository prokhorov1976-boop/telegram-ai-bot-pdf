import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/lib/auth';
import Icon from '@/components/ui/icon';
import { BACKEND_URLS } from './types';
import { EmailTemplatesList } from './email-templates/EmailTemplatesList';
import { EmailTemplateEditor } from './email-templates/EmailTemplateEditor';
import { EmailTemplateCreator } from './email-templates/EmailTemplateCreator';
import { EmailTemplatePreviewDialog } from './email-templates/EmailTemplatePreviewDialog';

interface EmailTemplate {
  id: number;
  template_key: string;
  subject: string;
  body: string;
  description: string;
  updated_at: string;
}

export const EmailTemplatesTab = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      console.log('Loading templates from:', BACKEND_URLS.emailTemplates);
      const response = await authenticatedFetch(BACKEND_URLS.emailTemplates);
      console.log('Response received:', response.status, response.ok);
      if (response.ok) {
        const data = await response.json();
        console.log('Data received:', data);
        setTemplates(data.templates || []);
        if (data.templates.length > 0 && !selectedTemplate) {
          setSelectedTemplate(data.templates[0]);
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Server error:', response.status, errorData);
        toast({
          title: 'Ошибка сервера',
          description: errorData.error || `Статус: ${response.status}`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось загрузить шаблоны',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTemplate = (template: EmailTemplate | null) => {
    setSelectedTemplate(template);
    setIsCreating(false);
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setSelectedTemplate(null);
  };

  const handleCreatorCancel = () => {
    setIsCreating(false);
  };

  const handleCreatorSuccess = () => {
    setIsCreating(false);
    loadTemplates();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Icon name="Loader2" className="animate-spin mx-auto mb-2" size={32} />
          <p className="text-slate-600">Загрузка шаблонов...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <EmailTemplatesList
          templates={templates}
          selectedTemplate={selectedTemplate}
          onSelectTemplate={handleSelectTemplate}
          onCreateNew={handleCreateNew}
        />

        {isCreating && (
          <EmailTemplateCreator
            onCancel={handleCreatorCancel}
            onSuccess={handleCreatorSuccess}
          />
        )}

        {selectedTemplate && !isCreating && (
          <EmailTemplateEditor
            template={selectedTemplate}
            onUpdate={setSelectedTemplate}
            onSaveSuccess={loadTemplates}
            onShowPreview={() => setShowPreview(true)}
          />
        )}
      </div>

      <EmailTemplatePreviewDialog
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        template={selectedTemplate}
      />
    </>
  );
};
