/**
 * User Profile and KYC Management API
 */

import { apiClient } from './client';
import {
  UserProfile,
  ProfileUpdateRequest,
  DetailedProfileUpdate,
  KYCVerification,
  KYCReminderConfig,
  UserDashboard,
} from '../types/userProfile';

export const userProfileApi = {
  /**
   * Get current user's profile
   */
  async getMyProfile(): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>('/api/profile/me');
    return response.data;
  },

  /**
   * Get user dashboard data
   */
  async getMyDashboard(): Promise<UserDashboard> {
    const response = await apiClient.get<UserDashboard>('/api/profile/me/dashboard');
    return response.data;
  },

  /**
   * Request profile update
   * User submits changes, goes to approval queue
   */
  async requestProfileUpdate(updates: {
    updateType: 'CONTACT' | 'ADDRESS' | 'COMPLIANCE' | 'DOCUMENTS' | 'BRANCH';
    proposedValues: Record<string, any>;
    reason: string;
  }): Promise<ProfileUpdateRequest> {
    const response = await apiClient.post<ProfileUpdateRequest>(
      '/api/profile/me/update-request',
      updates
    );
    return response.data;
  },

  /**
   * Get user's pending update requests
   */
  async getMyPendingUpdates(): Promise<ProfileUpdateRequest[]> {
    const response = await apiClient.get<ProfileUpdateRequest[]>(
      '/api/profile/me/pending-updates'
    );
    return response.data;
  },

  /**
   * Cancel pending update request
   */
  async cancelUpdateRequest(requestId: string): Promise<void> {
    await apiClient.delete(`/api/profile/me/update-request/${requestId}`);
  },

  /**
   * Get KYC status
   */
  async getMyKYCStatus(): Promise<KYCVerification> {
    const response = await apiClient.get<KYCVerification>('/api/profile/me/kyc');
    return response.data;
  },

  /**
   * Update profile documents
   * Documents go through approval
   */
  async uploadDocuments(documents: {
    panCard?: File;
    gstCertificate?: File;
    addressProof?: File;
    cancelledCheque?: File;
  }): Promise<ProfileUpdateRequest> {
    const formData = new FormData();
    
    if (documents.panCard) formData.append('panCard', documents.panCard);
    if (documents.gstCertificate) formData.append('gstCertificate', documents.gstCertificate);
    if (documents.addressProof) formData.append('addressProof', documents.addressProof);
    if (documents.cancelledCheque) formData.append('cancelledCheque', documents.cancelledCheque);
    
    const response = await apiClient.post<ProfileUpdateRequest>(
      '/api/profile/me/documents',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // ========== Back Office APIs ==========

  /**
   * Get all pending profile update requests (Admin only)
   */
  async getAllPendingUpdates(filters?: {
    updateType?: string;
    businessPartnerId?: string;
    userId?: string;
  }): Promise<DetailedProfileUpdate[]> {
    const queryParams = new URLSearchParams(filters as Record<string, string>).toString();
    const response = await apiClient.get<DetailedProfileUpdate[]>(
      `/api/admin/profile-updates/pending${queryParams ? `?${queryParams}` : ''}`
    );
    return response.data;
  },

  /**
   * Approve profile update request (Admin only)
   */
  async approveProfileUpdate(
    requestId: string,
    notes?: string
  ): Promise<ProfileUpdateRequest> {
    const response = await apiClient.post<ProfileUpdateRequest>(
      `/api/admin/profile-updates/${requestId}/approve`,
      { notes }
    );
    return response.data;
  },

  /**
   * Reject profile update request (Admin only)
   */
  async rejectProfileUpdate(
    requestId: string,
    reason: string
  ): Promise<ProfileUpdateRequest> {
    const response = await apiClient.post<ProfileUpdateRequest>(
      `/api/admin/profile-updates/${requestId}/reject`,
      { reason }
    );
    return response.data;
  },

  /**
   * Get KYC due list (Admin only)
   */
  async getKYCDueList(filters?: {
    status?: 'CURRENT' | 'DUE_SOON' | 'OVERDUE';
    daysRange?: number; // e.g., 30 = due in next 30 days
  }): Promise<Array<{
    partnerId: string;
    partnerName: string;
    partnerCode: string;
    kycStatus: string;
    kycLastVerified: string;
    kycNextDue: string;
    daysRemaining: number;
  }>> {
    const queryParams = new URLSearchParams(filters as Record<string, string>).toString();
    const response = await apiClient.get<any[]>(
      `/api/admin/kyc/due-list${queryParams ? `?${queryParams}` : ''}`
    );
    return response.data;
  },

  /**
   * Verify KYC (Admin only)
   */
  async verifyKYC(partnerId: string, verification: {
    documentsVerified: Record<string, boolean>;
    status: 'VERIFIED' | 'ISSUES_FOUND' | 'REJECTED';
    issues?: string[];
    notes: string;
  }): Promise<KYCVerification> {
    const response = await apiClient.post<KYCVerification>(
      `/api/admin/kyc/${partnerId}/verify`,
      verification
    );
    return response.data;
  },

  /**
   * Send KYC reminder manually (Admin only)
   */
  async sendKYCReminder(partnerId: string): Promise<void> {
    await apiClient.post(`/api/admin/kyc/${partnerId}/send-reminder`, {});
  },

  /**
   * Get KYC reminder configuration (Admin only)
   */
  async getKYCReminderConfig(): Promise<KYCReminderConfig> {
    const response = await apiClient.get<KYCReminderConfig>('/api/admin/kyc/reminder-config');
    return response.data;
  },

  /**
   * Update KYC reminder configuration (Admin only)
   */
  async updateKYCReminderConfig(config: Partial<KYCReminderConfig>): Promise<KYCReminderConfig> {
    const response = await apiClient.put<KYCReminderConfig>(
      '/api/admin/kyc/reminder-config',
      config
    );
    return response.data;
  },

  /**
   * Get KYC history for a partner (Admin only)
   */
  async getKYCHistory(partnerId: string): Promise<KYCVerification[]> {
    const response = await apiClient.get<KYCVerification[]>(
      `/api/admin/kyc/${partnerId}/history`
    );
    return response.data;
  },
};
