/**
 * User Profile and KYC Management Types
 */

export type ProfileUpdateStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type KYCStatus = 'CURRENT' | 'DUE_SOON' | 'OVERDUE' | 'VERIFIED';

/**
 * User Profile with Update History
 */
export interface UserProfile {
  // Basic Info
  userId: string;
  name: string;
  email: string;
  phone: string;
  
  // Business Partner Link
  businessPartnerId: string;
  businessPartnerName: string;
  businessPartnerCode: string;
  
  // KYC Status
  kycStatus: KYCStatus;
  kycLastVerified: string; // Date of last verification
  kycNextDue: string; // Date when next KYC is due (yearly)
  kycDaysRemaining: number; // Days until KYC due
  
  // Profile Completeness
  profileCompleteness: number; // 0-100%
  missingFields: string[];
  
  // Pending Updates
  hasPendingUpdates: boolean;
  pendingUpdateCount: number;
  
  // Metadata
  createdAt: string;
  lastLoginAt: string;
  lastUpdatedAt: string;
}

/**
 * Profile Update Request
 * User can request to update their profile, requires approval
 */
export interface ProfileUpdateRequest {
  id: string;
  userId: string;
  userName: string;
  businessPartnerId: string;
  
  // What is being updated
  updateType: 'CONTACT' | 'ADDRESS' | 'COMPLIANCE' | 'DOCUMENTS' | 'BRANCH';
  
  // Current vs Proposed values
  currentValues: Record<string, any>;
  proposedValues: Record<string, any>;
  
  // Reason for update
  reason: string;
  
  // Status
  status: ProfileUpdateStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  
  // Metadata
  requestedAt: string;
  requestedFrom: string; // IP address
}

/**
 * KYC Verification Record
 */
export interface KYCVerification {
  id: string;
  businessPartnerId: string;
  businessPartnerName: string;
  
  // Verification Details
  verificationDate: string;
  nextVerificationDue: string;
  verifiedBy: string;
  verifiedByName: string;
  
  // Documents Verified
  documentsVerified: {
    panCard: boolean;
    gstCertificate: boolean;
    addressProof: boolean;
    cancelledCheque: boolean;
    others?: string[];
  };
  
  // Verification Status
  status: 'VERIFIED' | 'ISSUES_FOUND' | 'REJECTED';
  issues?: string[];
  notes: string;
  
  // Reminder Status
  reminderSent: boolean;
  reminderSentAt?: string;
  
  // Metadata
  createdAt: string;
}

/**
 * KYC Reminder Configuration
 */
export interface KYCReminderConfig {
  enabled: boolean;
  daysBeforeDue: number[]; // e.g., [30, 15, 7, 1] - send reminders 30, 15, 7, and 1 day before
  emailTemplate: string;
  escalateToAdmin: boolean;
  escalateDaysOverdue: number; // e.g., 7 - escalate to admin if 7 days overdue
}

/**
 * Profile Update Request with Details
 */
export interface DetailedProfileUpdate {
  // Update Request
  request: ProfileUpdateRequest;
  
  // User Details
  user: {
    id: string;
    name: string;
    email: string;
  };
  
  // Business Partner Details
  partner: {
    id: string;
    name: string;
    code: string;
  };
  
  // Comparison Data (for approval UI)
  changes: Array<{
    field: string;
    label: string;
    oldValue: any;
    newValue: any;
    requiresVerification: boolean;
  }>;
}

/**
 * User Dashboard Data
 */
export interface UserDashboard {
  profile: UserProfile;
  
  // Quick Stats
  stats: {
    pendingApprovals: number;
    kycStatus: KYCStatus;
    profileCompleteness: number;
    lastLogin: string;
  };
  
  // Notifications
  notifications: Array<{
    id: string;
    type: 'KYC_DUE' | 'UPDATE_APPROVED' | 'UPDATE_REJECTED' | 'PROFILE_INCOMPLETE';
    message: string;
    severity: 'info' | 'warning' | 'error';
    createdAt: string;
    read: boolean;
  }>;
  
  // Recent Activity
  recentActivity: Array<{
    id: string;
    action: string;
    timestamp: string;
    status: string;
  }>;
}
