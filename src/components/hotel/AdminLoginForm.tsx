import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { BACKEND_URLS } from './types';

interface AdminLoginFormProps {
  onLoginSuccess: () => void;
}

const AdminLoginForm = ({ onLoginSuccess }: AdminLoginFormProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutMinutes, setLockoutMinutes] = useState(0);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите логин и пароль',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(BACKEND_URLS.authAdmin, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        // Очищаем флаг просмотра других тенантов при новом входе
        sessionStorage.removeItem('superadmin_viewing_tenant');
        setAttemptsLeft(null);
        setIsLocked(false);
        toast({
          title: 'Успешно!',
          description: `Добро пожаловать, ${data.user.username}!`
        });
        onLoginSuccess();
      } else if (response.status === 429) {
        setIsLocked(true);
        setLockoutMinutes(data.remainingMinutes || 15);
        toast({
          title: 'Доступ заблокирован',
          description: data.error || 'Слишком много попыток входа',
          variant: 'destructive'
        });
      } else {
        setAttemptsLeft(data.attemptsLeft ?? null);
        const message = data.attemptsLeft !== undefined && data.attemptsLeft > 0
          ? `${data.error}. Осталось попыток: ${data.attemptsLeft}`
          : data.error || 'Неверный пароль';
        
        toast({
          title: 'Ошибка входа',
          description: message,
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка входа',
        description: error.message || 'Неверный пароль',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-4 pb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto">
            <Icon name="Lock" size={32} className="text-white" />
          </div>
          <CardTitle className="text-2xl text-center">Вход в админку</CardTitle>
          <CardDescription className="text-center">
            Введите пароль для доступа к панели управления
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Логин
              </label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Введите логин"
                className="text-lg"
                disabled={isLoading}
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Пароль
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                className="text-lg"
                disabled={isLoading}
              />
            </div>

            {isLocked && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-start gap-2">
                  <Icon name="ShieldAlert" size={20} className="text-red-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-900">Доступ временно заблокирован</p>
                    <p className="text-sm text-red-700 mt-1">
                      Слишком много неудачных попыток входа. Попробуйте снова через {lockoutMinutes} минут.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {attemptsLeft !== null && attemptsLeft > 0 && (
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2">
                  <Icon name="AlertTriangle" size={18} className="text-orange-600" />
                  <p className="text-sm text-orange-800">
                    Осталось попыток: <span className="font-bold">{attemptsLeft}</span>
                  </p>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || !username.trim() || !password.trim() || isLocked}
              className="w-full h-12 text-base"
            >
              {isLoading ? (
                <>
                  <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                  Проверка...
                </>
              ) : (
                <>
                  <Icon name="LogIn" size={20} className="mr-2" />
                  Войти
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-start gap-2">
              <Icon name="Info" size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800 space-y-1">
                <p>Если вы забыли пароль, обратитесь к администратору системы</p>
                <p className="font-medium">Защита от брутфорса: максимум 5 попыток за 10 минут</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLoginForm;