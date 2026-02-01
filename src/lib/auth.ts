interface AdminUser {
  id: number;
  username: string;
  role: 'super_admin' | 'tenant_admin';
  tenant_id: number | null;
  tariff_id?: string | null;
}

interface DecodedToken {
  user_id: number;
  username: string;
  role: string;
  tenant_id: number | null;
  exp: number;
}

export const getAuthToken = (): string | null => {
  return localStorage.getItem('adminToken');
};

export const getAdminUser = (): AdminUser | null => {
  const userStr = localStorage.getItem('adminUser');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  if (!token) return false;
  
  try {
    const payload = parseJwt(token);
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp > currentTime;
  } catch {
    return false;
  }
};

export const isSuperAdmin = (): boolean => {
  const user = getAdminUser();
  return user?.role === 'super_admin';
};

export const getTenantId = (): number | null => {
  const viewingTenantId = sessionStorage.getItem('superadmin_viewing_tenant_id');
  if (viewingTenantId) {
    return parseInt(viewingTenantId, 10);
  }
  const user = getAdminUser();
  return user?.tenant_id ?? null;
};

export const getTariffId = (): string | null => {
  const viewingTariffId = sessionStorage.getItem('superadmin_viewing_tariff_id');
  if (viewingTariffId) {
    return viewingTariffId;
  }
  const user = getAdminUser();
  const tariffId = user?.tariff_id ?? null;
  console.log('[auth] getTariffId:', { user, tariffId });
  return tariffId;
};

export const logout = () => {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  sessionStorage.removeItem('superadmin_viewing_tenant');
  sessionStorage.removeItem('superadmin_viewing_tenant_id');
  sessionStorage.removeItem('superadmin_viewing_tariff_id');
};

export const enterTenantAsSuper = (tenantId: number, tariffId: string) => {
  sessionStorage.setItem('superadmin_viewing_tenant', 'true');
  sessionStorage.setItem('superadmin_viewing_tenant_id', tenantId.toString());
  sessionStorage.setItem('superadmin_viewing_tariff_id', tariffId);
};

export const exitTenantView = () => {
  sessionStorage.removeItem('superadmin_viewing_tenant');
  sessionStorage.removeItem('superadmin_viewing_tenant_id');
  sessionStorage.removeItem('superadmin_viewing_tariff_id');
};

export const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  if (!token) return {};
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers
  };
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'omit' // Не отправляем cookies в cross-origin запросы
    });
    
    // Логируем только статус, не читаем body (чтобы не сломать .json() вызывающего кода)
    if (!response.ok) {
      console.error(`HTTP ${response.status} from ${url}`);
    }
    
    // НЕ делаем автологаут на 401 - может быть просто нет прав доступа
    // Вызывающий код сам решит, что делать с ошибкой
    
    return response;
  } catch (error) {
    console.error('Fetch error:', error, 'for', url);
    throw error;
  }
};

function parseJwt(token: string): DecodedToken {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  
  return JSON.parse(jsonPayload);
}