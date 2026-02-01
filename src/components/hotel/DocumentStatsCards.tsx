import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Document } from './types';

interface DocumentStatsCardsProps {
  documents: Document[];
}

export const DocumentStatsCards = ({ documents }: DocumentStatsCardsProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Icon name="FileText" size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">{documents.length}</p>
              <p className="text-xs text-slate-600">Документов</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Icon name="BookOpen" size={16} className="text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">
                {documents.reduce((sum, doc) => sum + (doc.pages || 0), 0)}
              </p>
              <p className="text-xs text-slate-600">Страниц</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Icon name="CheckCircle" size={16} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">
                {documents.filter(d => d.status === 'ready').length}
              </p>
              <p className="text-xs text-slate-600">Готовы</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Icon name="Loader2" size={16} className="text-orange-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900">
                {documents.filter(d => d.status === 'processing').length}
              </p>
              <p className="text-xs text-slate-600">Обработка</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};