import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { authenticatedFetch } from '@/lib/auth';
import FUNC_URLS from '../../../backend/func2url.json';

const BACKEND_URL = FUNC_URLS['update-tenant-slug'];

interface TenantUrlEditorProps {
  tenantId: number;
  currentSlug: string;
  tenantName: string;
  onSlugUpdated?: (newSlug: string) => void;
}

const TenantUrlEditor = ({ tenantId, currentSlug, tenantName, onSlugUpdated }: TenantUrlEditorProps) => {
  const [slug, setSlug] = useState(currentSlug);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleUpdate = async () => {
    if (!slug.trim()) {
      toast({
        title: 'Ошибка',
        description: 'URL не может быть пустым',
        variant: 'destructive'
      });
      return;
    }

    if (slug === currentSlug) {
      toast({
        title: 'Нет изменений',
        description: 'URL не изменился',
        variant: 'default'
      });
      return;
    }

    setIsUpdating(true);
    try {
      const response = await authenticatedFetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          slug: slug.trim().toLowerCase()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: 'Успешно',
          description: `${data.message}. Переход на новый URL...`
        });
        if (onSlugUpdated) {
          onSlugUpdated(data.slug);
        }
        
        // Редирект на новый URL после успешного обновления
        setTimeout(() => {
          window.location.href = `/${data.slug}/admin`;
        }, 1500);
      } else {
        throw new Error(data.error || 'Не удалось обновить URL');
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSlugChange = (value: string) => {
    // Автоматическая очистка: только буквы, цифры, дефис
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSlug(cleaned);
  };

  const isChanged = slug !== currentSlug;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Link" size={20} />
          URL бота
        </CardTitle>
        <CardDescription>
          Управление адресом страницы для {tenantName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="tenant_slug">Адрес страницы (slug)</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">/</span>
            <Input
              id="tenant_slug"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="my-business-bot"
              className="flex-1 font-mono"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Только латинские буквы, цифры и дефис. Например: demo-hyatt-regency
          </p>
        </div>

        {isChanged && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Icon name="Info" size={16} className="text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Изменение URL:</p>
                <p className="text-blue-800">
                  <span className="line-through">/{currentSlug}</span> → <span className="font-semibold">/{slug}</span>
                </p>
                <p className="text-xs text-blue-700 mt-2">
                  После изменения нужно обновить ссылки во всех местах, где используется этот бот
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Icon name="AlertTriangle" size={16} className="text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-900">
              <p className="font-medium mb-1">Важно:</p>
              <ul className="list-disc list-inside text-amber-800 space-y-1">
                <li>Страница бота будет доступна по адресу: <span className="font-mono">/{slug}</span></li>
                <li>Старый адрес перестанет работать</li>
                <li>Обновите виджеты и iframe, если они используют этот URL</li>
              </ul>
            </div>
          </div>
        </div>

        <Button
          onClick={handleUpdate}
          disabled={isUpdating || !isChanged || !slug.trim()}
          className="w-full"
        >
          {isUpdating ? (
            <>
              <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
              Обновление...
            </>
          ) : (
            <>
              <Icon name="Save" size={16} className="mr-2" />
              Обновить URL
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default TenantUrlEditor;