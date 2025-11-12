/**
 * Access Control API
 * User management, roles, permissions, and approval workflows
 */

import { apiClient } from './client';
import {
  EnhancedUser,
  UserRole,
  SubUserInvite,
  ApprovalWorkflow,
  DataIsolationRule,
} from '../types/accessControl';
import { buildQueryParams } from '../utils/apiHelpers';

export const accessControlApi = {
  // ========== User Management ==========
  
  /**
   * Get all users with filters
   */
  async getAllUsers(filters?: {
    userType?: string;
    status?: string;
    businessPartnerId?: string;
    search?: string;
  }): Promise<EnhancedUser[]> {
    const queryParams = buildQueryParams(filters);
    const response = await apiClient.get<EnhancedUser[]>(
      `/api/users${queryParams}`
    );
    return response.data;
  },

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<EnhancedUser> {
    const response = await apiClient.get<EnhancedUser>(`/api/users/${userId}`);
    return response.data;
  },

  /**
   * Create user (manual - back office only)
   */
  async createUser(user: Partial<EnhancedUser>): Promise<EnhancedUser> {
    const response = await apiClient.post<EnhancedUser>('/api/users', user);
    return response.data;
  },

  /**
   * Update user
   */
  async updateUser(userId: string, updates: Partial<EnhancedUser>): Promise<EnhancedUser> {
    const response = await apiClient.put<EnhancedUser>(`/api/users/${userId}`, updates);
    return response.data;
  },

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<void> {
    await apiClient.delete(`/api/users/${userId}`);
  },

  /**
   * Suspend user
   */
  async suspendUser(userId: string, reason: string): Promise<EnhancedUser> {
    const response = await apiClient.post<EnhancedUser>(`/api/users/${userId}/suspend`, {
      reason,
    });
    return response.data;
  },

  /**
   * Activate user
   */
  async activateUser(userId: string): Promise<EnhancedUser> {
    const response = await apiClient.post<EnhancedUser>(`/api/users/${userId}/activate`, {});
    return response.data;
  },

  // ========== Sub-User Management ==========

  /**
   * Get sub-users for current user
   */
  async getMySubUsers(): Promise<EnhancedUser[]> {
    const response = await apiClient.get<EnhancedUser[]>('/api/users/me/sub-users');
    return response.data;
  },

  /**
   * Invite sub-user
   */
  async inviteSubUser(invite: {
    email: string;
    name: string;
    branchIds: string[];
    permissions: string[];
  }): Promise<SubUserInvite> {
    const response = await apiClient.post<SubUserInvite>('/api/users/me/sub-users/invite', invite);
    return response.data;
  },

  /**
   * Accept sub-user invitation
   */
  async acceptSubUserInvite(token: string, password: string): Promise<EnhancedUser> {
    const response = await apiClient.post<EnhancedUser>('/api/users/sub-users/accept', {
      token,
      password,
    });
    return response.data;
  },

  /**
   * Update sub-user
   */
  async updateSubUser(subUserId: string, updates: {
    branchIds?: string[];
    permissions?: string[];
    status?: string;
  }): Promise<EnhancedUser> {
    const response = await apiClient.put<EnhancedUser>(
      `/api/users/me/sub-users/${subUserId}`,
      updates
    );
    return response.data;
  },

  /**
   * Delete sub-user
   */
  async deleteSubUser(subUserId: string): Promise<void> {
    await apiClient.delete(`/api/users/me/sub-users/${subUserId}`);
  },

  // ========== Role Management ==========

  /**
   * Get all roles
   */
  async getAllRoles(): Promise<UserRole[]> {
    const response = await apiClient.get<UserRole[]>('/api/roles');
    return response.data;
  },

  /**
   * Get role by ID
   */
  async getRoleById(roleId: string): Promise<UserRole> {
    const response = await apiClient.get<UserRole>(`/api/roles/${roleId}`);
    return response.data;
  },

  /**
   * Create role
   */
  async createRole(role: Omit<UserRole, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserRole> {
    const response = await apiClient.post<UserRole>('/api/roles', role);
    return response.data;
  },

  /**
   * Update role
   */
  async updateRole(roleId: string, updates: Partial<UserRole>): Promise<UserRole> {
    const response = await apiClient.put<UserRole>(`/api/roles/${roleId}`, updates);
    return response.data;
  },

  /**
   * Delete role
   */
  async deleteRole(roleId: string): Promise<void> {
    await apiClient.delete(`/api/roles/${roleId}`);
  },

  // ========== Approval Workflows ==========

  /**
   * Get pending approvals
   */
  async getPendingApprovals(): Promise<ApprovalWorkflow[]> {
    const response = await apiClient.get<ApprovalWorkflow[]>('/api/approvals/pending');
    return response.data;
  },

  /**
   * Approve request
   */
  async approveRequest(approvalId: string, notes?: string): Promise<ApprovalWorkflow> {
    const response = await apiClient.post<ApprovalWorkflow>(
      `/api/approvals/${approvalId}/approve`,
      { notes }
    );
    return response.data;
  },

  /**
   * Reject request
   */
  async rejectRequest(approvalId: string, reason: string): Promise<ApprovalWorkflow> {
    const response = await apiClient.post<ApprovalWorkflow>(
      `/api/approvals/${approvalId}/reject`,
      { reason }
    );
    return response.data;
  },

  /**
   * Get approval history
   */
  async getApprovalHistory(filters?: {
    requestType?: string;
    status?: string;
  }): Promise<ApprovalWorkflow[]> {
    const queryParams = buildQueryParams(filters);
    const response = await apiClient.get<ApprovalWorkflow[]>(
      `/api/approvals/history${queryParams}`
    );
    return response.data;
  },

  // ========== Data Isolation ==========

  /**
   * Get data isolation rules for user
   */
  async getDataIsolationRules(userId: string): Promise<DataIsolationRule> {
    const response = await apiClient.get<DataIsolationRule>(
      `/api/users/${userId}/data-isolation`
    );
    return response.data;
  },

  /**
   * Update data isolation rules
   */
  async updateDataIsolationRules(
    userId: string,
    rules: Partial<DataIsolationRule>
  ): Promise<DataIsolationRule> {
    const response = await apiClient.put<DataIsolationRule>(
      `/api/users/${userId}/data-isolation`,
      rules
    );
    return response.data;
  },

  /**
   * Get users by branch
   */
  async getUsersByBranch(branchId: string): Promise<EnhancedUser[]> {
    const response = await apiClient.get<EnhancedUser[]>(`/api/branches/${branchId}/users`);
    return response.data;
  },
};
