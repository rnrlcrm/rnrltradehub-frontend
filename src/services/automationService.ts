/**
 * Real Automation Service Implementation
 * This actually executes the automation workflows
 */

import { apiClient } from '../api/realApiClient';
import type { BusinessPartner, BusinessBranch } from '../types/businessPartner';
import type { EnhancedUser } from '../types/accessControl';
import { generatePassword, validatePasswordStrength } from '../config/security';
import { sendEmail, EmailType } from './emailService';

export class AutomationService {
  /**
   * AUTO-CREATE USER FROM BUSINESS PARTNER
   * This is the main automation that creates users when partner is approved
   */
  static async autoCreateUserFromPartner(
    partnerId: string,
    partnerData: BusinessPartner
  ): Promise<{ user: EnhancedUser; password: string }> {
    console.log(`[AUTOMATION] Starting user creation for partner: ${partnerId}`);

    try {
      // 1. Generate secure password
      const password = generatePassword();
      console.log(`[AUTOMATION] Generated secure password`);

      // 2. Create user account
      const user: Partial<EnhancedUser> = {
        email: partnerData.contactEmail,
        name: partnerData.contactPerson,
        businessPartnerId: partnerId,
        businessType: partnerData.businessType,
        role: this.mapBusinessTypeToRole(partnerData.businessType),
        branchIds: partnerData.branches?.map(b => b.id) || [],
        isFirstLogin: true,
        isActive: true,
        mustResetPassword: true,
      };

      // 3. Call API to create user
      const response = await apiClient.post<EnhancedUser>('/api/users', {
        ...user,
        password, // Backend will hash this
      });

      console.log(`[AUTOMATION] User created: ${response.data.id}`);

      // 4. Send welcome email with credentials
      await sendEmail({
        type: EmailType.WELCOME,
        to: partnerData.contactEmail,
        data: {
          userName: partnerData.contactPerson,
          email: partnerData.contactEmail,
          password,
          companyName: partnerData.legalName,
          loginUrl: `${window.location.origin}/login`,
        },
      });

      console.log(`[AUTOMATION] Welcome email sent to ${partnerData.contactEmail}`);

      // 5. Assign branch access
      if (partnerData.branches && partnerData.branches.length > 0) {
        await this.assignBranchAccess(response.data.id, partnerData.branches);
        console.log(`[AUTOMATION] Branch access assigned`);
      }

      // 6. Log audit trail
      await apiClient.post('/api/audit/log', {
        action: 'AUTO_USER_CREATION',
        entityType: 'USER',
        entityId: response.data.id,
        details: {
          partnerId,
          partnerName: partnerData.legalName,
          automated: true,
        },
      });

      return { user: response.data, password };
    } catch (error) {
      console.error('[AUTOMATION] Failed to create user:', error);
      throw error;
    }
  }

  /**
   * AUTO-ASSIGN BRANCH ACCESS
   */
  static async assignBranchAccess(
    userId: string,
    branches: BusinessBranch[]
  ): Promise<void> {
    const branchIds = branches.map(b => b.id);

    await apiClient.put(`/api/users/${userId}/branch-access`, {
      branchIds,
      dataScope: {
        ownPartnerOnly: true,
        allBranches: true,
        partnerTransactions: true,
        partnerDocuments: true,
      },
    });
  }

  /**
   * AUTO-SEND KYC REMINDERS
   * This runs as a scheduled job
   */
  static async sendKYCReminders(): Promise<void> {
    console.log('[AUTOMATION] Starting KYC reminder job');

    try {
      // Get partners with upcoming KYC due dates
      const response = await apiClient.get<BusinessPartner[]>(
        '/api/business-partners/kyc-due',
        { params: { daysAhead: 30 } }
      );

      const partners = response.data;
      console.log(`[AUTOMATION] Found ${partners.length} partners with upcoming KYC`);

      for (const partner of partners) {
        const daysUntilDue = this.calculateDaysUntilDue(partner.kycDueDate!);

        // Send reminder based on days remaining
        if ([30, 15, 7, 1].includes(daysUntilDue)) {
          await sendEmail({
            type: EmailType.KYC_REMINDER,
            to: partner.contactEmail,
            data: {
              companyName: partner.legalName,
              dueDate: partner.kycDueDate,
              daysRemaining: daysUntilDue,
              dashboardUrl: `${window.location.origin}/profile`,
            },
          });

          console.log(`[AUTOMATION] KYC reminder sent to ${partner.contactEmail} (${daysUntilDue} days)`);
        }

        // Escalate if overdue
        if (daysUntilDue < 0) {
          await this.escalateOverdueKYC(partner);
        }
      }
    } catch (error) {
      console.error('[AUTOMATION] KYC reminder job failed:', error);
    }
  }

  /**
   * AUTO-VALIDATE DATA
   */
  static async autoValidateData(data: {
    pan?: string;
    gst?: string;
    phone?: string;
    email?: string;
  }): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // PAN validation
    if (data.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(data.pan)) {
      errors.push('Invalid PAN format');
    }

    // GST validation
    if (data.gst && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]{3}$/.test(data.gst)) {
      errors.push('Invalid GST format');
    }

    // Phone validation
    if (data.phone && !/^[6-9]\d{9}$/.test(data.phone)) {
      errors.push('Invalid phone number');
    }

    // Email validation
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Invalid email format');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * AUTO-APPROVE LOW-RISK REQUESTS
   * Automatically approve requests that meet criteria
   */
  static async autoApproveIfEligible(
    requestType: 'PARTNER' | 'USER' | 'AMENDMENT',
    requestId: string
  ): Promise<boolean> {
    try {
      // Check auto-approval criteria
      const response = await apiClient.post('/api/approvals/check-auto-eligibility', {
        requestType,
        requestId,
      });

      const { eligible, score, reasons } = response.data;

      if (eligible && score >= 80) {
        // Auto-approve
        await apiClient.post(`/api/approvals/${requestId}/auto-approve`, {
          score,
          reasons,
          automated: true,
        });

        console.log(`[AUTOMATION] Auto-approved ${requestType} request ${requestId}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('[AUTOMATION] Auto-approval check failed:', error);
      return false;
    }
  }

  /**
   * Helper: Map business type to role
   */
  private static mapBusinessTypeToRole(businessType: string): string {
    const roleMap: Record<string, string> = {
      BUYER: 'Buyer',
      SELLER: 'Seller',
      TRADER: 'Trader',
      SUB_BROKER: 'Broker',
      TRANSPORTER: 'Transporter',
      CONTROLLER: 'Quality Controller',
    };
    return roleMap[businessType] || 'User';
  }

  /**
   * Helper: Calculate days until due
   */
  private static calculateDaysUntilDue(dueDate: string): number {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Helper: Escalate overdue KYC
   */
  private static async escalateOverdueKYC(partner: BusinessPartner): Promise<void> {
    // Notify admins
    await apiClient.post('/api/notifications/escalate-kyc', {
      partnerId: partner.id,
      partnerName: partner.legalName,
      daysOverdue: Math.abs(this.calculateDaysUntilDue(partner.kycDueDate!)),
    });

    // Lock account if severely overdue (>30 days)
    if (this.calculateDaysUntilDue(partner.kycDueDate!) < -30) {
      await apiClient.put(`/api/business-partners/${partner.id}/lock`, {
        reason: 'KYC verification overdue',
      });
    }
  }
}

/**
 * Background Job Scheduler
 * Runs automation tasks periodically
 */
export class AutomationScheduler {
  private static jobs: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Start all scheduled jobs
   */
  static startAll(): void {
    // KYC reminders - run daily at 9 AM
    this.schedule('kyc-reminders', () => {
      AutomationService.sendKYCReminders();
    }, 24 * 60 * 60 * 1000); // 24 hours

    console.log('[AUTOMATION] Scheduler started');
  }

  /**
   * Stop all jobs
   */
  static stopAll(): void {
    this.jobs.forEach((timeout) => clearInterval(timeout));
    this.jobs.clear();
    console.log('[AUTOMATION] Scheduler stopped');
  }

  /**
   * Schedule a job
   */
  private static schedule(name: string, fn: () => void, interval: number): void {
    const job = setInterval(fn, interval);
    this.jobs.set(name, job);
  }
}

export default AutomationService;
