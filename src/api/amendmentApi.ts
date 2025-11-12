/**
 * Amendment API
 * Handles all amendment operations with version control
 */

import { apiClient } from './client';
import {
  BusinessPartnerAmendment,
  BusinessPartnerVersion,
  AmendmentImpactReport,
  AmendmentHistory,
  TransactionLock,
} from '../types/amendment';

export const amendmentApi = {
  /**
   * Create amendment request
   * System automatically checks for ongoing transactions
   */
  async createAmendment(request: {
    partnerId: string;
    amendmentType: string;
    changes: Record<string, any>;
    reason: string;
    justification: string;
    urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    effectiveDate: string;
    attachments?: File[];
  }): Promise<BusinessPartnerAmendment> {
    const formData = new FormData();
    
    formData.append('partnerId', request.partnerId);
    formData.append('amendmentType', request.amendmentType);
    formData.append('changes', JSON.stringify(request.changes));
    formData.append('reason', request.reason);
    formData.append('justification', request.justification);
    formData.append('urgency', request.urgency);
    formData.append('effectiveDate', request.effectiveDate);
    
    if (request.attachments) {
      request.attachments.forEach((file, index) => {
        formData.append(`attachment_${index}`, file);
      });
    }
    
    const response = await apiClient.post<BusinessPartnerAmendment>(
      '/api/amendments',
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
   * Get amendment impact assessment
   * CRITICAL: Check what will be affected before creating amendment
   */
  async getImpactAssessment(
    partnerId: string,
    changes: Record<string, any>
  ): Promise<AmendmentImpactReport> {
    const response = await apiClient.post<AmendmentImpactReport>(
      `/api/amendments/impact-assessment`,
      {
        partnerId,
        changes,
      }
    );
    return response.data;
  },

  /**
   * Get pending amendments
   */
  async getPendingAmendments(filters?: {
    partnerId?: string;
    amendmentType?: string;
    urgency?: string;
  }): Promise<BusinessPartnerAmendment[]> {
    const queryParams = new URLSearchParams(filters as Record<string, string>).toString();
    const response = await apiClient.get<BusinessPartnerAmendment[]>(
      `/api/amendments/pending${queryParams ? `?${queryParams}` : ''}`
    );
    return response.data;
  },

  /**
   * Get amendment by ID
   */
  async getAmendment(amendmentId: string): Promise<BusinessPartnerAmendment> {
    const response = await apiClient.get<BusinessPartnerAmendment>(
      `/api/amendments/${amendmentId}`
    );
    return response.data;
  },

  /**
   * Approve amendment
   * System creates new version and applies changes
   */
  async approveAmendment(
    amendmentId: string,
    notes?: string
  ): Promise<BusinessPartnerAmendment> {
    const response = await apiClient.post<BusinessPartnerAmendment>(
      `/api/amendments/${amendmentId}/approve`,
      { notes }
    );
    return response.data;
  },

  /**
   * Reject amendment
   */
  async rejectAmendment(
    amendmentId: string,
    reason: string
  ): Promise<BusinessPartnerAmendment> {
    const response = await apiClient.post<BusinessPartnerAmendment>(
      `/api/amendments/${amendmentId}/reject`,
      { reason }
    );
    return response.data;
  },

  /**
   * Cancel amendment
   * Can only cancel if not yet approved
   */
  async cancelAmendment(amendmentId: string): Promise<void> {
    await apiClient.delete(`/api/amendments/${amendmentId}`);
  },

  /**
   * Get amendment history for partner
   */
  async getAmendmentHistory(partnerId: string): Promise<AmendmentHistory> {
    const response = await apiClient.get<AmendmentHistory>(
      `/api/amendments/history/${partnerId}`
    );
    return response.data;
  },

  /**
   * Get all versions of a partner
   */
  async getPartnerVersions(partnerId: string): Promise<BusinessPartnerVersion[]> {
    const response = await apiClient.get<BusinessPartnerVersion[]>(
      `/api/partners/${partnerId}/versions`
    );
    return response.data;
  },

  /**
   * Get specific version
   */
  async getPartnerVersion(
    partnerId: string,
    version: number
  ): Promise<BusinessPartnerVersion> {
    const response = await apiClient.get<BusinessPartnerVersion>(
      `/api/partners/${partnerId}/versions/${version}`
    );
    return response.data;
  },

  /**
   * Get partner data as of specific date
   * CRITICAL: Used to get partner data at transaction time
   */
  async getPartnerAsOfDate(
    partnerId: string,
    date: string
  ): Promise<BusinessPartnerVersion> {
    const response = await apiClient.get<BusinessPartnerVersion>(
      `/api/partners/${partnerId}/as-of/${date}`
    );
    return response.data;
  },

  /**
   * Get transaction locks
   * Shows what fields are locked due to ongoing transactions
   */
  async getTransactionLocks(partnerId: string): Promise<TransactionLock[]> {
    const response = await apiClient.get<TransactionLock[]>(
      `/api/partners/${partnerId}/locks`
    );
    return response.data;
  },

  /**
   * Check if amendment is allowed
   * Returns locked fields and reasons
   */
  async checkAmendmentAllowed(
    partnerId: string,
    fields: string[]
  ): Promise<{
    allowed: boolean;
    lockedFields: string[];
    reasons: string[];
  }> {
    const response = await apiClient.post<any>(
      `/api/amendments/check-allowed`,
      {
        partnerId,
        fields,
      }
    );
    return response.data;
  },

  /**
   * Compare versions
   * Shows differences between two versions
   */
  async compareVersions(
    partnerId: string,
    fromVersion: number,
    toVersion: number
  ): Promise<{
    changes: Array<{
      field: string;
      label: string;
      oldValue: any;
      newValue: any;
    }>;
  }> {
    const response = await apiClient.get<any>(
      `/api/partners/${partnerId}/compare?from=${fromVersion}&to=${toVersion}`
    );
    return response.data;
  },
};
