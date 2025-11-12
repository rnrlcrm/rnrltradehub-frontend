/**
 * Enhanced Business Partner Types with Branch Support
 */

export type BusinessPartnerType = 
  | 'BUYER' 
  | 'SELLER' 
  | 'TRADER' 
  | 'SUB_BROKER' 
  | 'TRANSPORTER' 
  | 'CONTROLLER';

export type BusinessPartnerStatus = 
  | 'DRAFT' 
  | 'PENDING_APPROVAL' 
  | 'ACTIVE' 
  | 'INACTIVE' 
  | 'SUSPENDED' 
  | 'BLACKLISTED';

export type ApprovalStatus = 
  | 'PENDING' 
  | 'APPROVED' 
  | 'REJECTED';

/**
 * Business Branch - Multiple branches under one partner
 */
export interface BusinessBranch {
  id: string;
  partnerId: string;
  branchName: string;
  branchCode: string;
  
  // Address
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  
  // GST & Tax
  gstNumber: string;
  panNumber?: string; // Optional, can inherit from parent
  
  // Contact
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  
  // Banking
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  
  // Status
  isActive: boolean;
  isHeadOffice: boolean; // One branch should be marked as HO
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

/**
 * Enhanced Business Partner with Multi-Branch Support
 */
export interface EnhancedBusinessPartner {
  id: string;
  partnerCode: string; // Auto-generated: BP-YYYY-NNNN
  
  // Basic Info
  legalName: string;
  tradeName?: string;
  businessType: BusinessPartnerType;
  status: BusinessPartnerStatus;
  
  // Primary Contact (Head Office)
  primaryContactPerson: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  
  // Head Office Address
  registeredAddress: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  
  // Branches
  branches: BusinessBranch[];
  
  // Compliance (Parent Level)
  pan: string;
  cin?: string;
  tan?: string;
  
  // Primary Bank (can be overridden at branch level)
  primaryBank?: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
  };
  
  // Documents
  documents: {
    panCard?: string;
    incorporationCert?: string;
    addressProof?: string;
    cancelledCheque?: string;
  };
  
  // User Management
  primaryUserId?: string; // Auto-created user
  primaryUserApprovalStatus: ApprovalStatus;
  primaryUserApprovedBy?: string;
  primaryUserApprovedAt?: string;
  
  // Workflow
  approvalStatus: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  complianceNotes?: string;
}

/**
 * User Creation Request from Business Partner
 */
export interface BusinessPartnerUserRequest {
  businessPartnerId: string;
  email: string;
  name: string;
  role: string;
  branchIds: string[]; // Which branches this user can access
  isSubUser: boolean;
  parentUserId?: string;
}

/**
 * Business Partner Onboarding Request
 */
export interface BusinessPartnerOnboardingRequest {
  legalName: string;
  tradeName?: string;
  businessType: BusinessPartnerType;
  
  // Contact
  primaryContactPerson: string;
  primaryContactEmail: string; // This becomes the primary user's email
  primaryContactPhone: string;
  
  // Address
  registeredAddress: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  
  // Compliance
  pan: string;
  gstNumber?: string;
  
  // Initial Branch (can add more later)
  initialBranch?: {
    branchName: string;
    gstNumber: string;
    sameAsRegistered: boolean; // Use registered address for branch
  };
}

/**
 * Branch Transaction Allocation
 */
export interface BranchAllocation {
  branchId: string;
  branchName: string;
  quantity: number; // e.g., bales
  gstNumber: string;
}

/**
 * Transaction with Branch Support
 */
export interface BranchAwareTransaction {
  id: string;
  transactionType: 'SALES' | 'PURCHASE' | 'DO' | 'INVOICE';
  businessPartnerId: string;
  
  // Branch Allocation
  branchAllocations: BranchAllocation[];
  
  // GST is handled per branch
  totalAmount: number;
  
  createdAt: string;
  createdBy: string;
}
