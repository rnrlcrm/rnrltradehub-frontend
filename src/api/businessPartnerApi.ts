/**
 * Business Partner API with Multi-Branch Support
 */

import { apiClient } from './client';
import {
  EnhancedBusinessPartner,
  BusinessBranch,
  BusinessPartnerOnboardingRequest,
  BusinessPartnerUserRequest,
} from '../types/businessPartner';
import { buildQueryParams } from '../utils/apiHelpers';

export const businessPartnerApi = {
  /**
   * Get all business partners with filters
   */
  async getAllPartners(filters?: {
    businessType?: string;
    status?: string;
    search?: string;
  }): Promise<EnhancedBusinessPartner[]> {
    const queryParams = buildQueryParams(filters);
    const response = await apiClient.get<EnhancedBusinessPartner[]>(
      `/api/business-partners${queryParams}`
    );
    return response.data;
  },

  /**
   * Get business partner by ID
   */
  async getPartnerById(partnerId: string): Promise<EnhancedBusinessPartner> {
    const response = await apiClient.get<EnhancedBusinessPartner>(`/api/business-partners/${partnerId}`);
    return response.data;
  },

  /**
   * Create new business partner (onboarding)
   */
  async createPartner(partner: BusinessPartnerOnboardingRequest): Promise<{
    partner: EnhancedBusinessPartner;
    primaryUser: BusinessPartnerUserRequest;
  }> {
    const response = await apiClient.post<{
      partner: EnhancedBusinessPartner;
      primaryUser: BusinessPartnerUserRequest;
    }>('/api/business-partners', partner);
    return response.data;
  },

  /**
   * Update business partner
   */
  async updatePartner(
    partnerId: string,
    updates: Partial<EnhancedBusinessPartner>
  ): Promise<EnhancedBusinessPartner> {
    const response = await apiClient.put<EnhancedBusinessPartner>(
      `/api/business-partners/${partnerId}`,
      updates
    );
    return response.data;
  },

  /**
   * Approve business partner
   */
  async approvePartner(partnerId: string, notes?: string): Promise<EnhancedBusinessPartner> {
    const response = await apiClient.post<EnhancedBusinessPartner>(
      `/api/business-partners/${partnerId}/approve`,
      { notes }
    );
    return response.data;
  },

  /**
   * Reject business partner
   */
  async rejectPartner(partnerId: string, reason: string): Promise<EnhancedBusinessPartner> {
    const response = await apiClient.post<EnhancedBusinessPartner>(
      `/api/business-partners/${partnerId}/reject`,
      { reason }
    );
    return response.data;
  },

  /**
   * Get all branches for a partner
   */
  async getPartnerBranches(partnerId: string): Promise<BusinessBranch[]> {
    const response = await apiClient.get<BusinessBranch[]>(
      `/api/business-partners/${partnerId}/branches`
    );
    return response.data;
  },

  /**
   * Add branch to partner
   */
  async addBranch(partnerId: string, branch: Omit<BusinessBranch, 'id'>): Promise<BusinessBranch> {
    const response = await apiClient.post<BusinessBranch>(
      `/api/business-partners/${partnerId}/branches`,
      branch
    );
    return response.data;
  },

  /**
   * Update branch
   */
  async updateBranch(
    partnerId: string,
    branchId: string,
    updates: Partial<BusinessBranch>
  ): Promise<BusinessBranch> {
    const response = await apiClient.put<BusinessBranch>(
      `/api/business-partners/${partnerId}/branches/${branchId}`,
      updates
    );
    return response.data;
  },

  /**
   * Delete branch
   */
  async deleteBranch(partnerId: string, branchId: string): Promise<void> {
    await apiClient.delete(`/api/business-partners/${partnerId}/branches/${branchId}`);
  },

  /**
   * Get branch by ID
   */
  async getBranchById(partnerId: string, branchId: string): Promise<BusinessBranch> {
    const response = await apiClient.get<BusinessBranch>(
      `/api/business-partners/${partnerId}/branches/${branchId}`
    );
    return response.data;
  },

  /**
   * Approve primary user for business partner
   */
  async approvePrimaryUser(partnerId: string): Promise<{
    user: BusinessPartnerUserRequest;
    temporaryPassword: string;
  }> {
    const response = await apiClient.post<{
      user: BusinessPartnerUserRequest;
      temporaryPassword: string;
    }>(`/api/business-partners/${partnerId}/approve-user`, {});
    return response.data;
  },

  /**
   * Reject primary user for business partner
   */
  async rejectPrimaryUser(partnerId: string, reason: string): Promise<void> {
    await apiClient.post(`/api/business-partners/${partnerId}/reject-user`, { reason });
  },

  /**
   * Get partners by branch
   */
  async getPartnersByBranch(branchId: string): Promise<EnhancedBusinessPartner[]> {
    const response = await apiClient.get<EnhancedBusinessPartner[]>(
      `/api/branches/${branchId}/partners`
    );
    return response.data;
  },

  /**
   * Get all branches (for selection dropdowns)
   */
  async getAllBranches(): Promise<BusinessBranch[]> {
    const response = await apiClient.get<BusinessBranch[]>('/api/branches');
    return response.data;
  },

  /**
   * Search branches
   */
  async searchBranches(query: string, filters?: {
    state?: string;
    partnerId?: string;
  }): Promise<BusinessBranch[]> {
    const queryParams = buildQueryParams({ 
      q: query,
      ...filters
    });
    const response = await apiClient.get<BusinessBranch[]>(
      `/api/branches/search${queryParams}`
    );
    return response.data;
  },
};
