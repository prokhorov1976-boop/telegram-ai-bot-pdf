import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { PageSettings } from '@/components/hotel/types';
import { isSuperAdmin } from '@/lib/auth';

interface IndexHeaderProps {
  pageSettings?: PageSettings;
  view: 'guest' | 'admin';
  isAdminAuthenticated: boolean;
  onViewChange: (view: 'guest' | 'admin') => void;
  onLogout: () => void;
}

export const IndexHeader = ({ 
  pageSettings, 
  view, 
  isAdminAuthenticated,
  onViewChange, 
  onLogout 
}: IndexHeaderProps) => {
  return (
    <header className="mb-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
            <Icon name={pageSettings?.header_icon || 'Bot'} size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{pageSettings?.header_title || 'AI-помощник'}</h1>
            <p className="text-slate-600 text-sm">{pageSettings?.header_subtitle || 'Виртуальный помощник клиентов'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {isSuperAdmin() && (
            <Button 
              variant="outline"
              onClick={() => {
                sessionStorage.removeItem('superadmin_viewing_tenant');
                window.location.href = '/super-admin';
              }}
              className="gap-2"
            >
              <Icon name="Crown" size={18} />
              Мастер-панель
            </Button>
          )}
          <Button 
            variant={view === 'admin' ? 'default' : 'outline'}
            onClick={() => onViewChange(view === 'guest' ? 'admin' : 'guest')}
            className="gap-2"
          >
            <Icon name={view === 'admin' ? 'MessageCircle' : 'Settings'} size={18} />
            {view === 'admin' ? 'Чат для клиентов' : 'Админ-панель'}
          </Button>
          {view === 'admin' && isAdminAuthenticated && (
            <Button 
              variant="ghost"
              onClick={onLogout}
              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Icon name="LogOut" size={18} />
              Выйти
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};