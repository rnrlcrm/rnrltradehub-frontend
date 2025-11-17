import { SalesContract, Commission } from '../types';
import { calculateGST } from './gstCalculations';

/**
 * Auto-generates a commission record from a completed sales contract
 */
export const autoGenerateCommission = (contract: SalesContract): Partial<Commission> => {
  // Calculate commission amount (2% of contract total value)
  const contractValue = contract.quantity * contract.rate;
  const commissionRate = 0.02; // 2%
  const commissionAmount = contractValue * commissionRate;

  // Get agent/sub-broker details from contract
  const agentName = contract.agentName || 'Default Agent';
  const subBrokerId = contract.subBrokerId;
  const subBrokerName = contract.subBrokerName;
  const subBrokerShare = contract.commissionSharePercent || 0;

  // Calculate sub-broker split if applicable
  let subBrokerAmount = 0;
  let companyAmount = commissionAmount;
  let companyShare = 100;

  if (subBrokerId && subBrokerShare > 0) {
    subBrokerAmount = (commissionAmount * subBrokerShare) / 100;
    companyAmount = commissionAmount - subBrokerAmount;
    companyShare = 100 - subBrokerShare;
  }

  // Calculate GST (18% on professional services)
  // Assuming company state is Maharashtra for GST calculation
  const companyState = 'Maharashtra';
  const agentState = 'Maharashtra'; // This should come from business partner data
  
  const gstCalculation = calculateGST(
    commissionAmount,
    companyState,
    agentState,
    18 // 18% GST for professional services
  );

  // Calculate total amounts with GST
  const totalCommissionWithGST = commissionAmount + gstCalculation.totalGST;
  const totalSubBrokerWithGST = subBrokerShare > 0 
    ? (totalCommissionWithGST * subBrokerShare) / 100 
    : 0;
  const totalCompanyWithGST = totalCommissionWithGST - totalSubBrokerWithGST;

  return {
    salesContractId: contract.scNo,
    agentName,
    amount: commissionAmount,
    taxableAmount: commissionAmount,
    cgst: gstCalculation.cgst,
    sgst: gstCalculation.sgst,
    igst: gstCalculation.igst,
    gstRate: 18,
    totalAmount: totalCommissionWithGST,
    agentState,
    companyState,
    isInterState: gstCalculation.isInterState,
    subBrokerId,
    subBrokerName,
    subBrokerShare,
    subBrokerAmount: totalSubBrokerWithGST,
    companyShare,
    companyAmount: totalCompanyWithGST,
    status: 'Pending Approval',
    commissionDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    financialYear: getCurrentFinancialYear(),
  };
};

/**
 * Get current financial year in format "YYYY-YYYY"
 */
export const getCurrentFinancialYear = (): string => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 0-indexed

  // Indian FY: April to March
  if (currentMonth >= 4) {
    return `${currentYear}-${currentYear + 1}`;
  } else {
    return `${currentYear - 1}-${currentYear}`;
  }
};

/**
 * Calculate days overdue for an invoice or commission
 */
export const calculateDaysOverdue = (dueDate: string): number => {
  const due = new Date(dueDate);
  const today = new Date();
  const diff = today.getTime() - due.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

/**
 * Check if an item is overdue
 */
export const isOverdue = (dueDate: string): boolean => {
  return calculateDaysOverdue(dueDate) > 0;
};

/**
 * Get overdue items from a list
 */
export const getOverdueItems = <T extends { dueDate: string }>(items: T[]): T[] => {
  return items.filter(item => isOverdue(item.dueDate));
};

/**
 * Calculate total amount from a list of items
 */
export const calculateTotalAmount = <T extends { amount?: number; totalAmount?: number }>(
  items: T[]
): number => {
  return items.reduce((total, item) => {
    return total + (item.totalAmount || item.amount || 0);
  }, 0);
};
