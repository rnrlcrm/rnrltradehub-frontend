# CCI Setting Master - Developer Guide

## Overview

The CCI Setting Master is a comprehensive configuration system that centralizes all financial parameters, calculations, and business rules for CCI (Cotton Corporation of India) trade operations. This ensures that:

1. **No values are hardcoded** - All rates, percentages, and limits are configurable
2. **Historical accuracy** - Version tracking maintains audit trail
3. **Flexible updates** - Settings can be changed seasonally without code modifications
4. **Consistent calculations** - All modules use the same source of truth

## Important: GST Calculation Rules

**Critical Note**: The following calculations must use amounts **EXCLUDING GST**:

1. **EMD (Earnest Money Deposit)**:
   - Calculated on invoice amount excluding GST
   - **GST is NOT charged on EMD**
   
2. **Carrying Charges & Late Lifting Charges**:
   - Initially calculated on candy basis
   - Reconciliation done on final invoice value **excluding GST**
   
3. **EMD Interest & Cash Discount**:
   - Calculated on amount paid **excluding GST**

These rules are enforced in the calculation functions through parameter naming (`invoiceAmountExclGst`, `netInvoiceExclGst`, `amountPaidExclGst`).

## Important: Approximate vs. Final Calculations

**Provisional/Approximate Calculations** (Contract & DO stages):
- Use **0.48 candy per bale** as standard approximation factor
- Applied for: Contract value, DO value, EMD calculation, Carrying charges, Late lifting

**Final Invoice Calculations** (After actual weighment):
- Use **actual weight (quintals) × 0.2812** (candy factor from CCI Setting Master)
- Applied for: Final net invoice, Final reconciliation

**EMD Per-Bale Allocation**:
- EMD is allocated per bale across the entire contract
- Formula: `EMD_per_bale = Total_EMD ÷ Total_Bales`
- When DO requested: `EMD_for_DO = EMD_per_bale × DO_Bales`
- Unlifted value for carrying: `Value_of_unlifted - EMD_allocated_to_unlifted`

## Architecture

### Core Components

1. **Type Definitions** (`src/types.ts`)
   - `CciTerm` interface - Main setting structure
   - `EmdByBuyerType` interface - Buyer-type-specific EMD rates

2. **Calculation Utilities** (`src/utils/cciCalculations.ts`)
   - 20+ utility functions for all CCI-related calculations
   - Pure functions that take CCI setting as parameter
   - Zero hardcoded values

3. **UI Components**
   - `CciTermForm.tsx` - Comprehensive form for editing settings
   - `CciTermManagement.tsx` - List/CRUD interface
   - Settings page integration

## CCI Setting Master Structure

### Versioning & Lifecycle
```typescript
{
  effectiveFrom: '2024-04-01',      // Start date
  effectiveTo: '2025-03-31',        // End date (optional, null = current)
  version: 1,                        // Version number
  isActive: true                     // Active status
}
```

### Core Financial Parameters
```typescript
{
  candy_factor: 0.2812,              // Quintal to Candy conversion
  gst_rate: 5                        // GST percentage
}
```

### EMD Configuration
```typescript
{
  emd_by_buyer_type: {
    kvic: 10,                        // KVIC buyers: 10%
    privateMill: 12.5,               // Private Mills: 10-15%
    trader: 17.5                     // Traders: 15-20%
  },
  emd_payment_days: 5,               // Days to pay EMD (grace period)
  emd_interest_percent: 5,           // Interest on timely EMD (annual)
  emd_late_interest_percent: 10,     // Late payment interest (annual)
  emd_block_do_if_not_full: true     // Block DO creation if full EMD not paid (CCI Policy)
}
```

**CCI Policy - Full EMD Mandatory Before Delivery Order:**
- No Delivery Order (DO) shall be created until full EMD is paid
- Partial EMD or part-payment = ❌ DO Blocked
- System automatically calculates grace period expiry date
- Late EMD interest applies if paid after grace period
- Email reminders triggered at grace expiry and overdue stages


### Carrying Charges (Tiered)
```typescript
{
  carrying_charge_tier1_days: 30,    // Days for tier 1
  carrying_charge_tier1_percent: 1.25,  // % per month (0-30 days)
  carrying_charge_tier2_days: 60,    // Days for tier 2
  carrying_charge_tier2_percent: 1.35   // % per month (>30 days)
}
```

### Late Lifting Charges (3-Tier)
```typescript
{
  free_lifting_period_days: 21,      // Free period
  late_lifting_tier1_days: 30,       // Tier 1: 0-30 days
  late_lifting_tier1_percent: 0.5,   // % per month
  late_lifting_tier2_days: 60,       // Tier 2: 31-60 days
  late_lifting_tier2_percent: 0.75,  // % per month
  late_lifting_tier3_percent: 1.0    // Tier 3: >60 days, % per month
}
```

### Moisture Adjustment
```typescript
{
  moisture_lower_limit: 7,           // Below 7% → premium charged
  moisture_upper_limit: 9,           // Above 9% → discount applied
  moisture_sample_count: 10          // Number of bales to sample
}
```

### Interest Rates
```typescript
{
  cash_discount_percentage: 5,      // Annual cash discount
  interest_lc_bg_percent: 10,       // LC/BG interest (annual)
  penal_interest_lc_bg_percent: 11  // LC/BG penal interest (annual)
}
```

### Other Parameters
```typescript
{
  lifting_period_days: 45,           // Allowed lifting period
  contract_period_days: 45,          // Contract duration
  lockin_charge_min: 350,            // Rs/bale minimum
  lockin_charge_max: 700,            // Rs/bale maximum
  email_reminder_days: 5             // Email reminder threshold
}
```

## EMD Control & Delivery Order Logic

**CCI Policy: Full EMD Mandatory Before Delivery Order**

### Key Policy Points

1. **No DO without full EMD**: Delivery Order creation is blocked until 100% EMD is paid
2. **Partial EMD = Blocked**: Even 99% payment blocks DO creation
3. **Grace Period**: EMD must be paid within `emd_payment_days` (typically 5 days)
4. **Late Interest**: If paid after grace period, late interest applies at `emd_late_interest_percent`
5. **Automatic Reminders**: System triggers emails at grace expiry and overdue stages

### EMD Calculation & Validation Flow

```typescript
// Step 1: Calculate EMD Required
const emdRequired = contractValue * (emdPercent / 100);

// Step 2: Calculate grace period expiry
const gracePeriodExpiry = calculateEmdGracePeriodExpiry(cciSetting, contractDate);

// Step 3: Check EMD status
const emdStatus = checkEmdStatus(emdRequired, emdPaid, paymentDate, gracePeriodExpiry);
// Returns: 'Not Paid' | 'Partial' | 'Full' | 'Late Full'

// Step 4: Check DO eligibility
const doEligibility = checkDoEligibility(cciSetting, emdRequired, emdPaid);
// Returns: { eligible: boolean, reason?: string }

// Step 5: If late payment, calculate late interest
if (emdStatus === 'Late Full') {
  const daysLate = calculateEmdLateDays(paymentDate, gracePeriodExpiry);
  const lateInterest = calculateEmdLateInterest(cciSetting, emdRequired, daysLate);
}
```

### EMD Status Matrix

| EMD Paid | Status | DO Allowed | Carrying Charges | Email Reminder |
|----------|--------|------------|------------------|----------------|
| 0% | Not Paid | ❌ Blocked | ⚙ Informational only | ✅ Yes |
| 1-99% | Partial | ❌ Blocked | ⚙ Informational only | ✅ Yes |
| 100% (on time) | Full | ✅ Allowed | ✅ Calculated | ❌ No |
| 100% (late) | Late Full | ✅ Allowed | ✅ Calculated | — |

### Email Notification Triggers

```typescript
// Initial notification (at contract creation)
if (reminderType === 'initial') {
  // Send: "Please deposit ₹XX as EMD within 5 days"
}

// Grace period expiry (day 5)
if (reminderType === 'grace_expiry') {
  // Send: "EMD still pending. Cannot request delivery until paid."
}

// Overdue (every 5 days after expiry)
if (reminderType === 'overdue') {
  // Send: "EMD overdue. Late interest @10% applicable."
}

// EMD payment confirmation
if (emdStatus === 'Full' || emdStatus === 'Late Full') {
  // Send: "EMD received. You can now request delivery."
}
```

### Integration with Carrying Charges

When EMD is not fully paid:
- Carrying charges are still **calculated** (for information)
- But marked as **"Informational only"**
- DO creation remains **blocked**
- Payment advice **cannot be generated**

```typescript
const carryingResult = calculateCarryingChargeWithEmdStatus(
  cciSetting,
  netInvoiceExclGst,
  daysHeld,
  emdPaid,
  emdRequired
);

// Result:
// {
//   amount: 59675,
//   informationalOnly: true,  // if EMD not full
//   note: "Informational only - Full EMD payment required before DO creation"
// }
```

### Ledger Posting for EMD

| Event | Debit | Credit | Notes |
|-------|-------|--------|-------|
| EMD Payment | Bank | Security Deposit | EMD received |
| Late EMD Interest | Buyer A/c | EMD Interest Income | Non-GST |
| DO Approval | Buyer Payment | Sales Advance | After EMD cleared |
| EMD Refund | Security Deposit | Bank | Post-trade completion |

## EMD Per-Bale Allocation & Carrying Charge Per-Quantity

### Concept

EMD is allocated per bale across the entire contract, not as a lump sum. This affects:
1. How much EMD secures each DO
2. The base value for carrying charge calculations
3. Payment advice breakdown

### Key Formulas

```typescript
// 1. EMD per bale
EMD_per_bale = Total_EMD ÷ Total_Bales

// 2. EMD allocated for a DO
EMD_for_DO = EMD_per_bale × DO_Bales

// 3. EMD allocated to unlifted bales
EMD_for_unlifted = EMD_per_bale × Unlifted_Bales

// 4. Unlifted value for carrying
Unlifted_Value_for_Carrying = Value_of_unlifted_bales - EMD_for_unlifted

// 5. Carrying per bale
Carrying_per_bale = Total_Carrying ÷ Unlifted_Bales

// 6. Carrying per 100 bales
Carrying_per_100 = Carrying_per_bale × 100

// 7. Carrying for specific DO
Carrying_for_DO = Carrying_per_bale × DO_Bales
```

### Example: 1000 Bales Contract, 200 Bales DO

**Contract Details:**
- Total Bales: 1,000
- Rate per Candy: ₹62,000
- Approx Candy per Bale: 0.48
- Contract Value (Approx): 1,000 × 0.48 × 62,000 = ₹29,760,000
- EMD %: 10%
- Total EMD: ₹2,976,000

**EMD Per-Bale Allocation:**
```
EMD_per_bale = 2,976,000 ÷ 1,000 = ₹2,976 per bale

For DO (200 bales):
  EMD_for_DO = 2,976 × 200 = ₹595,200

For Unlifted (800 bales):
  EMD_for_unlifted = 2,976 × 800 = ₹2,380,800

Verification: 595,200 + 2,380,800 = 2,976,000 ✓
```

**DO Value:**
```
DO_Value = 200 × 0.48 × 62,000 = ₹5,952,000 (excl GST)
DO_GST = 5,952,000 × 5% = ₹297,600
DO_Total = 5,952,000 + 297,600 = ₹6,249,600

Less EMD_for_DO = ₹595,200
DO Payable = ₹5,654,400 (what buyer pays now)
```

**Carrying Charge Calculation:**
```
Value_of_unlifted = 29,760,000 - 5,952,000 = ₹23,808,000

Unlifted_Value_for_Carrying = 23,808,000 - 2,380,800 = ₹21,427,200

Carrying (15 days @ 1.25% per month):
  Factor = 1.25% × (15/30) = 0.625%
  Total_exclGST = 21,427,200 × 0.625% = ₹133,920
  Total_GST = 133,920 × 5% = ₹6,696
  Total_inclGST = ₹140,616

Per Bale (800 unlifted):
  Per_bale_exclGST = 133,920 ÷ 800 = ₹167.40

Per 100 Bales:
  Per_100_exclGST = 167.40 × 100 = ₹16,740
  Per_100_GST = 16,740 × 5% = ₹837
  Per_100_inclGST = ₹17,577

For DO (200 bales):
  For_DO_exclGST = 167.40 × 200 = ₹33,480
  For_DO_GST = 33,480 × 5% = ₹1,674
  For_DO_inclGST = ₹35,154
```

**Payment Advice for DO (200 bales):**
```
DO Value (excl GST):              ₹5,952,000
GST @ 5%:                         ₹297,600
DO Value (incl GST):              ₹6,249,600

Less: EMD Allocated (200 bales):  (₹595,200)
                                  ─────────────
DO Payable After EMD:             ₹5,654,400

Carrying for DO (excl GST):       ₹33,480
GST on Carrying:                  ₹1,674
Carrying for DO (incl GST):       ₹35,154
                                  ═════════════
TOTAL PAYABLE FOR DO:             ₹5,689,554
```

### Code Example

```typescript
import {
  calculateApproximateContractValue,
  calculateEmdAmount,
  calculateEmdPerBale,
  calculateEmdAllocatedForDo,
  calculateUnliftedValueForCarrying,
  calculateCarryingWithBreakdown,
  calculateCarryingForDo,
  calculateDoPayableAfterEmd
} from '../utils/cciCalculations';

// Contract setup
const contractQty = 1000;
const ratePerCandy = 62000;
const doBales = 200;

// Approximate contract value (using 0.48 candy per bale)
const contractValue = calculateApproximateContractValue(contractQty, ratePerCandy);
// Returns: 29,760,000

// EMD calculation
const emdTotal = calculateEmdAmount(cciSetting, contractValue, 'privateMill');
const emdPerBale = calculateEmdPerBale(emdTotal, contractQty);
// Returns: 2,976 per bale

// DO EMD allocation
const emdForDo = calculateEmdAllocatedForDo(emdPerBale, doBales);
// Returns: 595,200

// Unlifted value for carrying
const unliftedBales = contractQty - doBales;
const doValue = calculateApproximateDoValue(doBales, ratePerCandy);
const unliftedValue = calculateUnliftedValueForCarrying(
  contractValue,
  doValue,
  emdPerBale,
  unliftedBales
);
// Returns: 21,427,200

// Carrying breakdown
const carrying = calculateCarryingWithBreakdown(
  cciSetting,
  unliftedValue,
  unliftedBales,
  15 // days
);
// Returns: {
//   totalExclGst: 133920,
//   totalInclGst: 140616,
//   perBaleExclGst: 167.40,
//   per100BalesInclGst: 17577,
//   ...
// }

// Carrying for DO
const carryingForDo = calculateCarryingForDo(
  carrying.perBaleExclGst,
  doBales,
  cciSetting.gst_rate
);
// Returns: { exclGst: 33480, gst: 1674, inclGst: 35154 }

// DO payable
const doPayable = calculateDoPayableAfterEmd(
  doValue,
  cciSetting.gst_rate,
  emdForDo
);
// Returns: { doPayableAfterEmd: 5654400, ... }
```

## Usage Examples

**Important Notes on GST:**
- **EMD**: Calculated on invoice amount EXCLUDING GST. GST is NOT charged on EMD.
- **Carrying Charges & Late Lifting**: Initially calculated on candy basis, but reconciliation is done on final invoice value EXCLUDING GST.
- **EMD Interest & Cash Discount**: Calculated on amount paid EXCLUDING GST.

### 1. Fetching Active CCI Setting

```typescript
import { getActiveCciSetting } from '../utils/cciCalculations';

const contractDate = '2024-07-15';
const activeSetting = getActiveCciSetting(cciTerms, contractDate);

if (!activeSetting) {
  throw new Error('No active CCI setting found for this date');
}
```

### 2. EMD Calculation

```typescript
import { calculateEmdAmount, calculateEmdPercent } from '../utils/cciCalculations';

// Note: Use invoice amount EXCLUDING GST for EMD calculation
const invoiceAmountExclGst = 3100000; // Rs 31 lakh (excluding GST)
const buyerType = 'privateMill';

const emdPercent = calculateEmdPercent(activeSetting, buyerType);
// Returns: 12.5

const emdAmount = calculateEmdAmount(activeSetting, invoiceAmountExclGst, buyerType);
// Returns: 387,500 (12.5% of 31 lakh)
// Note: GST is NOT charged on EMD
```

### 3. EMD Control & DO Eligibility Check

```typescript
import { 
  calculateEmdGracePeriodExpiry,
  checkEmdStatus,
  checkDoEligibility,
  calculateEmdLateDays,
  getEmdReminderType
} from '../utils/cciCalculations';

// Contract details
const contractDate = '2024-07-15';
const contractValue = 29760000; // Rs 2.97 crore
const buyerType = 'privateMill';

// Step 1: Calculate EMD required
const emdRequired = calculateEmdAmount(activeSetting, contractValue, buyerType);
// Returns: 2,976,000 (10% for private mill)

// Step 2: Calculate grace period
const gracePeriodExpiry = calculateEmdGracePeriodExpiry(activeSetting, contractDate);
// Returns: '2024-07-20' (5 days after contract)

// Step 3: Check EMD status
const emdPaid = 300000; // Buyer paid only 3 lakh
const paymentDate = '2024-07-18';
const emdStatus = checkEmdStatus(emdRequired, emdPaid, paymentDate, gracePeriodExpiry);
// Returns: 'Partial'

// Step 4: Check DO eligibility
const doCheck = checkDoEligibility(activeSetting, emdRequired, emdPaid);
// Returns: {
//   eligible: false,
//   reason: "Full EMD not received. Required: ₹29,76,000, Paid: ₹3,00,000, Shortfall: ₹26,76,000"
// }

// Step 5: Check if reminder needed
const reminderType = getEmdReminderType(
  activeSetting,
  contractDate,
  emdPaid,
  emdRequired,
  '2024-07-20' // current date
);
// Returns: 'grace_expiry' (send reminder on grace period expiry)

// Step 6: If paid late, calculate late interest
const latePaid = 2976000; // Full EMD paid late
const latePaymentDate = '2024-07-25'; // 5 days after grace
const daysLate = calculateEmdLateDays(latePaymentDate, gracePeriodExpiry);
// Returns: 5 days

const lateInterest = calculateEmdLateInterest(activeSetting, emdRequired, daysLate);
// Returns: 2,976,000 × 10% × (5/365) = 4,077
```

### 4. Carrying Charge Calculation

```typescript
import { calculateCarryingCharge } from '../utils/cciCalculations';

// Note: Use net invoice EXCLUDING GST for reconciliation
const netInvoiceExclGst = 3100000;
const daysHeld = 45; // 45 days

const carryingCharge = calculateCarryingCharge(activeSetting, netInvoiceExclGst, daysHeld);
// Tier 1 (0-30 days): 3,100,000 × 1.25% × (30/30) = 38,750
// Tier 2 (31-45 days): 3,100,000 × 1.35% × (15/30) = 20,925
// Total: 59,675
```

### 5. Moisture Adjustment

```typescript
import { calculateMoistureAdjustment } from '../utils/cciCalculations';

const averageMoisture = 10; // 10%
const netDeliveryWeight = 162; // quintals
const saleRatePerQuintal = 17400;

const adjustment = calculateMoistureAdjustment(
  activeSetting,
  averageMoisture,
  netDeliveryWeight,
  saleRatePerQuintal
);

// Result: { type: 'discount', amount: 2,818,800 }
// Calculation: (10 - 9) × 162 × 17,400 = 2,818,800
```

### 5. Complete Invoice Calculation

```typescript
import { 
  calculateNetInvoice,
  calculateMoistureAdjustment,
  calculateGst,
  calculateTotalInvoice
} from '../utils/cciCalculations';

// Step 1: Calculate base invoice
const weightQtl = 162;
const ratePerCandy = 62000;
let netInvoice = calculateNetInvoice(activeSetting, weightQtl, ratePerCandy);
// 162 × 0.2812 × 62,000 = 2,824,464

// Step 2: Apply moisture adjustment
const moistureAdj = calculateMoistureAdjustment(
  activeSetting,
  10, // 10% moisture
  weightQtl,
  17400
);

if (moistureAdj.type === 'discount') {
  netInvoice -= moistureAdj.amount;
} else if (moistureAdj.type === 'premium') {
  netInvoice += moistureAdj.amount;
}

// Step 3: Calculate GST
const gst = calculateGst(activeSetting, netInvoice);

// Step 4: Total invoice
const totalInvoice = calculateTotalInvoice(activeSetting, netInvoice);
```

### 6. Late Lifting Charges

```typescript
import { calculateLateLiftingCharge } from '../utils/cciCalculations';

// Note: Use net invoice EXCLUDING GST
const netInvoiceExclGst = 3100000;
const daysLate = 75; // 75 days after free period

const lateLiftingCharge = calculateLateLiftingCharge(activeSetting, netInvoiceExclGst, daysLate);
// Tier 1 (0-30): 3,100,000 × 0.5% × (30/30) = 15,500
// Tier 2 (31-60): 3,100,000 × 0.75% × (30/30) = 23,250
// Tier 3 (61-75): 3,100,000 × 1.0% × (15/30) = 15,500
// Total: 54,250
```

### 7. EMD Interest & Cash Discount Calculation

```typescript
import { calculateEmdInterest, calculateEmdLateInterest, calculateCashDiscount } from '../utils/cciCalculations';

// Note: Use amount paid EXCLUDING GST
const emdAmountPaid = 387500;

// Timely payment interest (benefit to buyer)
const daysHeld = 45;
const interest = calculateEmdInterest(activeSetting, emdAmountPaid, daysHeld);
// 387,500 × 5% × (45/365) = 2,391

// Late payment interest (penalty)
const daysLate = 10;
const lateInterest = calculateEmdLateInterest(activeSetting, emdAmountPaid, daysLate);
// 387,500 × 10% × (10/365) = 1,062

// Cash discount on amount paid (excluding GST)
const amountPaidExclGst = 3100000;
const cashDiscount = calculateCashDiscount(activeSetting, amountPaidExclGst, 30);
// 3,100,000 × 5% × (30/365) = 12,740
```

## Integration Points

### Invoice Generation
```typescript
// Store CCI setting info for audit
invoice.cciSettingId = activeSetting.id;
invoice.cciSettingVersion = activeSetting.version;
invoice.cciSettingEffectiveDate = activeSetting.effectiveFrom;

// Store moisture adjustment details
invoice.averageMoisture = 10;
invoice.moistureAdjustmentType = 'discount';
invoice.moistureAdjustmentAmount = 2818800;
```

### Contract Entry
```typescript
// Store setting reference
contract.cciTermId = activeSetting.id;
contract.cciSettingVersion = activeSetting.version;
contract.cciSettingEffectiveDate = activeSetting.effectiveFrom;

// Store buyer type for EMD calculation
contract.buyerType = 'privateMill';
```

### Payment Advice
```typescript
// Calculate all charges dynamically
const carryingCharge = calculateCarryingCharge(activeSetting, netInvoice, days);
const lateLiftingCharge = calculateLateLiftingCharge(activeSetting, netInvoice, daysLate);
const emdInterest = calculateEmdInterest(activeSetting, emdAmount, daysHeld);
```

## Admin Operations

### Creating New Season Settings

1. Navigate to Settings → Master Data Management
2. Click "Add CCI Term" in the CCI Trade Terms Master section
3. Fill in all parameters:
   - Set appropriate Effective From date (e.g., 2025-04-01)
   - Set version number
   - Configure all financial parameters
   - Set moisture limits
   - Configure email templates
4. Mark as Active
5. Save

### Updating Existing Settings

**Method 1: Clone & Modify (Recommended)**
1. Edit existing setting
2. Change Effective From to new season date
3. Increment version number
4. Update parameters as needed
5. Mark old setting as Inactive (set Effective To date)

**Method 2: Direct Edit (For corrections only)**
1. Edit the active setting
2. Update required parameters
3. Save
4. System automatically logs the change in Audit Trail

## Best Practices

### 1. Version Control
- Always increment version number when creating new settings
- Use effectiveTo date to close old versions
- Never delete historical settings (needed for audit)

### 2. Calculation Consistency
```typescript
// ✅ GOOD - Uses CCI master
const charge = calculateCarryingCharge(activeSetting, amount, days);

// ❌ BAD - Hardcoded values
const charge = (amount * 1.25 / 100) * (days / 30);
```

### 3. Audit Trail
Always store:
- CCI Setting ID
- Version number
- Effective date used
- Calculated amounts

### 4. Error Handling
```typescript
const activeSetting = getActiveCciSetting(cciTerms, contractDate);
if (!activeSetting) {
  // Handle missing setting gracefully
  throw new Error(`No CCI setting found for date: ${contractDate}`);
}
```

### 5. Testing Calculations
```typescript
// Always test with multiple scenarios
const testCases = [
  { days: 15, expected: 'tier1' },
  { days: 35, expected: 'tier2' },
  { days: 75, expected: 'tier3' }
];

testCases.forEach(tc => {
  const result = calculateLateLiftingCharge(setting, amount, tc.days);
  // Verify result matches expected tier logic
});
```

## Formula Reference

### Carrying Charge
```
If days <= tier1_days:
  Charge = NetInvoice × tier1_percent × (days / 30)
Else:
  Tier1 = NetInvoice × tier1_percent × (tier1_days / 30)
  Tier2 = NetInvoice × tier2_percent × ((days - tier1_days) / 30)
  Charge = Tier1 + Tier2
```

### Moisture Adjustment
```
If moisture > upper_limit:
  Discount = (moisture - upper_limit) × weight × rate_per_quintal
Else if moisture < lower_limit:
  Premium = (lower_limit - moisture) × weight × rate_per_quintal
Else:
  Adjustment = 0
```

### EMD Interest
```
Interest = EMD_Amount × (Annual_Rate / 100) × (Days / 365)
```

### GST
```
GST_Amount = Net_Invoice × (GST_Rate / 100)
Total = Net_Invoice + GST_Amount
```

## Migration Guide

### For Existing Contracts
1. Add cciSettingVersion field to all active contracts
2. Populate with current active setting version
3. Store effectiveDate for audit

### For Invoices
1. Add moisture tracking fields
2. Add CCI setting reference fields
3. Recalculate with proper setting version

## Troubleshooting

### Issue: No active setting found
**Cause**: No CCI term configured for the contract date
**Solution**: Create a CCI term with effectiveFrom <= contract date

### Issue: Incorrect calculation results
**Cause**: Using wrong buyer type or parameters
**Solution**: Verify buyer type is correctly set on contract

### Issue: Historical invoices showing wrong amounts
**Cause**: Missing setting version reference
**Solution**: Store setting version when creating invoice

## API Examples

### REST API Structure (for backend integration)
```typescript
// GET /api/cci-settings?date=2024-07-15
// Returns active setting for the date

// POST /api/cci-settings
// Create new setting

// PUT /api/cci-settings/:id
// Update existing setting

// GET /api/contracts/:id/calculations
// Get all calculations for a contract using its CCI setting
```

## Future Enhancements

1. **Multiple Formulas Support**: Allow custom calculation formulas
2. **Buyer Category Master**: Link buyer types to master data
3. **Auto-activation**: Automatically activate/deactivate based on dates
4. **Import/Export**: Bulk upload CCI settings from spreadsheet
5. **Simulation Mode**: Test calculation changes before applying
6. **Notification Engine**: Auto-send emails based on CCI rules

## Support

For questions or issues:
1. Check this documentation
2. Review calculation utilities code
3. Test with mock data examples
4. Contact development team

---

**Last Updated**: 2024-11-10
**Version**: 1.0
