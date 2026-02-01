import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Icon from '@/components/ui/icon';
import { Document, BACKEND_URLS } from './types';
import { getTariffId, getTenantId, isSuperAdmin } from '@/lib/auth';
import { getTariffLimits, canUploadMoreDocuments } from '@/lib/tariff-limits';
import DocumentUploadArea from './DocumentUploadArea';
import DocumentGrid from './DocumentGrid';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/lib/auth';

interface DocumentsPanelProps {
  documents: Document[];
  isLoading: boolean;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteDocument: (documentId: number) => Promise<any>;
}

export const DocumentsPanel = ({
  documents,
  isLoading,
  onFileUpload,
  onDeleteDocument
}: DocumentsPanelProps) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date'>('date');
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState({ current: 0, total: 0 });
  const [isReindexing, setIsReindexing] = useState(false);
  const tariffId = getTariffId();
  const limits = getTariffLimits(tariffId);
  const canUpload = canUploadMoreDocuments(documents.length, tariffId);
  const superAdmin = isSuperAdmin();
  const [purePromptMode, setPurePromptMode] = useState<boolean>(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState<boolean>(true);

  const filteredDocuments = useMemo(() => {
    const filtered = documents.filter(doc => {
      const statusMatch = selectedStatus === 'all' || doc.status === selectedStatus;
      return statusMatch;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name, 'ru');
      } else if (sortBy === 'size') {
        const parseSize = (sizeStr: string) => {
          if (!sizeStr || sizeStr === '—') return 0;
          const [value, unit] = sizeStr.split(' ');
          const num = parseFloat(value);
          return unit === 'МБ' ? num * 1024 : num;
        };
        return parseSize(b.size) - parseSize(a.size);
      } else {
        return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      }
    });

    return sorted;
  }, [documents, selectedStatus, sortBy]);



  const { toast } = useToast();

  const handleReindex = async () => {
    const tenantId = getTenantId();
    if (!tenantId) return;

    if (!confirm(`Переиндексировать все документы для улучшения поиска? Это может занять несколько минут.`)) {
      return;
    }

    setIsReindexing(true);
    try {
      const response = await authenticatedFetch(`${BACKEND_URLS.reindexEmbeddings}?tenant_id=${tenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: '✓ Переиндексация запущена',
          description: `Обработано документов: ${data.reindexed} из ${data.total}. Качество поиска улучшено.`,
          duration: 7000
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start reindexing');
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка переиндексации',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsReindexing(false);
    }
  };

  // Загрузка настройки pure_prompt_mode
  useEffect(() => {
    const loadPurePromptSetting = async () => {
      const tenantId = getTenantId();
      if (!tenantId) return;

      try {
        const response = await authenticatedFetch(`${BACKEND_URLS.getAiSettings}?tenant_id=${tenantId}`);
        if (response.ok) {
          const data = await response.json();
          setPurePromptMode(data.enable_pure_prompt_mode || false);
        }
      } catch (error) {
        console.error('Failed to load pure_prompt_mode setting:', error);
      } finally {
        setIsLoadingSettings(false);
      }
    };

    loadPurePromptSetting();
  }, []);

  const handleTogglePurePromptMode = async (enabled: boolean) => {
    const tenantId = getTenantId();
    if (!tenantId) return;

    try {
      const response = await authenticatedFetch(BACKEND_URLS.updateAiSettings, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          enable_pure_prompt_mode: enabled
        })
      });

      if (response.ok) {
        setPurePromptMode(enabled);
        toast({
          title: enabled ? '✓ Режим без RAG включён' : '✓ Режим без RAG выключен',
          description: enabled 
            ? 'Бот работает только на system_prompt с историей диалога'
            : 'Бот использует RAG поиск по документам',
          duration: 3000
        });
      } else {
        throw new Error('Failed to update setting');
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка обновления настройки',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleDeleteAll = async () => {
    setIsDeletingAll(true);
    setDeleteProgress({ current: 0, total: documents.length });
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < documents.length; i++) {
      try {
        await onDeleteDocument(documents[i].id);
        successCount++;
        setDeleteProgress({ current: i + 1, total: documents.length });
      } catch (error) {
        console.error(`Failed to delete document ${documents[i].id}:`, error);
        errorCount++;
      }
    }
    
    setIsDeletingAll(false);
    setShowDeleteAllDialog(false);
    setDeleteProgress({ current: 0, total: 0 });
    
    if (successCount > 0) {
      toast({
        title: 'Готово!',
        description: `Удалено документов: ${successCount}${errorCount > 0 ? `, ошибок: ${errorCount}` : ''}`
      });
      window.location.reload();
    } else {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить документы',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-blue-50 pb-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Icon name="Library" size={20} />
                  База знаний
                </CardTitle>
                <CardDescription className="text-sm mt-1">
                  {documents.length} из {limits.maxPdfDocuments} документов
                </CardDescription>
              </div>
              <div className="flex gap-2 flex-wrap">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'size' | 'date')}
                  className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="date">По дате</option>
                  <option value="name">По имени</option>
                  <option value="size">По размеру</option>
                </select>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">Все статусы</option>
                  <option value="ready">Готовы</option>
                  <option value="processing">Обработка</option>
                </select>
                {documents.length > 0 && (
                  <>
                    {superAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReindex}
                        disabled={isReindexing}
                      >
                        <Icon name={isReindexing ? "Loader2" : "RefreshCw"} size={16} className={`mr-2 ${isReindexing ? 'animate-spin' : ''}`} />
                        {isReindexing ? 'Переиндексация...' : 'Переиндексировать'}
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowDeleteAllDialog(true)}
                      disabled={isDeletingAll}
                    >
                      <Icon name="Trash2" size={16} className="mr-2" />
                      Очистить всё
                    </Button>
                  </>
                )}
              </div>
            </div>
            {superAdmin && !isLoadingSettings && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="pure-prompt-mode" className="text-sm font-medium text-amber-900">
                      Режим без RAG (только system_prompt)
                    </Label>
                    <p className="text-xs text-amber-700">
                      Бот работает только на основе system_prompt с историей диалога, без поиска по документам. 
                      Подходит для ботов-продажников и консультантов без базы знаний.
                    </p>
                  </div>
                  <Switch
                    id="pure-prompt-mode"
                    checked={purePromptMode}
                    onCheckedChange={handleTogglePurePromptMode}
                  />
                </div>
              </div>
            )}
            {isDeletingAll && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-blue-900 font-medium">Удаление документов...</span>
                  <span className="text-blue-700">{deleteProgress.current} из {deleteProgress.total}</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-2 transition-all duration-300"
                    style={{ width: `${(deleteProgress.current / deleteProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DocumentGrid
            documents={filteredDocuments}
            onDeleteDocument={onDeleteDocument}
          />
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardContent className="pt-4 pb-4">
          <DocumentUploadArea
            isLoading={isLoading}
            canUpload={canUpload}
            limits={limits}
            currentDocCount={documents.length}
            onFileUpload={onFileUpload}
          />
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Icon name="AlertTriangle" size={24} className="text-red-600" />
              Удалить все документы?
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p>Будет удалено: <strong>{documents.length} документов</strong></p>
                <p className="text-red-600 font-medium">Это действие нельзя отменить!</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              className="bg-red-600 hover:bg-red-700"
            >
              <Icon name="Trash2" size={16} className="mr-2" />
              Да, удалить всё
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};