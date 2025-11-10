/**
 * GST Calculation Utilities
 * 
 * Indian GST Rules:
 * - Same State: CGST + SGST (each 9% for 18% total)
 * - Different State: IGST (18%)
 * 
 * Default GST rate is 18% for most goods and services
 * Can be customized based on HSN code/product category
 */

export interface GSTCalculation {
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  totalAmount: number;
  gstRate: number;
  isInterState: boolean;
}

/**
 * Calculate GST based on seller and buyer states
 * @param taxableAmount - Base amount before GST
 * @param sellerState - State code/name of seller
 * @param buyerState - State code/name of buyer
 * @param gstRate - GST rate percentage (default 18%)
 * @returns GST calculation breakdown
 */
export function calculateGST(
  taxableAmount: number,
  sellerState: string,
  buyerState: string,
  gstRate: number = 18
): GSTCalculation {
  // Normalize state names for comparison (remove spaces, convert to uppercase)
  const normalizedSellerState = sellerState.trim().toUpperCase().replace(/\s+/g, '');
  const normalizedBuyerState = buyerState.trim().toUpperCase().replace(/\s+/g, '');
  
  // Check if inter-state transaction
  const isInterState = normalizedSellerState !== normalizedBuyerState;
  
  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  
  if (isInterState) {
    // Different states: IGST applies
    igst = (taxableAmount * gstRate) / 100;
  } else {
    // Same state: CGST + SGST applies (split equally)
    cgst = (taxableAmount * (gstRate / 2)) / 100;
    sgst = (taxableAmount * (gstRate / 2)) / 100;
  }
  
  const totalTax = cgst + sgst + igst;
  const totalAmount = taxableAmount + totalTax;
  
  return {
    taxableAmount: parseFloat(taxableAmount.toFixed(2)),
    cgst: parseFloat(cgst.toFixed(2)),
    sgst: parseFloat(sgst.toFixed(2)),
    igst: parseFloat(igst.toFixed(2)),
    totalTax: parseFloat(totalTax.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    gstRate,
    isInterState,
  };
}

/**
 * Format GST breakdown for display
 * @param gst - GST calculation object
 * @returns Formatted string for display
 */
export function formatGSTBreakdown(gst: GSTCalculation): string {
  if (gst.isInterState) {
    return `IGST @ ${gst.gstRate}%: ₹${gst.igst.toLocaleString('en-IN')}`;
  } else {
    return `CGST @ ${gst.gstRate / 2}%: ₹${gst.cgst.toLocaleString('en-IN')} + SGST @ ${gst.gstRate / 2}%: ₹${gst.sgst.toLocaleString('en-IN')}`;
  }
}

/**
 * Calculate reverse GST (given total amount including GST, calculate base)
 * @param totalAmount - Total amount including GST
 * @param gstRate - GST rate percentage
 * @returns Taxable amount before GST
 */
export function reverseGSTCalculation(totalAmount: number, gstRate: number = 18): number {
  const taxableAmount = (totalAmount * 100) / (100 + gstRate);
  return parseFloat(taxableAmount.toFixed(2));
}

/**
 * Validate state code/name
 * @param state - State name or code
 * @returns Boolean indicating if state is valid
 */
export function isValidIndianState(state: string): boolean {
  const indianStates = [
    'ANDHRA PRADESH', 'AP',
    'ARUNACHAL PRADESH', 'AR',
    'ASSAM', 'AS',
    'BIHAR', 'BR',
    'CHHATTISGARH', 'CG', 'CHATTISGARH',
    'GOA', 'GA',
    'GUJARAT', 'GJ',
    'HARYANA', 'HR',
    'HIMACHAL PRADESH', 'HP',
    'JHARKHAND', 'JH',
    'KARNATAKA', 'KA',
    'KERALA', 'KL',
    'MADHYA PRADESH', 'MP',
    'MAHARASHTRA', 'MH',
    'MANIPUR', 'MN',
    'MEGHALAYA', 'ML',
    'MIZORAM', 'MZ',
    'NAGALAND', 'NL',
    'ODISHA', 'OR', 'ORISSA',
    'PUNJAB', 'PB',
    'RAJASTHAN', 'RJ',
    'SIKKIM', 'SK',
    'TAMIL NADU', 'TN', 'TAMILNADU',
    'TELANGANA', 'TG', 'TS',
    'TRIPURA', 'TR',
    'UTTAR PRADESH', 'UP',
    'UTTARAKHAND', 'UK', 'UT',
    'WEST BENGAL', 'WB',
    'ANDAMAN AND NICOBAR ISLANDS', 'AN',
    'CHANDIGARH', 'CH',
    'DADRA AND NAGAR HAVELI AND DAMAN AND DIU', 'DN', 'DD',
    'DELHI', 'DL',
    'JAMMU AND KASHMIR', 'JK',
    'LADAKH', 'LA',
    'LAKSHADWEEP', 'LD',
    'PUDUCHERRY', 'PY', 'PONDICHERRY',
  ];
  
  const normalizedState = state.trim().toUpperCase().replace(/\s+/g, '');
  return indianStates.some(s => s.replace(/\s+/g, '') === normalizedState);
}

/**
 * Get standard GST rates for different categories
 */
export const GST_RATES = {
  AGRICULTURAL_PRODUCTS: 0, // Exempt
  ESSENTIAL_GOODS: 5,
  STANDARD_GOODS: 12,
  STANDARD_SERVICES: 18,
  LUXURY_GOODS: 28,
  COTTON: 5, // Cotton and cotton waste
  TEXTILES: 5, // Most textiles
  DEFAULT: 18, // Default rate for most goods and services
};

/**
 * Get GST rate by HSN code or product category
 * @param hsnCode - HSN code or product category
 * @returns GST rate percentage
 */
export function getGSTRateByHSN(hsnCode?: string): number {
  if (!hsnCode) return GST_RATES.DEFAULT;
  
  // For cotton products (common in this ERP)
  if (hsnCode.startsWith('52') || hsnCode.startsWith('5201')) {
    return GST_RATES.COTTON;
  }
  
  // Default to 18%
  return GST_RATES.DEFAULT;
}
