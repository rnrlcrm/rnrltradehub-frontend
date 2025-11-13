/**
 * Complete Business Partner API
 * With Verification, KYC, Change Requests, Sub-Broker Support
 */

import { apiClient } from './client';
import {
  BusinessPartner,
  PartnerRegistrationRequest,
  RegistrationResponse,
  VerificationRequest,
  VerificationResponse,
  SendOTPRequest,
  ChangeRequest,
  KYCRecord,
  SubUser,
  BusinessBranch,
  DocumentRecord,
  PartnerFilters,
  PartnerStatistics,
  SubBrokerUserRegistration,
  ChatbotCommand,
} from '../types/businessPartner';

export const businessPartnerApi = {
  // ==================== REGISTRATION ====================
  
  /**
   * Step 1: Start registration (self-service or chatbot)
   * Returns partner ID for verification flow
   */
  async startRegistration(data: PartnerRegistrationRequest): Promise<RegistrationResponse> {
    const response = await apiClient.post<RegistrationResponse>(
      '/api/partners/register/start',
      data
    );
    return response.data;
  },

  /**
   * Send OTP for verification
   */
  async sendOTP(request: SendOTPRequest): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/api/partners/verification/send-otp', request);
    return response.data;
  },

  /**
   * Verify OTP (email or mobile)
   */
  async verifyOTP(request: VerificationRequest): Promise<VerificationResponse> {
    const response = await apiClient.post<VerificationResponse>(
      '/api/partners/verification/verify-otp',
      request
    );
    return response.data;
  },

  /**
   * Complete registration after verification
   * Submits for admin approval
   */
  async completeRegistration(partnerId: string): Promise<BusinessPartner> {
    const response = await apiClient.post<BusinessPartner>(
      `/api/partners/${partnerId}/complete`,
      {}
    );
    return response.data;
  },

  // ==================== PARTNER MANAGEMENT ====================

  /**
   * Get all partners with advanced filters
   */
  async getAllPartners(filters?: PartnerFilters): Promise<BusinessPartner[]> {
    const queryParams = new URLSearchParams(filters as any).toString();
    const response = await apiClient.get<BusinessPartner[]>(
      `/api/partners${queryParams ? `?${queryParams}` : ''}`
    );
    return response.data;
  },

  /**
   * Get partner by ID
   */
  async getPartnerById(partnerId: string): Promise<BusinessPartner> {
    const response = await apiClient.get<BusinessPartner>(`/api/partners/${partnerId}`);
    return response.data;
  },

  /**
   * Get partner statistics
   */
  async getStatistics(): Promise<PartnerStatistics> {
    const response = await apiClient.get<PartnerStatistics>('/api/partners/statistics');
    return response.data;
  },

  /**
   * Search partners
   */
  async searchPartners(query: string): Promise<BusinessPartner[]> {
    const response = await apiClient.get<BusinessPartner[]>(`/api/partners/search?q=${query}`);
    return response.data;
  },

  // ==================== APPROVAL WORKFLOW ====================

  /**
   * Get pending approvals
   */
  async getPendingApprovals(): Promise<BusinessPartner[]> {
    const response = await apiClient.get<BusinessPartner[]>('/api/partners/pending-approvals');
    return response.data;
  },

  /**
   * Approve partner registration
   * Creates primary user account and sends welcome email
   */
  async approvePartner(
    partnerId: string,
    notes?: string
  ): Promise<{ partner: BusinessPartner; primaryUser: SubUser; temporaryPassword: string }> {
    const response = await apiClient.post(`/api/partners/${partnerId}/approve`, { notes });
    return response.data;
  },

  /**
   * Reject partner registration
   */
  async rejectPartner(partnerId: string, reason: string): Promise<BusinessPartner> {
    const response = await apiClient.post<BusinessPartner>(
      `/api/partners/${partnerId}/reject`,
      { reason }
    );
    return response.data;
  },

  // ==================== CHANGE REQUESTS ====================

  /**
   * Create change request for profile edit
   */
  async createChangeRequest(
    partnerId: string,
    changes: any,
    notes?: string
  ): Promise<ChangeRequest> {
    const response = await apiClient.post<ChangeRequest>(
      `/api/partners/${partnerId}/change-requests`,
      { changes, notes }
    );
    return response.data;
  },

  /**
   * Get change requests for partner
   */
  async getChangeRequests(partnerId: string): Promise<ChangeRequest[]> {
    const response = await apiClient.get<ChangeRequest[]>(
      `/api/partners/${partnerId}/change-requests`
    );
    return response.data;
  },

  /**
   * Get all pending change requests (admin)
   */
  async getAllPendingChangeRequests(): Promise<ChangeRequest[]> {
    const response = await apiClient.get<ChangeRequest[]>('/api/partners/change-requests/pending');
    return response.data;
  },

  /**
   * Approve change request
   */
  async approveChangeRequest(
    changeRequestId: string,
    notes?: string
  ): Promise<ChangeRequest> {
    const response = await apiClient.post<ChangeRequest>(
      `/api/partners/change-requests/${changeRequestId}/approve`,
      { notes }
    );
    return response.data;
  },

  /**
   * Reject change request
   */
  async rejectChangeRequest(
    changeRequestId: string,
    reason: string
  ): Promise<ChangeRequest> {
    const response = await apiClient.post<ChangeRequest>(
      `/api/partners/change-requests/${changeRequestId}/reject`,
      { reason }
    );
    return response.data;
  },

  // ==================== KYC MANAGEMENT ====================

  /**
   * Get current KYC status
   */
  async getCurrentKYC(partnerId: string): Promise<KYCRecord | null> {
    const response = await apiClient.get<KYCRecord | null>(
      `/api/partners/${partnerId}/kyc/current`
    );
    return response.data;
  },

  /**
   * Get KYC history
   */
  async getKYCHistory(partnerId: string): Promise<KYCRecord[]> {
    const response = await apiClient.get<KYCRecord[]>(`/api/partners/${partnerId}/kyc/history`);
    return response.data;
  },

  /**
   * Start KYC renewal
   */
  async startKYCRenewal(partnerId: string): Promise<KYCRecord> {
    const response = await apiClient.post<KYCRecord>(
      `/api/partners/${partnerId}/kyc/renew`,
      {}
    );
    return response.data;
  },

  /**
   * Submit KYC documents
   */
  async submitKYCDocuments(
    partnerId: string,
    kycId: string,
    documents: { documentType: string; file: File }[]
  ): Promise<KYCRecord> {
    const formData = new FormData();
    documents.forEach((doc, index) => {
      formData.append(`documents[${index}][type]`, doc.documentType);
      formData.append(`documents[${index}][file]`, doc.file);
    });

    const response = await apiClient.post<KYCRecord>(
      `/api/partners/${partnerId}/kyc/${kycId}/documents`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  /**
   * Get partners with expiring KYC
   */
  async getExpiringKYC(days: number = 30): Promise<BusinessPartner[]> {
    const response = await apiClient.get<BusinessPartner[]>(
      `/api/partners/kyc/expiring?days=${days}`
    );
    return response.data;
  },

  /**
   * Complete KYC verification (admin)
   */
  async verifyKYC(
    partnerId: string,
    kycId: string,
    notes: string
  ): Promise<KYCRecord> {
    const response = await apiClient.post<KYCRecord>(
      `/api/partners/${partnerId}/kyc/${kycId}/verify`,
      { notes }
    );
    return response.data;
  },

  // ==================== SUB-USER MANAGEMENT ====================

  /**
   * Add sub-user (only after partner approval)
   */
  async addSubUser(partnerId: string, subUser: Omit<SubUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<SubUser> {
    const response = await apiClient.post<SubUser>(
      `/api/partners/${partnerId}/sub-users`,
      subUser
    );
    return response.data;
  },

  /**
   * Get sub-users for partner
   */
  async getSubUsers(partnerId: string): Promise<SubUser[]> {
    const response = await apiClient.get<SubUser[]>(`/api/partners/${partnerId}/sub-users`);
    return response.data;
  },

  /**
   * Update sub-user
   */
  async updateSubUser(
    partnerId: string,
    subUserId: string,
    updates: Partial<SubUser>
  ): Promise<SubUser> {
    const response = await apiClient.put<SubUser>(
      `/api/partners/${partnerId}/sub-users/${subUserId}`,
      updates
    );
    return response.data;
  },

  /**
   * Delete sub-user
   */
  async deleteSubUser(partnerId: string, subUserId: string): Promise<void> {
    await apiClient.delete(`/api/partners/${partnerId}/sub-users/${subUserId}`);
  },

  /**
   * Approve sub-user (admin)
   */
  async approveSubUser(partnerId: string, subUserId: string): Promise<SubUser> {
    const response = await apiClient.post<SubUser>(
      `/api/partners/${partnerId}/sub-users/${subUserId}/approve`,
      {}
    );
    return response.data;
  },

  // ==================== BRANCH MANAGEMENT ====================

  /**
   * Get branches for partner
   */
  async getBranches(partnerId: string): Promise<BusinessBranch[]> {
    const response = await apiClient.get<BusinessBranch[]>(
      `/api/partners/${partnerId}/branches`
    );
    return response.data;
  },

  /**
   * Add branch
   */
  async addBranch(partnerId: string, branch: Omit<BusinessBranch, 'id'>): Promise<BusinessBranch> {
    const response = await apiClient.post<BusinessBranch>(
      `/api/partners/${partnerId}/branches`,
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
      `/api/partners/${partnerId}/branches/${branchId}`,
      updates
    );
    return response.data;
  },

  /**
   * Delete branch
   */
  async deleteBranch(partnerId: string, branchId: string): Promise<void> {
    await apiClient.delete(`/api/partners/${partnerId}/branches/${branchId}`);
  },

  // ==================== DOCUMENT MANAGEMENT ====================

  /**
   * Upload document
   */
  async uploadDocument(
    partnerId: string,
    documentType: string,
    file: File
  ): Promise<DocumentRecord> {
    const formData = new FormData();
    formData.append('documentType', documentType);
    formData.append('file', file);

    const response = await apiClient.post<DocumentRecord>(
      `/api/partners/${partnerId}/documents`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  /**
   * Get documents
   */
  async getDocuments(partnerId: string): Promise<DocumentRecord[]> {
    const response = await apiClient.get<DocumentRecord[]>(
      `/api/partners/${partnerId}/documents`
    );
    return response.data;
  },

  /**
   * Delete document
   */
  async deleteDocument(partnerId: string, documentId: string): Promise<void> {
    await apiClient.delete(`/api/partners/${partnerId}/documents/${documentId}`);
  },

  /**
   * Verify document (admin)
   */
  async verifyDocument(
    partnerId: string,
    documentId: string,
    notes: string
  ): Promise<DocumentRecord> {
    const response = await apiClient.post<DocumentRecord>(
      `/api/partners/${partnerId}/documents/${documentId}/verify`,
      { notes }
    );
    return response.data;
  },

  // ==================== SUB-BROKER FEATURES ====================

  /**
   * Register user as sub-broker
   * Sub-brokers can register Buyer/Seller/Trader users
   */
  async subBrokerRegisterUser(data: SubBrokerUserRegistration): Promise<RegistrationResponse> {
    const response = await apiClient.post<RegistrationResponse>(
      '/api/partners/sub-broker/register-user',
      data
    );
    return response.data;
  },

  /**
   * Get users registered by sub-broker
   */
  async getSubBrokerUsers(subBrokerId: string): Promise<BusinessPartner[]> {
    const response = await apiClient.get<BusinessPartner[]>(
      `/api/partners/${subBrokerId}/registered-users`
    );
    return response.data;
  },

  // ==================== CHATBOT INTEGRATION ====================

  /**
   * Process chatbot command for registration
   */
  async processChatbotCommand(command: ChatbotCommand): Promise<any> {
    const response = await apiClient.post('/api/partners/chatbot/command', command);
    return response.data;
  },

  /**
   * Get registration status for chatbot
   */
  async getChatbotRegistrationStatus(conversationId: string): Promise<any> {
    const response = await apiClient.get(
      `/api/partners/chatbot/status/${conversationId}`
    );
    return response.data;
  },

  // ==================== BACK OFFICE ====================

  /**
   * Create partner from back office
   */
  async backOfficeCreatePartner(data: PartnerRegistrationRequest): Promise<BusinessPartner> {
    const response = await apiClient.post<BusinessPartner>(
      '/api/partners/back-office/create',
      data
    );
    return response.data;
  },

  /**
   * Save as draft (back office only)
   */
  async saveDraft(data: Partial<PartnerRegistrationRequest>): Promise<BusinessPartner> {
    const response = await apiClient.post<BusinessPartner>(
      '/api/partners/back-office/draft',
      data
    );
    return response.data;
  },

  /**
   * Get drafts (back office)
   */
  async getDrafts(): Promise<BusinessPartner[]> {
    const response = await apiClient.get<BusinessPartner[]>('/api/partners/back-office/drafts');
    return response.data;
  },

  // ==================== CERTIFICATIONS (After Approval) ====================

  /**
   * Get all certifications for a partner
   */
  async getCertifications(partnerId: string): Promise<{ data: any[] }> {
    const response = await apiClient.get(`/api/partners/${partnerId}/certifications`);
    return { data: response.data || [] };
  },

  /**
   * Add new certification (user after approval)
   * Back office will be notified for verification
   */
  async addCertification(partnerId: string, certification: any): Promise<any> {
    const response = await apiClient.post(
      `/api/partners/${partnerId}/certifications`,
      certification
    );
    return response.data;
  },

  /**
   * Update certification
   */
  async updateCertification(
    partnerId: string,
    certificationId: string,
    updates: any
  ): Promise<any> {
    const response = await apiClient.put(
      `/api/partners/${partnerId}/certifications/${certificationId}`,
      updates
    );
    return response.data;
  },

  /**
   * Delete certification
   */
  async deleteCertification(partnerId: string, certificationId: string): Promise<void> {
    await apiClient.delete(`/api/partners/${partnerId}/certifications/${certificationId}`);
  },

  /**
   * Upload document (generic - used for certifications too)
   */
  async uploadDocument(partnerId: string, file: File, documentType: string): Promise<{ data: { fileUrl: string } }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    
    const response = await apiClient.post(
      `/api/partners/${partnerId}/documents/upload`,
      formData
    );
    return { data: { fileUrl: response.data.fileUrl || '' } };
  },

  // ==================== BACK OFFICE - CERTIFICATION VERIFICATION ====================

  /**
   * Get pending certifications for verification (Back Office)
   */
  async getPendingCertifications(): Promise<any[]> {
    const response = await apiClient.get('/api/partners/certifications/pending');
    return response.data;
  },

  /**
   * Verify certification (Back Office)
   */
  async verifyCertification(
    partnerId: string,
    certificationId: string,
    notes?: string
  ): Promise<void> {
    await apiClient.post(
      `/api/partners/${partnerId}/certifications/${certificationId}/verify`,
      { notes }
    );
  },

  /**
   * Reject certification (Back Office)
   */
  async rejectCertification(
    partnerId: string,
    certificationId: string,
    reason: string
  ): Promise<void> {
    await apiClient.post(
      `/api/partners/${partnerId}/certifications/${certificationId}/reject`,
      { reason }
    );
  },
};

