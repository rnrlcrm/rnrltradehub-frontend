/**
 * CCI Setting Master - Calculation Utilities
 * 
 * This module provides utility functions for all CCI-related calculations
 * based on the CCI Setting Master configuration.
 * 
 * All calculations dynamically reference the CCI Setting Master, ensuring
 * no hardcoded values are used.
 */

import { CciTerm } from '../types';

/**
 * Fetch the active CCI setting for a given date
 * @param cciTerms - Array of all CCI terms
 * @param contractDate - The contract/invoice date
 * @returns The applicable CCI term or null if none found
 */
export function getActiveCciSetting(cciTerms: CciTerm[], contractDate: string): CciTerm | null {
  const date = new Date(contractDate);
  
  // Find all terms where effectiveFrom <= contractDate
  const applicableTerms = cciTerms.filter(term => {
    const effectiveFrom = new Date(term.effectiveFrom);
    const effectiveTo = term.effectiveTo ? new Date(term.effectiveTo) : null;
    
    return effectiveFrom <= date && (!effectiveTo || date <= effectiveTo);
  });
  
  // Sort by effectiveFrom descending and return the most recent
  if (applicableTerms.length === 0) return null;
  
  return applicableTerms.sort((a, b) => 
    new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime()
  )[0];
}

/**
 * Calculate EMD percentage based on buyer type
 * @param cciSetting - The CCI setting to use
 * @param buyerType - Type of buyer: 'kvic', 'privateMill', or 'trader'
 * @returns EMD percentage
 */
export function calculateEmdPercent(
  cciSetting: CciTerm, 
  buyerType: 'kvic' | 'privateMill' | 'trader'
): number {
  return cciSetting.emd_by_buyer_type[buyerType];
}

/**
 * Calculate EMD amount
 * Note: EMD is calculated on invoice amount excluding GST. GST is NOT charged on EMD.
 * @param cciSetting - The CCI setting to use
 * @param invoiceAmountExclGst - The invoice amount EXCLUDING GST
 * @param buyerType - Type of buyer
 * @returns EMD amount (GST not applicable on EMD)
 */
export function calculateEmdAmount(
  cciSetting: CciTerm,
  invoiceAmountExclGst: number,
  buyerType: 'kvic' | 'privateMill' | 'trader'
): number {
  const emdPercent = calculateEmdPercent(cciSetting, buyerType);
  return (invoiceAmountExclGst * emdPercent) / 100;
}

/**
 * Calculate EMD interest benefit (for timely payment)
 * Note: EMD Interest is calculated on the amount paid excluding GST.
 * @param cciSetting - The CCI setting to use
 * @param emdAmountPaid - The EMD amount paid (excluding GST)
 * @param daysHeld - Number of days EMD was held
 * @returns Interest amount
 */
export function calculateEmdInterest(
  cciSetting: CciTerm,
  emdAmountPaid: number,
  daysHeld: number
): number {
  const annualRate = cciSetting.emd_interest_percent / 100;
  return (emdAmountPaid * annualRate * daysHeld) / 365;
}

/**
 * Calculate EMD late interest (for late payment)
 * @param cciSetting - The CCI setting to use
 * @param emdAmount - The EMD amount
 * @param daysLate - Number of days late
 * @returns Late interest amount
 */
export function calculateEmdLateInterest(
  cciSetting: CciTerm,
  emdAmount: number,
  daysLate: number
): number {
  const annualRate = cciSetting.emd_late_interest_percent / 100;
  return (emdAmount * annualRate * daysLate) / 365;
}

/**
 * Calculate carrying charges based on days
 * Note: Initially calculated on candy basis, but reconciliation is done on 
 * the final invoice value excluding GST.
 * @param cciSetting - The CCI setting to use
 * @param netInvoiceExclGst - Net invoice amount EXCLUDING GST
 * @param days - Number of days
 * @returns Carrying charge amount
 */
export function calculateCarryingCharge(
  cciSetting: CciTerm,
  netInvoiceExclGst: number,
  days: number
): number {
  let chargePercent = 0;
  let chargeDays = days;
  
  if (days <= cciSetting.carrying_charge_tier1_days) {
    // Tier 1: 0-30 days
    chargePercent = cciSetting.carrying_charge_tier1_percent;
  } else {
    // Tier 2: >30 days
    // Calculate tier 1 portion
    const tier1Charge = (netInvoiceExclGst * cciSetting.carrying_charge_tier1_percent / 100) * 
                        (cciSetting.carrying_charge_tier1_days / 30);
    
    // Calculate tier 2 portion
    const tier2Days = days - cciSetting.carrying_charge_tier1_days;
    const tier2Charge = (netInvoiceExclGst * cciSetting.carrying_charge_tier2_percent / 100) * 
                        (tier2Days / 30);
    
    return tier1Charge + tier2Charge;
  }
  
  // Simple calculation for tier 1
  return (netInvoiceExclGst * chargePercent / 100) * (chargeDays / 30);
}

/**
 * Calculate late lifting charges based on days
 * Note: Initially calculated on candy basis, but reconciliation is done on 
 * the final invoice value excluding GST.
 * @param cciSetting - The CCI setting to use
 * @param netInvoiceExclGst - Net invoice amount EXCLUDING GST
 * @param daysLate - Number of days late (after free period)
 * @returns Late lifting charge amount
 */
export function calculateLateLiftingCharge(
  cciSetting: CciTerm,
  netInvoiceExclGst: number,
  daysLate: number
): number {
  if (daysLate <= 0) return 0;
  
  let totalCharge = 0;
  
  if (daysLate <= cciSetting.late_lifting_tier1_days) {
    // Tier 1: 0-30 days
    totalCharge = (netInvoiceExclGst * cciSetting.late_lifting_tier1_percent / 100) * (daysLate / 30);
  } else if (daysLate <= cciSetting.late_lifting_tier1_days + cciSetting.late_lifting_tier2_days) {
    // Tier 1 + part of Tier 2
    const tier1Charge = (netInvoiceExclGst * cciSetting.late_lifting_tier1_percent / 100) * 
                        (cciSetting.late_lifting_tier1_days / 30);
    
    const tier2Days = daysLate - cciSetting.late_lifting_tier1_days;
    const tier2Charge = (netInvoiceExclGst * cciSetting.late_lifting_tier2_percent / 100) * 
                        (tier2Days / 30);
    
    totalCharge = tier1Charge + tier2Charge;
  } else {
    // Tier 1 + Tier 2 + Tier 3
    const tier1Charge = (netInvoiceExclGst * cciSetting.late_lifting_tier1_percent / 100) * 
                        (cciSetting.late_lifting_tier1_days / 30);
    
    const tier2Charge = (netInvoiceExclGst * cciSetting.late_lifting_tier2_percent / 100) * 
                        (cciSetting.late_lifting_tier2_days / 30);
    
    const tier3Days = daysLate - cciSetting.late_lifting_tier1_days - cciSetting.late_lifting_tier2_days;
    const tier3Charge = (netInvoiceExclGst * cciSetting.late_lifting_tier3_percent / 100) * 
                        (tier3Days / 30);
    
    totalCharge = tier1Charge + tier2Charge + tier3Charge;
  }
  
  return totalCharge;
}

/**
 * Calculate cash discount
 * Note: Cash Discount is calculated on the amount paid excluding GST.
 * @param cciSetting - The CCI setting to use
 * @param amountPaidExclGst - Amount paid EXCLUDING GST
 * @param days - Number of days for discount calculation
 * @returns Cash discount amount
 */
export function calculateCashDiscount(
  cciSetting: CciTerm,
  amountPaidExclGst: number,
  days: number
): number {
  const annualRate = cciSetting.cash_discount_percentage / 100;
  return (amountPaidExclGst * annualRate * days) / 365;
}

/**
 * Calculate LC/BG interest
 * @param cciSetting - The CCI setting to use
 * @param amount - LC/BG amount
 * @param days - Number of days
 * @param isPenal - Whether to use penal interest rate
 * @returns Interest amount
 */
export function calculateLcBgInterest(
  cciSetting: CciTerm,
  amount: number,
  days: number,
  isPenal: boolean = false
): number {
  const annualRate = isPenal 
    ? cciSetting.penal_interest_lc_bg_percent / 100
    : cciSetting.interest_lc_bg_percent / 100;
  
  return (amount * annualRate * days) / 365;
}

/**
 * Convert quintals to candy
 * @param cciSetting - The CCI setting to use
 * @param quintals - Weight in quintals
 * @returns Weight in candy
 */
export function convertQuintalToCandy(
  cciSetting: CciTerm,
  quintals: number
): number {
  return quintals * cciSetting.candy_factor;
}

/**
 * Calculate net invoice (before GST)
 * @param cciSetting - The CCI setting to use
 * @param weightQtl - Weight in quintals
 * @param ratePerCandy - Rate per candy
 * @returns Net invoice amount
 */
export function calculateNetInvoice(
  cciSetting: CciTerm,
  weightQtl: number,
  ratePerCandy: number
): number {
  const candyWeight = convertQuintalToCandy(cciSetting, weightQtl);
  return candyWeight * ratePerCandy;
}

/**
 * Calculate moisture adjustment (discount or premium)
 * @param cciSetting - The CCI setting to use
 * @param averageMoisture - Average moisture percentage
 * @param netDeliveryWeight - Net delivery weight in quintals
 * @param saleRatePerQuintal - Sale rate per quintal
 * @returns Object with adjustment type and amount
 */
export function calculateMoistureAdjustment(
  cciSetting: CciTerm,
  averageMoisture: number,
  netDeliveryWeight: number,
  saleRatePerQuintal: number
): { type: 'discount' | 'premium' | 'none'; amount: number } {
  if (averageMoisture > cciSetting.moisture_upper_limit) {
    // Discount case
    const discountAmount = (averageMoisture - cciSetting.moisture_upper_limit) * 
                           netDeliveryWeight * 
                           saleRatePerQuintal;
    return { type: 'discount', amount: discountAmount };
  } else if (averageMoisture < cciSetting.moisture_lower_limit) {
    // Premium case
    const premiumAmount = (cciSetting.moisture_lower_limit - averageMoisture) * 
                          netDeliveryWeight * 
                          saleRatePerQuintal;
    return { type: 'premium', amount: premiumAmount };
  }
  
  return { type: 'none', amount: 0 };
}

/**
 * Calculate GST on invoice
 * @param cciSetting - The CCI setting to use
 * @param netInvoice - Net invoice amount (after moisture adjustment)
 * @returns GST amount
 */
export function calculateGst(
  cciSetting: CciTerm,
  netInvoice: number
): number {
  return (netInvoice * cciSetting.gst_rate) / 100;
}

/**
 * Calculate total invoice including GST
 * @param cciSetting - The CCI setting to use
 * @param netInvoice - Net invoice amount (after moisture adjustment)
 * @returns Total invoice amount
 */
export function calculateTotalInvoice(
  cciSetting: CciTerm,
  netInvoice: number
): number {
  const gst = calculateGst(cciSetting, netInvoice);
  return netInvoice + gst;
}

/**
 * Check if EMD payment is due
 * @param cciSetting - The CCI setting to use
 * @param contractDate - Contract date
 * @param currentDate - Current date (defaults to today)
 * @returns True if EMD is due
 */
export function isEmdDue(
  cciSetting: CciTerm,
  contractDate: string,
  currentDate: string = new Date().toISOString()
): boolean {
  const contract = new Date(contractDate);
  const current = new Date(currentDate);
  const daysDiff = Math.floor((current.getTime() - contract.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysDiff >= cciSetting.emd_payment_days;
}

/**
 * Check if email reminder should be sent
 * @param cciSetting - The CCI setting to use
 * @param contractDate - Contract date
 * @param currentDate - Current date (defaults to today)
 * @returns True if reminder should be sent
 */
export function shouldSendEmailReminder(
  cciSetting: CciTerm,
  contractDate: string,
  currentDate: string = new Date().toISOString()
): boolean {
  const contract = new Date(contractDate);
  const current = new Date(currentDate);
  const daysDiff = Math.floor((current.getTime() - contract.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysDiff >= cciSetting.email_reminder_days;
}

/**
 * Calculate lock-in period charge
 * @param cciSetting - The CCI setting to use
 * @param numberOfBales - Number of bales
 * @param useMaxCharge - Whether to use max charge (defaults to min)
 * @returns Lock-in charge amount
 */
export function calculateLockinCharge(
  cciSetting: CciTerm,
  numberOfBales: number,
  useMaxCharge: boolean = false
): number {
  const chargePerBale = useMaxCharge 
    ? cciSetting.lockin_charge_max 
    : cciSetting.lockin_charge_min;
  
  return numberOfBales * chargePerBale;
}

/**
 * Get CCI setting version info for audit trail
 * @param cciSetting - The CCI setting to use
 * @returns Version information string
 */
export function getCciSettingVersionInfo(cciSetting: CciTerm): string {
  return `${cciSetting.name} (v${cciSetting.version}) - Effective: ${cciSetting.effectiveFrom}`;
}

/**
 * EMD CONTROL & DELIVERY ORDER LOGIC
 * As per CCI Policy: Full EMD Mandatory Before Delivery Order
 */

/**
 * Calculate EMD grace period expiry date
 * @param cciSetting - The CCI setting to use
 * @param contractDate - Contract confirmation date
 * @returns Grace period expiry date (ISO string)
 */
export function calculateEmdGracePeriodExpiry(
  cciSetting: CciTerm,
  contractDate: string
): string {
  const contract = new Date(contractDate);
  const expiryDate = new Date(contract);
  expiryDate.setDate(expiryDate.getDate() + cciSetting.emd_payment_days);
  return expiryDate.toISOString().split('T')[0];
}

/**
 * Check EMD payment status
 * @param emdRequired - Total EMD required
 * @param emdPaid - Total EMD paid
 * @param paymentDate - Date when EMD was paid (optional)
 * @param gracePeriodExpiry - Grace period expiry date
 * @returns EMD status: 'Not Paid', 'Partial', 'Full', or 'Late Full'
 */
export function checkEmdStatus(
  emdRequired: number,
  emdPaid: number,
  paymentDate?: string,
  gracePeriodExpiry?: string
): 'Not Paid' | 'Partial' | 'Full' | 'Late Full' {
  if (emdPaid === 0) {
    return 'Not Paid';
  }
  
  if (emdPaid < emdRequired) {
    return 'Partial';
  }
  
  // Full EMD paid - check if late
  if (paymentDate && gracePeriodExpiry) {
    const payment = new Date(paymentDate);
    const grace = new Date(gracePeriodExpiry);
    
    if (payment > grace) {
      return 'Late Full';
    }
  }
  
  return 'Full';
}

/**
 * Check if Delivery Order can be created
 * As per CCI Policy: DO creation requires full EMD payment
 * @param cciSetting - The CCI setting to use
 * @param emdRequired - Total EMD required
 * @param emdPaid - Total EMD paid
 * @returns Object with eligibility status and reason
 */
export function checkDoEligibility(
  cciSetting: CciTerm,
  emdRequired: number,
  emdPaid: number
): { eligible: boolean; reason?: string } {
  // Check if DO blocking is enabled in CCI settings
  if (!cciSetting.emd_block_do_if_not_full) {
    return { eligible: true };
  }
  
  // Full EMD must be paid
  if (emdPaid < emdRequired) {
    const shortfall = emdRequired - emdPaid;
    return {
      eligible: false,
      reason: `Full EMD not received. Required: ₹${emdRequired.toLocaleString('en-IN')}, Paid: ₹${emdPaid.toLocaleString('en-IN')}, Shortfall: ₹${shortfall.toLocaleString('en-IN')}`
    };
  }
  
  return { eligible: true };
}

/**
 * Calculate days EMD payment is late
 * @param paymentDate - Date when EMD was paid
 * @param gracePeriodExpiry - Grace period expiry date
 * @returns Number of days late (0 if on time)
 */
export function calculateEmdLateDays(
  paymentDate: string,
  gracePeriodExpiry: string
): number {
  const payment = new Date(paymentDate);
  const grace = new Date(gracePeriodExpiry);
  
  if (payment <= grace) {
    return 0;
  }
  
  const diffTime = payment.getTime() - grace.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Get EMD reminder email trigger type based on days since contract
 * @param cciSetting - The CCI setting to use
 * @param contractDate - Contract date
 * @param emdPaid - Amount of EMD paid
 * @param emdRequired - Amount of EMD required
 * @param currentDate - Current date (defaults to today)
 * @returns Email reminder type or null if no reminder needed
 */
export function getEmdReminderType(
  cciSetting: CciTerm,
  contractDate: string,
  emdPaid: number,
  emdRequired: number,
  currentDate: string = new Date().toISOString().split('T')[0]
): 'initial' | 'grace_expiry' | 'overdue' | null {
  // If full EMD paid, no reminder needed
  if (emdPaid >= emdRequired) {
    return null;
  }
  
  const contract = new Date(contractDate);
  const current = new Date(currentDate);
  const gracePeriodExpiry = new Date(calculateEmdGracePeriodExpiry(cciSetting, contractDate));
  
  const daysSinceContract = Math.floor((current.getTime() - contract.getTime()) / (1000 * 60 * 60 * 24));
  
  // Initial notification (at contract creation)
  if (daysSinceContract === 0) {
    return 'initial';
  }
  
  // Grace period expiry reminder (on expiry day)
  if (current.toDateString() === gracePeriodExpiry.toDateString()) {
    return 'grace_expiry';
  }
  
  // Overdue reminder (after grace period)
  if (current > gracePeriodExpiry && daysSinceContract % 5 === 0) {
    return 'overdue';
  }
  
  return null;
}

/**
 * Calculate carrying charges considering EMD status
 * Note: Carrying charges are calculated even if EMD not paid (for informational purposes)
 * but DO cannot be created until full EMD is received
 * @param cciSetting - The CCI setting to use
 * @param netInvoiceExclGst - Net invoice amount EXCLUDING GST
 * @param days - Number of days
 * @param emdPaid - EMD paid amount
 * @param emdRequired - EMD required amount
 * @returns Object with carrying charge and whether it's informational only
 */
export function calculateCarryingChargeWithEmdStatus(
  cciSetting: CciTerm,
  netInvoiceExclGst: number,
  days: number,
  emdPaid: number,
  emdRequired: number
): { amount: number; informationalOnly: boolean; note?: string } {
  let chargePercent = 0;
  let chargeDays = days;
  
  if (days <= cciSetting.carrying_charge_tier1_days) {
    chargePercent = cciSetting.carrying_charge_tier1_percent;
  } else {
    const tier1Charge = (netInvoiceExclGst * cciSetting.carrying_charge_tier1_percent / 100) * 
                        (cciSetting.carrying_charge_tier1_days / 30);
    
    const tier2Days = days - cciSetting.carrying_charge_tier1_days;
    const tier2Charge = (netInvoiceExclGst * cciSetting.carrying_charge_tier2_percent / 100) * 
                        (tier2Days / 30);
    
    const amount = tier1Charge + tier2Charge;
    const isInformational = emdPaid < emdRequired;
    
    return {
      amount,
      informationalOnly: isInformational,
      note: isInformational ? 'Informational only - Full EMD payment required before DO creation' : undefined
    };
  }
  
  const amount = (netInvoiceExclGst * chargePercent / 100) * (chargeDays / 30);
  const isInformational = emdPaid < emdRequired;
  
  return {
    amount,
    informationalOnly: isInformational,
    note: isInformational ? 'Informational only - Full EMD payment required before DO creation' : undefined
  };
}

