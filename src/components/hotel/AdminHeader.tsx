import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface AdminHeaderProps {
  currentUser: { username: string } | null;
  superAdmin: boolean;
  isViewingOtherTenant: boolean;
  tenantId: number | null;
  tariffId: string | null;
  fz152Enabled?: boolean;
  onExitTenantView: () => void;
}

const AdminHeader = ({ 
  currentUser, 
  superAdmin, 
  isViewingOtherTenant, 
  tenantId, 
  tariffId,
  fz152Enabled = false,
  onExitTenantView 
}: AdminHeaderProps) => {
  if (!currentUser) return null;

  return (
    <Card className={superAdmin ? "border-purple-500 bg-purple-50" : "border-blue-500 bg-blue-50"}>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <Icon name={superAdmin ? "ShieldCheck" : "User"} size={20} className={superAdmin ? "text-purple-600" : "text-blue-600"} />
            <span className={`font-semibold ${superAdmin ? "text-purple-900" : "text-blue-900"}`}>
              {superAdmin ? (isViewingOtherTenant ? "Режим просмотра (суперадмин)" : "Режим суперадмина") : "Админ-панель"}
            </span>
            <span className={`text-sm ${superAdmin ? "text-purple-700" : "text-blue-700"}`}>
              • Логин: {currentUser.username}
            </span>
            <span className={`text-sm ${superAdmin ? "text-purple-700" : "text-blue-700"}`}>
              • Tenant ID: {tenantId}
            </span>
            <span className={`text-sm ${superAdmin ? "text-purple-700" : "text-blue-700"}`}>
              • Tariff: {tariffId || 'не установлен'}
            </span>
            {superAdmin && fz152Enabled && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full border border-blue-300">
                <Icon name="ShieldCheck" size={12} />
                152-ФЗ
              </span>
            )}
          </div>
          {isViewingOtherTenant && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onExitTenantView}
              className="border-purple-600 text-purple-700 hover:bg-purple-100"
            >
              <Icon name="ArrowLeft" size={16} className="mr-2" />
              Вернуться к суперадмину
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminHeader;