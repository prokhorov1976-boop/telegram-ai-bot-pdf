import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { authenticatedFetch } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { BACKEND_URLS } from './types';

interface EmbeddingSettings {
  embedding_provider: string;
  embedding_doc_model: string;
  embedding_query_model: string;
}

interface ReindexStatus {
  status: 'idle' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  total: number;
  error?: string;
}

interface EmbeddingsSettingsProps {
  currentTenantId: number | null;
  tenantName?: string;
  fz152Enabled?: boolean;
}

const EmbeddingsSettings = ({ currentTenantId, tenantName, fz152Enabled = false }: EmbeddingsSettingsProps) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<EmbeddingSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProvider, setEditedProvider] = useState('');
  const [editedDocModel, setEditedDocModel] = useState('');
  const [editedQueryModel, setEditedQueryModel] = useState('');
  const [reindexStatus, setReindexStatus] = useState<ReindexStatus | null>(null);
  const [isReindexing, setIsReindexing] = useState(false);

  useEffect(() => {
    if (currentTenantId) {
      loadSettings();
      loadReindexStatus();
    }
  }, [currentTenantId]);

  useEffect(() => {
    if (!currentTenantId) return;
    
    const interval = setInterval(() => {
      if (reindexStatus?.status === 'in_progress') {
        loadReindexStatus();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [currentTenantId, reindexStatus?.status]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await authenticatedFetch(`${BACKEND_URLS.manageEmbeddings}?tenant_id=${currentTenantId}`);
      if (response.ok) {
        const data = await response.json();
        const tenantSettings = data.tenants?.[0] || {
          embedding_provider: 'yandex',
          embedding_doc_model: 'text-search-doc',
          embedding_query_model: 'text-search-query'
        };
        setSettings(tenantSettings);
        setEditedProvider(tenantSettings.embedding_provider);
        setEditedDocModel(tenantSettings.embedding_doc_model);
        setEditedQueryModel(tenantSettings.embedding_query_model);
      } else {
        throw new Error('Failed to load embeddings settings');
      }
    } catch (error) {
      console.error('Error loading embeddings settings:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить настройки эмбеддингов',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadReindexStatus = async () => {
    if (!currentTenantId) return;
    
    try {
      const response = await authenticatedFetch(`${BACKEND_URLS.reindexEmbeddings}?tenant_id=${currentTenantId}`);
      if (response.ok) {
        const data = await response.json();
        setReindexStatus({
          status: data.status || 'idle',
          progress: data.progress || 0,
          total: data.total || 0,
          error: data.error
        });
      }
    } catch (error) {
      console.error('Error loading reindex status:', error);
    }
  };

  const handleSave = async () => {
    if (!currentTenantId) return;

    setIsSaving(true);
    try {
      const response = await authenticatedFetch(BACKEND_URLS.manageEmbeddings, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: currentTenantId,
          embedding_provider: editedProvider,
          embedding_doc_model: editedDocModel,
          embedding_query_model: editedQueryModel
        })
      });

      if (response.ok) {
        toast({
          title: '✓ Сохранено!',
          description: 'Настройки эмбеддингов обновлены. Рекомендуется переиндексировать документы.',
          duration: 5000
        });
        setIsEditing(false);
        loadSettings();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update embeddings');
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось обновить настройки',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReindex = async () => {
    if (!currentTenantId) return;

    if (reindexStatus?.status !== 'in_progress' && !confirm(`Переиндексировать все документы? Это может занять время.`)) {
      return;
    }

    setIsReindexing(true);
    try {
      const response = await authenticatedFetch(`${BACKEND_URLS.reindexEmbeddings}?tenant_id=${currentTenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      });

      if (response.ok) {
        const data = await response.json();
        setReindexStatus({
          status: data.status || 'in_progress',
          progress: data.reindexed || 0,
          total: data.total || 0
        });
        
        if (data.status === 'completed') {
          toast({
            title: '✅ Переиндексация завершена',
            description: `Обработано документов: ${data.reindexed} из ${data.total}`,
            duration: 5000
          });
        } else {
          toast({
            title: '⏳ Переиндексация в процессе',
            description: `Обработано: ${data.reindexed} из ${data.total}`,
            duration: 3000
          });
        }
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

  const handleCancel = () => {
    if (settings) {
      setEditedProvider(settings.embedding_provider);
      setEditedDocModel(settings.embedding_doc_model);
      setEditedQueryModel(settings.embedding_query_model);
    }
    setIsEditing(false);
  };

  useEffect(() => {
    if (editedProvider === 'yandex') {
      setEditedDocModel('text-search-doc');
      setEditedQueryModel('text-search-query');
    } else if (editedProvider === 'openrouter') {
      setEditedDocModel('openai/text-embedding-3-small');
      setEditedQueryModel('openai/text-embedding-3-small');
    } else if (editedProvider === 'proxyapi') {
      setEditedDocModel('openai/text-embedding-3-small');
      setEditedQueryModel('openai/text-embedding-3-small');
    }
  }, [editedProvider]);

  if (isLoading) {
    return (
      <Card className="shadow-xl">
        <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-purple-50">
          <CardTitle className="flex items-center gap-2">
            <Icon name="BrainCircuit" size={20} />
            Настройки эмбеддингов
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 flex items-center justify-center h-48">
          <Icon name="Loader2" size={32} className="animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return null;
  }

  return (
    <Card className="shadow-xl border-2 border-purple-200">
      <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-indigo-50">
        <CardTitle className="flex items-center gap-2">
          <Icon name="BrainCircuit" size={20} />
          Настройки эмбеддингов
          {tenantName && <span className="text-sm font-normal text-slate-600">• {tenantName}</span>}
        </CardTitle>
        <CardDescription>
          Модели векторизации текста для поиска по документам
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Icon name="ShieldCheck" size={24} className="text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Используются модели Яндекса</h4>
              <p className="text-sm text-blue-800">
                Все данные обрабатываются на территории РФ в соответствии с законодательством о персональных данных.
              </p>
            </div>
          </div>
        </div>

        {!isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-600 mb-1">Провайдер</div>
                <div className="font-semibold text-slate-900">
                  {settings.embedding_provider === 'yandex' ? '🇷🇺 Яндекс' : settings.embedding_provider === 'openrouter' ? '🌐 OpenRouter' : settings.embedding_provider === 'proxyapi' ? '💰 ProxyAPI' : settings.embedding_provider}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-600 mb-1">Модель для документов</div>
                <div className="font-semibold text-slate-900 text-sm">{settings.embedding_doc_model}</div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-600 mb-1">Модель для запросов</div>
                <div className="font-semibold text-slate-900 text-sm">{settings.embedding_query_model}</div>
              </div>
            </div>

            {reindexStatus && reindexStatus.status !== 'idle' && (
              <div className="p-4 rounded-lg border-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {reindexStatus.status === 'in_progress' && (
                      <Icon name="Loader2" size={20} className="animate-spin text-blue-600" />
                    )}
                    {reindexStatus.status === 'completed' && (
                      <Icon name="CheckCircle2" size={20} className="text-green-600" />
                    )}
                    {reindexStatus.status === 'failed' && (
                      <Icon name="XCircle" size={20} className="text-red-600" />
                    )}
                    <span className="font-semibold text-slate-900">
                      {reindexStatus.status === 'in_progress' && 'Переиндексация в процессе...'}
                      {reindexStatus.status === 'completed' && 'Переиндексация завершена'}
                      {reindexStatus.status === 'failed' && 'Ошибка переиндексации'}
                    </span>
                  </div>
                  <span className="text-sm font-mono text-slate-700">
                    {reindexStatus.progress} / {reindexStatus.total}
                  </span>
                </div>
                
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      reindexStatus.status === 'completed' ? 'bg-green-500' :
                      reindexStatus.status === 'failed' ? 'bg-red-500' :
                      'bg-gradient-to-r from-blue-500 to-indigo-600'
                    }`}
                    style={{ width: `${reindexStatus.total > 0 ? (reindexStatus.progress / reindexStatus.total * 100) : 0}%` }}
                  />
                </div>
                
                {reindexStatus.total > 0 && (
                  <div className="mt-2 text-sm text-slate-600">
                    {reindexStatus.status === 'in_progress' && `Осталось: ${reindexStatus.total - reindexStatus.progress} документов`}
                    {reindexStatus.status === 'completed' && `Все ${reindexStatus.total} документов обработаны`}
                  </div>
                )}
                
                {reindexStatus.error && (
                  <div className="mt-2 text-sm text-red-600 font-medium">
                    {reindexStatus.error}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => setIsEditing(true)}
                disabled={true}
                className="flex-1"
              >
                <Icon name="Settings" size={18} className="mr-2" />
                Редактирование заблокировано
              </Button>
              <Button
                variant="secondary"
                onClick={handleReindex}
                disabled={isReindexing}
                className="flex-1"
              >
                {isReindexing || reindexStatus?.status === 'in_progress' ? (
                  <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                ) : (
                  <Icon name="RefreshCw" size={18} className="mr-2" />
                )}
                {reindexStatus?.status === 'in_progress' ? 'Продолжить' : 'Переиндексировать документы'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Провайдер эмбеддингов</label>
              <Select value={editedProvider} onValueChange={setEditedProvider} disabled>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите провайдера" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yandex">🇷🇺 Яндекс (256 измерений, ₽0.8/1M)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editedProvider === 'yandex' && (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">Модель для документов</label>
                  <Select value={editedDocModel} onValueChange={setEditedDocModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text-search-doc">text-search-doc (256, ₽0.8/1M)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Модель для запросов</label>
                  <Select value={editedQueryModel} onValueChange={setEditedQueryModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text-search-query">text-search-query (256, ₽0.8/1M)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}



            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Icon name="AlertTriangle" size={18} className="text-yellow-700 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <strong>Важно:</strong> После изменения моделей необходимо переиндексировать все документы для корректной работы поиска.
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1"
              >
                <Icon name="Save" size={18} className="mr-2" />
                {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
                className="flex-1"
              >
                <Icon name="X" size={18} className="mr-2" />
                Отмена
              </Button>
            </div>
          </div>
        )}

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
            <Icon name="Info" size={16} />
            Что такое эмбеддинги?
          </h4>
          <p className="text-sm text-slate-700 mb-3">
            Эмбеддинги — это числовые представления текста, которые позволяют искать похожие фрагменты в документах. 
            Когда пользователь задает вопрос, система ищет наиболее релевантные части документов и использует их для ответа.
          </p>
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex items-start gap-2">
              <Icon name="Check" size={14} className="text-green-600 mt-1 flex-shrink-0" />
              <span><strong>Яндекс:</strong> 256 измерений, быстрая обработка, данные хранятся в РФ</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmbeddingsSettings;