/**
 * Multi-Tenant API Client
 * Handles user management, sub-user operations, and portal data
 */

import { apiClient } from './client';
import { User, SubUser, SubUserInvitation, ActivityLogEntry, SubUserLimits, Portal } from '../types/multiTenant';

export const multiTenantApi = {
  // Authentication
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const response = await apiClient.post<{ user: User; token: string }>('/api/settings/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/api/settings/users/me');
    return response.data;
  },

  // Sub-User Management (Client/Vendor only)
  async getMyTeam(): Promise<{ subUsers: SubUser[]; limits: SubUserLimits }> {
    const response = await apiClient.get<{ subUsers: SubUser[]; limits: SubUserLimits }>(
      '/api/settings/users/my-team'
    );
    return response.data;
  },

  async addSubUser(subUser: { name: string; email: string; permissions: string[] }): Promise<SubUser> {
    const response = await apiClient.post<SubUser>('/api/settings/users/my-team', subUser);
    return response.data;
  },

  async updateSubUser(
    subUserId: string,
    updates: { permissions?: string[]; isActive?: boolean }
  ): Promise<SubUser> {
    const response = await apiClient.put<SubUser>(`/api/settings/users/my-team/${subUserId}`, updates);
    return response.data;
  },

  async deleteSubUser(subUserId: string): Promise<void> {
    await apiClient.delete(`/api/settings/users/my-team/${subUserId}`);
  },

  async getSubUserActivity(subUserId: string, limit: number = 50): Promise<ActivityLogEntry[]> {
    const response = await apiClient.get<ActivityLogEntry[]>(
      `/api/settings/users/my-team/${subUserId}/activity?limit=${limit}`
    );
    return response.data;
  },

  // Portal Data
  async getPortalModules(portalType: string): Promise<Portal> {
    const response = await apiClient.get<Portal>(`/api/settings/portals/${portalType}/modules`);
    return response.data;
  },

  // User Management (Back Office only)
  async getAllUsers(filters?: { userType?: string; isActive?: boolean }): Promise<User[]> {
    const queryParams = new URLSearchParams(filters as any).toString();
    const response = await apiClient.get<User[]>(`/api/settings/users${queryParams ? `?${queryParams}` : ''}`);
    return response.data;
  },

  async createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const response = await apiClient.post<User>('/api/settings/users', user);
    return response.data;
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const response = await apiClient.put<User>(`/api/settings/users/${userId}`, updates);
    return response.data;
  },

  async deleteUser(userId: string): Promise<void> {
    await apiClient.delete(`/api/settings/users/${userId}`);
  },
};
