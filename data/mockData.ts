// Re-export types from types.ts
export type { User, AuditLog, MasterDataItem, SalesContract, BusinessPartner, Location, Invoice, Payment, Dispute, Commission } from '../types';

import { User, AuditLog, MasterDataItem, SalesContract, BusinessPartner, Location, Invoice, Payment, Dispute, Commission } from '../types';

// Mock Users
export const mockUsers: User[] = [
  { id: 1, name: 'Admin User', email: 'admin@example.com', role: 'Admin' },
  { id: 2, name: 'Sales User', email: 'sales@example.com', role: 'Sales' },
  { id: 3, name: 'Accounts User', email: 'accounts@example.com', role: 'Accounts' },
  { id: 4, name: 'Dispute Manager', email: 'disputes@example.com', role: 'Dispute Manager' },
  { id: 5, name: 'Vendor User', email: 'vendor@example.com', role: 'Vendor/Client' },
];

// Mock Audit Logs
export const mockAuditLogs: AuditLog[] = [
  {
    id: 1,
    timestamp: new Date().toISOString(),
    user: 'Admin User',
    role: 'Admin',
    module: 'Sales Contracts',
    action: 'Create',
    details: 'Created new sales contract',
    reason: 'New business requirement',
  },
];

// Mock Organizations
export const mockOrganizations: MasterDataItem[] = [
  { id: 1, name: 'Organization A' },
  { id: 2, name: 'Organization B' },
  { id: 3, name: 'Organization C' },
];

// Mock Sales Contracts
export const mockSalesContracts: SalesContract[] = [
  {
    id: 'sc_1',
    scNo: 'SC-2024-001',
    version: 1,
    date: '2024-01-15',
    organization: 'Organization A',
    financialYear: '2024-25',
    clientId: 'bp_1',
    clientName: 'Client A',
    vendorId: 'bp_2',
    vendorName: 'Vendor A',
    variety: 'Cotton Type 1',
    quantityBales: 100,
    rate: 50000,
    gstRateId: 1,
    buyerCommissionId: 1,
    sellerCommissionId: 1,
    buyerCommissionGstId: 1,
    sellerCommissionGstId: 1,
    tradeType: 'Domestic',
    bargainType: 'FOB',
    weightmentTerms: 'At Destination',
    passingTerms: 'At Source',
    deliveryTerms: 'Within 30 days',
    paymentTerms: 'Net 30',
    location: 'Mumbai',
    qualitySpecs: {
      length: '28mm',
      mic: '4.5',
      rd: '75',
      trash: '2%',
      moisture: '8%',
      strength: '28',
    },
    status: 'Active',
  },
];

// Mock Business Partners
export const mockBusinessPartners: BusinessPartner[] = [
  {
    id: 'bp_1',
    bp_code: 'BP001',
    legal_name: 'Client A Pvt Ltd',
    organization: 'Organization A',
    business_type: 'BUYER',
    status: 'ACTIVE',
    kyc_due_date: '2025-12-31',
    contact_person: 'John Doe',
    contact_email: 'john@clienta.com',
    contact_phone: '+91 9876543210',
    address_line1: '123 Main St',
    address_line2: 'Suite 100',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    country: 'India',
    shipping_addresses: [],
    pan: 'ABCDE1234F',
    gstin: '27ABCDE1234F1Z5',
    bank_name: 'HDFC Bank',
    bank_account_no: '1234567890',
    bank_ifsc: 'HDFC0001234',
    pan_doc_url: '',
    gst_doc_url: '',
    cheque_doc_url: '',
    compliance_notes: '',
  },
  {
    id: 'bp_2',
    bp_code: 'BP002',
    legal_name: 'Vendor A Pvt Ltd',
    organization: 'Organization A',
    business_type: 'SELLER',
    status: 'ACTIVE',
    kyc_due_date: '2025-12-31',
    contact_person: 'Jane Smith',
    contact_email: 'jane@vendora.com',
    contact_phone: '+91 9876543211',
    address_line1: '456 Market St',
    address_line2: '',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110001',
    country: 'India',
    shipping_addresses: [],
    pan: 'FGHIJ5678K',
    gstin: '07FGHIJ5678K1Z5',
    bank_name: 'ICICI Bank',
    bank_account_no: '0987654321',
    bank_ifsc: 'ICIC0001234',
    pan_doc_url: '',
    gst_doc_url: '',
    cheque_doc_url: '',
    compliance_notes: '',
  },
];

// Mock Locations
export const mockLocations: Location[] = [
  { id: 1, country: 'India', state: 'Maharashtra', city: 'Mumbai' },
  { id: 2, country: 'India', state: 'Gujarat', city: 'Ahmedabad' },
  { id: 3, country: 'India', state: 'Delhi', city: 'New Delhi' },
];

// Mock Master Data
export const mockMasterData = {
  organizations: mockOrganizations,
  financialYears: [
    { id: 1, name: '2022-23' },
    { id: 2, name: '2023-24' },
    { id: 3, name: '2024-25' },
  ],
  tradeTypes: [
    { id: 1, name: 'Domestic' },
    { id: 2, name: 'Import' },
    { id: 3, name: 'Export' },
  ],
  bargainTypes: [
    { id: 1, name: 'FOB' },
    { id: 2, name: 'CIF' },
    { id: 3, name: 'CFR' },
  ],
  varieties: [
    { id: 1, name: 'Cotton Type 1' },
    { id: 2, name: 'Cotton Type 2' },
    { id: 3, name: 'Cotton Type 3' },
  ],
  disputeReasons: [
    { id: 1, name: 'Quality Issue' },
    { id: 2, name: 'Delivery Delay' },
    { id: 3, name: 'Payment Dispute' },
  ],
  weightmentTerms: [
    { id: 1, name: 'At Source' },
    { id: 2, name: 'At Destination' },
    { id: 3, name: 'Average' },
  ],
  passingTerms: [
    { id: 1, name: 'At Source' },
    { id: 2, name: 'At Destination' },
  ],
  deliveryTerms: [
    { id: 1, name: 'Within 30 days', days: 30 },
    { id: 2, name: 'Within 60 days', days: 60 },
    { id: 3, name: 'Within 90 days', days: 90 },
  ],
  paymentTerms: [
    { id: 1, name: 'Net 30', days: 30 },
    { id: 2, name: 'Net 60', days: 60 },
    { id: 3, name: 'Net 90', days: 90 },
  ],
  gstRates: [
    { id: 1, rate: 5, description: 'GST 5%', hsnCode: '5201' },
    { id: 2, rate: 12, description: 'GST 12%', hsnCode: '5202' },
    { id: 3, rate: 18, description: 'GST 18%', hsnCode: '5203' },
  ],
  commissions: [
    { id: 1, name: 'Standard Commission', type: 'PERCENTAGE' as const, value: 2 },
    { id: 2, name: 'Premium Commission', type: 'PERCENTAGE' as const, value: 3 },
    { id: 3, name: 'Per Bale Commission', type: 'PER_BALE' as const, value: 100 },
  ],
  cciTerms: [
    {
      id: 1,
      name: 'Standard CCI Terms',
      contract_period_days: 90,
      emd_payment_days: 7,
      cash_discount_percentage: 2,
      carrying_charge_tier1_days: 30,
      carrying_charge_tier1_percent: 1,
      carrying_charge_tier2_days: 60,
      carrying_charge_tier2_percent: 2,
      additional_deposit_percent: 5,
      deposit_interest_percent: 6,
      free_lifting_period_days: 15,
      late_lifting_tier1_days: 30,
      late_lifting_tier1_percent: 1,
      late_lifting_tier2_days: 60,
      late_lifting_tier2_percent: 2,
      late_lifting_tier3_percent: 3,
    },
  ],
};

// Mock Invoices
export const mockInvoices: Invoice[] = [
  {
    id: 'inv_1',
    invoiceNo: 'INV-2024-001',
    salesContractId: 'sc_1',
    date: '2024-02-01',
    amount: 500000,
    status: 'Paid',
  },
];

// Mock Payments
export const mockPayments: Payment[] = [
  {
    id: 'pay_1',
    paymentId: 'PAY-2024-001',
    invoiceId: 'inv_1',
    date: '2024-02-15',
    amount: 500000,
    method: 'Bank Transfer',
  },
];

// Mock Disputes
export const mockDisputes: Dispute[] = [
  {
    id: 'dis_1',
    disputeId: 'DIS-2024-001',
    salesContractId: 'sc_1',
    reason: 'Quality Issue',
    status: 'Open',
    resolution: '',
    dateRaised: '2024-03-01',
  },
];

// Mock Commissions
export const mockCommissions: Commission[] = [
  {
    id: 'com_1',
    commissionId: 'COM-2024-001',
    salesContractId: 'sc_1',
    agent: 'Agent A',
    amount: 10000,
    status: 'Due',
  },
];
