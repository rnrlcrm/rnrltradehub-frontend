/**
 * Self-Service Onboarding Types
 * Allows users to onboard themselves without back-office intervention
 */

export interface SelfOnboardingRequest {
  // Company Information
  legalName: string;
  tradeName?: string;
  businessType: 'BUYER' | 'SELLER' | 'TRADER' | 'SUB_BROKER' | 'TRANSPORTER' | 'CONTROLLER';
  
  // Primary Contact (becomes the user)
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  
  // Registered Address
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  
  // Compliance
  pan: string;
  gstNumber?: string;
  cin?: string;
  
  // Initial Branch (optional - can add more later)
  initialBranch?: {
    branchName: string;
    gstNumber: string;
    city: string;
    state: string;
    pincode: string;
    contactPerson: string;
    contactEmail: string;
    contactPhone: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
  };
  
  // Documents (can upload later)
  documents?: {
    panCard?: File;
    gstCertificate?: File;
    addressProof?: File;
    cancelledCheque?: File;
  };
  
  // Agreement
  agreeToTerms: boolean;
  agreeToPrivacyPolicy: boolean;
}

export interface SelfOnboardingResponse {
  success: boolean;
  partnerId: string;
  partnerCode: string;
  message: string;
  status: 'PENDING_APPROVAL';
  nextSteps: string[];
  // User will receive email notification when approved
  estimatedApprovalTime: string; // e.g., "2-3 business days"
}

export interface OnboardingMethod {
  type: 'SELF_SERVICE' | 'BACK_OFFICE';
  initiatedBy: string; // email or user ID
  initiatedAt: string;
}

/**
 * Organization Auto-Assignment Configuration
 * System automatically assigns to ALL organizations
 */
export interface OrganizationAutoAssignment {
  enabled: boolean; // Always true
  assignToAll: boolean; // Always true
  organizations: string[]; // List of all organization IDs in system
  createdBy: 'SYSTEM_AUTO';
}
