import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch, getTenantId } from '@/lib/auth';
import { BACKEND_URLS } from './types';

interface EmojiMapping {
  keyword: string;
  emoji: string;
}

const DEFAULT_MAPPINGS: EmojiMapping[] = [
  { keyword: 'завтрак', emoji: '🍳' },
  { keyword: 'без питания', emoji: '🍽' },
  { keyword: 'полный пансион', emoji: '🍴' },
  { keyword: 'стандарт', emoji: '🏨' },
  { keyword: 'комфорт', emoji: '✨' },
  { keyword: 'люкс', emoji: '👑' },
  { keyword: 'руб', emoji: '💰' }
];

const EmojiMappingCard = () => {
  const [mappings, setMappings] = useState<EmojiMapping[]>(DEFAULT_MAPPINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [newEmoji, setNewEmoji] = useState('');
  const { toast } = useToast();
  const tenantId = getTenantId();

  useEffect(() => {
    loadMappings();
  }, [tenantId]);

  const loadMappings = async () => {
    if (!tenantId) return;
    
    try {
      const response = await authenticatedFetch(
        `${BACKEND_URLS.manageFormattingSettings}?tenant_id=${tenantId}&action=get_emoji_map`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.emoji_map && Object.keys(data.emoji_map).length > 0) {
          const loaded = Object.entries(data.emoji_map).map(([keyword, emoji]) => ({
            keyword,
            emoji: emoji as string
          }));
          setMappings(loaded);
        }
      }
    } catch (error) {
      console.error('Error loading emoji mappings:', error);
    }
  };

  const saveMappings = async () => {
    if (!tenantId) return;
    
    setIsLoading(true);
    try {
      const emojiMap = mappings.reduce((acc, { keyword, emoji }) => {
        acc[keyword] = emoji;
        return acc;
      }, {} as Record<string, string>);

      const response = await authenticatedFetch(
        `${BACKEND_URLS.manageFormattingSettings}?tenant_id=${tenantId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_emoji_map',
            emoji_map: emojiMap
          })
        }
      );

      if (response.ok) {
        toast({
          title: '✓ Карта эмодзи сохранена',
          description: 'Изменения вступят в силу при следующем сообщении'
        });
      } else {
        throw new Error('Failed to save emoji mappings');
      }
    } catch (error) {
      toast({
        title: 'Ошибка сохранения',
        description: 'Не удалось сохранить карту эмодзи',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addMapping = () => {
    if (!newKeyword.trim() || !newEmoji.trim()) {
      toast({
        title: 'Заполните поля',
        description: 'Укажите ключевое слово и эмодзи',
        variant: 'destructive'
      });
      return;
    }

    setMappings([...mappings, { keyword: newKeyword.trim(), emoji: newEmoji.trim() }]);
    setNewKeyword('');
    setNewEmoji('');
  };

  const removeMapping = (index: number) => {
    setMappings(mappings.filter((_, i) => i !== index));
  };

  const resetToDefault = () => {
    setMappings(DEFAULT_MAPPINGS);
    toast({
      title: '✓ Сброшено',
      description: 'Восстановлены стандартные значения'
    });
  };

  return (
    <Card className="shadow-xl">
      <CardHeader className="border-b bg-gradient-to-r from-yellow-50 to-orange-50">
        <CardTitle className="flex items-center gap-2">
          <Icon name="Smile" size={20} />
          Карта эмодзи для мессенджеров
        </CardTitle>
        <CardDescription>
          Настройте, какие эмодзи добавлять к строкам с определёнными словами
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Icon name="Info" size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Как это работает:</p>
              <p className="text-xs">
                Когда AI-ответ содержит ключевое слово (например, "завтрак"), к началу строки 
                автоматически добавляется соответствующий эмодзи (🍳). Регистр не учитывается.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">Текущие правила:</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={resetToDefault}
              className="text-xs"
            >
              <Icon name="RotateCcw" size={14} className="mr-1" />
              Сбросить
            </Button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {mappings.map((mapping, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-slate-50 rounded border"
              >
                <span className="text-2xl">{mapping.emoji}</span>
                <code className="flex-1 text-sm bg-white px-2 py-1 rounded border">
                  {mapping.keyword}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMapping(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Icon name="Trash2" size={16} />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold text-sm mb-3">Добавить новое правило:</h3>
          <div className="flex gap-2">
            <Input
              placeholder="Ключевое слово"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Эмодзи (🎉)"
              value={newEmoji}
              onChange={(e) => setNewEmoji(e.target.value)}
              className="w-24"
              maxLength={2}
            />
            <Button onClick={addMapping} size="sm">
              <Icon name="Plus" size={16} className="mr-1" />
              Добавить
            </Button>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            onClick={saveMappings}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Icon name="Loader2" className="mr-2 animate-spin" size={16} />
                Сохранение...
              </>
            ) : (
              <>
                <Icon name="Save" className="mr-2" size={16} />
                Сохранить карту эмодзи
              </>
            )}
          </Button>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Icon name="Lightbulb" size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-900">
              <p className="font-medium mb-1">Совет:</p>
              <p className="text-xs">
                Используйте точные формы слов. Например, если указано "завтрак", то к "завтраку" 
                эмодзи не добавится. При необходимости создайте несколько правил для разных форм слова.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmojiMappingCard;
