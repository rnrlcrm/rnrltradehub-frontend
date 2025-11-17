/**
 * Dynamic RBAC and Deal Access API
 * Handles module management and deal-level access control
 */

import { apiClient } from './client';
import type {
  DynamicModule,
  DynamicPermission,
  DynamicBusinessType,
  DealParticipant,
  DealAccessControl,
  TransactionVisibilityRules,
} from '../utils/dynamicRBAC';

/**
 * Module Management APIs
 */

// Get all modules for a business type
export async function getModulesForBusinessType(
  businessType: DynamicBusinessType
): Promise<DynamicModule[]> {
  const response = await apiClient.get(`/api/rbac/modules`, {
    params: { businessType },
  });
  return response.data;
}

// Get single module details
export async function getModuleDetails(moduleId: string): Promise<DynamicModule> {
  const response = await apiClient.get(`/api/rbac/modules/${moduleId}`);
  return response.data;
}

// Create new custom module (Admin only)
export async function createCustomModule(
  module: Omit<DynamicModule, 'id' | 'isSystem' | 'isActive' | 'metadata'>
): Promise<DynamicModule> {
  const response = await apiClient.post('/api/rbac/modules', module);
  return response.data;
}

// Update module (Admin only)
export async function updateModule(
  moduleId: string,
  updates: Partial<DynamicModule>
): Promise<DynamicModule> {
  const response = await apiClient.put(`/api/rbac/modules/${moduleId}`, updates);
  return response.data;
}

// Deactivate module (Admin only)
export async function deactivateModule(moduleId: string): Promise<void> {
  await apiClient.delete(`/api/rbac/modules/${moduleId}`);
}

// Reactivate module (Admin only)
export async function reactivateModule(moduleId: string): Promise<void> {
  await apiClient.post(`/api/rbac/modules/${moduleId}/reactivate`);
}

// Get all modules (Admin only - for management)
export async function getAllModules(): Promise<DynamicModule[]> {
  const response = await apiClient.get('/api/rbac/modules/all');
  return response.data;
}

/**
 * Permission Management APIs
 */

// Get permissions for a module
export async function getPermissionsForModule(
  moduleId: string,
  businessType: DynamicBusinessType
): Promise<DynamicPermission[]> {
  const response = await apiClient.get(`/api/rbac/modules/${moduleId}/permissions`, {
    params: { businessType },
  });
  return response.data;
}

// Create new custom permission (Admin only)
export async function createCustomPermission(
  permission: Omit<DynamicPermission, 'id' | 'isActive' | 'metadata'>
): Promise<DynamicPermission> {
  const response = await apiClient.post('/api/rbac/permissions', permission);
  return response.data;
}

// Update permission (Admin only)
export async function updatePermission(
  permissionId: string,
  updates: Partial<DynamicPermission>
): Promise<DynamicPermission> {
  const response = await apiClient.put(`/api/rbac/permissions/${permissionId}`, updates);
  return response.data;
}

// Get user's effective permissions
export async function getUserPermissions(
  userId: string,
  businessType: DynamicBusinessType
): Promise<{
  modules: DynamicModule[];
  permissions: Record<string, DynamicPermission[]>;
}> {
  const response = await apiClient.get(`/api/rbac/users/${userId}/permissions`, {
    params: { businessType },
  });
  return response.data;
}

/**
 * Deal Access Control APIs
 */

// Check if user can access a specific deal
export async function checkDealAccess(
  dealId: string,
  userId: string
): Promise<DealAccessControl> {
  const response = await apiClient.get(`/api/deals/${dealId}/access-check`, {
    params: { userId },
  });
  return response.data;
}

// Get user's deals (only deals they are involved in)
export async function getUserDeals(filters?: {
  role?: DealParticipant['participants'][0]['role'];
  dealType?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  perPage?: number;
}): Promise<{
  deals: Array<any>;
  total: number;
  page: number;
  perPage: number;
}> {
  const response = await apiClient.get('/api/deals/my-deals', { params: filters });
  return response.data;
}

// Get deal details with proper data masking
export async function getDealDetails(dealId: string): Promise<any> {
  const response = await apiClient.get(`/api/deals/${dealId}`);
  return response.data; // Backend automatically masks sensitive fields
}

// Get user's interaction network (for traders)
export async function getInteractionNetwork(): Promise<Array<{
  businessPartnerId: string;
  businessPartnerName: string;
  dealCount: number;
  totalValue: number;
  lastDealDate: string;
}>> {
  const response = await apiClient.get('/api/deals/interaction-network');
  return response.data;
}

// Check if user can initiate deal between parties (for traders)
export async function checkDealInitiationPermission(
  buyerId: string,
  sellerId: string
): Promise<{ allowed: boolean; reason: string }> {
  const response = await apiClient.post('/api/deals/check-initiation', {
    buyerId,
    sellerId,
  });
  return response.data;
}

/**
 * Deal Participant Management
 */

// Add participant to deal
export async function addDealParticipant(
  dealId: string,
  participant: Omit<DealParticipant['participants'][0], 'userId' | 'userName'>
): Promise<void> {
  await apiClient.post(`/api/deals/${dealId}/participants`, participant);
}

// Remove participant from deal
export async function removeDealParticipant(
  dealId: string,
  participantId: string
): Promise<void> {
  await apiClient.delete(`/api/deals/${dealId}/participants/${participantId}`);
}

// Update participant permissions
export async function updateDealParticipantPermissions(
  dealId: string,
  participantId: string,
  permissions: {
    canView?: boolean;
    canEdit?: boolean;
    canApprove?: boolean;
  }
): Promise<void> {
  await apiClient.put(
    `/api/deals/${dealId}/participants/${participantId}/permissions`,
    permissions
  );
}

// Get all participants of a deal
export async function getDealParticipants(
  dealId: string
): Promise<DealParticipant['participants']> {
  const response = await apiClient.get(`/api/deals/${dealId}/participants`);
  return response.data;
}

/**
 * Transaction Visibility Rules
 */

// Get visibility rules for user
export async function getTransactionVisibilityRules(
  userId: string,
  businessType: DynamicBusinessType
): Promise<TransactionVisibilityRules> {
  const response = await apiClient.get('/api/rbac/visibility-rules', {
    params: { userId, businessType },
  });
  return response.data;
}

// Update visibility rules (Admin only)
export async function updateVisibilityRules(
  businessType: DynamicBusinessType,
  rules: Partial<TransactionVisibilityRules>
): Promise<TransactionVisibilityRules> {
  const response = await apiClient.put('/api/rbac/visibility-rules', {
    businessType,
    ...rules,
  });
  return response.data;
}

/**
 * Deal Search with Access Control
 */

// Search deals (automatically filtered by access rights)
export async function searchDeals(criteria: {
  query?: string;
  dealType?: string;
  status?: string;
  commodity?: string;
  minValue?: number;
  maxValue?: number;
  fromDate?: string;
  toDate?: string;
  participants?: string[]; // Business partner IDs
  page?: number;
  perPage?: number;
}): Promise<{
  deals: Array<any>;
  total: number;
  page: number;
  perPage: number;
}> {
  const response = await apiClient.post('/api/deals/search', criteria);
  return response.data;
}

/**
 * Bulk Operations with Access Control
 */

// Get multiple deals (filtered by access)
export async function getDealsById(dealIds: string[]): Promise<Array<any>> {
  const response = await apiClient.post('/api/deals/bulk-get', { dealIds });
  return response.data;
}

// Bulk update deals (only allowed deals)
export async function bulkUpdateDeals(
  updates: Array<{
    dealId: string;
    changes: Record<string, any>;
  }>
): Promise<{
  successful: string[];
  failed: Array<{ dealId: string; reason: string }>;
}> {
  const response = await apiClient.post('/api/deals/bulk-update', { updates });
  return response.data;
}

/**
 * Access Audit Trail
 */

// Get access history for a deal
export async function getDealAccessHistory(
  dealId: string
): Promise<Array<{
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  accessGranted: boolean;
  reason?: string;
}>> {
  const response = await apiClient.get(`/api/deals/${dealId}/access-history`);
  return response.data;
}

// Get user's access attempts
export async function getUserAccessHistory(
  userId: string,
  fromDate?: string,
  toDate?: string
): Promise<Array<{
  id: string;
  dealId: string;
  dealNumber: string;
  action: string;
  timestamp: string;
  accessGranted: boolean;
  reason?: string;
}>> {
  const response = await apiClient.get(`/api/users/${userId}/access-history`, {
    params: { fromDate, toDate },
  });
  return response.data;
}

/**
 * Business Type Configuration
 */

// Get all configured business types
export async function getBusinessTypes(): Promise<Array<{
  id: string;
  name: string;
  displayName: string;
  description: string;
  isActive: boolean;
  isSystem: boolean;
}>> {
  const response = await apiClient.get('/api/rbac/business-types');
  return response.data;
}

// Add custom business type (Admin only)
export async function addCustomBusinessType(businessType: {
  name: string;
  displayName: string;
  description: string;
}): Promise<void> {
  await apiClient.post('/api/rbac/business-types', businessType);
}

// Update business type (Admin only)
export async function updateBusinessType(
  typeId: string,
  updates: Partial<{
    displayName: string;
    description: string;
    isActive: boolean;
  }>
): Promise<void> {
  await apiClient.put(`/api/rbac/business-types/${typeId}`, updates);
}

/**
 * Module Assignment
 */

// Assign module to business type
export async function assignModuleToBusinessType(
  moduleId: string,
  businessType: DynamicBusinessType
): Promise<void> {
  await apiClient.post(`/api/rbac/modules/${moduleId}/assign`, { businessType });
}

// Remove module from business type
export async function removeModuleFromBusinessType(
  moduleId: string,
  businessType: DynamicBusinessType
): Promise<void> {
  await apiClient.delete(`/api/rbac/modules/${moduleId}/assign`, {
    data: { businessType },
  });
}

// Get business types for a module
export async function getBusinessTypesForModule(
  moduleId: string
): Promise<DynamicBusinessType[]> {
  const response = await apiClient.get(`/api/rbac/modules/${moduleId}/business-types`);
  return response.data;
}

/**
 * Permission Check Utilities
 */

// Check if user has specific permission
export async function checkPermission(
  userId: string,
  moduleId: string,
  action: string
): Promise<boolean> {
  const response = await apiClient.get('/api/rbac/check-permission', {
    params: { userId, moduleId, action },
  });
  return response.data.hasPermission;
}

// Bulk check permissions
export async function bulkCheckPermissions(
  userId: string,
  checks: Array<{ moduleId: string; action: string }>
): Promise<Record<string, boolean>> {
  const response = await apiClient.post('/api/rbac/bulk-check-permissions', {
    userId,
    checks,
  });
  return response.data;
}

/**
 * Export/Import for Migration
 */

// Export all RBAC configuration
export async function exportRBACConfig(): Promise<{
  modules: DynamicModule[];
  permissions: DynamicPermission[];
  businessTypes: any[];
  visibilityRules: any[];
}> {
  const response = await apiClient.get('/api/rbac/export');
  return response.data;
}

// Import RBAC configuration
export async function importRBACConfig(config: {
  modules: DynamicModule[];
  permissions: DynamicPermission[];
  businessTypes: any[];
  visibilityRules: any[];
}): Promise<{
  imported: number;
  skipped: number;
  errors: string[];
}> {
  const response = await apiClient.post('/api/rbac/import', config);
  return response.data;
}
