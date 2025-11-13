/**
 * Per-Commodity Business Rule Engine
 * 
 * Flexible rule engine that allows defining commodity-specific business rules
 * Each commodity can have its own validation, constraints, and policies
 */

import { Commodity, CommodityUnit } from '../types';

// ============================================================================
// RULE TYPES
// ============================================================================

export type RuleSeverity = 'error' | 'warning' | 'info';
export type RuleCategory = 
  | 'required_fields'
  | 'unit_validation'
  | 'trading_parameters'
  | 'gst_compliance'
  | 'cci_terms'
  | 'quality_specs'
  | 'contract_terms'
  | 'pricing'
  | 'custom';

export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  category: RuleCategory;
  severity: RuleSeverity;
  commodityTypes: string[]; // ['Cotton'] or ['*'] for all
  isActive: boolean;
  validate: (commodity: Commodity, context?: RuleContext) => RuleValidationResult;
}

export interface RuleContext {
  existingCommodities?: Commodity[];
  masterData?: any;
  userRole?: string;
  currentDate?: Date;
  [key: string]: any; // Allow additional context
}

export interface RuleValidationResult {
  isValid: boolean;
  message?: string;
  field?: string;
  details?: any;
}

export interface RuleEngineResult {
  isValid: boolean;
  errors: Array<{ rule: string; message: string; field?: string }>;
  warnings: Array<{ rule: string; message: string; field?: string }>;
  info: Array<{ rule: string; message: string; field?: string }>;
}

// ============================================================================
// COMMODITY-SPECIFIC RULE DEFINITIONS
// ============================================================================

/**
 * Cotton-specific business rules
 */
export const CottonRules: BusinessRule[] = [
  {
    id: 'COTTON_001',
    name: 'CCI Terms Mandatory',
    description: 'Cotton commodities must support CCI Terms',
    category: 'cci_terms',
    severity: 'error',
    commodityTypes: ['Cotton'],
    isActive: true,
    validate: (commodity: Commodity) => {
      if (commodity.name.toLowerCase().includes('cotton') && !commodity.supportsCciTerms) {
        return {
          isValid: false,
          message: 'Cotton commodities must support CCI Terms as per business policy',
          field: 'supportsCciTerms',
        };
      }
      return { isValid: true };
    },
  },
  {
    id: 'COTTON_002',
    name: 'Unit Must Be Bales',
    description: 'Cotton should be traded in Bales',
    category: 'unit_validation',
    severity: 'warning',
    commodityTypes: ['Cotton'],
    isActive: true,
    validate: (commodity: Commodity) => {
      if (commodity.name.toLowerCase().includes('cotton') && commodity.unit !== 'Bales') {
        return {
          isValid: false,
          message: 'Cotton commodities should use Bales as the primary unit. Other units may cause confusion in CCI trades.',
          field: 'unit',
        };
      }
      return { isValid: true };
    },
  },
  {
    id: 'COTTON_003',
    name: 'CCI Trade Type Required',
    description: 'Cotton must support CCI Trade type',
    category: 'trading_parameters',
    severity: 'warning',
    commodityTypes: ['Cotton'],
    isActive: true,
    validate: (commodity: Commodity) => {
      // Trade Type ID 2 = CCI Trade (from mock data)
      if (commodity.name.toLowerCase().includes('cotton') && !commodity.tradeTypeIds.includes(2)) {
        return {
          isValid: false,
          message: 'Cotton commodities typically support "CCI Trade" type in addition to Normal Trade',
          field: 'tradeTypeIds',
        };
      }
      return { isValid: true };
    },
  },
  {
    id: 'COTTON_004',
    name: 'GST Rate Validation',
    description: 'Cotton GST rate should be 5% (HSN 5201)',
    category: 'gst_compliance',
    severity: 'warning',
    commodityTypes: ['Cotton'],
    isActive: true,
    validate: (commodity: Commodity, context?: RuleContext) => {
      // GST Rate ID 1 = 5% for cotton (from mock data)
      if (commodity.name.toLowerCase().includes('cotton') && commodity.defaultGstRateId !== 1) {
        return {
          isValid: false,
          message: 'Cotton typically has 5% GST (HSN 5201). Please verify if using a different rate.',
          field: 'defaultGstRateId',
        };
      }
      return { isValid: true };
    },
  },
  {
    id: 'COTTON_005',
    name: 'Quality Parameters Required',
    description: 'Cotton varieties must be specified',
    category: 'quality_specs',
    severity: 'info',
    commodityTypes: ['Cotton'],
    isActive: true,
    validate: (commodity: Commodity) => {
      if (commodity.name.toLowerCase().includes('cotton') && commodity.varietyIds.length === 0) {
        return {
          isValid: false,
          message: 'Consider adding cotton varieties (MCU-5, DCH-32, etc.) for better quality control',
          field: 'varietyIds',
        };
      }
      return { isValid: true };
    },
  },
];

/**
 * Wheat-specific business rules
 */
export const WheatRules: BusinessRule[] = [
  {
    id: 'WHEAT_001',
    name: 'No CCI Terms',
    description: 'Wheat does not support CCI Terms',
    category: 'cci_terms',
    severity: 'error',
    commodityTypes: ['Wheat'],
    isActive: true,
    validate: (commodity: Commodity) => {
      if (commodity.name.toLowerCase().includes('wheat') && commodity.supportsCciTerms) {
        return {
          isValid: false,
          message: 'Wheat commodities do not support CCI Terms. CCI Terms are specific to Cotton.',
          field: 'supportsCciTerms',
        };
      }
      return { isValid: true };
    },
  },
  {
    id: 'WHEAT_002',
    name: 'Unit Should Be Quintal',
    description: 'Wheat is typically traded in Quintals',
    category: 'unit_validation',
    severity: 'warning',
    commodityTypes: ['Wheat'],
    isActive: true,
    validate: (commodity: Commodity) => {
      if (commodity.name.toLowerCase().includes('wheat') && commodity.unit !== 'Quintal') {
        return {
          isValid: false,
          message: 'Wheat is typically traded in Quintals. Consider using Quintal as the primary unit.',
          field: 'unit',
        };
      }
      return { isValid: true };
    },
  },
  {
    id: 'WHEAT_003',
    name: 'Normal Trade Only',
    description: 'Wheat uses Normal Trade type',
    category: 'trading_parameters',
    severity: 'info',
    commodityTypes: ['Wheat'],
    isActive: true,
    validate: (commodity: Commodity) => {
      // Trade Type ID 2 = CCI Trade
      if (commodity.name.toLowerCase().includes('wheat') && commodity.tradeTypeIds.includes(2)) {
        return {
          isValid: false,
          message: 'CCI Trade type is typically used only for Cotton. Wheat uses Normal Trade.',
          field: 'tradeTypeIds',
        };
      }
      return { isValid: true };
    },
  },
  {
    id: 'WHEAT_004',
    name: 'GST Rate Check',
    description: 'Verify GST rate for wheat',
    category: 'gst_compliance',
    severity: 'info',
    commodityTypes: ['Wheat'],
    isActive: true,
    validate: (commodity: Commodity) => {
      if (commodity.name.toLowerCase().includes('wheat') && !commodity.defaultGstRateId) {
        return {
          isValid: false,
          message: 'Consider setting a default GST rate for wheat transactions',
          field: 'defaultGstRateId',
        };
      }
      return { isValid: true };
    },
  },
];

/**
 * Rice-specific business rules
 */
export const RiceRules: BusinessRule[] = [
  {
    id: 'RICE_001',
    name: 'No CCI Terms',
    description: 'Rice does not support CCI Terms',
    category: 'cci_terms',
    severity: 'error',
    commodityTypes: ['Rice'],
    isActive: true,
    validate: (commodity: Commodity) => {
      if (commodity.name.toLowerCase().includes('rice') && commodity.supportsCciTerms) {
        return {
          isValid: false,
          message: 'Rice commodities do not support CCI Terms. CCI Terms are specific to Cotton.',
          field: 'supportsCciTerms',
        };
      }
      return { isValid: true };
    },
  },
  {
    id: 'RICE_002',
    name: 'Unit Should Be Quintal',
    description: 'Rice is typically traded in Quintals',
    category: 'unit_validation',
    severity: 'warning',
    commodityTypes: ['Rice'],
    isActive: true,
    validate: (commodity: Commodity) => {
      if (commodity.name.toLowerCase().includes('rice') && commodity.unit !== 'Quintal') {
        return {
          isValid: false,
          message: 'Rice is typically traded in Quintals. Consider using Quintal as the primary unit.',
          field: 'unit',
        };
      }
      return { isValid: true };
    },
  },
  {
    id: 'RICE_003',
    name: 'Variety Specification',
    description: 'Rice varieties should be specified',
    category: 'quality_specs',
    severity: 'info',
    commodityTypes: ['Rice'],
    isActive: true,
    validate: (commodity: Commodity) => {
      if (commodity.name.toLowerCase().includes('rice') && commodity.varietyIds.length === 0) {
        return {
          isValid: false,
          message: 'Consider adding rice varieties (Basmati, Non-Basmati, etc.) for better classification',
          field: 'varietyIds',
        };
      }
      return { isValid: true };
    },
  },
];

/**
 * Global rules that apply to all commodities
 */
export const GlobalRules: BusinessRule[] = [
  {
    id: 'GLOBAL_001',
    name: 'Unique Commodity Name',
    description: 'Commodity names must be unique',
    category: 'required_fields',
    severity: 'error',
    commodityTypes: ['*'],
    isActive: true,
    validate: (commodity: Commodity, context?: RuleContext) => {
      if (!context?.existingCommodities) return { isValid: true };
      
      const duplicate = context.existingCommodities.find(
        c => c.name.toLowerCase().trim() === commodity.name.toLowerCase().trim() && c.id !== commodity.id
      );
      
      if (duplicate) {
        return {
          isValid: false,
          message: `A commodity with the name "${commodity.name}" already exists (ID: ${duplicate.id})`,
          field: 'name',
        };
      }
      return { isValid: true };
    },
  },
  {
    id: 'GLOBAL_002',
    name: 'Unique Symbol',
    description: 'Commodity symbols must be unique',
    category: 'required_fields',
    severity: 'error',
    commodityTypes: ['*'],
    isActive: true,
    validate: (commodity: Commodity, context?: RuleContext) => {
      if (!context?.existingCommodities) return { isValid: true };
      
      const duplicate = context.existingCommodities.find(
        c => c.symbol.toLowerCase().trim() === commodity.symbol.toLowerCase().trim() && c.id !== commodity.id
      );
      
      if (duplicate) {
        return {
          isValid: false,
          message: `A commodity with the symbol "${commodity.symbol}" already exists (${duplicate.name})`,
          field: 'symbol',
        };
      }
      return { isValid: true };
    },
  },
  {
    id: 'GLOBAL_003',
    name: 'Minimum One Active Commodity',
    description: 'At least one commodity must remain active',
    category: 'required_fields',
    severity: 'error',
    commodityTypes: ['*'],
    isActive: true,
    validate: (commodity: Commodity, context?: RuleContext) => {
      if (commodity.isActive) return { isValid: true };
      
      if (!context?.existingCommodities) return { isValid: true };
      
      const activeCount = context.existingCommodities.filter(
        c => c.isActive && c.id !== commodity.id
      ).length;
      
      if (activeCount === 0) {
        return {
          isValid: false,
          message: 'Cannot deactivate the last active commodity. At least one commodity must remain active.',
          field: 'isActive',
        };
      }
      return { isValid: true };
    },
  },
  {
    id: 'GLOBAL_004',
    name: 'Minimum Trading Parameters',
    description: 'At least one trade type must be selected',
    category: 'trading_parameters',
    severity: 'error',
    commodityTypes: ['*'],
    isActive: true,
    validate: (commodity: Commodity) => {
      if (!commodity.tradeTypeIds || commodity.tradeTypeIds.length === 0) {
        return {
          isValid: false,
          message: 'At least one trade type must be selected',
          field: 'tradeTypeIds',
        };
      }
      return { isValid: true };
    },
  },
  {
    id: 'GLOBAL_005',
    name: 'GST Rate Recommended',
    description: 'Default GST rate should be set',
    category: 'gst_compliance',
    severity: 'warning',
    commodityTypes: ['*'],
    isActive: true,
    validate: (commodity: Commodity) => {
      if (!commodity.defaultGstRateId) {
        return {
          isValid: false,
          message: 'Setting a default GST rate is recommended for smoother transaction processing',
          field: 'defaultGstRateId',
        };
      }
      return { isValid: true };
    },
  },
];

// ============================================================================
// BUSINESS RULE ENGINE
// ============================================================================

export class CommodityBusinessRuleEngine {
  private rules: Map<string, BusinessRule[]>;

  constructor() {
    this.rules = new Map();
    this.initializeRules();
  }

  /**
   * Initialize all rules
   */
  private initializeRules(): void {
    // Register commodity-specific rules
    this.registerRules('Cotton', CottonRules);
    this.registerRules('Wheat', WheatRules);
    this.registerRules('Rice', RiceRules);
    
    // Register global rules
    this.registerRules('*', GlobalRules);
  }

  /**
   * Register rules for a commodity type
   */
  registerRules(commodityType: string, rules: BusinessRule[]): void {
    const existing = this.rules.get(commodityType) || [];
    this.rules.set(commodityType, [...existing, ...rules]);
  }

  /**
   * Get rules for a specific commodity
   */
  getRulesForCommodity(commodityName: string): BusinessRule[] {
    const allRules: BusinessRule[] = [];
    
    // Add global rules
    const globalRules = this.rules.get('*') || [];
    allRules.push(...globalRules);
    
    // Add commodity-specific rules
    this.rules.forEach((rules, commodityType) => {
      if (commodityType !== '*') {
        rules.forEach(rule => {
          if (rule.commodityTypes.includes('*') || 
              rule.commodityTypes.some(type => commodityName.toLowerCase().includes(type.toLowerCase()))) {
            allRules.push(rule);
          }
        });
      }
    });
    
    return allRules.filter(rule => rule.isActive);
  }

  /**
   * Validate a commodity against all applicable rules
   */
  validate(commodity: Commodity, context?: RuleContext): RuleEngineResult {
    const applicableRules = this.getRulesForCommodity(commodity.name);
    
    const errors: Array<{ rule: string; message: string; field?: string }> = [];
    const warnings: Array<{ rule: string; message: string; field?: string }> = [];
    const info: Array<{ rule: string; message: string; field?: string }> = [];
    
    applicableRules.forEach(rule => {
      const result = rule.validate(commodity, context);
      
      if (!result.isValid) {
        const violation = {
          rule: rule.id,
          message: result.message || rule.description,
          field: result.field,
        };
        
        switch (rule.severity) {
          case 'error':
            errors.push(violation);
            break;
          case 'warning':
            warnings.push(violation);
            break;
          case 'info':
            info.push(violation);
            break;
        }
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      info,
    };
  }

  /**
   * Get all active rules
   */
  getAllRules(): BusinessRule[] {
    const allRules: BusinessRule[] = [];
    this.rules.forEach(rules => {
      allRules.push(...rules.filter(rule => rule.isActive));
    });
    return allRules;
  }

  /**
   * Get rules by category
   */
  getRulesByCategory(category: RuleCategory): BusinessRule[] {
    return this.getAllRules().filter(rule => rule.category === category);
  }

  /**
   * Enable/disable a specific rule
   */
  setRuleStatus(ruleId: string, isActive: boolean): void {
    this.rules.forEach(rules => {
      const rule = rules.find(r => r.id === ruleId);
      if (rule) {
        rule.isActive = isActive;
      }
    });
  }

  /**
   * Add a custom rule dynamically
   */
  addCustomRule(commodityType: string, rule: BusinessRule): void {
    const existing = this.rules.get(commodityType) || [];
    existing.push(rule);
    this.rules.set(commodityType, existing);
  }

  /**
   * Get rule statistics
   */
  getStatistics(): {
    totalRules: number;
    activeRules: number;
    rulesByCommodity: Record<string, number>;
    rulesByCategory: Record<RuleCategory, number>;
  } {
    const allRules = this.getAllRules();
    
    const rulesByCommodity: Record<string, number> = {};
    this.rules.forEach((rules, commodity) => {
      rulesByCommodity[commodity] = rules.filter(r => r.isActive).length;
    });
    
    const rulesByCategory: Record<RuleCategory, number> = {} as any;
    allRules.forEach(rule => {
      rulesByCategory[rule.category] = (rulesByCategory[rule.category] || 0) + 1;
    });
    
    return {
      totalRules: this.getAllRules().length,
      activeRules: allRules.length,
      rulesByCommodity,
      rulesByCategory,
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const commodityRuleEngine = new CommodityBusinessRuleEngine();

// ============================================================================
// EXPORT HELPER FUNCTIONS
// ============================================================================

/**
 * Validate a commodity with the rule engine
 */
export const validateCommodityRules = (
  commodity: Commodity,
  context?: RuleContext
): RuleEngineResult => {
  return commodityRuleEngine.validate(commodity, context);
};

/**
 * Get rules for a commodity
 */
export const getCommodityRules = (commodityName: string): BusinessRule[] => {
  return commodityRuleEngine.getRulesForCommodity(commodityName);
};
