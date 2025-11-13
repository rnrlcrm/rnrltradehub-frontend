/**
 * Commodity Helper Functions
 * 
 * Utility functions for commodity management including:
 * - Symbol generation
 * - Smart defaults
 * - Validation
 * - Business rules enforcement
 */

import { Commodity, CommodityUnit } from '../types';
import { 
  sanitizeCommodityName as sanitizeNameUtil, 
  sanitizeSymbol as sanitizeSymbolUtil 
} from './sanitization';
import { autoDetectGST } from '../services/gstDeterminationEngine';

// Re-export sanitization functions with original names
export const sanitizeCommodityName = sanitizeNameUtil;
export const sanitizeSymbol = sanitizeSymbolUtil;

/**
 * Auto-generate commodity symbol from name
 * Examples: "Cotton" -> "CTN", "Wheat" -> "WHT", "Rice Basmati" -> "RBS"
 */
export const generateSymbol = (name: string): string => {
  if (!name || name.trim().length === 0) return '';
  
  const cleaned = name.trim().toUpperCase();
  
  // For single word, take first 3 letters
  const words = cleaned.split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 3);
  }
  
  // For multiple words, take first letter of each word (max 4)
  return words
    .slice(0, 4)
    .map(word => word.charAt(0))
    .join('');
};

/**
 * Get default unit for commodity based on name
 */
export const getDefaultUnit = (commodityName: string): CommodityUnit => {
  const name = commodityName.toLowerCase();
  
  // Cotton-related commodities use Bales
  if (name.includes('cotton')) return 'Bales';
  
  // Grains typically use Quintal
  if (name.includes('wheat') || name.includes('rice') || name.includes('grain')) {
    return 'Quintal';
  }
  
  // Default to Quintal
  return 'Quintal';
};

/**
 * Check if commodity name suggests it should support CCI Terms
 * Currently only Cotton supports CCI Terms
 */
export const shouldSupportCciTerms = (commodityName: string): boolean => {
  return commodityName.toLowerCase().includes('cotton');
};

/**
 * Auto-determine GST information for commodity
 * Uses GST Determination Engine based on HSN codes and GST Act
 */
export const autoDetectGSTInfo = (commodityName: string, isProcessed: boolean = false) => {
  return autoDetectGST(commodityName, isProcessed);
};

/**
 * Get commodity template configuration
 * Pre-configured settings for common commodities with auto-GST
 */
interface CommodityTemplate {
  name: string;
  symbol: string;
  unit: CommodityUnit;
  isProcessed: boolean;
  supportsCciTerms: boolean;
  description: string;
  // Default trading parameter IDs (based on mock data)
  defaultTradeTypeIds: number[];
  defaultBargainTypeIds: number[];
  defaultWeightmentTermIds: number[];
  defaultPassingTermIds: number[];
  defaultDeliveryTermIds: number[];
  defaultPaymentTermIds: number[];
  defaultCommissionIds: number[];
}

export const getCommodityTemplates = (): CommodityTemplate[] => {
  return [
    {
      name: 'Cotton',
      symbol: 'CTN',
      unit: 'Bales',
      isProcessed: false, // Raw cotton
      supportsCciTerms: true,
      description: 'Raw cotton and cotton products - HSN 5201, 5% GST',
      defaultTradeTypeIds: [1, 2], // Normal Trade, CCI Trade
      defaultBargainTypeIds: [1, 2], // Pucca Sauda, Subject to Approval
      defaultWeightmentTermIds: [1, 2],
      defaultPassingTermIds: [1, 2],
      defaultDeliveryTermIds: [1, 2],
      defaultPaymentTermIds: [1, 2, 3, 4],
      defaultCommissionIds: [1, 2, 3],
    },
    {
      name: 'Wheat',
      symbol: 'WHT',
      unit: 'Quintal',
      isProcessed: false, // Unprocessed wheat
      supportsCciTerms: false,
      description: 'Wheat grains - HSN 1001, GST Exempt (unbranded)',
      defaultTradeTypeIds: [1], // Normal Trade only
      defaultBargainTypeIds: [1, 2],
      defaultWeightmentTermIds: [1, 2],
      defaultPassingTermIds: [1, 2],
      defaultDeliveryTermIds: [1, 2],
      defaultPaymentTermIds: [1, 2, 3, 4],
      defaultCommissionIds: [1, 2, 3],
    },
    {
      name: 'Rice',
      symbol: 'RIC',
      unit: 'Quintal',
      isProcessed: false, // Unprocessed rice
      supportsCciTerms: false,
      description: 'Rice grains - HSN 1006, GST Exempt (unbranded)',
      defaultTradeTypeIds: [1], // Normal Trade only
      defaultBargainTypeIds: [1, 2],
      defaultWeightmentTermIds: [1, 2],
      defaultPassingTermIds: [1, 2],
      defaultDeliveryTermIds: [1, 2],
      defaultPaymentTermIds: [1, 2, 3, 4],
      defaultCommissionIds: [1, 2, 3],
    },
  ];
};

/**
 * Validate commodity business rules
 */
export interface ValidationError {
  field: string;
  message: string;
}

export const validateCommodityBusinessRules = (
  commodity: Omit<Commodity, 'id'>,
  existingCommodities: Commodity[],
  editingId?: number
): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  // Rule 1: Cotton must support CCI Terms
  if (commodity.name.toLowerCase().includes('cotton') && !commodity.supportsCciTerms) {
    errors.push({
      field: 'supportsCciTerms',
      message: 'Cotton commodities must support CCI Terms as per business policy',
    });
  }
  
  // Rule 2: Non-cotton commodities should not support CCI Terms
  if (!commodity.name.toLowerCase().includes('cotton') && commodity.supportsCciTerms) {
    errors.push({
      field: 'supportsCciTerms',
      message: 'Only Cotton commodities can support CCI Terms',
    });
  }
  
  // Rule 3: Cotton should use Bales as unit
  if (commodity.name.toLowerCase().includes('cotton') && commodity.unit !== 'Bales') {
    // This is a warning, not a hard error, so we'll just log it
    console.warn('Cotton commodities typically use Bales as the unit');
  }
  
  // Rule 4: At least one trade type must be selected
  if (!commodity.tradeTypeIds || commodity.tradeTypeIds.length === 0) {
    errors.push({
      field: 'tradeTypeIds',
      message: 'At least one trade type must be selected',
    });
  }
  
  // Rule 5: Check if we're deactivating the last active commodity
  if (!commodity.isActive) {
    const activeCount = existingCommodities.filter(
      c => c.isActive && c.id !== editingId
    ).length;
    
    if (activeCount === 0) {
      errors.push({
        field: 'isActive',
        message: 'Cannot deactivate the last active commodity. At least one commodity must remain active.',
      });
    }
  }
  
  return errors;
};

/**
 * Check if commodity can be deleted
 * Returns error message if deletion is not allowed
 */
export const canDeleteCommodity = (
  commodity: Commodity,
  existingCommodities: Commodity[]
): { canDelete: boolean; reason?: string } => {
  // Rule 1: Cannot delete if it's the last active commodity
  const activeCommodities = existingCommodities.filter(c => c.isActive && c.id !== commodity.id);
  if (activeCommodities.length === 0) {
    return {
      canDelete: false,
      reason: 'Cannot delete the last active commodity. At least one commodity must remain active.',
    };
  }
  
  // Note: In a real application, we would also check:
  // - If there are active sales contracts using this commodity
  // - If there are active business partners linked to this commodity
  // - If there is historical data that references this commodity
  
  return { canDelete: true };
};

/**
 * Get smart suggestions for commodity configuration with Auto-GST
 */
export const getCommoditySuggestions = (
  partialName: string
): Partial<Commodity> | null => {
  if (!partialName || partialName.trim().length < 2) return null;
  
  const templates = getCommodityTemplates();
  const name = partialName.toLowerCase().trim();
  
  // Find matching template
  const matchingTemplate = templates.find(t => 
    t.name.toLowerCase().includes(name) || name.includes(t.name.toLowerCase())
  );
  
  if (matchingTemplate) {
    // Auto-detect GST based on commodity name
    const gstInfo = autoDetectGSTInfo(matchingTemplate.name, matchingTemplate.isProcessed);
    
    return {
      symbol: matchingTemplate.symbol,
      unit: matchingTemplate.unit,
      hsnCode: gstInfo.hsnCode,
      gstRate: gstInfo.gstRate,
      gstExemptionAvailable: gstInfo.exemptionAvailable,
      gstCategory: gstInfo.category as any,
      isProcessed: matchingTemplate.isProcessed,
      supportsCciTerms: matchingTemplate.supportsCciTerms,
      description: matchingTemplate.description,
      tradeTypeIds: matchingTemplate.defaultTradeTypeIds,
      bargainTypeIds: matchingTemplate.defaultBargainTypeIds,
      weightmentTermIds: matchingTemplate.defaultWeightmentTermIds,
      passingTermIds: matchingTemplate.defaultPassingTermIds,
      deliveryTermIds: matchingTemplate.defaultDeliveryTermIds,
      paymentTermIds: matchingTemplate.defaultPaymentTermIds,
      commissionIds: matchingTemplate.defaultCommissionIds,
    };
  }
  
  // Generate basic suggestions based on name with auto-GST
  const gstInfo = autoDetectGSTInfo(partialName, false);
  
  return {
    symbol: generateSymbol(partialName),
    unit: getDefaultUnit(partialName),
    hsnCode: gstInfo.hsnCode,
    gstRate: gstInfo.gstRate,
    gstExemptionAvailable: gstInfo.exemptionAvailable,
    gstCategory: gstInfo.category as any,
    isProcessed: false,
    supportsCciTerms: shouldSupportCciTerms(partialName),
  };
};

/**
 * Validate that all selected IDs exist in master data
 */
export const validateMasterDataIds = (
  commodity: Omit<Commodity, 'id'>,
  masterData: {
    tradeTypeIds: number[];
    bargainTypeIds: number[];
    varietyIds: number[];
    weightmentTermIds: number[];
    passingTermIds: number[];
    deliveryTermIds: number[];
    paymentTermIds: number[];
    commissionIds: number[];
    gstRateIds: number[];
  }
): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  // Validate trade types
  const invalidTradeTypes = commodity.tradeTypeIds.filter(
    id => !masterData.tradeTypeIds.includes(id)
  );
  if (invalidTradeTypes.length > 0) {
    errors.push({
      field: 'tradeTypeIds',
      message: `Invalid trade type IDs: ${invalidTradeTypes.join(', ')}`,
    });
  }
  
  // Validate bargain types
  const invalidBargainTypes = commodity.bargainTypeIds.filter(
    id => !masterData.bargainTypeIds.includes(id)
  );
  if (invalidBargainTypes.length > 0) {
    errors.push({
      field: 'bargainTypeIds',
      message: `Invalid bargain type IDs: ${invalidBargainTypes.join(', ')}`,
    });
  }
  
  // Validate GST rate if specified
  if (commodity.defaultGstRateId && !masterData.gstRateIds.includes(commodity.defaultGstRateId)) {
    errors.push({
      field: 'defaultGstRateId',
      message: 'Invalid GST rate selected',
    });
  }
  
  // Additional validations can be added for other fields
  
  return errors;
};
