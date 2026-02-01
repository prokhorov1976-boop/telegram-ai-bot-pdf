import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch, getTenantId } from '@/lib/auth';

interface QualityGateCategory {
  min_len: number;
  min_sim: number;
  min_overlap_ru: number;
  min_overlap_en: number;
}

interface QualityGateSettings {
  default: QualityGateCategory;
  tariffs: QualityGateCategory;
  services: QualityGateCategory;
}

interface QualityGateSettingsCardProps {
  currentTenantId?: number | null;
}

const QualityGateSettingsCard = ({ currentTenantId }: QualityGateSettingsCardProps) => {
  const [settings, setSettings] = useState<QualityGateSettings>({
    default: { min_len: 500, min_sim: 0.32, min_overlap_ru: 0.15, min_overlap_en: 0.12 },
    tariffs: { min_len: 250, min_sim: 0.25, min_overlap_ru: 0.06, min_overlap_en: 0.06 },
    services: { min_len: 450, min_sim: 0.28, min_overlap_ru: 0.15, min_overlap_en: 0.12 }
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, [currentTenantId]);

  const loadSettings = async () => {
    try {
      const tenantId = currentTenantId !== null && currentTenantId !== undefined ? currentTenantId : getTenantId();
      const url = `https://functions.poehali.dev/7a83fc62-4b62-4575-b6c7-876c5974d0a0?tenant_id=${tenantId}`;
      const response = await authenticatedFetch(url);
      const data = await response.json();
      
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error loading quality gate settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      const tenantId = currentTenantId !== null && currentTenantId !== undefined ? currentTenantId : getTenantId();
      const response = await authenticatedFetch('https://functions.poehali.dev/7d26fcc4-42c6-467f-9788-1da19509460f', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings, tenant_id: tenantId })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: '✓ Сохранено!',
          description: 'Настройки Quality Gate успешно обновлены'
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось сохранить настройки',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = (category: keyof QualityGateSettings, field: keyof QualityGateCategory, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setSettings({
        ...settings,
        [category]: {
          ...settings[category],
          [field]: numValue
        }
      });
    }
  };

  const CategorySettings = ({ 
    title, 
    category, 
    description 
  }: { 
    title: string; 
    category: keyof QualityGateSettings; 
    description: string;
  }) => (
    <div className="border rounded-lg p-4 bg-slate-50">
      <h4 className="font-semibold text-slate-900 mb-1">{title}</h4>
      <p className="text-xs text-slate-600 mb-3">{description}</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`${category}_min_sim`} className="text-xs">Мин. похожесть (0-1)</Label>
          <Input
            id={`${category}_min_sim`}
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={settings[category].min_sim}
            onChange={(e) => handleCategoryChange(category, 'min_sim', e.target.value)}
            className="h-9 text-sm"
          />
        </div>
        <div>
          <Label htmlFor={`${category}_min_len`} className="text-xs">Мин. длина текста</Label>
          <Input
            id={`${category}_min_len`}
            type="number"
            step="50"
            min="0"
            value={settings[category].min_len}
            onChange={(e) => handleCategoryChange(category, 'min_len', e.target.value)}
            className="h-9 text-sm"
          />
        </div>
        <div>
          <Label htmlFor={`${category}_min_overlap_ru`} className="text-xs">Мин. пересечение (RU)</Label>
          <Input
            id={`${category}_min_overlap_ru`}
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={settings[category].min_overlap_ru}
            onChange={(e) => handleCategoryChange(category, 'min_overlap_ru', e.target.value)}
            className="h-9 text-sm"
          />
        </div>
        <div>
          <Label htmlFor={`${category}_min_overlap_en`} className="text-xs">Мин. пересечение (EN)</Label>
          <Input
            id={`${category}_min_overlap_en`}
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={settings[category].min_overlap_en}
            onChange={(e) => handleCategoryChange(category, 'min_overlap_en', e.target.value)}
            className="h-9 text-sm"
          />
        </div>
      </div>
    </div>
  );

  return (
    <Card className="shadow-xl">
      <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-blue-50">
        <CardTitle className="flex items-center gap-2">
          <Icon name="Shield" size={20} />
          Настройки Quality Gate
        </CardTitle>
        <CardDescription>
          Управление точностью ответов бота — чем ниже пороги, тем больше ответов, но может снизиться точность
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-2">
            <Icon name="Info" size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Как это работает:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li><strong>Мин. похожесть</strong> — порог similarity (0.25 = бот найдёт больше ответов, 0.35 = только точные совпадения)</li>
                <li><strong>Мин. длина текста</strong> — минимальный размер найденного фрагмента в символах</li>
                <li><strong>Мин. пересечение</strong> — процент совпадающих слов между вопросом и найденным текстом</li>
              </ul>
            </div>
          </div>
        </div>

        <CategorySettings
          title="📋 Общие вопросы (default)"
          category="default"
          description="Применяется к вопросам, которые не относятся к тарифам или услугам"
        />

        <CategorySettings
          title="💰 Тарифы и цены (tariffs)"
          category="tariffs"
          description="Вопросы про стоимость, тарифы, бронирование, акции"
        />

        <CategorySettings
          title="🛎️ Услуги и сервисы (services)"
          category="services"
          description="Вопросы про услуги отеля, питание, парковку, трансфер"
        />

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSaveSettings} disabled={isLoading} size="lg">
            {isLoading ? (
              <>
                <Icon name="Loader2" className="mr-2 animate-spin" size={16} />
                Сохранение...
              </>
            ) : (
              <>
                <Icon name="Save" className="mr-2" size={16} />
                Сохранить настройки
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QualityGateSettingsCard;