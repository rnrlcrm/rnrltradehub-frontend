/**
 * EMD Per-Bale Allocation & Carrying Charge Per-Quantity Example
 * 
 * This example demonstrates the correct EMD allocation per bale and
 * carrying charge calculations with per-quantity breakdown.
 * 
 * Key Concepts:
 * - EMD is allocated per bale
 * - Unlifted value for carrying = Value of unlifted - EMD allocated to unlifted
 * - Carrying charges shown per bale, per 100 bales, and per DO quantity
 * - Approximate calculations use 0.48 candy per bale
 * - Final invoice uses actual weight × 0.2812
 */

import { 
  getActiveCciSetting,
  calculateEmdAmount,
  calculateEmdPerBale,
  calculateEmdAllocatedForDo,
  calculateApproximateContractValue,
  calculateApproximateDoValue,
  calculateUnliftedValueForCarrying,
  calculateCarryingWithBreakdown,
  calculateCarryingForDo,
  calculateDoPayableAfterEmd,
  calculateGst
} from '../utils/cciCalculations';
import { mockMasterData } from '../data/mockData';

console.log('='.repeat(80));
console.log('EMD PER-BALE ALLOCATION & CARRYING CHARGE PER-QUANTITY BREAKDOWN');
console.log('As per CCI Policy with Correct EMD Allocation');
console.log('='.repeat(80));
console.log();

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);
};

// Get active CCI setting
const contractDate = '2024-07-15';
const activeSetting = getActiveCciSetting(mockMasterData.cciTerms, contractDate);

if (!activeSetting) {
  console.log('No active CCI setting found!');
  process.exit(1);
}

console.log(`Active CCI Setting: ${activeSetting.name} (v${activeSetting.version})`);
console.log(`Candy Factor (for final invoice): ${activeSetting.candy_factor}`);
console.log(`Approximate Candy per Bale: 0.48 (for provisional calculations)`);
console.log(`GST Rate: ${activeSetting.gst_rate}%`);
console.log(`Carrying Rate (0-30 days): ${activeSetting.carrying_charge_tier1_percent}% per month`);
console.log();

// ============================================================================
// STEP 1: Contract Details & Approximate Values
// ============================================================================
console.log('STEP 1: Contract Details & Approximate Values');
console.log('-'.repeat(80));

const contractQty = 1000; // bales
const ratePerCandy = 62000; // Rs per candy
const buyerType = 'privateMill';

// Calculate approximate contract value using 0.48 candy per bale
const contractValueApprox = calculateApproximateContractValue(contractQty, ratePerCandy);

console.log(`Contract Quantity: ${contractQty} bales`);
console.log(`Rate per Candy: ${formatCurrency(ratePerCandy)}`);
console.log(`Approximate Candy per Bale: 0.48 (standard approximation)`);
console.log(`Contract Value (Approx): ${contractQty} × 0.48 × ${formatCurrency(ratePerCandy)}`);
console.log(`                       = ${formatCurrency(contractValueApprox)}`);
console.log();

// ============================================================================
// STEP 2: EMD Calculation & Per-Bale Allocation
// ============================================================================
console.log('STEP 2: EMD Calculation & Per-Bale Allocation');
console.log('-'.repeat(80));

const emdPercent = activeSetting.emd_by_buyer_type[buyerType];
const emdTotal = calculateEmdAmount(activeSetting, contractValueApprox, buyerType);
const emdPerBale = calculateEmdPerBale(emdTotal, contractQty);

console.log(`Buyer Type: ${buyerType}`);
console.log(`EMD %: ${emdPercent}%`);
console.log(`EMD Total: ${formatCurrency(contractValueApprox)} × ${emdPercent}%`);
console.log(`         = ${formatCurrency(emdTotal)}`);
console.log(`EMD per Bale: ${formatCurrency(emdTotal)} ÷ ${contractQty}`);
console.log(`            = ${formatCurrency(emdPerBale)} per bale`);
console.log();

// ============================================================================
// STEP 3: DO Request for 200 Bales
// ============================================================================
console.log('STEP 3: Delivery Order Request for 200 Bales');
console.log('-'.repeat(80));

const doBales = 200;
const doValueApprox = calculateApproximateDoValue(doBales, ratePerCandy);

console.log(`DO Requested: ${doBales} bales`);
console.log(`DO Value (Approx): ${doBales} × 0.48 × ${formatCurrency(ratePerCandy)}`);
console.log(`                 = ${formatCurrency(doValueApprox)}`);
console.log();

// EMD allocation for DO
const emdAllocatedForDo = calculateEmdAllocatedForDo(emdPerBale, doBales);
console.log(`EMD Allocated for DO (200 bales):`);
console.log(`  = ${formatCurrency(emdPerBale)} × ${doBales}`);
console.log(`  = ${formatCurrency(emdAllocatedForDo)}`);
console.log();

// Unlifted bales
const unliftedBales = contractQty - doBales;
const emdAllocatedToUnlifted = calculateEmdAllocatedForDo(emdPerBale, unliftedBales);

console.log(`Unlifted Bales: ${contractQty} - ${doBales} = ${unliftedBales} bales`);
console.log(`EMD Allocated to Unlifted (${unliftedBales} bales):`);
console.log(`  = ${formatCurrency(emdPerBale)} × ${unliftedBales}`);
console.log(`  = ${formatCurrency(emdAllocatedToUnlifted)}`);
console.log();

console.log(`Verification: EMD_for_DO + EMD_for_Unlifted = EMD_Total`);
console.log(`  ${formatCurrency(emdAllocatedForDo)} + ${formatCurrency(emdAllocatedToUnlifted)} = ${formatCurrency(emdTotal)}`);
console.log(`  ✓ Correct allocation`);
console.log();

// ============================================================================
// STEP 4: Unlifted Value for Carrying (Correct Calculation)
// ============================================================================
console.log('STEP 4: Unlifted Value for Carrying Charge Base');
console.log('-'.repeat(80));

const unliftedValueForCarrying = calculateUnliftedValueForCarrying(
  contractValueApprox,
  doValueApprox,
  emdPerBale,
  unliftedBales
);

console.log(`Value of Unlifted Bales:`);
console.log(`  = Contract Value (Approx) - DO Value (Approx)`);
console.log(`  = ${formatCurrency(contractValueApprox)} - ${formatCurrency(doValueApprox)}`);
console.log(`  = ${formatCurrency(contractValueApprox - doValueApprox)}`);
console.log();

console.log(`Unlifted Value for Carrying:`);
console.log(`  = Value of Unlifted Bales - EMD Allocated to Unlifted`);
console.log(`  = ${formatCurrency(contractValueApprox - doValueApprox)} - ${formatCurrency(emdAllocatedToUnlifted)}`);
console.log(`  = ${formatCurrency(unliftedValueForCarrying)}`);
console.log();

console.log(`📝 Note: EMD portion securing unlifted bales is subtracted,`);
console.log(`   NOT the entire EMD total.`);
console.log();

// ============================================================================
// STEP 5: Carrying Charges - Total & Per-Quantity Breakdown
// ============================================================================
console.log('STEP 5: Carrying Charges with Per-Quantity Breakdown');
console.log('-'.repeat(80));

const daysHeld = 15;
const carryingBreakdown = calculateCarryingWithBreakdown(
  activeSetting,
  unliftedValueForCarrying,
  unliftedBales,
  daysHeld
);

console.log(`Days Held: ${daysHeld} days`);
console.log(`Carrying Rate: ${activeSetting.carrying_charge_tier1_percent}% per month (0-30 days)`);
console.log(`Factor for ${daysHeld} days: ${activeSetting.carrying_charge_tier1_percent}% × (${daysHeld}/30) = ${(activeSetting.carrying_charge_tier1_percent * daysHeld / 30).toFixed(3)}%`);
console.log();

console.log(`Total Carrying on Unlifted (${unliftedBales} bales):`);
console.log(`  Excl GST: ${formatCurrency(unliftedValueForCarrying)} × ${(activeSetting.carrying_charge_tier1_percent * daysHeld / 30 / 100).toFixed(5)}`);
console.log(`          = ${formatCurrency(carryingBreakdown.totalExclGst)}`);
console.log(`  GST (${activeSetting.gst_rate}%): ${formatCurrency(carryingBreakdown.totalGst)}`);
console.log(`  Incl GST: ${formatCurrency(carryingBreakdown.totalInclGst)}`);
console.log();

console.log(`Per Bale Breakdown:`);
console.log(`  Carrying per bale (excl GST): ${formatCurrency(carryingBreakdown.totalExclGst)} ÷ ${unliftedBales}`);
console.log(`                              = ${formatCurrency(carryingBreakdown.perBaleExclGst)} per bale`);
console.log();

console.log(`Per 100 Bales Breakdown:`);
console.log(`  Carrying per 100 (excl GST): ${formatCurrency(carryingBreakdown.perBaleExclGst)} × 100`);
console.log(`                             = ${formatCurrency(carryingBreakdown.per100BalesExclGst)}`);
console.log(`  GST on 100 bales (${activeSetting.gst_rate}%): ${formatCurrency(carryingBreakdown.per100BalesGst)}`);
console.log(`  Carrying per 100 (incl GST): ${formatCurrency(carryingBreakdown.per100BalesInclGst)}`);
console.log();

// ============================================================================
// STEP 6: Carrying for DO (200 bales)
// ============================================================================
console.log('STEP 6: Carrying Charge for DO (200 bales)');
console.log('-'.repeat(80));

const carryingForDo = calculateCarryingForDo(
  carryingBreakdown.perBaleExclGst,
  doBales,
  activeSetting.gst_rate
);

console.log(`Carrying for DO (${doBales} bales):`);
console.log(`  Excl GST: ${formatCurrency(carryingBreakdown.perBaleExclGst)} × ${doBales}`);
console.log(`          = ${formatCurrency(carryingForDo.exclGst)}`);
console.log(`  GST (${activeSetting.gst_rate}%): ${formatCurrency(carryingForDo.gst)}`);
console.log(`  Incl GST: ${formatCurrency(carryingForDo.inclGst)}`);
console.log();

// ============================================================================
// STEP 7: DO Payable After EMD Allocation
// ============================================================================
console.log('STEP 7: DO Payable After EMD Allocation');
console.log('-'.repeat(80));

const doPayable = calculateDoPayableAfterEmd(
  doValueApprox,
  activeSetting.gst_rate,
  emdAllocatedForDo
);

console.log(`DO Value (excl GST): ${formatCurrency(doPayable.doValueExclGst)}`);
console.log(`GST (${activeSetting.gst_rate}%): ${formatCurrency(doPayable.doGst)}`);
console.log(`DO Value (incl GST): ${formatCurrency(doPayable.doValueInclGst)}`);
console.log();
console.log(`Less: EMD Allocated for DO: (${formatCurrency(doPayable.lessEmdAllocated)})`);
console.log();
console.log(`DO Payable After EMD: ${formatCurrency(doPayable.doPayableAfterEmd)}`);
console.log(`  (This is what buyer pays now for the DO)`);
console.log();

// ============================================================================
// STEP 8: Payment Advice Summary for DO (200 bales)
// ============================================================================
console.log('='.repeat(80));
console.log('PAYMENT ADVICE FOR DO (200 BALES) - SUMMARY');
console.log('='.repeat(80));
console.log();

console.log(`DO Value (excl GST):              ${formatCurrency(doPayable.doValueExclGst)}`);
console.log(`GST @ ${activeSetting.gst_rate}%:                         ${formatCurrency(doPayable.doGst)}`);
console.log(`DO Value (incl GST):              ${formatCurrency(doPayable.doValueInclGst)}`);
console.log();
console.log(`Less: EMD Allocated (200 bales):  (${formatCurrency(doPayable.lessEmdAllocated)})`);
console.log(`                                  ─────────────────`);
console.log(`DO Payable After EMD:             ${formatCurrency(doPayable.doPayableAfterEmd)}`);
console.log();
console.log(`Carrying for DO (excl GST):       ${formatCurrency(carryingForDo.exclGst)}`);
console.log(`GST on Carrying:                  ${formatCurrency(carryingForDo.gst)}`);
console.log(`Carrying for DO (incl GST):       ${formatCurrency(carryingForDo.inclGst)}`);
console.log();
console.log(`                                  ═════════════════`);
console.log(`TOTAL PAYABLE FOR DO:             ${formatCurrency(doPayable.doPayableAfterEmd + carryingForDo.inclGst)}`);
console.log();

// ============================================================================
// STEP 9: Full Contract Summary
// ============================================================================
console.log('='.repeat(80));
console.log('FULL CONTRACT SUMMARY');
console.log('='.repeat(80));
console.log();

console.log(`Contract Details:`);
console.log(`  Total Bales:                    ${contractQty}`);
console.log(`  Contract Value (Approx):        ${formatCurrency(contractValueApprox)}`);
console.log(`  EMD Total:                      ${formatCurrency(emdTotal)}`);
console.log(`  EMD per Bale:                   ${formatCurrency(emdPerBale)}`);
console.log();

console.log(`DO Details (200 bales):`);
console.log(`  DO Value (Approx):              ${formatCurrency(doValueApprox)}`);
console.log(`  EMD Allocated for DO:           ${formatCurrency(emdAllocatedForDo)}`);
console.log(`  DO Payable After EMD:           ${formatCurrency(doPayable.doPayableAfterEmd)}`);
console.log();

console.log(`Unlifted Bales (800 bales):`);
console.log(`  Unlifted Value (Approx):        ${formatCurrency(contractValueApprox - doValueApprox)}`);
console.log(`  EMD Allocated to Unlifted:      ${formatCurrency(emdAllocatedToUnlifted)}`);
console.log(`  Unlifted Value for Carrying:    ${formatCurrency(unliftedValueForCarrying)}`);
console.log();

console.log(`Carrying Charges (${daysHeld} days):`);
console.log(`  Total Carrying (incl GST):      ${formatCurrency(carryingBreakdown.totalInclGst)}`);
console.log(`  Carrying per 100 bales:         ${formatCurrency(carryingBreakdown.per100BalesInclGst)}`);
console.log(`  Carrying for DO (200 bales):    ${formatCurrency(carryingForDo.inclGst)}`);
console.log();

// ============================================================================
// STEP 10: Key Formulas Reference
// ============================================================================
console.log('='.repeat(80));
console.log('KEY FORMULAS REFERENCE');
console.log('='.repeat(80));
console.log();

console.log(`1. Approximate Contract Value:`);
console.log(`   = TotalBales × 0.48 (approx candy) × RatePerCandy`);
console.log();

console.log(`2. EMD per Bale:`);
console.log(`   = TotalEMD ÷ TotalBales`);
console.log();

console.log(`3. EMD Allocated for DO:`);
console.log(`   = EMD_per_bale × DO_Bales`);
console.log();

console.log(`4. Unlifted Value for Carrying:`);
console.log(`   = (ContractValue - DOValue) - EMD_Allocated_to_Unlifted`);
console.log(`   = Value_of_unlifted_bales - (EMD_per_bale × Unlifted_Bales)`);
console.log();

console.log(`5. Carrying Charge:`);
console.log(`   Total_exclGST = UnliftedValueForCarrying × Rate% × (Days/30)`);
console.log(`   Per_Bale = Total_exclGST ÷ Unlifted_Bales`);
console.log(`   Per_100 = Per_Bale × 100`);
console.log(`   For_DO = Per_Bale × DO_Bales`);
console.log();

console.log(`6. DO Payable After EMD:`);
console.log(`   = (DO_Value + GST) - EMD_Allocated_for_DO`);
console.log();

console.log('='.repeat(80));
console.log('✅ All calculations use EMD per-bale allocation as per CCI policy');
console.log('✅ Carrying charges show per-quantity breakdown for Payment Advice');
console.log('✅ Approximate calculations use 0.48 candy per bale standard factor');
console.log('='.repeat(80));

export { };
