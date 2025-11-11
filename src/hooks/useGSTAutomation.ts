/**
 * React Hook for GST Automation
 */

import { useState, useCallback } from 'react';
import {
  searchHSNCode,
  getHSNCode,
  calculateGST,
  autoFillGSTRate,
  validateHSNCode,
  suggestHSNCode,
  type HSNCode,
  type GSTCalculation
} from '../utils/gstAutomation';

export interface UseGSTAutomationReturn {
  // HSN Code operations
  searchHSN: (query: string) => HSNCode[];
  getHSN: (code: string) => HSNCode | undefined;
  suggestHSN: (description: string) => HSNCode[];
  validateHSN: (code: string) => { isValid: boolean; error?: string };
  
  // GST Calculations
  calculateGST: (
    amount: number,
    rate: number,
    buyerState: string,
    sellerState: string
  ) => GSTCalculation;
  
  // Auto-fill
  autoFillRate: (hsnCode: string) => {
    gstRate: number;
    cgst: number;
    sgst: number;
    igst: number;
  } | null;
  
  // State
  selectedHSN: HSNCode | null;
  setSelectedHSN: (hsn: HSNCode | null) => void;
  calculation: GSTCalculation | null;
  setCalculation: (calc: GSTCalculation | null) => void;
}

export function useGSTAutomation(): UseGSTAutomationReturn {
  const [selectedHSN, setSelectedHSN] = useState<HSNCode | null>(null);
  const [calculation, setCalculation] = useState<GSTCalculation | null>(null);
  
  const searchHSN = useCallback((query: string) => {
    return searchHSNCode(query);
  }, []);
  
  const getHSN = useCallback((code: string) => {
    return getHSNCode(code);
  }, []);
  
  const suggestHSN = useCallback((description: string) => {
    return suggestHSNCode(description);
  }, []);
  
  const validateHSN = useCallback((code: string) => {
    return validateHSNCode(code);
  }, []);
  
  const calculate = useCallback((
    amount: number,
    rate: number,
    buyerState: string,
    sellerState: string
  ) => {
    return calculateGST(amount, rate, buyerState, sellerState);
  }, []);
  
  const autoFillRate = useCallback((hsnCode: string) => {
    return autoFillGSTRate(hsnCode);
  }, []);
  
  return {
    searchHSN,
    getHSN,
    suggestHSN,
    validateHSN,
    calculateGST: calculate,
    autoFillRate,
    selectedHSN,
    setSelectedHSN,
    calculation,
    setCalculation
  };
}
