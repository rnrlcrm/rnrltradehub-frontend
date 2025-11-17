# Commodity Master - Security & Audit Trail Policy

## 🔒 CRITICAL: Core Module Security

The Commodity Master is the **CORE MODULE** for the entire trading system. All other modules depend on it, especially Sales Contracts. Therefore, the highest level of security and data integrity is maintained.

---

## 📋 Commodity ID System

### ID Generation
- **When Created**: Every commodity gets a unique ID immediately upon creation
- **Format**: Numeric ID (auto-incrementing from database)
- **Immutability**: Once assigned, the ID **NEVER changes**
- **Uniqueness**: Guaranteed unique across the entire system

### Purpose of Commodity ID
1. **Audit Trail**: Track all operations on this commodity
2. **Referential Integrity**: Link to Sales Contracts and other modules
3. **Historical Data**: Preserve data even if commodity is deactivated
4. **Security**: Prevent data tampering and ensure traceability

---

## 🔗 Module Relationships

### Sales Contract Integration
```typescript
interface SalesContract {
  // MANDATORY commodity reference
  commodityId: number;           // Links to Commodity.id
  commodityName: string;         // Cached at contract time
  commoditySymbol: string;       // Cached at contract time
  
  // Other fields...
}
```

### Why Cache Commodity Name/Symbol?
- **Audit Trail**: Even if commodity is renamed, contracts show original values
- **Data Integrity**: Historical accuracy is preserved
- **Compliance**: Regulatory requirements for immutable contract records

---

## 🛡️ Security Policies

### 1. Deletion Policy

#### ❌ CANNOT DELETE IF:
- **Last Active Commodity**: At least one commodity must remain active
- **Active Contracts Exist**: Any sales contract with status 'Active' or 'Pending Approval' references this commodity
- **Historical Contracts Exist**: Deletion is blocked to preserve audit trail

#### ✅ CAN DELETE IF:
- Multiple active commodities exist
- No sales contracts reference this commodity
- No invoices, payments, or delivery orders depend on it

#### ⚠️ Alternative: Deactivation
If deletion is blocked due to historical data:
- Set `isActive = false`
- Commodity hidden from new contract creation
- Historical data preserved
- Can be reactivated if needed

### 2. Edit Policy

#### 🔒 LOCKED FIELDS (when active contracts exist):
- `symbol`: Used in contract references and reports
- `unit`: Changing would invalidate contract quantities
- `hsnCode`: Affects GST calculations in contracts
- `supportsCciTerms`: Changes contract terms applicability

#### ✏️ EDITABLE FIELDS (even with active contracts):
- `name`: Display name can be updated (original cached in contracts)
- `description`: Non-critical field
- `isActive`: Can deactivate (with validation)
- Trading parameters: Can add new options (existing contracts unaffected)

### 3. Creation Policy

#### ✅ MANDATORY FIELDS:
- `name`: Unique, non-empty
- `symbol`: Unique, 2-10 uppercase alphanumeric characters
- `unit`: Must select from predefined units
- `hsnCode`: Auto-determined or manually set
- At least one of each:
  - Trade Type
  - Bargain Type
  - Weightment Term
  - Passing Term
  - Delivery Term
  - Payment Term
  - Commission Structure

#### 🔍 VALIDATION CHECKS:
- No duplicate name (case-insensitive)
- No duplicate symbol (case-insensitive)
- Valid HSN code format (4, 6, or 8 digits)
- GST rate within 0-100%
- All trading parameters have valid data

### 4. Deactivation Policy

#### ⚠️ CANNOT DEACTIVATE IF:
- Last active commodity in system
- Active sales contracts reference this commodity

#### ✅ CAN DEACTIVATE IF:
- Other active commodities exist
- No active contracts (historical contracts OK)

#### 📝 EFFECT OF DEACTIVATION:
- Hidden from new contract creation dropdown
- Existing contracts remain valid
- Can be reactivated by admin
- Appears in reports as "Inactive"

---

## 📊 Audit Trail Requirements

### All Operations Must Log:
1. **Create**: 
   - Who created
   - When created
   - Initial values
   - Commodity ID assigned

2. **Edit**:
   - Who edited
   - When edited
   - What changed (before/after values)
   - Reason for change

3. **Delete** (if allowed):
   - Who deleted
   - When deleted
   - Commodity details snapshot
   - Reason for deletion

4. **Deactivate/Reactivate**:
   - Who changed status
   - When changed
   - Previous status
   - Reason for change

### Audit Log Format:
```typescript
{
  user: "Admin User",
  role: "Admin",
  action: "Create" | "Update" | "Delete" | "Deactivate" | "Reactivate",
  module: "Settings - Commodity Master",
  details: "Created commodity: Cotton (CTN) - HSN 5201",
  reason: "Commodity master management",
  timestamp: "2024-01-15T10:30:00Z",
  commodityId: 123,
  changes: {
    before: {...},
    after: {...}
  }
}
```

---

## 🔐 Data Integrity Checks

### Before ANY Operation:

1. **Uniqueness Check**
   - Name unique across all commodities
   - Symbol unique across all commodities

2. **Referential Integrity**
   - Check sales contracts using this commodity
   - Check invoices referencing commodity
   - Check delivery orders linked to commodity

3. **Business Rule Validation**
   - Cotton must support CCI Terms
   - Non-cotton cannot support CCI Terms
   - HSN code matches commodity type

4. **Security Validation**
   - No SQL injection in inputs
   - No XSS attempts in text fields
   - Valid data types and formats

---

## 🚨 Critical Warnings

### ⚠️ NEVER:
1. Change commodity ID after creation
2. Delete commodity with active contracts
3. Allow duplicate names or symbols
4. Skip validation checks
5. Bypass audit logging

### ✅ ALWAYS:
1. Generate audit log for every operation
2. Validate contract dependencies before deletion
3. Cache commodity details in contracts
4. Preserve historical data
5. Enforce business rules

---

## 🔄 Integration with Sales Contract Module

### Contract Creation Flow:
1. User selects commodity from dropdown (active commodities only)
2. System loads commodity details:
   - ID, Name, Symbol
   - Available trade types
   - Available varieties
   - HSN code for GST
3. Contract created with:
   ```typescript
   commodityId: selectedCommodity.id,
   commodityName: selectedCommodity.name,    // Cached
   commoditySymbol: selectedCommodity.symbol, // Cached
   ```

### Contract Validation:
- Commodity must exist and be active
- Variety must be in commodity's variety list
- Trade type must be in commodity's trade types
- GST rate matches commodity's HSN code

### Historical Preservation:
- Even if commodity name changes, contract shows original
- Even if commodity is deactivated, contract remains valid
- Audit trail maintains complete history

---

## 📈 Best Practices

### For Developers:
1. **Always use commodityId** for relationships, never name or symbol
2. **Cache display values** in dependent entities (contracts, invoices)
3. **Validate existence** before creating dependent records
4. **Check deletion safety** before any delete operation
5. **Log everything** for audit compliance

### For Administrators:
1. **Plan before creating** - commodity structure is critical
2. **Deactivate, don't delete** - preserve historical data
3. **Review dependencies** - check contracts before changes
4. **Regular audits** - verify data integrity
5. **Backup regularly** - commodity data is irreplaceable

---

## 🎯 Summary

The Commodity Master is protected by:
- ✅ Unique ID system with immutability
- ✅ Strict deletion policies with contract checks
- ✅ Field-level edit restrictions based on usage
- ✅ Comprehensive audit trail logging
- ✅ Referential integrity validation
- ✅ Security checks (SQL injection, XSS)
- ✅ Business rule enforcement
- ✅ Historical data preservation

**This ensures the commodity module serves as a robust, secure, and reliable foundation for the entire trading system.**
