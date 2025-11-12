/**
 * Business Partner Amendment System
 * Critical: Amendments must not affect ongoing transactions
 * All changes versioned and require approval
 */

export type AmendmentStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'ACTIVE';
export type AmendmentType = 'CONTACT' | 'ADDRESS' | 'COMPLIANCE' | 'BRANCH' | 'BANKING' | 'DOCUMENTS';

/**
 * Business Partner Version
 * Maintains complete history of partner data
 */
export interface BusinessPartnerVersion {
  id: string;
  partnerId: string;
  version: number;
  
  // Complete snapshot of partner data at this version
  data: {
    legalName: string;
    tradeName?: string;
    businessType: string;
    contactPerson: string;
    contactEmail: string;
    contactPhone: string;
    registeredAddress: any;
    pan: string;
    gst?: string;
    cin?: string;
    branches: any[];
    documents: any;
    // ... all other fields
  };
  
  // Version metadata
  effectiveFrom: string; // When this version became active
  effectiveTo?: string; // When superseded by next version (null = current)
  isActive: boolean; // Only one version active at a time
  
  // Amendment tracking
  amendmentId?: string; // Link to amendment that created this version
  amendmentReason?: string;
  
  // Approval
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

/**
 * Amendment Request
 * All changes go through this workflow
 */
export interface BusinessPartnerAmendment {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerCode: string;
  
  // Amendment details
  amendmentType: AmendmentType;
  amendmentNumber: string; // e.g., "AMD-2024-001"
  
  // What's being changed
  currentVersion: number;
  proposedVersion: number; // Will be current + 1
  
  // Changes (field-by-field comparison)
  changes: Array<{
    field: string;
    fieldLabel: string;
    currentValue: any;
    proposedValue: any;
    section: string; // e.g., "Contact", "Address", "Compliance"
  }>;
  
  // Reason and justification
  reason: string;
  justification: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  
  // Impact assessment
  impactAssessment: {
    affectsOngoingTransactions: boolean;
    transactionCount: number;
    transactionIds: string[];
    requiredActions: string[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  
  // Status and workflow
  status: AmendmentStatus;
  requestedBy: string;
  requestedByName: string;
  requestedAt: string;
  
  // Approval workflow
  approvalRequired: boolean;
  approver?: string;
  approverName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  
  // Effective date
  effectiveDate: string; // When changes should take effect
  implementedAt?: string; // When actually implemented
  
  // Attachments (supporting documents)
  attachments: Array<{
    id: string;
    filename: string;
    fileType: string;
    uploadedAt: string;
  }>;
}

/**
 * Transaction Lock
 * Prevents amendments during critical periods
 */
export interface TransactionLock {
  id: string;
  partnerId: string;
  transactionId: string;
  transactionType: 'SALES_CONTRACT' | 'PURCHASE_ORDER' | 'INVOICE' | 'PAYMENT' | 'DELIVERY';
  transactionNumber: string;
  
  // Lock details
  lockedFields: string[]; // Fields that cannot be amended
  lockReason: string;
  lockedBy: string;
  lockedAt: string;
  
  // Auto-unlock
  autoUnlockAt?: string; // Unlock after transaction completes
  isActive: boolean;
}

/**
 * Amendment Notification
 * Notify relevant parties about amendments
 */
export interface AmendmentNotification {
  id: string;
  amendmentId: string;
  partnerId: string;
  
  // Who to notify
  recipients: Array<{
    userId: string;
    userName: string;
    email: string;
    notificationType: 'REQUESTER' | 'APPROVER' | 'AFFECTED_USER' | 'ADMIN';
  }>;
  
  // Notification details
  subject: string;
  message: string;
  sentAt: string;
  
  // Read status
  readBy: Array<{
    userId: string;
    readAt: string;
  }>;
}

/**
 * Amendment History
 * Complete audit trail
 */
export interface AmendmentHistory {
  partnerId: string;
  partnerName: string;
  
  amendments: Array<{
    amendmentNumber: string;
    amendmentType: AmendmentType;
    status: AmendmentStatus;
    reason: string;
    requestedBy: string;
    requestedAt: string;
    approvedBy?: string;
    approvedAt?: string;
    version: number;
  }>;
  
  currentVersion: number;
  totalAmendments: number;
}

/**
 * Amendment Impact Report
 * Shows what will be affected
 */
export interface AmendmentImpactReport {
  amendmentId: string;
  partnerId: string;
  
  // Affected entities
  affectedTransactions: Array<{
    id: string;
    type: string;
    number: string;
    status: string;
    amount: number;
    willBeAffected: boolean;
    reason: string;
  }>;
  
  affectedUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    mustBeNotified: boolean;
  }>;
  
  affectedBranches: Array<{
    id: string;
    name: string;
    hasActiveTransactions: boolean;
  }>;
  
  // Risk analysis
  riskAnalysis: {
    overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    risks: string[];
    mitigations: string[];
  };
  
  // Recommendations
  recommendations: string[];
}
