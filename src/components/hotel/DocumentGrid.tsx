import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { Document } from './types';
import { useToast } from '@/hooks/use-toast';

interface DocumentGridProps {
  documents: Document[];
  onDeleteDocument: (documentId: number) => Promise<any>;
}

const DocumentGrid = ({ documents, onDeleteDocument }: DocumentGridProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDeleteClick = (doc: Document) => {
    setDocumentToDelete(doc);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!documentToDelete) return;
    
    setIsDeleting(true);
    try {
      await onDeleteDocument(documentToDelete.id);
      toast({
        title: 'Удалено!',
        description: `Документ "${documentToDelete.name}" удалён из базы`
      });
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
      window.location.reload();
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось удалить документ',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };
  if (documents.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        <Icon name="FileText" size={48} className="mx-auto mb-3 opacity-30" />
        <p>Нет документов с выбранными фильтрами</p>
      </div>
    );
  }

  return (
    <div>
      <div className="p-3 space-y-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all bg-white"
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                doc.status === 'ready' ? 'bg-blue-100' : 'bg-orange-100'
              }`}>
                <Icon name={doc.status === 'ready' ? 'FileCheck' : 'Loader2'} 
                  size={16} 
                  className={`${doc.status === 'ready' ? 'text-primary' : 'text-orange-600 animate-spin'}`} 
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-slate-900 truncate mb-0.5">{doc.name}</p>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  {doc.pages > 0 && <span>{doc.pages} стр.</span>}
                  <span>{doc.size}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {doc.fileUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-primary hover:text-blue-700 hover:bg-blue-50"
                    onClick={() => window.open(doc.fileUrl, '_blank')}
                    title="Скачать PDF"
                  >
                    <Icon name="Download" size={14} />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleDeleteClick(doc)}
                  title="Удалить документ"
                >
                  <Icon name="Trash2" size={14} />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Icon name="AlertTriangle" size={24} className="text-orange-600" />
              Удалить документ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p>Документ: <strong>{documentToDelete?.name}</strong></p>
                <p className="text-orange-600 font-medium">Все данные будут удалены из базы знаний!</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                  Удаление...
                </>
              ) : (
                <>
                  <Icon name="Trash2" size={16} className="mr-2" />
                  Да, удалить
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DocumentGrid;