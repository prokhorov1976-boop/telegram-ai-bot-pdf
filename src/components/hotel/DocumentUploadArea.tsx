import Icon from '@/components/ui/icon';

interface DocumentUploadAreaProps {
  isLoading: boolean;
  canUpload: boolean;
  limits: {
    name: string;
    maxPdfDocuments: number;
  };
  currentDocCount: number;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const DocumentUploadArea = ({ 
  isLoading, 
  canUpload, 
  limits, 
  currentDocCount, 
  onFileUpload 
}: DocumentUploadAreaProps) => {
  if (!canUpload) {
    return (
      <div className="border-2 border-dashed border-amber-300 bg-amber-50 rounded-xl p-8 text-center">
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Icon name="Lock" size={20} className="text-amber-600" />
        </div>
        <p className="font-medium text-amber-900 mb-1">
          Достигнут лимит по тарифу
        </p>
        <p className="text-sm text-amber-800 mb-3">
          {limits.maxPdfDocuments === -1 
            ? 'Безлимит документов'
            : `Ваш тариф "${limits.name}" позволяет загрузить до ${limits.maxPdfDocuments} документов`}
        </p>
        <a 
          href="/#pricing" 
          className="inline-flex items-center gap-2 text-sm font-medium text-amber-900 hover:underline"
        >
          <Icon name="ArrowUpRight" size={16} />
          Перейти на тариф Бизнес или Премиум
        </a>
      </div>
    );
  }

  return (
    <>
      <label htmlFor="file-upload" className="cursor-pointer block">
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-primary hover:bg-blue-50/50 transition-all group">
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Icon name={isLoading ? 'Loader2' : 'Upload'} size={18} className={`text-primary ${isLoading ? 'animate-spin' : ''}`} />
            </div>
            <div className="text-left">
              <p className="font-medium text-slate-900 text-sm">
                {isLoading ? 'Загрузка...' : 'Выберите PDF файлы'}
              </p>
              <p className="text-xs text-slate-600">
                {limits.maxPdfDocuments === -1 
                  ? 'можно несколько (безлимит)' 
                  : `осталось ${limits.maxPdfDocuments - currentDocCount}`}
              </p>
            </div>
          </div>
        </div>
      </label>
      <input
        id="file-upload"
        type="file"
        accept=".pdf"
        multiple
        className="hidden"
        onChange={onFileUpload}
        disabled={isLoading}
      />
      
      <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <Icon name="AlertCircle" size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-amber-900">
            <p className="font-semibold mb-1">Требования:</p>
            <div className="space-y-0.5">
              <div>• Только PDF, до 10 МБ</div>
              <div>• Максимум 20 страниц</div>
              <div>• Необходимы Yandex API ключи в разделе «AI» → «API Ключи»</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DocumentUploadArea;