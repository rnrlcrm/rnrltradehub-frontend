/**
 * Field Linking Utilities
 * 
 * Auto-populates related fields based on selections
 * Provides intelligent suggestions and validations
 */

import type { SalesContract, QualitySpecs } from '../types';

/**
 * Variety to Quality Specs mapping
 * Auto-fills quality parameters when variety is selected
 */
export const VARIETY_QUALITY_MAP: Record<string, Partial<QualitySpecs>> = {
  'Shankar-6': {
    length: '26-28mm',
    mic: '4.0-4.9',
    rd: '65+',
    trash: '<7%',
    moisture: '<8%',
    strength: '24+',
    leafGrade: '4-5'
  },
  'MCU-5': {
    length: '28-30mm',
    mic: '3.5-4.5',
    rd: '70+',
    trash: '<5%',
    moisture: '<8%',
    strength: '28+',
    leafGrade: '3-4'
  },
  'Bunny-Hybrid': {
    length: '24-26mm',
    mic: '4.5-5.2',
    rd: '60+',
    trash: '<8%',
    moisture: '<10%',
    strength: '22+',
    leafGrade: '5-6'
  },
  'DCH-32': {
    length: '27-29mm',
    mic: '3.8-4.6',
    rd: '68+',
    trash: '<6%',
    moisture: '<8%',
    strength: '26+',
    leafGrade: '4'
  },
  'Suraj': {
    length: '24-26mm',
    mic: '4.5-5.5',
    rd: '60+',
    trash: '<8%',
    moisture: '<10%',
    strength: '22+',
    leafGrade: '5-6'
  },
  'H-4': {
    length: '30-32mm',
    mic: '3.0-3.8',
    rd: '75+',
    trash: '<4%',
    moisture: '<7%',
    strength: '30+',
    leafGrade: '2-3'
  }
};

/**
 * Location to Delivery Terms mapping
 * Filters valid delivery terms based on location
 */
export const LOCATION_DELIVERY_MAP: Record<string, string[]> = {
  'Same City': [
    'Pickup',
    'Door Delivery',
    'Ex-Godown'
  ],
  'Same State': [
    'Ex-Godown',
    'FOR Destination',
    'Door Delivery',
    'Pickup'
  ],
  'Interstate': [
    'Ex-Godown',
    'FOR Destination',
    'Ex-Works',
    'CIF'
  ],
  'Export': [
    'FOB',
    'CIF',
    'CFR',
    'Ex-Works'
  ],
  'CCI Godown': [
    'Ex-Godown',
    'At CCI Godown'
  ]
};

/**
 * Client Type to Payment Terms mapping
 * Suggests payment terms based on client type
 */
export const CLIENT_PAYMENT_MAP: Record<string, string[]> = {
  'KVIC': [
    'Within 60 Days',
    'Within 90 Days'
  ],
  'Mill': [
    'Within 30 Days',
    'Within 45 Days',
    'Against Delivery'
  ],
  'Trader': [
    'Within 15 Days',
    'Within 30 Days',
    'Against Delivery',
    'Advance Payment'
  ],
  'Export': [
    'Against LC',
    'Advance Payment',
    'Within 30 Days of Shipment'
  ],
  'Government': [
    'Within 60 Days',
    'Within 90 Days'
  ]
};

/**
 * Trade Type to Default Terms mapping
 * Auto-fills multiple fields based on trade type
 */
export const TRADE_TYPE_DEFAULTS: Record<string, Partial<SalesContract>> = {
  'CCI Trade': {
    bargainType: 'CCI Bargain',
    weightmentTerms: 'At CCI Godown',
    passingTerms: 'Sample Passing',
    deliveryTerms: 'Ex-Godown'
  },
  'Private Sale': {
    bargainType: 'Private',
    weightmentTerms: 'At Source',
    passingTerms: 'Tentative',
    deliveryTerms: 'Ex-Works'
  },
  'Forward Contract': {
    bargainType: 'Forward',
    weightmentTerms: 'At Destination',
    passingTerms: 'Final',
    deliveryTerms: 'FOR Destination'
  }
};

/**
 * Auto-fill quality specs when variety is selected
 */
export function autoFillQualitySpecs(variety: string): Partial<QualitySpecs> | null {
  return VARIETY_QUALITY_MAP[variety] || null;
}

/**
 * Get valid delivery terms for location
 */
export function getValidDeliveryTerms(location: string): string[] {
  return LOCATION_DELIVERY_MAP[location] || [];
}

/**
 * Get suggested payment terms for client type
 */
export function getSuggestedPaymentTerms(clientType: string): string[] {
  return CLIENT_PAYMENT_MAP[clientType] || [];
}

/**
 * Get default terms for trade type
 */
export function getTradeTypeDefaults(tradeType: string): Partial<SalesContract> | null {
  return TRADE_TYPE_DEFAULTS[tradeType] || null;
}

/**
 * Validate delivery term for location
 */
export function isValidDeliveryTerm(location: string, deliveryTerm: string): boolean {
  const validTerms = getValidDeliveryTerms(location);
  return validTerms.length === 0 || validTerms.includes(deliveryTerm);
}

/**
 * Validate field combination
 * Returns errors if combination is invalid
 */
export function validateFieldCombination(contract: Partial<SalesContract>): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // CCI Trade validations
  if (contract.tradeType === 'CCI Trade') {
    if (contract.bargainType && contract.bargainType !== 'CCI Bargain') {
      errors.push('CCI Trade must use CCI Bargain type');
    }
    if (contract.weightmentTerms && contract.weightmentTerms !== 'At CCI Godown') {
      warnings.push('CCI Trade typically uses "At CCI Godown" for weightment');
    }
    if (!contract.cciTermId) {
      warnings.push('CCI Trade should have CCI Terms selected');
    }
  }
  
  // Location-based validations
  if (contract.location && contract.deliveryTerms) {
    if (!isValidDeliveryTerm(contract.location, contract.deliveryTerms)) {
      errors.push(`Delivery term "${contract.deliveryTerms}" is not valid for location "${contract.location}"`);
    }
  }
  
  // Export validations
  if (contract.location === 'Export') {
    if (contract.deliveryTerms && !['FOB', 'CIF', 'CFR', 'Ex-Works'].includes(contract.deliveryTerms)) {
      errors.push('Export contracts must use FOB, CIF, CFR, or Ex-Works delivery terms');
    }
    if (contract.paymentTerms && !['Against LC', 'Advance Payment', 'Within 30 Days of Shipment'].includes(contract.paymentTerms)) {
      warnings.push('Export contracts typically use LC or Advance Payment');
    }
  }
  
  // Quality specs validations
  if (contract.variety && contract.qualitySpecs) {
    const expectedSpecs = autoFillQualitySpecs(contract.variety);
    if (expectedSpecs && contract.qualitySpecs.length !== expectedSpecs.length) {
      warnings.push(`Quality specs for ${contract.variety} may not match standard specifications`);
    }
  }
  
  // KVIC client validations
  if (contract.clientType === 'KVIC') {
    if (contract.brokerage && contract.brokerage > 1.0) {
      warnings.push('KVIC contracts typically have brokerage ≤ 0.75%');
    }
    if (contract.paymentTerms && !contract.paymentTerms.includes('60 Days') && !contract.paymentTerms.includes('90 Days')) {
      warnings.push('KVIC typically requires 60-90 day payment terms');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get field suggestions based on current form state
 */
export function getFieldSuggestions(contract: Partial<SalesContract>): {
  field: string;
  suggestion: any;
  reason: string;
}[] {
  const suggestions: { field: string; suggestion: any; reason: string }[] = [];
  
  // Variety-based quality specs suggestion
  if (contract.variety && !contract.qualitySpecs) {
    const specs = autoFillQualitySpecs(contract.variety);
    if (specs) {
      suggestions.push({
        field: 'qualitySpecs',
        suggestion: specs,
        reason: `Standard quality specs for ${contract.variety}`
      });
    }
  }
  
  // Location-based delivery term suggestion
  if (contract.location && !contract.deliveryTerms) {
    const validTerms = getValidDeliveryTerms(contract.location);
    if (validTerms.length > 0) {
      suggestions.push({
        field: 'deliveryTerms',
        suggestion: validTerms[0],
        reason: `Most common delivery term for ${contract.location}`
      });
    }
  }
  
  // Client type-based payment term suggestion
  if (contract.clientType && !contract.paymentTerms) {
    const suggestedTerms = getSuggestedPaymentTerms(contract.clientType);
    if (suggestedTerms.length > 0) {
      suggestions.push({
        field: 'paymentTerms',
        suggestion: suggestedTerms[0],
        reason: `Standard payment term for ${contract.clientType} clients`
      });
    }
  }
  
  // Trade type-based defaults
  if (contract.tradeType) {
    const defaults = getTradeTypeDefaults(contract.tradeType);
    if (defaults) {
      Object.entries(defaults).forEach(([field, value]) => {
        if (!contract[field as keyof SalesContract]) {
          suggestions.push({
            field,
            suggestion: value,
            reason: `Standard for ${contract.tradeType}`
          });
        }
      });
    }
  }
  
  return suggestions;
}

/**
 * Auto-apply all suggestions to contract
 */
export function applyFieldSuggestions(
  contract: Partial<SalesContract>,
  suggestionFields: string[] = []
): Partial<SalesContract> {
  const suggestions = getFieldSuggestions(contract);
  const updates: Partial<SalesContract> = { ...contract };
  
  suggestions.forEach(({ field, suggestion }) => {
    if (suggestionFields.length === 0 || suggestionFields.includes(field)) {
      (updates as any)[field] = suggestion;
    }
  });
  
  return updates;
}

/**
 * Get field dependencies
 * Returns which fields should trigger updates when changed
 */
export function getFieldDependencies(): Record<string, string[]> {
  return {
    variety: ['qualitySpecs'],
    location: ['deliveryTerms'],
    clientType: ['paymentTerms', 'brokerage'],
    tradeType: ['bargainType', 'weightmentTerms', 'passingTerms', 'deliveryTerms'],
    bargainType: ['weightmentTerms', 'passingTerms']
  };
}

/**
 * Check if field update should trigger cascade
 */
export function shouldCascadeUpdate(
  fieldName: string,
  oldValue: any,
  newValue: any
): boolean {
  if (oldValue === newValue) {
    return false;
  }
  
  const dependencies = getFieldDependencies();
  return fieldName in dependencies;
}

/**
 * Get affected fields for a field change
 */
export function getAffectedFields(fieldName: string): string[] {
  const dependencies = getFieldDependencies();
  return dependencies[fieldName] || [];
}
