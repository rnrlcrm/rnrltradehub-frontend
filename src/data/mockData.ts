
import { User, SalesContract, BusinessPartner, Invoice, Payment, Dispute, Commission, AuditLog, MasterDataItem, Location, CommissionStructure, StructuredTerm, CciTerm, GstRate, Organization, Commodity } from '../types';

export const mockUsers: User[] = [
  { id: 1, name: 'Admin User', email: 'admin@rnrl.com', role: 'Admin' },
  { id: 2, name: 'Sales Manager', email: 'sales@rnrl.com', role: 'Sales' },
  { id: 3, name: 'Accounts Officer', email: 'accounts@rnrl.com', role: 'Accounts' },
  { id: 4, name: 'Dispute Handler', email: 'disputes@rnrl.com', role: 'Dispute Manager' },
  { id: 5, name: 'Client Portal', email: 'client@example.com', role: 'Vendor/Client' },
];

export const mockOrganizations: MasterDataItem[] = [
    { id: 1, name: 'RNRL Trade Hub Pvt. Ltd.' },
    { id: 2, name: 'RNRL Agro Solutions' },
];

export const mockBusinessPartners: BusinessPartner[] = [
  {
    id: 'bp_001', bp_code: 'R001', legal_name: 'Global Textiles Inc.', organization: 'RNRL Trade Hub Pvt. Ltd.', business_type: 'BUYER', status: 'ACTIVE', kyc_due_date: '2025-05-20',
    contact_person: 'Priya Sharma', contact_email: 'priya@globaltextiles.com', contact_phone: '9876543210',
    address_line1: '123 Textile Market', address_line2: '', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', country: 'India',
    shipping_addresses: [
        { id: 'ship1', address_line1: 'Warehouse A, Bhiwandi', address_line2: '', city: 'Bhiwandi', state: 'Maharashtra', pincode: '421302', country: 'India', is_default: true },
        { id: 'ship2', address_line1: 'Unit 5, Textile Park', address_line2: '', city: 'Surat', state: 'Gujarat', pincode: '395003', country: 'India', is_default: false },
    ],
    pan: 'ABCDE1234F', gstin: '27ABCDE1234F1Z5', bank_name: 'HDFC Bank', bank_account_no: 'XXXX-XXXX-1234', bank_ifsc: 'HDFC0000001',
    pan_doc_url: 'pan_card.pdf', gst_doc_url: 'gst_cert.pdf', cheque_doc_url: 'cheque.pdf', compliance_notes: 'All documents verified and approved.'
  },
  {
    id: 'bp_002', bp_code: 'R002', legal_name: 'Akola Cotton Mills', organization: 'RNRL Agro Solutions', business_type: 'SELLER', status: 'ACTIVE', kyc_due_date: '2025-06-15',
    contact_person: 'Ramesh Patel', contact_email: 'ramesh@akolacotton.com', contact_phone: '9988776655',
    address_line1: '456 MIDC Area', address_line2: '', city: 'Akola', state: 'Maharashtra', pincode: '444001', country: 'India',
    shipping_addresses: [],
    pan: 'FGHIJ5678K', gstin: '27FGHIJ5678K1Z6', bank_name: 'State Bank of India', bank_account_no: 'XXXX-XXXX-5678', bank_ifsc: 'SBIN0000002',
    pan_doc_url: 'pan_card.pdf', gst_doc_url: 'gst_cert.pdf', cheque_doc_url: 'cheque.pdf', compliance_notes: 'Reliable seller.'
  },
  {
    id: 'bp_003', bp_code: 'R003', legal_name: 'Surat Weavers Coop', organization: 'RNRL Trade Hub Pvt. Ltd.', business_type: 'BUYER', status: 'PENDING_COMPLIANCE', kyc_due_date: '2024-07-01',
    contact_person: 'Sunita Mehta', contact_email: 'sunita@suratweavers.com', contact_phone: '9123456789',
    address_line1: '789 Weavers Lane', address_line2: '', city: 'Surat', state: 'Gujarat', pincode: '395003', country: 'India',
    shipping_addresses: [],
    pan: 'KLMNO9012P', gstin: '24KLMNO9012P1Z7', bank_name: 'Axis Bank', bank_account_no: 'XXXX-XXXX-9012', bank_ifsc: 'UTIB0000003',
    pan_doc_url: 'pan_card.pdf', gst_doc_url: '', cheque_doc_url: 'cheque.pdf', compliance_notes: 'Awaiting GST certificate upload.'
  },
  {
    id: 'bp_004', bp_code: 'A001', legal_name: 'Excel Brokerage Services', organization: 'RNRL Trade Hub Pvt. Ltd.', business_type: 'AGENT', status: 'ACTIVE', kyc_due_date: '2025-08-01',
    contact_person: 'Ankit Desai', contact_email: 'ankit@excelbrokerage.com', contact_phone: '9876501234',
    address_line1: '101 Broker House', address_line2: 'Dalal Street', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', country: 'India',
    shipping_addresses: [], pan: 'PQRST4321Z', gstin: '27PQRST4321Z1Z9', bank_name: 'ICICI Bank', bank_account_no: 'XXXX-XXXX-4321', bank_ifsc: 'ICIC0000004',
    pan_doc_url: 'pan.pdf', gst_doc_url: 'gst.pdf', cheque_doc_url: 'cheque.pdf', compliance_notes: 'Primary agent.'
  },
];

export const mockSalesContracts: SalesContract[] = [
  {
    id: 'sc_001', scNo: 'SC-2024-001', version: 1, date: '2024-07-10', organization: 'RNRL Trade Hub Pvt. Ltd.', financialYear: '2024-25', clientId: 'bp_001', clientName: 'Global Textiles Inc.', vendorId: 'bp_002', vendorName: 'Akola Cotton Mills', agentId: 'bp_004',
    variety: 'MCU-5', quantityBales: 500, rate: 62000, gstRateId: 1,
    qualitySpecs: { length: '29mm', mic: '3.8', rd: '78', trash: '2.5%', moisture: '8.5%', strength: '29 GPT' },
    tradeType: 'CCI Trade', bargainType: 'Pucca Sauda',
    buyerCommissionId: 1, sellerCommissionId: 1, buyerCommissionGstId: 2, sellerCommissionGstId: 2,
    status: 'Active', cciContractNo: 'CCI-123', cciTermId: 1,
    weightmentTerms: `At Seller's Gin`, passingTerms: 'Lab Report', deliveryTerms: 'FOR', paymentTerms: '30 Days Credit', location: 'Maharashtra - Akola'
  },
  {
    id: 'sc_002', scNo: 'SC-2024-002', version: 1, date: '2024-07-15', organization: 'RNRL Agro Solutions', financialYear: '2024-25', clientId: 'bp_001', clientName: 'Global Textiles Inc.', vendorId: 'bp_002', vendorName: 'Akola Cotton Mills',
    variety: 'DCH-32', quantityBales: 200, rate: 75000, gstRateId: 1,
    qualitySpecs: { length: '34mm', mic: '4.2', rd: '80', trash: '2.0%', moisture: '8.0%', strength: '32 GPT' },
    manualTerms: 'Advance payment, delivery within 15 days.', buyerCommissionId: 3, sellerCommissionId: 3, buyerCommissionGstId: null, sellerCommissionGstId: null,
    tradeType: 'Normal Trade', bargainType: 'Pucca Sauda', status: 'Completed', cciTermId: null,
    weightmentTerms: `At Buyer's Mill`, passingTerms: 'Visual Inspection', deliveryTerms: 'Ex-Gin', paymentTerms: 'Advance', location: 'Maharashtra - Mumbai'
  },
  {
    id: 'sc_003', scNo: 'SC-2023-003', version: 1, date: '2024-03-20', organization: 'RNRL Trade Hub Pvt. Ltd.', financialYear: '2023-24', clientId: 'bp_003', clientName: 'Surat Weavers Coop', vendorId: 'bp_002', vendorName: 'Akola Cotton Mills', agentId: 'bp_004',
    variety: 'MCU-5', quantityBales: 1000, rate: 61500, gstRateId: 1,
    qualitySpecs: { length: '29mm', mic: '3.9', rd: '77', trash: '2.8%', moisture: '8.7%', strength: '28.5 GPT' },
    manualTerms: '60 days payment', buyerCommissionId: 2, sellerCommissionId: 2, buyerCommissionGstId: 2, sellerCommissionGstId: 2,
    tradeType: 'Normal Trade', bargainType: 'Subject to Approval', status: 'Active', cciTermId: null,
    weightmentTerms: `At Seller's Gin`, passingTerms: 'Lab Report', deliveryTerms: 'FOR', paymentTerms: '60 Days Credit', location: 'Gujarat - Surat'
  },
  {
    id: 'sc_004', scNo: 'SC-2024-004', version: 1, date: '2024-07-28', organization: 'RNRL Trade Hub Pvt. Ltd.', financialYear: '2024-25', clientId: 'bp_001', clientName: 'Global Textiles Inc.', vendorId: 'bp_002', vendorName: 'Akola Cotton Mills', agentId: 'bp_004',
    variety: 'Shankar-6', quantityBales: 300, rate: 65000, gstRateId: 1,
    qualitySpecs: { length: '30mm', mic: '4.0', rd: '79', trash: '2.2%', moisture: '8.2%', strength: '30 GPT' },
    tradeType: 'Normal Trade', bargainType: 'Pucca Sauda',
    buyerCommissionId: 1, sellerCommissionId: 1, buyerCommissionGstId: 2, sellerCommissionGstId: 2,
    status: 'Pending Approval', cciTermId: null,
    weightmentTerms: `At Seller's Gin`, passingTerms: 'Lab Report', deliveryTerms: 'FOR', paymentTerms: '30 Days Credit', location: 'Gujarat - Ahmedabad',
    manualTerms: 'Standard terms apply.'
  },
];

export const mockInvoices: Invoice[] = [
  { id: 'inv_001', invoiceNo: 'INV-2024-001', salesContractId: 'SC-2024-001', date: '2024-07-20', amount: 31000000, status: 'Paid' },
  { id: 'inv_002', invoiceNo: 'INV-2024-002', salesContractId: 'SC-2024-002', date: '2024-07-16', amount: 15000000, status: 'Paid' },
  { id: 'inv_003', invoiceNo: 'INV-2023-003', salesContractId: 'SC-2023-003', date: '2024-03-25', amount: 61500000, status: 'Unpaid' },
];

export const mockPayments: Payment[] = [
  { id: 'pay_001', paymentId: 'PAY-2024-001', invoiceId: 'INV-2024-001', date: '2024-07-25', amount: 31000000, method: 'Bank Transfer' },
  { id: 'pay_002', paymentId: 'PAY-2024-002', invoiceId: 'INV-2024-002', date: '2024-07-15', amount: 15000000, method: 'Bank Transfer' },
];

export const mockDisputes: Dispute[] = [
  { id: 'disp_001', disputeId: 'DISP-001', salesContractId: 'SC-2023-003', reason: 'Quality Mismatch (Mic)', status: 'Open', resolution: '', dateRaised: '2024-04-05' },
];

export const mockCommissions: Commission[] = [
    { id: 'comm_001', commissionId: 'COMM-001', salesContractId: 'SC-2024-001', agent: 'Agent X', amount: 310000, status: 'Paid' },
    { id: 'comm_002', commissionId: 'COMM-002', salesContractId: 'SC-2023-003', agent: 'Agent Y', amount: 922500, status: 'Due' },
];

export const mockAuditLogs: AuditLog[] = [
  { id: 1, timestamp: '2024-07-26 10:00:15', user: 'Admin User', role: 'Admin', module: 'Sales Contracts', action: 'Create', details: 'Created contract SC-2024-003', reason: 'New deal finalized' },
  { id: 2, timestamp: '2024-07-26 10:05:20', user: 'Sales Manager', role: 'Sales', module: 'Business Partner', action: 'Update', details: 'Updated contact for Global Textiles Inc.', reason: 'Contact person changed' },
  { id: 3, timestamp: '2024-07-26 T 11:00:00', user: 'Accounts Officer', role: 'Accounts', module: 'Payments', action: 'Create', details: 'Recorded payment PAY-2024-001 for INV-2024-001', reason: 'Payment received' },
];

export const mockLocations: Location[] = [
    { id: 1, country: 'India', state: 'Maharashtra', city: 'Akola' },
    { id: 2, country: 'India', state: 'Maharashtra', city: 'Mumbai' },
    { id: 3, country: 'India', state: 'Gujarat', city: 'Surat' },
    { id: 4, country: 'India', state: 'Gujarat', city: 'Ahmedabad' },
];

const tradeTypes: MasterDataItem[] = [ { id: 1, name: 'Normal Trade' }, { id: 2, name: 'CCI Trade' } ];
const varieties: MasterDataItem[] = [ { id: 1, name: 'MCU-5' }, { id: 2, name: 'DCH-32' }, { id: 3, name: 'Shankar-6' } ];
const disputeReasons: MasterDataItem[] = [ { id: 1, name: 'Quality Mismatch' }, { id: 2, name: 'Weight Shortage' }, { id: 3, name: 'Late Delivery' } ];
const weightmentTerms: MasterDataItem[] = [ { id: 1, name: 'At Seller\'s Gin' }, { id: 2, name: 'At Buyer\'s Mill' } ];
const passingTerms: MasterDataItem[] = [ { id: 1, name: 'Lab Report' }, { id: 2, name: 'Visual Inspection' } ];
const financialYears: MasterDataItem[] = [ { id: 1, name: '2023-24' }, { id: 2, name: '2024-25' } ];
const bargainTypes: MasterDataItem[] = [ { id: 1, name: 'Pucca Sauda' }, { id: 2, name: 'Subject to Approval' } ];

const deliveryTerms: StructuredTerm[] = [ { id: 1, name: 'Ex-Gin', days: 0 }, { id: 2, name: 'FOR', days: 5 } ];
const paymentTerms: StructuredTerm[] = [ { id: 1, name: 'Advance', days: 0 }, { id: 2, name: 'Against Delivery', days: 0 }, { id: 3, name: '30 Days Credit', days: 30 }, { id: 4, name: '60 Days Credit', days: 60 }];

const commissions: CommissionStructure[] = [
    { id: 1, name: 'Standard Brokerage', type: 'PERCENTAGE', value: 1.0 },
    { id: 2, name: 'Per Bale Fee', type: 'PER_BALE', value: 100 },
    { id: 3, name: 'None', type: 'PERCENTAGE', value: 0 },
];

const cciTerms: CciTerm[] = [
    {
        id: 1, 
        name: 'Standard CCI 2024-25', 
        
        // Versioning
        effectiveFrom: '2024-04-01',
        effectiveTo: undefined,
        version: 1,
        isActive: true,
        
        // Core Financial Parameters
        candy_factor: 0.2812, // Conversion from quintal to candy
        gst_rate: 5, // 5% GST on cotton
        
        // EMD Configuration
        emd_by_buyer_type: {
            kvic: 10, // 10% for KVIC
            privateMill: 12.5, // 10-15% for Private Mill (using mid-point)
            trader: 17.5, // 15-20% for Trader (using mid-point)
        },
        emd_payment_days: 5,
        emd_interest_percent: 5, // 5% annual interest on timely EMD
        emd_late_interest_percent: 10, // 10% if EMD paid late
        emd_block_do_if_not_full: true, // Block DO creation if full EMD not paid (CCI Policy)
        
        // Carrying Charges
        carrying_charge_tier1_days: 30,
        carrying_charge_tier1_percent: 1.25, // 1.25% per month for 0-30 days
        carrying_charge_tier2_days: 60,
        carrying_charge_tier2_percent: 1.35, // 1.35% per month for >30 days
        
        // Late Lifting Charges
        free_lifting_period_days: 21,
        late_lifting_tier1_days: 30,
        late_lifting_tier1_percent: 0.5, // 0.5% per month for 0-30 days
        late_lifting_tier2_days: 60,
        late_lifting_tier2_percent: 0.75, // 0.75% per month for 31-60 days
        late_lifting_tier3_percent: 1.0, // 1.0% per month for >60 days
        
        // Payment & Discount Terms
        cash_discount_percentage: 5, // 5% annual cash discount
        
        // Interest Rates
        interest_lc_bg_percent: 10, // 10% annual interest for LC/BG
        penal_interest_lc_bg_percent: 11, // 11% penal interest
        
        // Additional Deposits
        additional_deposit_percent: 10,
        deposit_interest_percent: 5,
        
        // Lifting & Contract Period
        lifting_period_days: 45, // 30-60 days (using mid-point)
        contract_period_days: 45,
        
        // Lock-in Period Charges
        lockin_charge_min: 350, // Rs/bale
        lockin_charge_max: 700, // Rs/bale
        
        // Moisture Adjustment Parameters
        moisture_lower_limit: 7, // Below 7%, premium charged
        moisture_upper_limit: 9, // Above 9%, discount applied
        moisture_sample_count: 10, // Sample 10 bales
        
        // Email Configuration
        email_reminder_days: 5,
        email_template_emd_reminder: '<p>Dear Partner, This is a reminder that EMD payment is due within {days} days.</p>',
        email_template_payment_due: '<p>Dear Partner, Payment for invoice {invoice_no} is now due.</p>',
    },
    {
        id: 2, 
        name: 'Standard CCI 2023-24 (Historical)', 
        
        // Versioning
        effectiveFrom: '2023-04-01',
        effectiveTo: '2024-03-31',
        version: 1,
        isActive: false,
        
        // Core Financial Parameters
        candy_factor: 0.2812,
        gst_rate: 5,
        
        // EMD Configuration
        emd_by_buyer_type: {
            kvic: 10,
            privateMill: 12.5,
            trader: 17.5,
        },
        emd_payment_days: 3,
        emd_interest_percent: 5,
        emd_late_interest_percent: 10,
        emd_block_do_if_not_full: true, // Block DO creation if full EMD not paid
        
        // Carrying Charges
        carrying_charge_tier1_days: 30,
        carrying_charge_tier1_percent: 1.25,
        carrying_charge_tier2_days: 60,
        carrying_charge_tier2_percent: 1.5,
        
        // Late Lifting Charges
        free_lifting_period_days: 21,
        late_lifting_tier1_days: 15,
        late_lifting_tier1_percent: 0.5,
        late_lifting_tier2_days: 30,
        late_lifting_tier2_percent: 0.75,
        late_lifting_tier3_percent: 1.0,
        
        // Payment & Discount Terms
        cash_discount_percentage: 5,
        
        // Interest Rates
        interest_lc_bg_percent: 10,
        penal_interest_lc_bg_percent: 11,
        
        // Additional Deposits
        additional_deposit_percent: 10,
        deposit_interest_percent: 6,
        
        // Lifting & Contract Period
        lifting_period_days: 45,
        contract_period_days: 45,
        
        // Lock-in Period Charges
        lockin_charge_min: 350,
        lockin_charge_max: 700,
        
        // Moisture Adjustment Parameters
        moisture_lower_limit: 7,
        moisture_upper_limit: 9,
        moisture_sample_count: 10,
        
        // Email Configuration
        email_reminder_days: 5,
    }
];

// Comprehensive GST Master as per GST Act - Reference Database
// This is a comprehensive database of all HSN/SAC codes and their GST rates
// Users don't select from this - it's used for reference and validation
const gstRates: GstRate[] = [
    // AGRICULTURAL COMMODITIES - Mostly Exempt or 5%
    { id: 1, rate: 0, description: 'Wheat and meslin (unbranded)', hsnCode: '1001' },
    { id: 2, rate: 0, description: 'Rice (unbranded)', hsnCode: '1006' },
    { id: 3, rate: 5, description: 'Rice (branded/packaged)', hsnCode: '1006' },
    { id: 4, rate: 0, description: 'Maize (Corn)', hsnCode: '1005' },
    { id: 5, rate: 0, description: 'Soya beans', hsnCode: '1201' },
    { id: 6, rate: 0, description: 'Ground-nuts', hsnCode: '1202' },
    { id: 7, rate: 0, description: 'Copra', hsnCode: '1203' },
    { id: 8, rate: 0, description: 'Linseed', hsnCode: '1204' },
    { id: 9, rate: 0, description: 'Rape or colza seeds', hsnCode: '1205' },
    { id: 10, rate: 0, description: 'Sunflower seeds', hsnCode: '1206' },
    { id: 11, rate: 0, description: 'Other oil seeds (Sesame, Mustard)', hsnCode: '1207' },
    { id: 12, rate: 0, description: 'Dried leguminous vegetables (Pulses)', hsnCode: '0713' },
    { id: 13, rate: 0, description: 'Coffee (unroasted)', hsnCode: '0901' },
    { id: 14, rate: 5, description: 'Tea', hsnCode: '0902' },
    { id: 15, rate: 5, description: 'Pepper', hsnCode: '0904' },
    { id: 16, rate: 5, description: 'Vanilla', hsnCode: '0905' },
    { id: 17, rate: 5, description: 'Cinnamon', hsnCode: '0906' },
    { id: 18, rate: 5, description: 'Cloves', hsnCode: '0907' },
    { id: 19, rate: 5, description: 'Nutmeg, mace and cardamoms', hsnCode: '0908' },
    { id: 20, rate: 5, description: 'Seeds of anise, badian, fennel, etc.', hsnCode: '0909' },
    { id: 21, rate: 5, description: 'Ginger, saffron, turmeric, thyme', hsnCode: '0910' },
    
    // COTTON AND COTTON PRODUCTS
    { id: 22, rate: 5, description: 'Cotton, not carded or combed (Raw Cotton)', hsnCode: '5201' },
    { id: 23, rate: 5, description: 'Cotton waste', hsnCode: '5202' },
    { id: 24, rate: 5, description: 'Cotton, carded or combed', hsnCode: '5203' },
    { id: 25, rate: 5, description: 'Cotton sewing thread', hsnCode: '5204' },
    { id: 26, rate: 5, description: 'Cotton yarn', hsnCode: '5205' },
    { id: 27, rate: 5, description: 'Cotton yarn (multiple)', hsnCode: '5206' },
    { id: 28, rate: 5, description: 'Cotton yarn (put up for retail sale)', hsnCode: '5207' },
    { id: 29, rate: 5, description: 'Woven fabrics of cotton', hsnCode: '5208' },
    { id: 30, rate: 5, description: 'Woven fabrics of cotton (denim, etc.)', hsnCode: '5209' },
    { id: 31, rate: 5, description: 'Woven fabrics of cotton (printed)', hsnCode: '5210' },
    { id: 32, rate: 5, description: 'Other woven fabrics of cotton', hsnCode: '5211' },
    { id: 33, rate: 5, description: 'Other woven fabrics of cotton (mixed)', hsnCode: '5212' },
    
    // PROCESSED AGRICULTURAL PRODUCTS
    { id: 34, rate: 0, description: 'Wheat or meslin flour (unbranded)', hsnCode: '1101' },
    { id: 35, rate: 5, description: 'Wheat or meslin flour (branded)', hsnCode: '1101' },
    { id: 36, rate: 5, description: 'Rice flour', hsnCode: '1102' },
    { id: 37, rate: 5, description: 'Cereal flours other than wheat/meslin', hsnCode: '1102' },
    { id: 38, rate: 5, description: 'Cereal groats, meal and pellets', hsnCode: '1103' },
    { id: 39, rate: 5, description: 'Cereal grains otherwise worked', hsnCode: '1104' },
    
    // EDIBLE OILS
    { id: 40, rate: 5, description: 'Soya-bean oil and its fractions', hsnCode: '1507' },
    { id: 41, rate: 5, description: 'Ground-nut oil and its fractions', hsnCode: '1508' },
    { id: 42, rate: 5, description: 'Olive oil and its fractions', hsnCode: '1509' },
    { id: 43, rate: 5, description: 'Palm oil and its fractions', hsnCode: '1511' },
    { id: 44, rate: 5, description: 'Sunflower-seed oil', hsnCode: '1512' },
    { id: 45, rate: 5, description: 'Coconut oil', hsnCode: '1513' },
    { id: 46, rate: 5, description: 'Rape, colza or mustard oil', hsnCode: '1514' },
    
    // SUGAR AND CONFECTIONERY
    { id: 47, rate: 5, description: 'Raw sugar (without flavouring)', hsnCode: '1701' },
    { id: 48, rate: 18, description: 'Sugar confectionery', hsnCode: '1704' },
    
    // SERVICES - SAC CODES
    { id: 49, rate: 18, description: 'Brokerage and Commission Services', hsnCode: '9983' },
    { id: 50, rate: 5, description: 'Goods Transport Services by Road', hsnCode: '9965' },
    { id: 51, rate: 18, description: 'Goods Transport Services by Air', hsnCode: '9964' },
    { id: 52, rate: 5, description: 'Transport of goods by Rail', hsnCode: '9966' },
    { id: 53, rate: 5, description: 'Transport of goods by inland waterways', hsnCode: '9967' },
    { id: 54, rate: 18, description: 'Storage and warehousing services', hsnCode: '9968' },
    { id: 55, rate: 18, description: 'Packaging services', hsnCode: '9985' },
    { id: 56, rate: 18, description: 'Cleaning services', hsnCode: '9986' },
    { id: 57, rate: 18, description: 'Membership services of trade unions', hsnCode: '9992' },
    { id: 58, rate: 18, description: 'Other professional, technical and business services', hsnCode: '9982' },
    
    // TEXTILES (OTHER THAN COTTON)
    { id: 59, rate: 5, description: 'Silk yarn', hsnCode: '5004' },
    { id: 60, rate: 5, description: 'Wool yarn', hsnCode: '5106' },
    { id: 61, rate: 12, description: 'Synthetic filament yarn', hsnCode: '5401' },
    { id: 62, rate: 12, description: 'Synthetic staple fibres', hsnCode: '5501' },
    
    // JUTE AND OTHER VEGETABLE TEXTILE FIBRES
    { id: 63, rate: 5, description: 'Jute and other textile bast fibres', hsnCode: '5303' },
    { id: 64, rate: 5, description: 'Coconut (coir)', hsnCode: '5305' },
    
    // METAL PRODUCTS (for equipment/machinery)
    { id: 65, rate: 18, description: 'Iron and steel products', hsnCode: '7308' },
    { id: 66, rate: 18, description: 'Machinery and mechanical appliances', hsnCode: '8419' },
    
    // CHEMICALS AND FERTILIZERS
    { id: 67, rate: 5, description: 'Fertilizers', hsnCode: '3102' },
    { id: 68, rate: 18, description: 'Pesticides', hsnCode: '3808' },
];

// Commodity Master - Multi-commodity support with Auto-GST
const commodities: Commodity[] = [
    {
        id: 1,
        name: 'Cotton',
        symbol: 'CTN',
        unit: 'Bales',
        // GST auto-determined from GST Act
        hsnCode: '5201', // Cotton, not carded or combed
        gstRate: 5, // 5% as per GST Act Schedule I
        gstExemptionAvailable: false,
        gstCategory: 'Agricultural',
        isProcessed: false,
        isActive: true,
        // Cotton has all trade types - stored directly
        tradeTypes: [
            { id: 1, name: 'Normal Trade' },
            { id: 2, name: 'CCI Trade' },
        ],
        bargainTypes: [
            { id: 1, name: 'Pucca Sauda' },
            { id: 2, name: 'Subject to Approval' },
        ],
        varieties: [
            { id: 1, name: 'MCU-5' },
            { id: 2, name: 'DCH-32' },
            { id: 3, name: 'Shankar-6' },
        ],
        weightmentTerms: [
            { id: 1, name: 'At Seller\'s Gin' },
            { id: 2, name: 'At Buyer\'s Mill' },
        ],
        passingTerms: [
            { id: 1, name: 'Lab Report' },
            { id: 2, name: 'Visual Inspection' },
        ],
        deliveryTerms: [
            { id: 1, name: 'Ex-Gin', days: 0 },
            { id: 2, name: 'FOR', days: 5 },
        ],
        paymentTerms: [
            { id: 1, name: 'Advance', days: 0 },
            { id: 2, name: 'Against Delivery', days: 0 },
            { id: 3, name: '30 Days Credit', days: 30 },
            { id: 4, name: '60 Days Credit', days: 60 },
        ],
        commissions: [
            { id: 1, name: 'Standard Brokerage', type: 'PERCENTAGE', value: 1.0 },
            { id: 2, name: 'Per Bale Fee', type: 'PER_BALE', value: 100 },
            { id: 3, name: 'None', type: 'PERCENTAGE', value: 0 },
        ],
        supportsCciTerms: true, // Cotton supports CCI terms
        description: 'Raw cotton and cotton products',
    },
    {
        id: 2,
        name: 'Wheat',
        symbol: 'WHT',
        unit: 'Quintal',
        // GST auto-determined - Wheat is exempt
        hsnCode: '1001', // Wheat and meslin
        gstRate: 0, // Exempt under Schedule (unbranded/unprocessed)
        gstExemptionAvailable: true,
        gstCategory: 'Agricultural',
        isProcessed: false,
        isActive: true,
        tradeTypes: [
            { id: 1, name: 'Normal Trade' },
        ],
        bargainTypes: [
            { id: 1, name: 'Pucca Sauda' },
            { id: 2, name: 'Subject to Approval' },
        ],
        varieties: [], // Will be added separately for wheat
        weightmentTerms: [
            { id: 1, name: 'At Seller\'s Gin' },
            { id: 2, name: 'At Buyer\'s Mill' },
        ],
        passingTerms: [
            { id: 1, name: 'Lab Report' },
            { id: 2, name: 'Visual Inspection' },
        ],
        deliveryTerms: [
            { id: 1, name: 'Ex-Gin', days: 0 },
            { id: 2, name: 'FOR', days: 5 },
        ],
        paymentTerms: [
            { id: 1, name: 'Advance', days: 0 },
            { id: 2, name: 'Against Delivery', days: 0 },
            { id: 3, name: '30 Days Credit', days: 30 },
            { id: 4, name: '60 Days Credit', days: 60 },
        ],
        commissions: [
            { id: 1, name: 'Standard Brokerage', type: 'PERCENTAGE', value: 1.0 },
            { id: 2, name: 'Per Bale Fee', type: 'PER_BALE', value: 100 },
            { id: 3, name: 'None', type: 'PERCENTAGE', value: 0 },
        ],
        supportsCciTerms: false, // Wheat doesn't support CCI terms
        description: 'Wheat grains and related products',
    },
    {
        id: 3,
        name: 'Rice',
        symbol: 'RIC',
        unit: 'Quintal',
        // GST auto-determined - Rice is exempt (unbranded)
        hsnCode: '1006', // Rice
        gstRate: 0, // Exempt if unbranded/not pre-packaged
        gstExemptionAvailable: true,
        gstCategory: 'Agricultural',
        isProcessed: false,
        isActive: true,
        tradeTypes: [
            { id: 1, name: 'Normal Trade' },
        ],
        bargainTypes: [
            { id: 1, name: 'Pucca Sauda' },
            { id: 2, name: 'Subject to Approval' },
        ],
        varieties: [], // Will be added separately for rice
        weightmentTerms: [
            { id: 1, name: 'At Seller\'s Gin' },
            { id: 2, name: 'At Buyer\'s Mill' },
        ],
        passingTerms: [
            { id: 1, name: 'Lab Report' },
            { id: 2, name: 'Visual Inspection' },
        ],
        deliveryTerms: [
            { id: 1, name: 'Ex-Gin', days: 0 },
            { id: 2, name: 'FOR', days: 5 },
        ],
        paymentTerms: [
            { id: 1, name: 'Advance', days: 0 },
            { id: 2, name: 'Against Delivery', days: 0 },
            { id: 3, name: '30 Days Credit', days: 30 },
            { id: 4, name: '60 Days Credit', days: 60 },
        ],
        commissions: [
            { id: 1, name: 'Standard Brokerage', type: 'PERCENTAGE', value: 1.0 },
            { id: 2, name: 'Per Bale Fee', type: 'PER_BALE', value: 100 },
            { id: 3, name: 'None', type: 'PERCENTAGE', value: 0 },
        ],
        supportsCciTerms: false, // Rice doesn't support CCI terms
        description: 'Rice grains and related products',
    },
];

export const mockOrganizationsDetailed: Organization[] = [
    {
        id: 1,
        name: 'RNRL Trade Hub Pvt. Ltd.',
        code: 'RNRL-HO',
        address: '123 Trade Center, Commercial Complex',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India',
        phone: '022-12345678',
        email: 'info@rnrlhub.com',
        gstin: '27AABCR1234K1Z5',
        pan: 'AABCR1234K',
        tan: 'MUMR12345A',
        cin: 'U51909MH2020PTC123456',
        bankName: 'HDFC Bank Ltd',
        accountNumber: '50200012345678',
        ifscCode: 'HDFC0001234',
        branchName: 'Fort, Mumbai',
        isActive: true,
    },
    {
        id: 2,
        name: 'RNRL Agro Solutions',
        code: 'RNRL-AS',
        address: '456 Agricultural Park, MIDC Area',
        city: 'Akola',
        state: 'Maharashtra',
        pincode: '444001',
        country: 'India',
        phone: '0724-2234567',
        email: 'agro@rnrl.com',
        gstin: '27AABCR5678M1Z8',
        pan: 'AABCR5678M',
        tan: 'AKOR56789B',
        cin: 'U01100MH2021PTC234567',
        bankName: 'State Bank of India',
        accountNumber: '12345678901',
        ifscCode: 'SBIN0005678',
        branchName: 'Akola Main Branch',
        isActive: true,
    },
];

export const mockMasterData = {
    tradeTypes, varieties, disputeReasons, weightmentTerms, passingTerms, financialYears, bargainTypes, deliveryTerms, paymentTerms, commissions, cciTerms, organizations: mockOrganizations, locations: mockLocations, gstRates, commodities
};
