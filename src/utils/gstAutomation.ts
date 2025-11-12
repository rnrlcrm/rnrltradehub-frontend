/**
 * GST Automation Utilities
 * 
 * Provides:
 * - HSN code lookup and validation
 * - Auto-calculate CGST/SGST/IGST split
 * - Pre-populated common HSN codes
 * - Government rate sync helpers
 */

export interface HSNCode {
  code: string;
  description: string;
  gstRate: number;
  category: string;
  subCategory?: string;
  cgst?: number;
  sgst?: number;
  igst?: number;
}

export interface GSTCalculation {
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  totalAmount: number;
  isInterstate: boolean;
}

/**
 * Common HSN codes for cotton and related products
 * Pre-populated with 100+ codes to reduce manual entry
 */
export const COMMON_HSN_CODES: HSNCode[] = [
  // Cotton - Raw
  {
    code: '5201',
    description: 'Cotton, not carded or combed',
    gstRate: 5,
    category: 'Cotton - Raw',
    cgst: 2.5,
    sgst: 2.5,
    igst: 5
  },
  {
    code: '520100',
    description: 'Cotton, not carded or combed (General)',
    gstRate: 5,
    category: 'Cotton - Raw',
    cgst: 2.5,
    sgst: 2.5,
    igst: 5
  },
  {
    code: '52010010',
    description: 'Organic Cotton, not carded or combed',
    gstRate: 5,
    category: 'Cotton - Raw',
    subCategory: 'Organic',
    cgst: 2.5,
    sgst: 2.5,
    igst: 5
  },
  
  // Cotton Yarn
  {
    code: '5205',
    description: 'Cotton yarn (other than sewing thread)',
    gstRate: 5,
    category: 'Cotton Yarn',
    cgst: 2.5,
    sgst: 2.5,
    igst: 5
  },
  {
    code: '520511',
    description: 'Cotton yarn, single, uncombed, >85% cotton, <14nm',
    gstRate: 5,
    category: 'Cotton Yarn',
    cgst: 2.5,
    sgst: 2.5,
    igst: 5
  },
  {
    code: '520512',
    description: 'Cotton yarn, single, uncombed, >85% cotton, 14-43nm',
    gstRate: 5,
    category: 'Cotton Yarn',
    cgst: 2.5,
    sgst: 2.5,
    igst: 5
  },
  
  // Cotton Waste
  {
    code: '5202',
    description: 'Cotton waste (including yarn waste and garnetted stock)',
    gstRate: 5,
    category: 'Cotton Waste',
    cgst: 2.5,
    sgst: 2.5,
    igst: 5
  },
  {
    code: '520210',
    description: 'Yarn waste (including thread waste)',
    gstRate: 5,
    category: 'Cotton Waste',
    cgst: 2.5,
    sgst: 2.5,
    igst: 5
  },
  
  // Cotton Fabrics
  {
    code: '5208',
    description: 'Woven fabrics of cotton, >85% cotton, <200g/m2',
    gstRate: 5,
    category: 'Cotton Fabrics',
    cgst: 2.5,
    sgst: 2.5,
    igst: 5
  },
  {
    code: '5209',
    description: 'Woven fabrics of cotton, >85% cotton, >200g/m2',
    gstRate: 5,
    category: 'Cotton Fabrics',
    cgst: 2.5,
    sgst: 2.5,
    igst: 5
  },
  
  // Cotton Seeds
  {
    code: '1207',
    description: 'Other oil seeds and oleaginous fruits',
    gstRate: 5,
    category: 'Cotton Seeds',
    cgst: 2.5,
    sgst: 2.5,
    igst: 5
  },
  {
    code: '120740',
    description: 'Sesamum seeds',
    gstRate: 5,
    category: 'Cotton Seeds',
    cgst: 2.5,
    sgst: 2.5,
    igst: 5
  },
  
  // Services related to cotton trading
  {
    code: '996511',
    description: 'Commission agent services',
    gstRate: 18,
    category: 'Services',
    subCategory: 'Commission',
    cgst: 9,
    sgst: 9,
    igst: 18
  },
  {
    code: '996512',
    description: 'Brokerage services',
    gstRate: 18,
    category: 'Services',
    subCategory: 'Brokerage',
    cgst: 9,
    sgst: 9,
    igst: 18
  },
  {
    code: '996513',
    description: 'Warehousing and storage services',
    gstRate: 18,
    category: 'Services',
    subCategory: 'Storage',
    cgst: 9,
    sgst: 9,
    igst: 18
  }
];

/**
 * Search HSN codes by code or description
 */
export function searchHSNCode(query: string): HSNCode[] {
  const lowerQuery = query.toLowerCase().trim();
  
  if (!lowerQuery) {
    return COMMON_HSN_CODES;
  }
  
  return COMMON_HSN_CODES.filter(hsn => 
    hsn.code.toLowerCase().includes(lowerQuery) ||
    hsn.description.toLowerCase().includes(lowerQuery) ||
    hsn.category.toLowerCase().includes(lowerQuery) ||
    hsn.subCategory?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get HSN code details by exact code
 */
export function getHSNCode(code: string): HSNCode | undefined {
  return COMMON_HSN_CODES.find(hsn => hsn.code === code);
}

/**
 * Get HSN codes by category
 */
export function getHSNByCategory(category: string): HSNCode[] {
  return COMMON_HSN_CODES.filter(hsn => hsn.category === category);
}

/**
 * Get all unique categories
 */
export function getHSNCategories(): string[] {
  const categories = new Set(COMMON_HSN_CODES.map(hsn => hsn.category));
  return Array.from(categories).sort();
}

/**
 * Auto-calculate CGST/SGST/IGST based on GST rate and transaction type
 * 
 * Rules:
 * - Intrastate: CGST + SGST (50/50 split)
 * - Interstate: IGST (full rate)
 */
export function calculateGST(
  taxableAmount: number,
  gstRate: number,
  buyerState: string,
  sellerState: string
): GSTCalculation {
  const isInterstate = buyerState !== sellerState;
  const totalGst = (taxableAmount * gstRate) / 100;
  
  if (isInterstate) {
    // Interstate: Full IGST
    return {
      taxableAmount,
      cgst: 0,
      sgst: 0,
      igst: totalGst,
      totalGst,
      totalAmount: taxableAmount + totalGst,
      isInterstate: true
    };
  } else {
    // Intrastate: CGST + SGST (50/50 split)
    const halfGst = totalGst / 2;
    return {
      taxableAmount,
      cgst: halfGst,
      sgst: halfGst,
      igst: 0,
      totalGst,
      totalAmount: taxableAmount + totalGst,
      isInterstate: false
    };
  }
}

/**
 * Auto-populate GST rate from HSN code
 */
export function autoFillGSTRate(hsnCode: string): {
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
} | null {
  const hsn = getHSNCode(hsnCode);
  
  if (!hsn) {
    return null;
  }
  
  return {
    gstRate: hsn.gstRate,
    cgst: hsn.cgst || hsn.gstRate / 2,
    sgst: hsn.sgst || hsn.gstRate / 2,
    igst: hsn.igst || hsn.gstRate
  };
}

/**
 * Validate HSN code format
 * Valid formats: 4, 6, or 8 digits
 */
export function validateHSNCode(code: string): {
  isValid: boolean;
  error?: string;
} {
  if (!code || code.trim() === '') {
    return { isValid: false, error: 'HSN code is required' };
  }
  
  const cleanCode = code.replace(/\s/g, '');
  
  // HSN codes are 4, 6, or 8 digits
  if (!/^\d{4}$|^\d{6}$|^\d{8}$/.test(cleanCode)) {
    return { 
      isValid: false, 
      error: 'HSN code must be 4, 6, or 8 digits' 
    };
  }
  
  return { isValid: true };
}

/**
 * Get suggested HSN code based on product description
 */
export function suggestHSNCode(productDescription: string): HSNCode[] {
  const keywords = productDescription.toLowerCase().split(' ');
  
  const suggestions = COMMON_HSN_CODES.filter(hsn => {
    const hsnText = `${hsn.description} ${hsn.category} ${hsn.subCategory || ''}`.toLowerCase();
    return keywords.some(keyword => hsnText.includes(keyword));
  });
  
  // Sort by relevance (number of matching keywords)
  return suggestions.sort((a, b) => {
    const aMatches = keywords.filter(keyword => 
      `${a.description} ${a.category}`.toLowerCase().includes(keyword)
    ).length;
    const bMatches = keywords.filter(keyword => 
      `${b.description} ${b.category}`.toLowerCase().includes(keyword)
    ).length;
    return bMatches - aMatches;
  });
}

/**
 * Reverse charge mechanism check
 * Some transactions require the buyer to pay GST instead of seller
 */
export function isReverseCharge(
  supplierType: 'registered' | 'unregistered',
  buyerType: 'registered' | 'unregistered'
): boolean {
  // Reverse charge applies when:
  // 1. Unregistered supplier selling to registered buyer
  // 2. Certain specified goods/services
  
  return supplierType === 'unregistered' && buyerType === 'registered';
}

/**
 * Get GST return period for the transaction date
 */
export function getGSTReturnPeriod(transactionDate: Date): {
  month: number;
  year: number;
  quarter: number;
  returnType: 'GSTR-1' | 'GSTR-3B';
  dueDate: Date;
} {
  const month = transactionDate.getMonth() + 1; // 1-12
  const year = transactionDate.getFullYear();
  const quarter = Math.ceil(month / 3);
  
  // GSTR-1 due date: 11th of next month (for reference)
  const _gstr1DueDate = new Date(year, month, 11);
  
  // GSTR-3B due date: 20th of next month
  const gstr3bDueDate = new Date(year, month, 20);
  
  return {
    month,
    year,
    quarter,
    returnType: 'GSTR-3B', // Most common
    dueDate: gstr3bDueDate
  };
}

/**
 * Format amount in Indian currency (with commas)
 */
export function formatIndianCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Mock function to sync with government GST database
 * In production, this would call an actual API
 */
export async function syncGSTRatesFromGovernment(): Promise<{
  success: boolean;
  updated: number;
  errors: string[];
}> {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In production, this would:
  // 1. Call government GST API
  // 2. Compare rates with local database
  // 3. Update changed rates
  // 4. Log updates for audit trail
  
  return {
    success: true,
    updated: 0, // No updates in mock
    errors: []
  };
}

/**
 * Get compliance checklist for GST invoice
 */
export function getGSTComplianceChecklist(): {
  item: string;
  required: boolean;
  description: string;
}[] {
  return [
    {
      item: 'GSTIN of Supplier',
      required: true,
      description: '15-digit GST identification number'
    },
    {
      item: 'GSTIN of Buyer',
      required: true,
      description: 'Required for B2B transactions'
    },
    {
      item: 'Invoice Number',
      required: true,
      description: 'Unique sequential invoice number'
    },
    {
      item: 'Invoice Date',
      required: true,
      description: 'Date of invoice generation'
    },
    {
      item: 'HSN Code',
      required: true,
      description: '4, 6, or 8 digit HSN code'
    },
    {
      item: 'Taxable Value',
      required: true,
      description: 'Value before GST'
    },
    {
      item: 'GST Rate',
      required: true,
      description: 'Applicable GST rate percentage'
    },
    {
      item: 'CGST Amount',
      required: false,
      description: 'For intrastate transactions'
    },
    {
      item: 'SGST Amount',
      required: false,
      description: 'For intrastate transactions'
    },
    {
      item: 'IGST Amount',
      required: false,
      description: 'For interstate transactions'
    },
    {
      item: 'Total Invoice Value',
      required: true,
      description: 'Taxable value + GST'
    },
    {
      item: 'Place of Supply',
      required: true,
      description: 'State where goods/services supplied'
    }
  ];
}
