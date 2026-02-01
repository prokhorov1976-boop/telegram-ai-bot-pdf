import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch, getTenantId } from '@/lib/auth';

interface BackupManagementCardProps {
  currentTenantId?: number | null;
}

const BackupManagementCard = ({ currentTenantId }: BackupManagementCardProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const tenantId = currentTenantId !== null && currentTenantId !== undefined ? currentTenantId : getTenantId();
      const url = `https://functions.poehali.dev/23da4062-a69b-4817-8fd5-a1edb58d06bf?tenant_id=${tenantId}`;
      
      const response = await authenticatedFetch(url);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to export backup');
      }

      const backupData = await response.json();
      
      // Создаём файл и скачиваем
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `tenant_${tenantId}_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast({
        title: '✓ Экспорт завершён',
        description: 'Резервная копия успешно сохранена на ваше устройство'
      });
    } catch (error: any) {
      toast({
        title: 'Ошибка экспорта',
        description: error.message || 'Не удалось создать резервную копию',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const fileContent = await file.text();
      const backupData = JSON.parse(fileContent);

      // Проверяем структуру
      if (!backupData.version || !backupData.tenant_id) {
        throw new Error('Неверный формат файла резервной копии');
      }

      const tenantId = currentTenantId !== null && currentTenantId !== undefined ? currentTenantId : getTenantId();
      const url = 'https://functions.poehali.dev/f486c3ef-91ae-4620-995f-a62175bd4118';
      
      const response = await authenticatedFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backup_data: backupData, tenant_id: tenantId })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to import backup');
      }

      toast({
        title: '✓ Импорт завершён',
        description: `Восстановлено: ${result.imported_items.join(', ')}. Обновите страницу для применения изменений.`
      });

      // Обновляем страницу через 2 секунды
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      toast({
        title: 'Ошибка импорта',
        description: error.message || 'Не удалось импортировать резервную копию',
        variant: 'destructive'
      });
    } finally {
      setIsImporting(false);
      // Очищаем input
      event.target.value = '';
    }
  };

  return (
    <Card className="shadow-xl">
      <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-purple-50">
        <CardTitle className="flex items-center gap-2">
          <Icon name="Database" size={20} />
          Резервное копирование
        </CardTitle>
        <CardDescription>
          Экспорт и импорт всех настроек, API ключей и конфигурации тенанта
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Icon name="Info" size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Что включено в резервную копию:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Настройки страницы (заголовки, контакты, тексты)</li>
                <li>Быстрые вопросы</li>
                <li>AI настройки и Quality Gate пороги</li>
                <li>API ключи (в зашифрованном виде)</li>
                <li>Настройки мессенджеров</li>
                <li>Настройки виджета</li>
              </ul>
              <p className="mt-2 text-xs text-blue-700">
                ⚠️ Документы и история сообщений НЕ включены в резервную копию
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4 bg-green-50">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="Download" size={20} className="text-green-600" />
              <h3 className="font-semibold text-green-900">Экспорт данных</h3>
            </div>
            <p className="text-sm text-green-700 mb-4">
              Скачайте файл с полной резервной копией настроек вашего тенанта
            </p>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isExporting ? (
                <>
                  <Icon name="Loader2" className="mr-2 animate-spin" size={16} />
                  Экспорт...
                </>
              ) : (
                <>
                  <Icon name="Download" className="mr-2" size={16} />
                  Скачать резервную копию
                </>
              )}
            </Button>
          </div>

          <div className="border rounded-lg p-4 bg-orange-50">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="Upload" size={20} className="text-orange-600" />
              <h3 className="font-semibold text-orange-900">Импорт данных</h3>
            </div>
            <p className="text-sm text-orange-700 mb-4">
              Загрузите файл резервной копии для восстановления настроек
            </p>
            <label className="w-full">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={isImporting}
                className="hidden"
              />
              <Button
                as="span"
                disabled={isImporting}
                className="w-full bg-orange-600 hover:bg-orange-700 cursor-pointer"
              >
                {isImporting ? (
                  <>
                    <Icon name="Loader2" className="mr-2 animate-spin" size={16} />
                    Импорт...
                  </>
                ) : (
                  <>
                    <Icon name="Upload" className="mr-2" size={16} />
                    Загрузить резервную копию
                  </>
                )}
              </Button>
            </label>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Icon name="AlertTriangle" size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-900">
              <p className="font-medium mb-1">Важно:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Импорт заменит текущие настройки данными из резервной копии</li>
                <li>API ключи импортируются только если они отсутствуют (не перезаписываются)</li>
                <li>Рекомендуется создать экспорт перед импортом для отката изменений</li>
                <li>После импорта страница автоматически обновится</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BackupManagementCard;
