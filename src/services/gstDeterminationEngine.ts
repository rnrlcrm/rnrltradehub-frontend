/**
 * GST Management System
 * 
 * Automatic GST rate determination based on:
 * - HSN Code (Harmonized System of Nomenclature)
 * - Commodity Category
 * - GST Act Rules
 * - Exemptions and Special Rates
 * 
 * This eliminates manual GST rate selection by users
 */

import { Commodity } from '../types';

// ============================================================================
// GST ACT DEFINITIONS
// ============================================================================

export interface GSTRate {
  id: number;
  rate: number;
  description: string;
  hsnCode: string;
  category: string;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive: boolean;
  exemptions?: string[];
  conditions?: string[];
}

export interface HSNMapping {
  hsnCode: string;
  description: string;
  commodityKeywords: string[];
  gstRate: number;
  category: 'Agricultural' | 'Processed' | 'Industrial' | 'Service';
  sacCode?: string; // For services
  exemptionAvailable: boolean;
  exemptionConditions?: string[];
}

// ============================================================================
// GST ACT - AGRICULTURAL COMMODITIES (Schedule I)
// ============================================================================

export const AGRICULTURAL_GST_RATES: HSNMapping[] = [
  {
    hsnCode: '5201',
    description: 'Cotton, not carded or combed',
    commodityKeywords: ['cotton', 'kapas', 'raw cotton'],
    gstRate: 5,
    category: 'Agricultural',
    exemptionAvailable: false,
    exemptionConditions: [],
  },
  {
    hsnCode: '5203',
    description: 'Cotton, carded or combed',
    commodityKeywords: ['cotton lint', 'combed cotton'],
    gstRate: 5,
    category: 'Agricultural',
    exemptionAvailable: false,
  },
  {
    hsnCode: '1001',
    description: 'Wheat and meslin',
    commodityKeywords: ['wheat', 'gehu', 'meslin'],
    gstRate: 0, // Exempt under Schedule
    category: 'Agricultural',
    exemptionAvailable: true,
    exemptionConditions: ['Unprocessed wheat', 'Not branded or packaged'],
  },
  {
    hsnCode: '1006',
    description: 'Rice',
    commodityKeywords: ['rice', 'chawal', 'paddy'],
    gstRate: 0, // Exempt under Schedule (unbranded)
    category: 'Agricultural',
    exemptionAvailable: true,
    exemptionConditions: ['Unbranded rice', 'Not pre-packaged and labeled'],
  },
  {
    hsnCode: '1006',
    description: 'Rice (Branded/Packaged)',
    commodityKeywords: ['branded rice', 'packaged rice', 'basmati rice'],
    gstRate: 5,
    category: 'Agricultural',
    exemptionAvailable: false,
    exemptionConditions: ['If branded and pre-packaged'],
  },
  {
    hsnCode: '1201',
    description: 'Soya beans',
    commodityKeywords: ['soybean', 'soya', 'soy'],
    gstRate: 0,
    category: 'Agricultural',
    exemptionAvailable: true,
  },
  {
    hsnCode: '1207',
    description: 'Other oil seeds',
    commodityKeywords: ['groundnut', 'mustard', 'sesame', 'sunflower', 'safflower'],
    gstRate: 0,
    category: 'Agricultural',
    exemptionAvailable: true,
  },
  {
    hsnCode: '0713',
    description: 'Dried leguminous vegetables',
    commodityKeywords: ['pulses', 'dal', 'lentils', 'chickpeas', 'moong', 'tur', 'chana'],
    gstRate: 0,
    category: 'Agricultural',
    exemptionAvailable: true,
  },
  {
    hsnCode: '1005',
    description: 'Maize (corn)',
    commodityKeywords: ['maize', 'corn', 'makka'],
    gstRate: 0,
    category: 'Agricultural',
    exemptionAvailable: true,
  },
  {
    hsnCode: '0901',
    description: 'Coffee',
    commodityKeywords: ['coffee', 'coffee beans'],
    gstRate: 0,
    category: 'Agricultural',
    exemptionAvailable: true,
    exemptionConditions: ['Unroasted coffee beans'],
  },
  {
    hsnCode: '0902',
    description: 'Tea',
    commodityKeywords: ['tea', 'chai', 'green tea'],
    gstRate: 5,
    category: 'Agricultural',
    exemptionAvailable: false,
  },
  {
    hsnCode: '0906',
    description: 'Cinnamon and cinnamon-tree flowers',
    commodityKeywords: ['cinnamon', 'dalchini'],
    gstRate: 5,
    category: 'Agricultural',
    exemptionAvailable: false,
  },
  {
    hsnCode: '0907',
    description: 'Cloves',
    commodityKeywords: ['cloves', 'laung'],
    gstRate: 5,
    category: 'Agricultural',
    exemptionAvailable: false,
  },
  {
    hsnCode: '0908',
    description: 'Nutmeg, mace and cardamoms',
    commodityKeywords: ['cardamom', 'elaichi', 'nutmeg', 'mace'],
    gstRate: 5,
    category: 'Agricultural',
    exemptionAvailable: false,
  },
  {
    hsnCode: '0910',
    description: 'Ginger, saffron, turmeric, thyme, etc.',
    commodityKeywords: ['ginger', 'adrak', 'turmeric', 'haldi', 'saffron', 'kesar'],
    gstRate: 5,
    category: 'Agricultural',
    exemptionAvailable: false,
  },
];

// ============================================================================
// PROCESSED COMMODITIES
// ============================================================================

export const PROCESSED_GST_RATES: HSNMapping[] = [
  {
    hsnCode: '5205',
    description: 'Cotton yarn',
    commodityKeywords: ['cotton yarn', 'thread'],
    gstRate: 5,
    category: 'Processed',
    exemptionAvailable: false,
  },
  {
    hsnCode: '5208',
    description: 'Woven fabrics of cotton',
    commodityKeywords: ['cotton fabric', 'cloth'],
    gstRate: 5,
    category: 'Processed',
    exemptionAvailable: false,
  },
  {
    hsnCode: '1101',
    description: 'Wheat or meslin flour',
    commodityKeywords: ['wheat flour', 'atta', 'maida'],
    gstRate: 0,
    category: 'Processed',
    exemptionAvailable: true,
    exemptionConditions: ['Not branded or packaged'],
  },
  {
    hsnCode: '1006',
    description: 'Rice flour',
    commodityKeywords: ['rice flour', 'chawal ka atta'],
    gstRate: 5,
    category: 'Processed',
    exemptionAvailable: false,
  },
];

// ============================================================================
// SERVICE GST RATES
// ============================================================================

export const SERVICE_GST_RATES: HSNMapping[] = [
  {
    hsnCode: '9983',
    description: 'Brokerage and Commission Services',
    commodityKeywords: ['brokerage', 'commission', 'agent services'],
    gstRate: 18,
    category: 'Service',
    sacCode: '9983',
    exemptionAvailable: false,
  },
  {
    hsnCode: '9965',
    description: 'Transportation by road',
    commodityKeywords: ['transport', 'freight', 'logistics'],
    gstRate: 5,
    category: 'Service',
    sacCode: '9965',
    exemptionAvailable: false,
  },
];

// ============================================================================
// GST DETERMINATION ENGINE
// ============================================================================

export class GSTDeterminationEngine {
  private hsnMappings: HSNMapping[];

  constructor() {
    this.hsnMappings = [
      ...AGRICULTURAL_GST_RATES,
      ...PROCESSED_GST_RATES,
      ...SERVICE_GST_RATES,
    ];
  }

  /**
   * Automatically determine GST rate for a commodity
   */
  determineGSTRate(commodityName: string, isProcessed: boolean = false): {
    hsnCode: string;
    gstRate: number;
    description: string;
    category: string;
    exemptionAvailable: boolean;
    exemptionConditions?: string[];
    confidence: 'high' | 'medium' | 'low';
    suggestions?: string[];
  } {
    const normalizedName = commodityName.toLowerCase().trim();
    
    // Find matching HSN mapping
    const matches = this.hsnMappings.filter(mapping => 
      mapping.commodityKeywords.some(keyword => 
        normalizedName.includes(keyword.toLowerCase())
      )
    );

    if (matches.length === 0) {
      return {
        hsnCode: '0000',
        gstRate: 5, // Default rate for unclassified
        description: 'Unclassified commodity',
        category: 'Agricultural',
        exemptionAvailable: false,
        confidence: 'low',
        suggestions: ['Please specify commodity type for accurate GST rate'],
      };
    }

    // If multiple matches, prefer processed or unprocessed based on flag
    let selectedMapping = matches[0];
    if (matches.length > 1) {
      const processedMatches = matches.filter(m => m.category === 'Processed');
      const agriculturalMatches = matches.filter(m => m.category === 'Agricultural');
      
      if (isProcessed && processedMatches.length > 0) {
        selectedMapping = processedMatches[0];
      } else if (!isProcessed && agriculturalMatches.length > 0) {
        selectedMapping = agriculturalMatches[0];
      }
    }

    return {
      hsnCode: selectedMapping.hsnCode,
      gstRate: selectedMapping.gstRate,
      description: selectedMapping.description,
      category: selectedMapping.category,
      exemptionAvailable: selectedMapping.exemptionAvailable,
      exemptionConditions: selectedMapping.exemptionConditions,
      confidence: matches.length === 1 ? 'high' : 'medium',
      suggestions: matches.length > 1 ? [
        `Multiple matches found. Selected ${selectedMapping.description}.`,
        `Other options: ${matches.slice(1).map(m => m.description).join(', ')}`,
      ] : undefined,
    };
  }

  /**
   * Get GST rate by HSN code
   */
  getGSTByHSN(hsnCode: string): HSNMapping | undefined {
    return this.hsnMappings.find(m => m.hsnCode === hsnCode);
  }

  /**
   * Search HSN codes by keyword
   */
  searchHSN(keyword: string): HSNMapping[] {
    const normalized = keyword.toLowerCase();
    return this.hsnMappings.filter(mapping =>
      mapping.description.toLowerCase().includes(normalized) ||
      mapping.commodityKeywords.some(kw => kw.toLowerCase().includes(normalized))
    );
  }

  /**
   * Get all HSN codes for a category
   */
  getHSNByCategory(category: 'Agricultural' | 'Processed' | 'Industrial' | 'Service'): HSNMapping[] {
    return this.hsnMappings.filter(m => m.category === category);
  }

  /**
   * Check if commodity is GST exempt
   */
  isGSTExempt(commodityName: string): {
    isExempt: boolean;
    conditions?: string[];
    hsnCode?: string;
  } {
    const gstInfo = this.determineGSTRate(commodityName);
    
    return {
      isExempt: gstInfo.gstRate === 0,
      conditions: gstInfo.exemptionConditions,
      hsnCode: gstInfo.hsnCode,
    };
  }

  /**
   * Get applicable GST components (CGST, SGST, IGST)
   */
  getGSTComponents(
    gstRate: number,
    isInterState: boolean
  ): {
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
  } {
    if (isInterState) {
      return {
        cgst: 0,
        sgst: 0,
        igst: gstRate,
        total: gstRate,
      };
    } else {
      const halfRate = gstRate / 2;
      return {
        cgst: halfRate,
        sgst: halfRate,
        igst: 0,
        total: gstRate,
      };
    }
  }

  /**
   * Calculate GST amount
   */
  calculateGST(
    baseAmount: number,
    gstRate: number,
    isInterState: boolean
  ): {
    baseAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalGST: number;
    totalAmount: number;
  } {
    const components = this.getGSTComponents(gstRate, isInterState);
    const cgstAmount = (baseAmount * components.cgst) / 100;
    const sgstAmount = (baseAmount * components.sgst) / 100;
    const igstAmount = (baseAmount * components.igst) / 100;
    const totalGST = cgstAmount + sgstAmount + igstAmount;

    return {
      baseAmount,
      cgst: cgstAmount,
      sgst: sgstAmount,
      igst: igstAmount,
      totalGST,
      totalAmount: baseAmount + totalGST,
    };
  }

  /**
   * Validate HSN code format
   */
  validateHSNCode(hsnCode: string): {
    isValid: boolean;
    message?: string;
  } {
    // HSN codes are 4, 6, or 8 digits
    const hsnRegex = /^\d{4}(\d{2})?(\d{2})?$/;
    
    if (!hsnRegex.test(hsnCode)) {
      return {
        isValid: false,
        message: 'HSN code must be 4, 6, or 8 digits',
      };
    }

    return { isValid: true };
  }

  /**
   * Get GST compliance notes
   */
  getComplianceNotes(commodityName: string): string[] {
    const gstInfo = this.determineGSTRate(commodityName);
    const notes: string[] = [];

    if (gstInfo.exemptionAvailable) {
      notes.push(`⚠️ GST exemption may be available under specific conditions`);
      if (gstInfo.exemptionConditions) {
        notes.push(`Conditions: ${gstInfo.exemptionConditions.join(', ')}`);
      }
    }

    if (gstInfo.gstRate === 0) {
      notes.push(`✓ This commodity is currently GST exempt`);
    }

    notes.push(`HSN Code: ${gstInfo.hsnCode}`);
    notes.push(`Category: ${gstInfo.category}`);

    return notes;
  }

  /**
   * Add custom HSN mapping
   */
  addCustomMapping(mapping: HSNMapping): void {
    this.hsnMappings.push(mapping);
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalMappings: number;
    byCategory: Record<string, number>;
    exemptCount: number;
    averageRate: number;
  } {
    const byCategory: Record<string, number> = {};
    let totalRate = 0;
    let exemptCount = 0;

    this.hsnMappings.forEach(mapping => {
      byCategory[mapping.category] = (byCategory[mapping.category] || 0) + 1;
      totalRate += mapping.gstRate;
      if (mapping.gstRate === 0) exemptCount++;
    });

    return {
      totalMappings: this.hsnMappings.length,
      byCategory,
      exemptCount,
      averageRate: totalRate / this.hsnMappings.length,
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const gstEngine = new GSTDeterminationEngine();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Auto-determine GST for commodity
 */
export const autoDetectGST = (commodityName: string, isProcessed?: boolean) => {
  return gstEngine.determineGSTRate(commodityName, isProcessed);
};

/**
 * Get GST info with human-readable explanation
 */
export const getGSTInfo = (commodityName: string): {
  rate: number;
  hsnCode: string;
  explanation: string;
  exemptionNotes?: string;
} => {
  const result = gstEngine.determineGSTRate(commodityName);
  
  let explanation = `${commodityName} is classified under HSN ${result.hsnCode} `;
  explanation += `and attracts ${result.gstRate}% GST as per GST Act.`;
  
  let exemptionNotes: string | undefined;
  if (result.exemptionAvailable) {
    exemptionNotes = `Note: GST exemption may be available if `;
    exemptionNotes += result.exemptionConditions?.join(', ') || 'certain conditions are met';
  }

  return {
    rate: result.gstRate,
    hsnCode: result.hsnCode,
    explanation,
    exemptionNotes,
  };
};
