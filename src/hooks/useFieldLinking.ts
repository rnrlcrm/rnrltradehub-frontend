/**
 * React Hook for Field Linking
 */

import { useState, useCallback, useEffect } from 'react';
import {
  autoFillQualitySpecs,
  getValidDeliveryTerms,
  getSuggestedPaymentTerms,
  getTradeTypeDefaults,
  validateFieldCombination,
  getFieldSuggestions,
  applyFieldSuggestions,
  shouldCascadeUpdate,
  getAffectedFields,
  type QualitySpecs
} from '../utils/fieldLinking';
import type { SalesContract } from '../types';

export interface UseFieldLinkingReturn {
  // Auto-fill operations
  autoFillQuality: (variety: string) => Partial<QualitySpecs> | null;
  getDeliveryTerms: (location: string) => string[];
  getPaymentTerms: (clientType: string) => string[];
  getTradeDefaults: (tradeType: string) => Partial<SalesContract> | null;
  
  // Validation
  validate: (contract: Partial<SalesContract>) => {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  
  // Suggestions
  getSuggestions: (contract: Partial<SalesContract>) => {
    field: string;
    suggestion: any;
    reason: string;
  }[];
  
  applySuggestions: (
    contract: Partial<SalesContract>,
    fields?: string[]
  ) => Partial<SalesContract>;
  
  // Field dependencies
  shouldCascade: (field: string, oldValue: any, newValue: any) => boolean;
  getAffected: (field: string) => string[];
  
  // State
  suggestions: { field: string; suggestion: any; reason: string }[];
  validationResult: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } | null;
}

export function useFieldLinking(
  contract?: Partial<SalesContract>
): UseFieldLinkingReturn {
  const [suggestions, setSuggestions] = useState<
    { field: string; suggestion: any; reason: string }[]
  >([]);
  
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);
  
  // Update suggestions when contract changes
  useEffect(() => {
    if (contract) {
      const newSuggestions = getFieldSuggestions(contract);
      setSuggestions(newSuggestions);
      
      const validation = validateFieldCombination(contract);
      setValidationResult(validation);
    }
  }, [contract]);
  
  const autoFillQuality = useCallback((variety: string) => {
    return autoFillQualitySpecs(variety);
  }, []);
  
  const getDeliveryTerms = useCallback((location: string) => {
    return getValidDeliveryTerms(location);
  }, []);
  
  const getPaymentTerms = useCallback((clientType: string) => {
    return getSuggestedPaymentTerms(clientType);
  }, []);
  
  const getTradeDefaults = useCallback((tradeType: string) => {
    return getTradeTypeDefaults(tradeType);
  }, []);
  
  const validate = useCallback((contract: Partial<SalesContract>) => {
    return validateFieldCombination(contract);
  }, []);
  
  const getSuggestionsCallback = useCallback((contract: Partial<SalesContract>) => {
    return getFieldSuggestions(contract);
  }, []);
  
  const applySuggestions = useCallback((
    contract: Partial<SalesContract>,
    fields?: string[]
  ) => {
    return applyFieldSuggestions(contract, fields);
  }, []);
  
  const shouldCascade = useCallback((
    field: string,
    oldValue: any,
    newValue: any
  ) => {
    return shouldCascadeUpdate(field, oldValue, newValue);
  }, []);
  
  const getAffected = useCallback((field: string) => {
    return getAffectedFields(field);
  }, []);
  
  return {
    autoFillQuality,
    getDeliveryTerms,
    getPaymentTerms,
    getTradeDefaults,
    validate,
    getSuggestions: getSuggestionsCallback,
    applySuggestions,
    shouldCascade,
    getAffected,
    suggestions,
    validationResult
  };
}
