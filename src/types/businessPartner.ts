/**
 * Complete Business Partner Registration System
 * With Email/Mobile Verification, Change Requests, Annual KYC, Sub-Broker Support
 */

// ==================== ENUMS & TYPES ====================

export type BusinessPartnerType = 
  | 'BUYER' 
  | 'SELLER' 
  | 'TRADER' 
  | 'SUB_BROKER' 
  | 'TRANSPORTER' 
  | 'CONTROLLER';

export type BusinessPartnerStatus = 
  | 'DRAFT'                    // Being filled
  | 'PENDING_VERIFICATION'     // Email/Mobile verification pending
  | 'PENDING_APPROVAL'         // Awaiting admin approval
  | 'ACTIVE'                   // Approved and active
  | 'INACTIVE'                 // Temporarily inactive
  | 'SUSPENDED'                // Suspended by admin
  | 'BLACKLISTED'             // Blacklisted
  | 'KYC_EXPIRED';            // KYC expired - needs renewal

export type ApprovalStatus = 
  | 'PENDING' 
  | 'APPROVED' 
  | 'REJECTED';

export type RegistrationSource = 
  | 'SELF_SERVICE'             // User registered themselves
  | 'BACK_OFFICE'              // Registered by staff
  | 'CHATBOT'                  // Registered via chatbot
  | 'SUB_BROKER';              // Registered by sub-broker

export type RegistrationType = 
  | 'COMPANY' 
  | 'INDIVIDUAL';

export type KYCStatus = 
  | 'PENDING'                  // Not yet done
  | 'COMPLETED'                // Done and valid
  | 'EXPIRED'                  // Expired - needs renewal
  | 'IN_REVIEW';               // Being reviewed

export type ChangeRequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export type DocumentType = 
  | 'PAN_CARD'                 // Mandatory for all
  | 'GST_CERTIFICATE'          // Mandatory for Buyer/Seller/Trader with GST
  | 'CANCELLED_CHECK'          // Mandatory for all
  | 'AADHAR_CARD'             // Mandatory for individuals
  | 'INCORPORATION_CERT'       // For companies
  | 'ADDRESS_PROOF'
  | 'TRANSPORTER_DECLARATION'  // For transporters without GST
  | 'PARTNERSHIP_DEED'
  | 'KYC_DOCUMENTS'           // For annual KYC
  | 'OTHER';

// ==================== VERIFICATION ====================

export interface VerificationStatus {
  email: {
    verified: boolean;
    verifiedAt?: string;
    otp?: string;
    otpSentAt?: string;
    attempts: number;
  };
  mobile: {
    verified: boolean;
    verifiedAt?: string;
    otp?: string;
    otpSentAt?: string;
    attempts: number;
  };
}

// ==================== ADDRESS ====================

export interface Address {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface ShipToAddress extends Address {
  id: string;
  name: string;                // Label: "Mumbai Warehouse"
  contactPerson?: string;
  contactPhone?: string;
  isDefault: boolean;
  sameAsRegistered: boolean;
}

// ==================== BANKING ====================

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  ifscCode: string;
  branchName: string;
  accountType: 'CURRENT' | 'SAVINGS';
  isVerified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
}

// ==================== BRANCH ====================

export interface BusinessBranch {
  id: string;
  partnerId: string;
  branchName: string;
  branchCode: string;
  
  // Address
  address: Address;
  
  // GST & Compliance
  gstNumber: string;
  panNumber?: string;          // Can inherit from parent
  
  // Contact
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  
  // Banking (Branch-specific)
  bankDetails: BankDetails;
  
  // Status
  isActive: boolean;
  isHeadOffice: boolean;       // One branch marked as HO
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// ==================== SUB-USER ====================

export interface SubUser {
  id: string;
  partnerId: string;
  
  // User Info
  name: string;
  email: string;               // Login email
  phone: string;
  designation?: string;
  
  // Access Control
  role: 'PRIMARY_USER' | 'SUB_USER';
  permissions: string[];
  branchAccess: string[];      // Branch IDs user can access
  
  // Status
  status: 'PENDING' | 'ACTIVE' | 'INACTIVE';
  approvalStatus: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: string;
  
  // Verification
  emailVerified: boolean;
  phoneVerified: boolean;
  
  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

// ==================== DOCUMENTS ====================

export interface DocumentRecord {
  id: string;
  partnerId: string;
  
  // Document Info
  documentType: DocumentType;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  
  // Upload Info
  uploadedBy: string;
  uploadedAt: string;
  
  // Verification
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNotes?: string;
  
  // Expiry (for time-bound documents)
  expiryDate?: string;
  
  // Version Control
  version: number;
  replacedBy?: string;         // ID of newer version
  isActive: boolean;
}

// ==================== CHANGE REQUEST ====================

export interface ChangeRequest {
  id: string;
  partnerId: string;
  
  // Request Info
  requestType: 'PROFILE_UPDATE' | 'DOCUMENT_UPDATE' | 'BANK_UPDATE' | 'BRANCH_UPDATE';
  requestedBy: string;
  requestedAt: string;
  
  // Changes
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
    section: string;           // e.g., 'contact', 'banking', 'compliance'
  }[];
  
  // Documents (if document update)
  newDocuments?: DocumentRecord[];
  
  // Approval
  status: ChangeRequestStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  
  // Notes
  requestNotes?: string;
  approvalNotes?: string;
  
  // Impact Assessment
  affectsOngoingContracts: boolean;
  contractsAffected?: string[];
}

// ==================== KYC ====================

export interface KYCRecord {
  id: string;
  partnerId: string;
  
  // KYC Info
  kycYear: number;             // Financial year
  kycDate: string;             // When KYC was completed
  nextKYCDate: string;         // Auto: kycDate + 1 year
  
  // Documents
  documentsSubmitted: string[]; // Document IDs
  
  // Verification
  status: KYCStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNotes?: string;
  
  // Reminders
  remindersSent: {
    date: string;
    type: '90_DAYS' | '30_DAYS' | '7_DAYS' | 'EXPIRED';
  }[];
  
  // Metadata
  createdAt: string;
  completedAt?: string;
}

// ==================== CORE BUSINESS PARTNER ====================

export interface BusinessPartner {
  id: string;
  partnerCode: string;         // Auto: BP-YYYY-NNNN
  
  // Registration Source
  registrationSource: RegistrationSource;
  registeredBy?: string;       // User ID if back office/sub-broker
  registeredVia?: string;      // 'web' | 'chatbot' | 'mobile'
  
  // Basic Info
  legalName: string;
  tradeName?: string;
  businessType: BusinessPartnerType;
  registrationType: RegistrationType;
  status: BusinessPartnerStatus;
  
  // Contact (Primary User)
  primaryContactPerson: string;
  primaryContactEmail: string; // Login email - VERIFIED
  primaryContactPhone: string; // VERIFIED
  
  // Verification Status
  verification: VerificationStatus;
  
  // Address
  registeredAddress: Address;
  shipToAddresses: ShipToAddress[]; // Only for Buyer/Seller/Trader
  
  // Compliance
  pan: string;                 // Mandatory for all
  gstNumber?: string;          // Conditional
  hasGST: boolean;
  cin?: string;
  tan?: string;
  aadharNumber?: string;       // For individuals
  
  // Banking
  bankDetails: BankDetails;
  
  // Multi-Branch
  branches: BusinessBranch[];
  
  // Documents
  documents: DocumentRecord[];
  
  // Users
  primaryUserId?: string;      // Created after approval
  subUsers: SubUser[];         // Max 2, added after approval
  
  // KYC
  currentKYC?: KYCRecord;
  kycHistory: KYCRecord[];
  lastKYCDate?: string;
  nextKYCDate?: string;
  kycStatus: KYCStatus;
  
  // Change Requests
  pendingChangeRequests: ChangeRequest[];
  changeRequestHistory: ChangeRequest[];
  
  // Approval Workflow
  approvalStatus: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  
  // Multi-Organization
  organizationIds: string[];   // Auto-linked to all orgs on approval
  
  // Sub-Broker Specific (if businessType = SUB_BROKER)
  subBrokerInfo?: {
    canRegisterUsers: boolean; // Can register Buyer/Seller/Trader
    registeredUsers: string[]; // Partner IDs registered by this sub-broker
    commissionStructure?: any;
  };
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  version: number;
  complianceNotes?: string;
  
  // Audit Trail
  auditTrail: {
    timestamp: string;
    user: string;
    action: string;
    details: string;
  }[];
}

// ==================== REGISTRATION REQUEST ====================

export interface PartnerRegistrationRequest {
  // Source
  registrationSource: RegistrationSource;
  registeredBy?: string;
  registeredVia?: string;
  
  // Basic (Step 1)
  legalName: string;
  tradeName?: string;
  businessType: BusinessPartnerType;
  registrationType: RegistrationType;
  
  // Contact (Step 2) - Will be verified
  primaryContactPerson: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  
  // Compliance (Step 3)
  pan: string;
  gstNumber?: string;
  hasGST: boolean;
  cin?: string;
  tan?: string;
  aadharNumber?: string;
  
  // Address (Step 4)
  registeredAddress: Address;
  shipToAddresses?: Omit<ShipToAddress, 'id'>[]; // Optional, only for Buyer/Seller/Trader
  
  // Banking (Step 5)
  bankDetails: {
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
    ifscCode: string;
    branchName: string;
    accountType: 'CURRENT' | 'SAVINGS';
  };
  
  // Documents (Step 6)
  documents: {
    documentType: DocumentType;
    file: File;
  }[];
  
  // Agreements (Step 7)
  agreeToTerms: boolean;
  agreeToPrivacyPolicy: boolean;
  agreeToDataSharing: boolean;
}

// ==================== VERIFICATION ====================

export interface VerificationRequest {
  partnerId?: string;          // Optional for pre-registration
  email?: string;
  phone?: string;
  otp: string;
  type: 'email' | 'mobile';
}

export interface SendOTPRequest {
  email?: string;
  phone?: string;
  type: 'email' | 'mobile';
  purpose: 'registration' | 'change_request' | 'kyc';
}

// ==================== RESPONSES ====================

export interface RegistrationResponse {
  success: boolean;
  partner?: BusinessPartner;
  primaryUser?: SubUser;
  message: string;
  verificationRequired: boolean;
  nextStep: 'VERIFY_EMAIL' | 'VERIFY_PHONE' | 'PENDING_APPROVAL' | 'ERROR';
}

export interface VerificationResponse {
  success: boolean;
  verified: boolean;
  message: string;
  nextStep?: string;
}

// ==================== SUB-BROKER USER REGISTRATION ====================

export interface SubBrokerUserRegistration {
  subBrokerId: string;         // Sub-broker partner ID
  
  // User being registered
  registration: PartnerRegistrationRequest;
  
  // Commission/relationship info
  commissionPercentage?: number;
  relationshipNotes?: string;
}

// ==================== CHATBOT INTEGRATION ====================

export interface ChatbotRegistrationContext {
  conversationId: string;
  step: number;
  data: Partial<PartnerRegistrationRequest>;
  errors?: string[];
  suggestions?: string[];
}

export interface ChatbotCommand {
  command: 'register' | 'verify' | 'status' | 'help';
  params?: any;
  context?: ChatbotRegistrationContext;
}

// ==================== FILTERS & QUERIES ====================

export interface PartnerFilters {
  businessType?: BusinessPartnerType[];
  status?: BusinessPartnerStatus[];
  registrationSource?: RegistrationSource[];
  kycStatus?: KYCStatus[];
  hasGST?: boolean;
  search?: string;           // Search in name, email, partner code
  organizationId?: string;
  createdAfter?: string;
  createdBefore?: string;
  kycExpiringInDays?: number;
  hasPendingChangeRequests?: boolean;
}

// ==================== STATISTICS ====================

export interface PartnerStatistics {
  total: number;
  byType: Record<BusinessPartnerType, number>;
  byStatus: Record<BusinessPartnerStatus, number>;
  bySource: Record<RegistrationSource, number>;
  pendingApproval: number;
  pendingVerification: number;
  kycExpiringSoon: number;    // Within 30 days
  kycExpired: number;
  activePartners: number;
  pendingChangeRequests: number;
}

