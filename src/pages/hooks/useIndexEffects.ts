import { useEffect } from 'react';
import { UseIndexEffectsParams } from '../types/index.types';

export const useIndexEffects = (params: UseIndexEffectsParams): void => {
  const {
    tenantSlug,
    currentTenantId,
    view,
    isAdminAuthenticated,
    loadTenantInfo,
    loadPageSettings,
    loadConsentSettings,
    loadDocuments
  } = params;

  useEffect(() => {
    if (tenantSlug) {
      loadTenantInfo(tenantSlug);
    }
  }, [tenantSlug]);

  useEffect(() => {
    loadPageSettings();
    loadConsentSettings();
  }, [currentTenantId]);

  useEffect(() => {
    if (view === 'admin' && isAdminAuthenticated) {
      loadDocuments();
    }
  }, [view, isAdminAuthenticated, currentTenantId]);
};