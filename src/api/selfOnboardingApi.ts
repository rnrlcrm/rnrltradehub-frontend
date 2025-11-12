/**
 * Self-Service Onboarding API
 * Allows users to onboard themselves
 */

import { apiClient } from './client';
import { SelfOnboardingRequest, SelfOnboardingResponse } from '../types/selfOnboarding';

export const selfOnboardingApi = {
  /**
   * Self-service onboarding
   * User registers their company without back-office intervention
   */
  async selfRegister(request: SelfOnboardingRequest): Promise<SelfOnboardingResponse> {
    const formData = new FormData();
    
    // Add all text fields
    Object.keys(request).forEach(key => {
      if (key !== 'documents' && key !== 'initialBranch') {
        formData.append(key, (request as any)[key]);
      }
    });
    
    // Add initial branch if provided
    if (request.initialBranch) {
      formData.append('initialBranch', JSON.stringify(request.initialBranch));
    }
    
    // Add documents if provided
    if (request.documents) {
      if (request.documents.panCard) {
        formData.append('panCard', request.documents.panCard);
      }
      if (request.documents.gstCertificate) {
        formData.append('gstCertificate', request.documents.gstCertificate);
      }
      if (request.documents.addressProof) {
        formData.append('addressProof', request.documents.addressProof);
      }
      if (request.documents.cancelledCheque) {
        formData.append('cancelledCheque', request.documents.cancelledCheque);
      }
    }
    
    const response = await apiClient.post<SelfOnboardingResponse>(
      '/api/self-onboarding/register',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data;
  },

  /**
   * Check onboarding status
   * User can check their application status
   */
  async checkStatus(email: string): Promise<{
    partnerId: string;
    status: string;
    submittedAt: string;
    approvedAt?: string;
    rejectedAt?: string;
    rejectionReason?: string;
  }> {
    const response = await apiClient.get<any>(
      `/api/self-onboarding/status?email=${encodeURIComponent(email)}`
    );
    return response.data;
  },

  /**
   * Resend verification email
   * If user didn't receive initial email
   */
  async resendVerificationEmail(email: string): Promise<void> {
    await apiClient.post('/api/self-onboarding/resend-verification', { email });
  },

  /**
   * Upload additional documents
   * User can upload documents after initial registration
   */
  async uploadDocuments(
    partnerId: string,
    documents: {
      panCard?: File;
      gstCertificate?: File;
      addressProof?: File;
      cancelledCheque?: File;
    }
  ): Promise<void> {
    const formData = new FormData();
    
    if (documents.panCard) formData.append('panCard', documents.panCard);
    if (documents.gstCertificate) formData.append('gstCertificate', documents.gstCertificate);
    if (documents.addressProof) formData.append('addressProof', documents.addressProof);
    if (documents.cancelledCheque) formData.append('cancelledCheque', documents.cancelledCheque);
    
    await apiClient.post(
      `/api/self-onboarding/${partnerId}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  },
};
