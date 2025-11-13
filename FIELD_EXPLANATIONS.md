# Commodity Master Fields - Detailed Explanations

## Why These Fields Are Essential

### 1. **Active** (Checkbox)
**Purpose**: Controls whether the commodity is available for creating new sales contracts.

**Business Logic**:
- ✅ **Active = true**: Commodity appears in dropdown lists when creating new contracts
- ❌ **Active = false**: Commodity is hidden from new contract creation (but existing contracts remain valid)

**Use Cases**:
- Temporarily disable a commodity without deleting it
- Seasonal commodities (e.g., disable "Wheat" during off-season)
- Phase out old commodities while preserving historical data
- Compliance: Stop trading a commodity without losing audit trail

**Example**:
```
Cotton (Active = true) → Appears in "Create Contract" dropdown
Rice (Active = false) → Hidden from new contracts, but old contracts still visible
```

**Why NOT just delete?**
- Deleting removes ALL historical data
- Active/Inactive preserves:
  - Historical sales contracts
  - Past invoices
  - Audit logs
  - Financial reports

---

### 2. **Is Processed?** (Checkbox)
**Purpose**: Indicates if the commodity is processed/manufactured, which directly affects GST rates.

**GST Tax Law Impact**:
According to Indian GST Act:
- **Unprocessed/Raw Agricultural Products**: 0% or 5% GST (exempt or lower rates)
- **Processed/Manufactured Products**: 12% or 18% GST (higher rates)

**Examples**:

| Commodity | Is Processed? | GST Rate | Reason |
|-----------|---------------|----------|---------|
| Raw Cotton | ❌ No | 5% | Natural agricultural product |
| Cotton Yarn | ✅ Yes | 12% | Processed/manufactured |
| Raw Paddy | ❌ No | 0% | Unprocessed grain (exempt) |
| Polished Rice | ✅ Yes | 5% | Processed grain |
| Raw Wheat | ❌ No | 0% | Natural product |
| Wheat Flour | ✅ Yes | 5% | Processed product |
| Crude Oil | ❌ No | 5% | Natural extraction |
| Refined Oil | ✅ Yes | 18% | Refined/processed |

**Business Impact**:
```
Example: Cotton Purchase
- Raw Cotton (Is Processed = No): 
  Base Price: ₹5,000/bale
  GST @ 5%: ₹250
  Total: ₹5,250

- Cotton Yarn (Is Processed = Yes):
  Base Price: ₹5,000/unit
  GST @ 12%: ₹600
  Total: ₹5,600
```

**Why Critical**:
1. **Legal Compliance**: Wrong GST rate = Legal issues, penalties, tax notices
2. **Pricing Accuracy**: Incorrect rate = Wrong invoice amounts
3. **ITC (Input Tax Credit)**: Buyers need correct GST for tax claims
4. **Financial Reports**: GST liability calculations depend on this

---

### 3. **Supports CCI Terms** (Checkbox)
**Purpose**: Enables Cotton Corporation of India (CCI) specific terms and rules for cotton trading.

**What is CCI?**
CCI = Cotton Corporation of India (Government of India Enterprise)
- Established: 1970
- Purpose: Price stabilization and support to cotton farmers
- Role: Minimum Support Price (MSP) operations for cotton

**CCI Terms Include**:
1. **EMD (Earnest Money Deposit)**:
   - Mandatory deposit: 5-10% of contract value
   - Refundable after contract completion
   - Interest on EMD: 5% per annum

2. **Carrying Charges**:
   - Storage cost: ₹2-3 per candy per day
   - Tiered: 0-30 days (normal), 31-60 days (higher)

3. **Late Lifting Charges**:
   - Free period: 15 days
   - After 15 days: Penalty charges apply
   - Tiered penalties for delayed pickup

4. **Quality Specifications**:
   - Staple length requirements
   - Micronaire limits
   - Trash content limits

5. **Payment Terms**:
   - Cash discount: 2.5% if paid within 7 days
   - LC/BG interest: 10% per annum
   - Penal interest: 11% for defaults

6. **Lock-in Charges**:
   - ₹350-700 per bale for early exit

**Example Contract with CCI Terms**:
```
Contract: 100 bales of Cotton @ ₹6,000/candy

WITH CCI Terms:
- EMD: 10% = ₹60,000 (refundable + 5% interest)
- Carrying Charge: ₹2/candy/day after 30 days
- Late Lifting: ₹50/bale/day after 15 days
- Quality: Must meet CCI specifications
- Payment: Cash discount 2.5% if paid in 7 days

WITHOUT CCI Terms:
- No EMD required
- No standardized carrying charges
- No late lifting penalties
- Negotiable quality terms
- Flexible payment terms
```

**Why Only Cotton?**
- CCI is ONLY for cotton (Government mandate)
- Other commodities (wheat, rice, pulses) have different agencies:
  - FCI (Food Corporation of India) for grains
  - NAFED for pulses and oilseeds
  - Each has different terms

**Business Impact**:
```
Scenario: Buyer wants 100 bales cotton

Cotton with CCI Terms:
✓ Standardized quality
✓ Government-backed
✓ Clear penalty structure
✓ Predictable costs
✗ Higher upfront cost (EMD)
✗ Time-bound delivery

Cotton without CCI Terms:
✓ Flexible terms
✓ Negotiable quality
✓ No EMD
✗ Higher risk
✗ Dispute-prone
```

**When to Enable**:
- ✅ Trading with CCI directly
- ✅ Contracts requiring government standards
- ✅ Export quality cotton
- ❌ Direct farmer purchases
- ❌ Non-cotton commodities
- ❌ Informal/local trading

---

## Real-World Example: Complete Flow

### Scenario: Trading Company "ABC Traders"

**Commodity 1: Raw Cotton**
```
Name: Raw Cotton
Active: ✅ Yes (currently trading)
Is Processed: ❌ No (natural product)
Supports CCI Terms: ✅ Yes (government cotton)
→ Result: Available for new contracts, 5% GST, CCI rules apply
```

**Commodity 2: Cotton Yarn**
```
Name: Cotton Yarn
Active: ✅ Yes (currently trading)
Is Processed: ✅ Yes (manufactured)
Supports CCI Terms: ❌ No (processed goods)
→ Result: Available for new contracts, 12% GST, no CCI rules
```

**Commodity 3: Old Season Cotton**
```
Name: Cotton 2022 Season
Active: ❌ No (season ended)
Is Processed: ❌ No
Supports CCI Terms: ✅ Yes
→ Result: NOT available for new contracts, but old contracts still valid
```

---

## Summary: Why These 3 Fields?

| Field | Impact | Without It |
|-------|--------|------------|
| **Active** | Controls availability | Cannot disable without deleting |
| **Is Processed** | Determines GST rate | Wrong tax = legal issues |
| **Supports CCI Terms** | Applies government rules | Cannot trade CCI cotton |

**All 3 fields are MANDATORY for**:
1. Legal compliance (GST)
2. Business operations (CCI)
3. Data integrity (Active status)
4. Financial accuracy (Tax calculations)
5. Contract management (Terms application)

---

## Technical Implementation

### Backend Logic:
```typescript
// When creating sales contract
if (commodity.isActive === false) {
  throw new Error("Cannot create contract: Commodity is inactive");
}

// When calculating GST
const gstRate = commodity.isProcessed ? 
  getProcessedGSTRate(commodity) : 
  getUnprocessedGSTRate(commodity);

// When applying terms
if (commodity.supportsCciTerms) {
  applyEMD();
  applyCarryingCharges();
  applyLateLiftingPenalty();
  applyCCIQualityStandards();
}
```

### Database Impact:
```sql
-- Sales contracts reference active status
SELECT * FROM sales_contracts 
WHERE commodity_id = ? 
AND contract_date > commodity.deactivated_date; -- Would fail!

-- GST calculations depend on isProcessed
UPDATE invoices 
SET gst_amount = base_amount * (
  SELECT gst_rate FROM commodities 
  WHERE id = ? AND is_processed = ?
);

-- CCI terms apply conditionally
IF commodity.supports_cci_terms THEN
  INSERT INTO cci_emd_records ...
END IF;
```

---

## Conclusion

These 3 checkboxes are NOT just flags - they are:
- **Legal Requirements**: GST compliance
- **Business Rules**: CCI government terms
- **Operational Controls**: Active/Inactive management
- **Financial Accuracy**: Tax and penalty calculations
- **Data Integrity**: Historical preservation

**Removing any of these = System Breakdown!**
