
export interface CciTerm {
  id: number;
  name: string;
  contract_period_days: number;
  emd_payment_days: number;
  cash_discount_percentage: number;
  carrying_charge_tier1_days: number;
  carrying_charge_tier1_percent: number;
  carrying_charge_tier2_days: number;
  carrying_charge_tier2_percent: number;
  additional_deposit_percent: number;
  deposit_interest_percent: number;
  free_lifting_period_days: number;
  late_lifting_tier1_days: number;
  late_lifting_tier1_percent: number;
  late_lifting_tier2_days: number;
  late_lifting_tier2_percent: number;
  late_lifting_tier3_percent: number;
}

export interface CommissionStructure {
  id: number;
  name: string;
  type: 'PERCENTAGE' | 'PER_BALE';
  value: number;
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
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  salesContractId: string;
  date: string;
  amount: number;
  status: 'Unpaid' | 'Partially Paid' | 'Paid';
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
}

export type UserRole = 'Admin' | 'Sales' | 'Accounts' | 'Dispute Manager' | 'Vendor/Client';

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

export type Module = 'Sales Contracts' | 'Invoices' | 'Payments' | 'Disputes' | 'Commissions' | 'Vendors & Clients' | 'User Management' | 'Settings' | 'Reports' | 'Audit Trail' | 'Roles & Rights' | 'Grievance Officer' | 'Business Partner';
export type Permission = 'create' | 'read' | 'update' | 'delete' | 'approve' | 'share';
export type PermissionsMap = {
  [key in UserRole]?: {
    [key in Module]?: Permission[];
  };
};
