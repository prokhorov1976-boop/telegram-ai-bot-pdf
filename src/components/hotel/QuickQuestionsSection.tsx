import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import IconPicker from './IconPicker';
import { QuickQuestion } from './types';

interface QuickQuestionsSectionProps {
  title: string;
  questions: QuickQuestion[];
  onTitleChange: (title: string) => void;
  onAddQuestion: () => void;
  onRemoveQuestion: (index: number) => void;
  onUpdateQuestion: (index: number, field: keyof QuickQuestion, value: string) => void;
}

export const QuickQuestionsSection = ({
  title,
  questions,
  onTitleChange,
  onAddQuestion,
  onRemoveQuestion,
  onUpdateQuestion
}: QuickQuestionsSectionProps) => {
  return (
    <div className="border-b pb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900">Быстрые вопросы</h3>
        <Button type="button" size="sm" variant="outline" onClick={onAddQuestion}>
          <Icon name="Plus" size={14} className="mr-1" />
          Добавить
        </Button>
      </div>
      <div className="space-y-3">
        <div>
          <Label>Заголовок секции</Label>
          <Input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Быстрые вопросы"
          />
        </div>
        <div className="space-y-3">
          {questions.map((q, index) => (
            <div key={index} className="border rounded-lg p-3 space-y-2 bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Icon name={q.icon} size={16} className="text-primary" />
                  </div>
                  <IconPicker
                    selectedIcon={q.icon}
                    onSelectIcon={(icon) => onUpdateQuestion(index, 'icon', icon)}
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemoveQuestion(index)}
                >
                  <Icon name="Trash2" size={14} className="text-destructive" />
                </Button>
              </div>
              <div>
                <Label className="text-xs">Текст кнопки</Label>
                <Input
                  value={q.text}
                  onChange={(e) => onUpdateQuestion(index, 'text', e.target.value)}
                  placeholder="Услуги"
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Полный вопрос</Label>
                <Input
                  value={q.question}
                  onChange={(e) => onUpdateQuestion(index, 'question', e.target.value)}
                  placeholder="Что вы предлагаете?"
                  className="h-8"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};