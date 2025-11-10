/**
 * CCI Calculation Examples
 * 
 * This file demonstrates how to use the CCI Setting Master calculation utilities.
 * These examples show real-world calculations based on mock data.
 */

import { 
  getActiveCciSetting,
  calculateEmdAmount,
  calculateEmdPercent,
  calculateCarryingCharge,
  calculateLateLiftingCharge,
  calculateMoistureAdjustment,
  calculateGst,
  calculateTotalInvoice,
  calculateNetInvoice,
  getCciSettingVersionInfo
} from '../utils/cciCalculations';
import { mockMasterData } from '../data/mockData';

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

console.log('='.repeat(80));
console.log('CCI SETTING MASTER - CALCULATION EXAMPLES');
console.log('='.repeat(80));
console.log();

// Example 1: Get Active CCI Setting
console.log('Example 1: Fetching Active CCI Setting');
console.log('-'.repeat(80));
const contractDate = '2024-07-15';
const activeSetting = getActiveCciSetting(mockMasterData.cciTerms, contractDate);

if (activeSetting) {
  console.log(`Contract Date: ${contractDate}`);
  console.log(`Active Setting: ${getCciSettingVersionInfo(activeSetting)}`);
  console.log(`Candy Factor: ${activeSetting.candy_factor}`);
  console.log(`GST Rate: ${activeSetting.gst_rate}%`);
  console.log();
} else {
  console.log('No active setting found!');
  process.exit(1);
}

// Example 2: EMD Calculation
console.log('Example 2: EMD Calculation');
console.log('-'.repeat(80));
// Note: EMD is calculated on invoice amount EXCLUDING GST
const invoiceAmountExclGst = 3100000; // Rs 31 lakh (excluding GST)

console.log(`Invoice Amount (excl GST): ${formatCurrency(invoiceAmountExclGst)}`);
console.log('Note: GST is NOT charged on EMD');
console.log();

const buyerTypes: Array<'kvic' | 'privateMill' | 'trader'> = ['kvic', 'privateMill', 'trader'];
buyerTypes.forEach(buyerType => {
  const emdPercent = calculateEmdPercent(activeSetting, buyerType);
  const emdAmount = calculateEmdAmount(activeSetting, invoiceAmountExclGst, buyerType);
  console.log(`  ${buyerType.toUpperCase()}: ${emdPercent}% = ${formatCurrency(emdAmount)}`);
});
console.log();

// Example 3: Carrying Charge Calculation
console.log('Example 3: Carrying Charge Calculation');
console.log('-'.repeat(80));
// Note: Reconciliation is done on final invoice value EXCLUDING GST
const netInvoiceExclGst = 3100000;
console.log('Note: Uses net invoice EXCLUDING GST for reconciliation');
const scenarios = [
  { days: 15, desc: 'Tier 1 (0-30 days)' },
  { days: 45, desc: 'Tier 1 + Tier 2' },
  { days: 90, desc: 'Extended period' }
];

scenarios.forEach(scenario => {
  const charge = calculateCarryingCharge(activeSetting, netInvoiceExclGst, scenario.days);
  console.log(`  ${scenario.desc} (${scenario.days} days): ${formatCurrency(charge)}`);
});
console.log();

// Example 4: Late Lifting Charges
console.log('Example 4: Late Lifting Charges');
console.log('-'.repeat(80));
console.log('Note: Uses net invoice EXCLUDING GST for reconciliation');
const lateScenarios = [
  { days: 15, desc: 'Tier 1 (0-30 days)' },
  { days: 45, desc: 'Tier 2 (31-60 days)' },
  { days: 75, desc: 'Tier 3 (>60 days)' }
];

lateScenarios.forEach(scenario => {
  const charge = calculateLateLiftingCharge(activeSetting, netInvoiceExclGst, scenario.days);
  console.log(`  ${scenario.desc} (${scenario.days} days late): ${formatCurrency(charge)}`);
});
console.log();

// Example 5: Moisture Adjustment
console.log('Example 5: Moisture Adjustment');
console.log('-'.repeat(80));
const netDeliveryWeight = 162; // quintals
const saleRatePerQuintal = 17400;

console.log(`Moisture Range: ${activeSetting.moisture_lower_limit}% - ${activeSetting.moisture_upper_limit}%`);
console.log(`Net Delivery Weight: ${netDeliveryWeight} qtl`);
console.log(`Sale Rate: ${formatCurrency(saleRatePerQuintal)}/qtl`);
console.log();

const moistureScenarios = [
  { moisture: 6.5, desc: 'Below lower limit (Premium)' },
  { moisture: 8.0, desc: 'Within range (No adjustment)' },
  { moisture: 10.0, desc: 'Above upper limit (Discount)' }
];

moistureScenarios.forEach(scenario => {
  const adjustment = calculateMoistureAdjustment(
    activeSetting,
    scenario.moisture,
    netDeliveryWeight,
    saleRatePerQuintal
  );
  
  const sign = adjustment.type === 'premium' ? '+' : adjustment.type === 'discount' ? '-' : '±';
  console.log(`  ${scenario.desc} (${scenario.moisture}%): ${sign} ${formatCurrency(adjustment.amount)}`);
});
console.log();

// Example 6: Complete Invoice Calculation
console.log('Example 6: Complete Invoice Calculation');
console.log('-'.repeat(80));
const weightQtl = 162;
const ratePerCandy = 62000;

console.log(`Weight: ${weightQtl} quintals`);
console.log(`Rate: ${formatCurrency(ratePerCandy)} per candy`);
console.log(`Candy Factor: ${activeSetting.candy_factor}`);
console.log();

// Step 1: Base invoice
let netInvoiceAmount = calculateNetInvoice(activeSetting, weightQtl, ratePerCandy);
console.log(`  1. Base Invoice: ${formatCurrency(netInvoiceAmount)}`);
console.log(`     Calculation: ${weightQtl} qtl × ${activeSetting.candy_factor} × ${formatCurrency(ratePerCandy)}`);

// Step 2: Moisture adjustment
const moistureAdj = calculateMoistureAdjustment(activeSetting, 10, weightQtl, saleRatePerQuintal);
if (moistureAdj.type !== 'none') {
  const sign = moistureAdj.type === 'discount' ? '-' : '+';
  console.log(`  2. Moisture Adjustment (${moistureAdj.type}): ${sign} ${formatCurrency(moistureAdj.amount)}`);
  
  if (moistureAdj.type === 'discount') {
    netInvoiceAmount -= moistureAdj.amount;
  } else {
    netInvoiceAmount += moistureAdj.amount;
  }
}

console.log(`  3. Adjusted Net Invoice: ${formatCurrency(netInvoiceAmount)}`);

// Step 3: GST
const gstAmount = calculateGst(activeSetting, netInvoiceAmount);
console.log(`  4. GST (${activeSetting.gst_rate}%): ${formatCurrency(gstAmount)}`);

// Step 4: Total
const totalAmount = calculateTotalInvoice(activeSetting, netInvoiceAmount);
console.log(`  5. TOTAL INVOICE: ${formatCurrency(totalAmount)}`);
console.log();

// Example 7: Summary Table
console.log('Example 7: Complete Charges Summary');
console.log('-'.repeat(80));
const buyerType = 'privateMill';
const daysHeld = 45;
const daysLate = 15;

// Note: Use amounts excluding GST for all calculations
const emd = calculateEmdAmount(activeSetting, netInvoiceAmount, buyerType); // excl GST
const carrying = calculateCarryingCharge(activeSetting, netInvoiceAmount, daysHeld); // excl GST
const lateLifting = calculateLateLiftingCharge(activeSetting, netInvoiceAmount, daysLate); // excl GST

console.log(`Net Invoice (excl GST): ${formatCurrency(netInvoiceAmount)}`);
console.log(`Invoice Total (incl GST): ${formatCurrency(totalAmount)}`);
console.log(`EMD Required:          ${formatCurrency(emd)} (${calculateEmdPercent(activeSetting, buyerType)}% on excl GST, NO GST on EMD)`);
console.log(`Carrying Charges:      ${formatCurrency(carrying)} (${daysHeld} days on excl GST)`);
console.log(`Late Lifting:          ${formatCurrency(lateLifting)} (${daysLate} days late on excl GST)`);
console.log('-'.repeat(80));
console.log(`Total Charges:         ${formatCurrency(emd + carrying + lateLifting)}`);
console.log();

console.log('='.repeat(80));
console.log('All examples completed successfully!');
console.log('Note: All calculations use amounts EXCLUDING GST as per CCI rules');
console.log('='.repeat(80));

// Export for use in other files
export {
  activeSetting,
  formatCurrency
};
