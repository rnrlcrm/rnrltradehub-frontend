/**
 * useSubUsers Hook
 * Manages sub-user operations for client/vendor portals
 */

import { useState, useEffect } from 'react';
import { multiTenantApi } from '../api/multiTenantApi';
import { SubUser, SubUserLimits } from '../types/multiTenant';

export interface UseSubUsersReturn {
  subUsers: SubUser[];
  limits: SubUserLimits;
  loading: boolean;
  error: string | null;
  hasReachedLimit: boolean;
  addSubUser: (data: { name: string; email: string; permissions?: Record<string, boolean> }) => Promise<{ success: boolean; error?: string }>;
  updateSubUser: (subUserId: string, updates: { permissions?: Record<string, boolean>; isActive?: boolean }) => Promise<{ success: boolean; error?: string }>;
  removeSubUser: (subUserId: string) => Promise<{ success: boolean; error?: string }>;
  refresh: () => Promise<void>;
}

export function useSubUsers(): UseSubUsersReturn {
  const [subUsers, setSubUsers] = useState<SubUser[]>([]);
  const [limits, setLimits] = useState<SubUserLimits>({
    max: 2,
    current: 0,
    hasReachedLimit: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await multiTenantApi.getMyTeam();
      setSubUsers(response.subUsers);
      setLimits(response.limits);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sub-users';
      setError(errorMessage);
      console.error('Failed to fetch sub-users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubUsers();
  }, []);

  const addSubUser = async (data: { name: string; email: string; permissions?: Record<string, boolean> }) => {
    if (limits.hasReachedLimit) {
      return { success: false, error: 'Sub-user limit reached (max 2)' };
    }

    try {
      const permissions = data.permissions || {};
      await multiTenantApi.addSubUser({
        name: data.name,
        email: data.email,
        permissions: Object.keys(permissions).filter(key => permissions[key]),
      });
      await fetchSubUsers();
      return { success: true };
    } catch (err) {
      const errorMessage = (err as { response?: { data?: { message?: string } }; message?: string }).response?.data?.message 
        || (err as Error).message 
        || 'Failed to add sub-user';
      return { success: false, error: errorMessage };
    }
  };

  const updateSubUser = async (subUserId: string, updates: { permissions?: Record<string, boolean>; isActive?: boolean }) => {
    try {
      const updateData: { permissions?: string[]; isActive?: boolean } = {};
      if (updates.permissions !== undefined) {
        updateData.permissions = Object.keys(updates.permissions).filter(key => updates.permissions![key]);
      }
      if (updates.isActive !== undefined) {
        updateData.isActive = updates.isActive;
      }
      await multiTenantApi.updateSubUser(subUserId, updateData);
      await fetchSubUsers();
      return { success: true };
    } catch (err) {
      const errorMessage = (err as { response?: { data?: { message?: string } }; message?: string }).response?.data?.message 
        || (err as Error).message 
        || 'Failed to update sub-user';
      return { success: false, error: errorMessage };
    }
  };

  const removeSubUser = async (subUserId: string) => {
    try {
      await multiTenantApi.deleteSubUser(subUserId);
      await fetchSubUsers();
      return { success: true };
    } catch (err) {
      const errorMessage = (err as { response?: { data?: { message?: string } }; message?: string }).response?.data?.message 
        || (err as Error).message 
        || 'Failed to remove sub-user';
      return { success: false, error: errorMessage };
    }
  };

  return {
    subUsers,
    limits,
    loading,
    error,
    hasReachedLimit: limits.hasReachedLimit,
    addSubUser,
    updateSubUser,
    removeSubUser,
    refresh: fetchSubUsers,
  };
}
