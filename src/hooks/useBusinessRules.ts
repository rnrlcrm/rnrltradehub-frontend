/**
 * useBusinessRules Hook
 * React hook for business rules automation
 * 
 * Usage:
 * const { applyRules, validateForm, applicableRules } = useBusinessRules(formData);
 */

import { useState, useEffect } from 'react';
import * as businessRulesUtils from '../utils/businessRules';

export function useBusinessRules(formData: any) {
  const [applicableRules, setApplicableRules] = useState<any[]>([]);
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; errors: string[] }>({
    isValid: true,
    errors: [],
  });

  useEffect(() => {
    // Update applicable rules when form data changes
    const rules = businessRulesUtils.getApplicableRules(formData);
    setApplicableRules(rules);

    // Validate combination
    const result = businessRulesUtils.validateCombination(formData);
    setValidationResult(result);
  }, [formData]);

  const applyRules = (data: any) => {
    return businessRulesUtils.applyBusinessRules(data);
  };

  const getQualitySpecs = (variety: string) => {
    return businessRulesUtils.getQualitySpecsForVariety(variety);
  };

  const getValidDeliveryTerms = (location: string) => {
    return businessRulesUtils.getValidDeliveryTerms(location);
  };

  const validateForm = (data: any) => {
    return businessRulesUtils.validateCombination(data);
  };

  return {
    applicableRules,
    validationResult,
    applyRules,
    getQualitySpecs,
    getValidDeliveryTerms,
    validateForm,
  };
}

export default useBusinessRules;
