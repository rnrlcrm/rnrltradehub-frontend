/**
 * EMD Control & Delivery Order - Complete Example
 * 
 * This example demonstrates the full EMD control and DO blocking logic
 * as per CCI Policy: Full EMD Mandatory Before Delivery Order
 */

import { 
  getActiveCciSetting,
  calculateEmdAmount,
  calculateEmdGracePeriodExpiry,
  checkEmdStatus,
  checkDoEligibility,
  calculateEmdLateDays,
  calculateEmdLateInterest,
  getEmdReminderType
} from '../utils/cciCalculations';
import { mockMasterData } from '../data/mockData';

console.log('='.repeat(80));
console.log('EMD CONTROL & DELIVERY ORDER LOGIC - COMPLETE EXAMPLE');
console.log('As per CCI Policy: Full EMD Mandatory Before Delivery Order');
console.log('='.repeat(80));
console.log();

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
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
console.log(`EMD Payment Days (Grace Period): ${activeSetting.emd_payment_days} days`);
console.log(`EMD Late Interest: ${activeSetting.emd_late_interest_percent}% p.a.`);
console.log(`Block DO if Full EMD Not Paid: ${activeSetting.emd_block_do_if_not_full ? 'YES' : 'NO'}`);
console.log();

// ============================================================================
// SCENARIO 1: Contract Created - Calculate EMD Required
// ============================================================================
console.log('SCENARIO 1: Contract Created - Calculate EMD Required');
console.log('-'.repeat(80));

const contractValue = 29760000; // Rs 2.97 crore (1000 bales × 1.70 qtl × 0.2812 × 62,000)
const buyerType = 'privateMill';

const emdRequired = calculateEmdAmount(activeSetting, contractValue, buyerType);
const emdPercent = activeSetting.emd_by_buyer_type[buyerType];

console.log(`Contract Value (excl GST): ${formatCurrency(contractValue)}`);
console.log(`Buyer Type: ${buyerType}`);
console.log(`EMD %: ${emdPercent}%`);
console.log(`EMD Required: ${formatCurrency(emdRequired)}`);
console.log(`GST on EMD: NOT APPLICABLE (as per policy)`);

const gracePeriodExpiry = calculateEmdGracePeriodExpiry(activeSetting, contractDate);
console.log(`Contract Date: ${contractDate}`);
console.log(`Grace Period Expiry: ${gracePeriodExpiry}`);
console.log();

// ============================================================================
// SCENARIO 2: Partial EMD Paid - DO Blocked
// ============================================================================
console.log('SCENARIO 2: Partial EMD Paid - DO Blocked');
console.log('-'.repeat(80));

const partialEmdPaid = 300000; // Only Rs 3 lakh paid
const partialPaymentDate = '2024-07-18';

const partialStatus = checkEmdStatus(emdRequired, partialEmdPaid, partialPaymentDate, gracePeriodExpiry);
const partialDoCheck = checkDoEligibility(activeSetting, emdRequired, partialEmdPaid);

console.log(`EMD Paid: ${formatCurrency(partialEmdPaid)}`);
console.log(`EMD Required: ${formatCurrency(emdRequired)}`);
console.log(`Shortfall: ${formatCurrency(emdRequired - partialEmdPaid)}`);
console.log(`EMD Status: ${partialStatus}`);
console.log(`DO Eligible: ${partialDoCheck.eligible ? '✅ YES' : '❌ NO'}`);
if (partialDoCheck.reason) {
  console.log(`Block Reason: ${partialDoCheck.reason}`);
}

// Check reminder
const partialReminder = getEmdReminderType(
  activeSetting,
  contractDate,
  partialEmdPaid,
  emdRequired,
  '2024-07-20' // grace period expiry date
);
console.log(`Email Reminder Type: ${partialReminder || 'None'}`);
if (partialReminder === 'grace_expiry') {
  console.log(`📧 Email: "EMD still pending. Cannot request delivery until fully paid."`);
}
console.log();

// ============================================================================
// SCENARIO 3: Full EMD Paid On Time - DO Allowed
// ============================================================================
console.log('SCENARIO 3: Full EMD Paid On Time - DO Allowed');
console.log('-'.repeat(80));

const fullEmdPaid = emdRequired; // Full amount
const onTimePaymentDate = '2024-07-18'; // Within grace period

const fullStatus = checkEmdStatus(emdRequired, fullEmdPaid, onTimePaymentDate, gracePeriodExpiry);
const fullDoCheck = checkDoEligibility(activeSetting, emdRequired, fullEmdPaid);

console.log(`EMD Paid: ${formatCurrency(fullEmdPaid)}`);
console.log(`Payment Date: ${onTimePaymentDate}`);
console.log(`Grace Period Expiry: ${gracePeriodExpiry}`);
console.log(`EMD Status: ${fullStatus}`);
console.log(`DO Eligible: ${fullDoCheck.eligible ? '✅ YES' : '❌ NO'}`);
console.log(`📧 Email: "EMD of ${formatCurrency(fullEmdPaid)} received. You can now request delivery."`);
console.log();

// ============================================================================
// SCENARIO 4: Full EMD Paid Late - DO Allowed but Late Interest Applies
// ============================================================================
console.log('SCENARIO 4: Full EMD Paid Late - DO Allowed but Late Interest Applies');
console.log('-'.repeat(80));

const latePaymentDate = '2024-07-25'; // 5 days after grace period
const lateStatus = checkEmdStatus(emdRequired, fullEmdPaid, latePaymentDate, gracePeriodExpiry);
const lateDoCheck = checkDoEligibility(activeSetting, emdRequired, fullEmdPaid);

const daysLate = calculateEmdLateDays(latePaymentDate, gracePeriodExpiry);
const lateInterest = calculateEmdLateInterest(activeSetting, emdRequired, daysLate);

console.log(`EMD Paid: ${formatCurrency(fullEmdPaid)}`);
console.log(`Payment Date: ${latePaymentDate}`);
console.log(`Grace Period Expiry: ${gracePeriodExpiry}`);
console.log(`Days Late: ${daysLate} days`);
console.log(`EMD Status: ${lateStatus}`);
console.log(`Late Interest (@${activeSetting.emd_late_interest_percent}% p.a.): ${formatCurrency(lateInterest)}`);
console.log(`DO Eligible: ${lateDoCheck.eligible ? '✅ YES (after late interest paid)' : '❌ NO'}`);
console.log(`📧 Email: "Late EMD Interest of ${formatCurrency(lateInterest)} applicable. DO now enabled."`);
console.log();

// ============================================================================
// SCENARIO 5: No EMD Paid - Multiple Reminders
// ============================================================================
console.log('SCENARIO 5: No EMD Paid - Multiple Reminders');
console.log('-'.repeat(80));

const noEmdPaid = 0;

console.log(`EMD Paid: ${formatCurrency(noEmdPaid)}`);
console.log(`EMD Required: ${formatCurrency(emdRequired)}`);
console.log();

// Day 0 - Contract created
let reminder = getEmdReminderType(activeSetting, contractDate, noEmdPaid, emdRequired, contractDate);
console.log(`Day 0 (${contractDate}): ${reminder || 'No reminder'}`);
if (reminder === 'initial') {
  console.log(`  📧 "Please deposit ${formatCurrency(emdRequired)} as EMD within ${activeSetting.emd_payment_days} days."`);
}

// Day 5 - Grace period expiry
reminder = getEmdReminderType(activeSetting, contractDate, noEmdPaid, emdRequired, gracePeriodExpiry);
console.log(`Day 5 (${gracePeriodExpiry}): ${reminder || 'No reminder'}`);
if (reminder === 'grace_expiry') {
  console.log(`  📧 "EMD for Indent No. #### is still pending. Cannot request delivery."`);
}

// Day 10 - Overdue
reminder = getEmdReminderType(activeSetting, contractDate, noEmdPaid, emdRequired, '2024-07-25');
console.log(`Day 10 (2024-07-25): ${reminder || 'No reminder'}`);
if (reminder === 'overdue') {
  console.log(`  📧 "EMD overdue. Late Interest @${activeSetting.emd_late_interest_percent}% applicable from ${gracePeriodExpiry}."`);
}
console.log();

// ============================================================================
// SCENARIO 6: Carrying Charges with Partial EMD
// ============================================================================
console.log('SCENARIO 6: Carrying Charges - Informational Only Without Full EMD');
console.log('-'.repeat(80));

const netInvoiceExclGst = contractValue;
const daysHeld = 30;

import { calculateCarryingChargeWithEmdStatus } from '../utils/cciCalculations';

// Scenario A: Partial EMD - Informational only
const partialCarrying = calculateCarryingChargeWithEmdStatus(
  activeSetting,
  netInvoiceExclGst,
  daysHeld,
  partialEmdPaid,
  emdRequired
);

console.log('A) With Partial EMD:');
console.log(`   EMD Paid: ${formatCurrency(partialEmdPaid)} of ${formatCurrency(emdRequired)}`);
console.log(`   Carrying Charge: ${formatCurrency(partialCarrying.amount)}`);
console.log(`   Informational Only: ${partialCarrying.informationalOnly ? 'YES ⚠️' : 'NO'}`);
if (partialCarrying.note) {
  console.log(`   Note: ${partialCarrying.note}`);
}
console.log();

// Scenario B: Full EMD - Normal calculation
const fullCarrying = calculateCarryingChargeWithEmdStatus(
  activeSetting,
  netInvoiceExclGst,
  daysHeld,
  fullEmdPaid,
  emdRequired
);

console.log('B) With Full EMD:');
console.log(`   EMD Paid: ${formatCurrency(fullEmdPaid)} (Full)`);
console.log(`   Carrying Charge: ${formatCurrency(fullCarrying.amount)}`);
console.log(`   Informational Only: ${fullCarrying.informationalOnly ? 'YES' : 'NO ✅'}`);
console.log(`   DO Creation: ALLOWED`);
console.log();

// ============================================================================
// SUMMARY TABLE
// ============================================================================
console.log('='.repeat(80));
console.log('SUMMARY: EMD Status vs System Behavior');
console.log('='.repeat(80));
console.log();
console.log('┌─────────────┬──────────────┬────────────┬──────────────────┬─────────────┐');
console.log('│ EMD Paid    │ Status       │ DO Allowed │ Carrying Charges │ Email       │');
console.log('├─────────────┼──────────────┼────────────┼──────────────────┼─────────────┤');
console.log('│ 0%          │ Not Paid     │ ❌ Blocked │ ⚙ Informational  │ ✅ Yes      │');
console.log('│ 1-99%       │ Partial      │ ❌ Blocked │ ⚙ Informational  │ ✅ Yes      │');
console.log('│ 100% (time) │ Full         │ ✅ Allowed │ ✅ Calculated    │ ❌ No       │');
console.log('│ 100% (late) │ Late Full    │ ✅ Allowed │ ✅ Calculated    │ Interest    │');
console.log('└─────────────┴──────────────┴────────────┴──────────────────┴─────────────┘');
console.log();

console.log('='.repeat(80));
console.log('KEY TAKEAWAYS:');
console.log('='.repeat(80));
console.log('✅ Full EMD = Mandatory precondition for delivery');
console.log('❌ No full EMD → No DO, No Payment Advice generation');
console.log('📧 System auto-triggers reminders and interest after grace period');
console.log('⚙ Carrying charges remain informational until full EMD clears');
console.log('📋 All rates, grace days, and interest values from CCI Setting Master');
console.log('='.repeat(80));

export { };
