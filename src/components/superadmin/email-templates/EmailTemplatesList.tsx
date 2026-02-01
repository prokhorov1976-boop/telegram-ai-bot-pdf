import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface EmailTemplate {
  id: number;
  template_key: string;
  subject: string;
  body: string;
  description: string;
  updated_at: string;
}

interface EmailTemplatesListProps {
  templates: EmailTemplate[];
  selectedTemplate: EmailTemplate | null;
  onSelectTemplate: (template: EmailTemplate | null) => void;
  onCreateNew: () => void;
}

export const EmailTemplatesList = ({ 
  templates, 
  selectedTemplate, 
  onSelectTemplate,
  onCreateNew 
}: EmailTemplatesListProps) => {
  return (
    <Card className="lg:col-span-1 flex flex-col max-h-[calc(100vh-12rem)]">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Шаблоны писем</CardTitle>
        <CardDescription>Выберите шаблон для редактирования</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start border-dashed"
            onClick={onCreateNew}
          >
            <Icon name="Plus" size={16} className="mr-2" />
            Создать новый шаблон
          </Button>
          {templates.map((template) => (
            <Button
              key={template.id}
              variant={selectedTemplate?.id === template.id ? 'default' : 'outline'}
              className="w-full justify-start h-auto py-3"
              onClick={() => onSelectTemplate(template)}
            >
              <Icon name="Mail" size={16} className="mr-2 flex-shrink-0" />
              <div className="text-left flex-1 min-w-0">
                <div className="font-medium truncate">{template.template_key}</div>
                <div className="text-xs opacity-70 line-clamp-2">{template.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};