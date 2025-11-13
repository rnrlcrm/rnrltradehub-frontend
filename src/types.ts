// Unit types for commodities
export type CommodityUnit = 'Kgs' | 'Qty' | 'Candy' | 'Bales' | 'Quintal' | 'Tonnes';

// Commodity interface for multi-commodity support
// Trading parameters are now stored directly within each commodity (not linked to Settings)
export interface Commodity {
  id: number;
  name: string; // e.g., "Cotton", "Wheat", "Rice"
  symbol: string; // e.g., "CTN", "WHT", "RIC"
  unit: CommodityUnit; // Primary trading unit (e.g., Bales for cotton)
  rateUnit?: CommodityUnit; // Rate basis unit (e.g., Candy for cotton rate) - Optional, defaults to unit
  // GST is now auto-determined based on commodity name and HSN code
  hsnCode: string; // HSN code as per GST Act (auto-determined)
  gstRate: number; // GST rate % (auto-determined from HSN)
  gstExemptionAvailable: boolean; // Auto-determined
  gstCategory: 'Agricultural' | 'Processed' | 'Industrial' | 'Service'; // Auto-determined
  isProcessed: boolean; // User specifies if processed (affects GST) - Processed goods may attract higher GST
  isActive: boolean; // Controls whether commodity is available for new contracts
  // Trading parameters stored directly in commodity (not as references to Settings)
  tradeTypes: MasterDataItem[]; // Trade types specific to this commodity
  bargainTypes: MasterDataItem[]; // Bargain types specific to this commodity
  varieties: MasterDataItem[]; // Varieties specific to this commodity
  weightmentTerms: MasterDataItem[]; // Weightment terms specific to this commodity
  passingTerms: MasterDataItem[]; // Passing terms specific to this commodity
  deliveryTerms: StructuredTerm[]; // Delivery terms specific to this commodity
  paymentTerms: StructuredTerm[]; // Payment terms specific to this commodity
  commissions: CommissionStructure[]; // Commission structures specific to this commodity
  // CCI specific (only for cotton)
  supportsCciTerms: boolean; // CCI Terms are Cotton Corporation of India terms - only applicable to cotton commodity
  description?: string; // Optional description
}

// EMD percentage configuration by buyer type
export interface EmdByBuyerType {
  kvic: number; // KVIC buyer EMD %
  privateMill: number; // Private Mill EMD %
  trader: number; // Trader EMD %
}

export interface CciTerm {
  id: number;
  name: string;
  
  // Versioning and effective date tracking
  effectiveFrom: string; // ISO date string
  effectiveTo?: string; // ISO date string, optional (null = current)
  version: number;
  isActive: boolean;
  
  // Core Financial Parameters
  candy_factor: number; // Conversion from quintal to candy (e.g., 0.2812)
  gst_rate: number; // GST percentage (e.g., 5)
  
  // EMD Configuration
  emd_by_buyer_type: EmdByBuyerType; // EMD % by buyer type
  emd_payment_days: number; // Days within which EMD must be paid (grace period)
  emd_interest_percent: number; // Annual interest on timely EMD (e.g., 5%)
  emd_late_interest_percent: number; // Interest if EMD paid late (e.g., 10%)
  emd_block_do_if_not_full: boolean; // Block DO creation if full EMD not paid (default: true)
  
  // Carrying Charges
  carrying_charge_tier1_days: number; // 0-30 days
  carrying_charge_tier1_percent: number; // % per month for tier 1
  carrying_charge_tier2_days: number; // >30 days
  carrying_charge_tier2_percent: number; // % per month for tier 2
  
  // Late Lifting Charges
  free_lifting_period_days: number; // Free lifting period
  late_lifting_tier1_days: number; // 0-30 days
  late_lifting_tier1_percent: number; // % per month
  late_lifting_tier2_days: number; // 31-60 days
  late_lifting_tier2_percent: number; // % per month
  late_lifting_tier3_percent: number; // >60 days, % per month
  
  // Payment & Discount Terms
  cash_discount_percentage: number; // Annual rate (e.g., 5%)
  
  // Interest Rates
  interest_lc_bg_percent: number; // LC/BG annual interest (e.g., 10%)
  penal_interest_lc_bg_percent: number; // LC/BG penal interest (e.g., 11%)
  
  // Additional Deposits
  additional_deposit_percent: number; // Additional deposit %
  deposit_interest_percent: number; // Interest on deposit
  
  // Lifting & Contract Period
  lifting_period_days: number; // Days allowed for lifting
  contract_period_days: number; // Overall contract period
  
  // Lock-in Period Charges
  lockin_charge_min: number; // Minimum Rs/bale (e.g., 350)
  lockin_charge_max: number; // Maximum Rs/bale (e.g., 700)
  
  // Moisture Adjustment Parameters
  moisture_lower_limit: number; // Below this, premium is charged (e.g., 7%)
  moisture_upper_limit: number; // Above this, discount is applied (e.g., 9%)
  moisture_sample_count: number; // Number of bales to sample (e.g., 10)
  
  // Email Configuration
  email_reminder_days: number; // Days after which reminder for EMD
  email_template_emd_reminder?: string; // HTML template for EMD reminder
  email_template_payment_due?: string; // HTML template for payment due
}

export interface CommissionStructure {
  id: number;
  name: string;
  type: 'PERCENTAGE' | 'PER_BALE';
  value: number;
  // GST on Commission Services (Brokerage & Commission - SAC 9983)
  // As per GST Act: Brokerage and Commission services attract 18% GST
  // GST is ALWAYS applicable on commission - no exemptions
  gstApplicable: boolean; // Always true for commissions (SAC 9983 = 18% GST)
  gstRate: number; // 18% as per GST Act for service code 9983
  sacCode: string; // Service Accounting Code - '9983' for brokerage/commission
}

export interface GstRate {
    id: number;
    rate: number;
    description: string;
    hsnCode: string;
}

export interface Dispute {
  id: string;
  disputeId: string;
  salesContractId: string;
  reason: string;
  status: 'Open' | 'Resolved' | 'Closed';
  resolution: string;
  dateRaised: string;
  // FY tracking
  financialYear?: string;
  carryForwardFromId?: string;
  isCarriedForward?: boolean;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  salesContractId: string;
  date: string;
  amount: number;
  status: 'Unpaid' | 'Partially Paid' | 'Paid';
  // GST fields
  taxableAmount?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  gstRate?: number;
  totalAmount?: number;
  sellerState?: string;
  buyerState?: string;
  isInterState?: boolean;
  // CCI Setting Master tracking for audit
  cciSettingId?: number;
  cciSettingVersion?: number;
  cciSettingEffectiveDate?: string;
  // Moisture adjustment tracking
  averageMoisture?: number;
  moistureAdjustmentType?: 'discount' | 'premium' | 'none';
  moistureAdjustmentAmount?: number;
  // FY tracking
  financialYear?: string;
  carryForwardFromId?: string;
  isCarriedForward?: boolean;
}

export interface Location {
  id: number;
  country: string;
  state: string;
  city: string;
}

export interface MasterDataItem {
  id: number;
  name: string;
}

export interface Organization {
  id: number;
  name: string;
  code: string;
  organizationType: 'PROPRIETORSHIP' | 'PARTNERSHIP' | 'PRIVATE_LIMITED' | 'PUBLIC_LIMITED' | 'LLP' | 'OPC';
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  phone: string;
  email: string;
  gstin: string;
  pan: string;
  tan: string;
  cin: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  accountType?: 'CURRENT' | 'SAVINGS' | 'CASH_CREDIT' | 'OVERDRAFT';
  beneficiaryName?: string;
  isActive: boolean;
  // Multi-tenant support
  organizationId?: string; // Unique org identifier for multi-tenant
  parentOrganizationId?: number; // For organization hierarchy
  // Contact person
  contactPersonName?: string;
  contactPersonPhone?: string;
  contactPersonEmail?: string;
  contactPersonDesignation?: string;
  // Compliance
  gstRegistrationDate?: string;
  panRegistrationDate?: string;
  // Audit fields
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface StructuredTerm {
    id: number;
    name: string;
    days: number;
}

export interface Payment {
  id: string;
  paymentId: string;
  invoiceId: string;
  date: string;
  amount: number;
  method: 'Bank Transfer' | 'Cheque' | 'Cash';
}

/**
 * Delivery Order - Created only when full EMD is paid
 * As per CCI Policy: No DO shall be created until full EMD is received
 */
export interface DeliveryOrder {
  id: string;
  doNo: string;
  salesContractId: string;
  contractNo: string;
  date: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  quantityBales: number;
  // EMD Validation (mandatory checks)
  emdRequired: number;
  emdPaid: number;
  emdVerified: boolean; // System verified full EMD paid
  emdVerificationDate?: string;
  // DO Status
  status: 'Pending' | 'Approved' | 'Blocked' | 'Completed' | 'Cancelled';
  blockReason?: string; // e.g., "Full EMD not received"
  // Payment Advice
  paymentAdviceAmount?: number;
  carryingCharges?: number;
  lateLiftingCharges?: number;
  // Delivery details
  deliveryLocation?: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  remarks?: string;
}

export interface SalesContract {
  id: string;
  scNo: string;
  version: number;
  amendmentReason?: string;
  date: string;
  organization: string;
  financialYear: string;
  clientId: string;
  clientName: string;
  vendorId: string;
  vendorName: string;
  agentId?: string;
  
  // CRITICAL: Commodity Reference for Audit Trail and Data Integrity
  commodityId: number; // Link to Commodity Master - MANDATORY for audit trail
  commodityName: string; // Cached for display (original name at time of contract)
  commoditySymbol: string; // Cached for display (original symbol at time of contract)
  
  variety: string;
  quantityBales: number;
  rate: number;
  gstRateId: number | null;
  buyerCommissionId: number | null;
  sellerCommissionId: number | null;
  buyerCommissionGstId: number | null;
  sellerCommissionGstId: number | null;
  tradeType: string;
  bargainType: string;
  weightmentTerms: string;
  passingTerms: string;
  deliveryTerms: string;
  paymentTerms: string;
  location: string;
  qualitySpecs: {
    length: string;
    mic: string;
    rd: string;
    trash: string;
    moisture: string;
    strength: string;
  };
  manualTerms?: string;
  status: 'Active' | 'Completed' | 'Disputed' | 'Carried Forward' | 'Amended' | 'Pending Approval' | 'Rejected';
  cciContractNo?: string;
  cciTermId?: number | null;
  // CCI Setting Master tracking for audit
  cciSettingVersion?: number;
  cciSettingEffectiveDate?: string;
  // Buyer type for EMD calculation
  buyerType?: 'kvic' | 'privateMill' | 'trader';
  // EMD Tracking (As per CCI Policy - Full EMD Mandatory Before DO)
  emdRequired?: number; // Total EMD required for contract
  emdPaid?: number; // Total EMD actually paid by buyer
  emdPaymentDate?: string; // Date when EMD was paid
  emdStatus?: 'Not Paid' | 'Partial' | 'Full' | 'Late Full'; // EMD payment status
  emdGracePeriodExpiry?: string; // Date when grace period expires
  emdLateInterestApplicable?: boolean; // Whether late interest applies
  doEligible?: boolean; // Whether Delivery Order can be created (requires full EMD)
  // Sub-broker assignment
  subBrokerId?: string;
  subBrokerName?: string;
  commissionSharePercent?: number; // % of commission to share with sub-broker (0-100)
  // FY tracking
  carryForwardFromId?: string;
  isCarriedForward?: boolean;
}

export type UserRole = 'Admin' | 'Sales' | 'Accounts' | 'Dispute Manager' | 'Business Partner';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuditLog {
  id: number;
  timestamp: string;
  user: string;
  role: UserRole;
  module: string;
  action: string;
  details: string;
  reason: string;
}

export interface Commission {
  id: string;
  commissionId: string;
  salesContractId: string;
  agent: string;
  amount: number;
  status: 'Due' | 'Paid';
  dueDate?: string;
  paidDate?: string;
  // GST fields
  taxableAmount?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  gstRate?: number;
  totalAmount?: number;
  agentState?: string;
  companyState?: string;
  isInterState?: boolean;
  // Sub-broker commission sharing
  subBrokerId?: string;
  subBrokerName?: string;
  subBrokerShare?: number; // Percentage (0-100)
  subBrokerAmount?: number; // Calculated amount
  companyShare?: number; // Percentage (0-100)
  companyAmount?: number; // Calculated amount
  // Communication tracking
  lastCommunication?: string;
  communicationNotes?: string;
  // FY tracking
  financialYear?: string;
  carryForwardFromId?: string;
  isCarriedForward?: boolean;
}

export interface Address {
  id: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_default: boolean;
}

export interface BusinessPartner {
  id: string;
  bp_code: string;
  legal_name: string;
  organization: string;
  business_type: 'BUYER' | 'SELLER' | 'BOTH' | 'AGENT';
  status: 'DRAFT' | 'PENDING_COMPLIANCE' | 'ACTIVE' | 'INACTIVE' | 'BLACKLISTED';
  kyc_due_date: string;
  // Contact
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  // Registered Address
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  // Shipping Addresses
  shipping_addresses: Address[];
  // Compliance
  pan: string;
  gstin: string;
  bank_name: string;
  bank_account_no: string;
  bank_ifsc: string;
  // Documents
  pan_doc_url: string;
  gst_doc_url: string;
  cheque_doc_url: string;
  // Internal
  compliance_notes: string;
}

// Accounting and Ledger Types
export interface LedgerEntry {
  id: string;
  date: string;
  transactionType: 'Invoice' | 'Payment' | 'Commission' | 'Adjustment';
  referenceNo: string; // Invoice No, Payment ID, etc.
  salesContractId: string;
  partyId: string; // Business Partner ID
  partyName: string;
  partyType: 'BUYER' | 'SELLER';
  debit: number;
  credit: number;
  balance: number; // Running balance
  description: string;
}

export interface AccountStatement {
  partyId: string;
  partyName: string;
  partyType: 'BUYER' | 'SELLER';
  openingBalance: number;
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
  entries: LedgerEntry[];
}

export interface AgingReport {
  partyId: string;
  partyName: string;
  current: number; // 0-30 days
  days30to60: number;
  days60to90: number;
  days90plus: number;
  total: number;
}

export type Module = 'Sales Contracts' | 'Invoices' | 'Payments' | 'Disputes' | 'Commissions' | 'Business Partners' | 'User Management' | 'Settings' | 'Reports' | 'Audit Trail' | 'Roles & Rights' | 'Grievance Officer';
export type Permission = 'create' | 'read' | 'update' | 'delete' | 'approve' | 'share';
export type PermissionsMap = {
  [key in UserRole]?: {
    [key in Module]?: Permission[];
  };
};

// Financial Year Management Types
export interface FinancialYear {
  id: number;
  fyCode: string; // e.g., "2024-2025"
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'CLOSED';
  closedBy?: string;
  closedDate?: string;
  createdAt: string;
}

export interface FYPendingItems {
  unpaidInvoices: { count: number; totalAmount: number; items: Invoice[] };
  dueCommissions: { count: number; totalAmount: number; items: Commission[] };
  openDisputes: { count: number; items: Dispute[] };
  activeContracts: { count: number; items: SalesContract[] };
}

export interface FYSplitSummary {
  fromFY: string;
  toFY: string;
  executedBy: string;
  executedAt: string;
  invoicesMigrated: number;
  commissionsMigrated: number;
  contractsMigrated: number;
  disputesMigrated: number;
  notes: string;
}

// Contract Template Types for Optimization
export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  category: 'standard' | 'custom' | 'historical';
  usageCount: number;
  lastUsed?: Date;
  
  // Template Data
  templateData: {
    tradeType?: string;
    bargainType?: string;
    variety?: string;
    weightmentTerms?: string;
    passingTerms?: string;
    deliveryTerms?: string;
    paymentTerms?: string;
    cciTermId?: number;
    
    // Quality parameters (auto-filled based on variety)
    qualitySpecs?: {
      length?: string;
      micronaire?: string;
      rd?: string;
      trash?: string;
      moisture?: string;
    };
    
    // Additional default values
    brokerage?: number;
    commission?: number;
    notes?: string;
  };
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface TemplateLibrary {
  templates: ContractTemplate[];
  categories: string[];
  mostUsed: ContractTemplate[];
}
