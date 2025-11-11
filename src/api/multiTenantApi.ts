/**
 * Multi-Tenant API Client
 * Handles user management, sub-user operations, and portal data
 */

import { apiClient } from './client';
import { User, SubUser, SubUserInvitation, ActivityLogEntry, SubUserLimits, Portal } from '../types/multiTenant';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/settings';

export const multiTenantApi = {
  // Authentication
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const response = await apiClient.post<{ user: User; token: string }>(`${BASE_URL}/auth/login`, {
      email,
      password,
    });
    return response;
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>(`${BASE_URL}/users/me`);
    return response;
  },

  // Sub-User Management (Client/Vendor only)
  async getMyTeam(): Promise<{ subUsers: SubUser[]; limits: SubUserLimits }> {
    const response = await apiClient.get<{ subUsers: SubUser[]; limits: SubUserLimits }>(
      `${BASE_URL}/users/my-team`
    );
    return response;
  },

  async addSubUser(subUser: { name: string; email: string; permissions: string[] }): Promise<SubUser> {
    const response = await apiClient.post<SubUser>(`${BASE_URL}/users/my-team`, subUser);
    return response;
  },

  async updateSubUser(
    subUserId: string,
    updates: { permissions?: string[]; isActive?: boolean }
  ): Promise<SubUser> {
    const response = await apiClient.put<SubUser>(`${BASE_URL}/users/my-team/${subUserId}`, updates);
    return response;
  },

  async deleteSubUser(subUserId: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/users/my-team/${subUserId}`);
  },

  async getSubUserActivity(subUserId: string, limit: number = 50): Promise<ActivityLogEntry[]> {
    const response = await apiClient.get<ActivityLogEntry[]>(
      `${BASE_URL}/users/my-team/${subUserId}/activity?limit=${limit}`
    );
    return response;
  },

  // Portal Data
  async getPortalModules(portalType: string): Promise<Portal> {
    const response = await apiClient.get<Portal>(`${BASE_URL}/portals/${portalType}/modules`);
    return response;
  },

  // User Management (Back Office only)
  async getAllUsers(filters?: { userType?: string; isActive?: boolean }): Promise<User[]> {
    const queryParams = new URLSearchParams(filters as any).toString();
    const response = await apiClient.get<User[]>(`${BASE_URL}/users${queryParams ? `?${queryParams}` : ''}`);
    return response;
  },

  async createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const response = await apiClient.post<User>(`${BASE_URL}/users`, user);
    return response;
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const response = await apiClient.put<User>(`${BASE_URL}/users/${userId}`, updates);
    return response;
  },

  async deleteUser(userId: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/users/${userId}`);
  },
};
