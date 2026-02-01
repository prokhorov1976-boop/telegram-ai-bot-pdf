import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Tenant } from './types';

interface TenantsTabProps {
  tenants: Tenant[];
  onEnterTenant: (tenant: Tenant) => void;
  onManageTenant: (tenant: Tenant) => void;
  onCreateTenant: () => void;
  onToggleFz152: (tenant: Tenant) => void;
  onDeleteTenant: (tenant: Tenant) => void;
}

export const TenantsTab = ({ tenants, onEnterTenant, onManageTenant, onCreateTenant, onToggleFz152, onDeleteTenant }: TenantsTabProps) => {
  const clientTenants = tenants.filter(tenant => tenant.id !== 1);
  
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <CardTitle>Управление клиентами</CardTitle>
            <CardDescription>Все боты в системе</CardDescription>
          </div>
          <Button onClick={onCreateTenant} className="w-full sm:w-auto">
            <Icon name="Plus" size={16} className="mr-2" />
            Создать клиента
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {clientTenants.map(tenant => (
            <div key={tenant.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-slate-50 gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="font-semibold text-base sm:text-lg">{tenant.name}</h3>
                  <Badge variant="outline" className="font-mono text-xs">ID: {tenant.id}</Badge>
                  <Badge className="text-xs">{tenant.tariff_id}</Badge>
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                  <div className="truncate">Slug: {tenant.slug}</div>
                  <div>Документов: {tenant.documents_count} • Админов: {tenant.admins_count}</div>
                  {tenant.admin_emails && (
                    <div className="flex items-center gap-1 truncate">
                      <Icon name="Mail" size={14} />
                      <span className="truncate">{tenant.admin_emails}</span>
                    </div>
                  )}
                  {tenant.subscription_end_date && (
                    <div>Подписка до: {new Date(tenant.subscription_end_date).toLocaleDateString('ru-RU')}</div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-medium text-xs">152-ФЗ:</span>
                    <button
                      onClick={() => onToggleFz152(tenant)}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                        tenant.fz152_enabled 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {tenant.fz152_enabled ? 'Вкл' : 'Выкл'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => onEnterTenant(tenant)}
                  className="w-full sm:w-auto"
                >
                  <Icon name="LogIn" size={16} className="mr-2" />
                  <span className="hidden sm:inline">Войти в админку</span>
                  <span className="sm:hidden">Войти</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onManageTenant(tenant)}
                  className="w-full sm:w-auto"
                >
                  <Icon name="Settings" size={16} className="mr-2" />
                  <span className="hidden sm:inline">Настройки</span>
                  <span className="sm:hidden">Настр.</span>
                </Button>
                {tenant.id !== 1 && tenant.id !== 2 && tenant.id !== 777 && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => onDeleteTenant(tenant)}
                    className="w-full sm:w-auto"
                  >
                    <Icon name="Trash2" size={16} className="sm:mr-2" />
                    <span className="hidden sm:inline">Удалить</span>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};