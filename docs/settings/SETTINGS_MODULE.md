# Settings Module - Complete Documentation

## Overview

The Settings module is a comprehensive configuration management system for the RNRL Trade Hub ERP. It provides a centralized interface for managing all master data, organizational settings, and financial year operations.

**Location:** `/src/pages/Settings.tsx`

**Access Control:** Admin role only (enforced on line 23-28)

## Architecture

### Main Components

The Settings page consists of two main tabs:
1. **Master Data Management** - Manages core system configurations
2. **Financial Year Management** - Handles FY split and migration

### Component Hierarchy

```
Settings.tsx (Main Container)
├── Tab: Master Data Management
│   ├── OrganizationManagement.tsx
│   ├── MasterDataManagement.tsx (x7 instances)
│   │   ├── Trade Types
│   │   ├── Bargain Types
│   │   ├── Varieties
│   │   ├── Dispute Reasons
│   │   ├── Weightment Terms
│   │   ├── Passing Terms
│   │   └── Financial Years
│   ├── GstRateManagement.tsx
│   ├── StructuredTermManagement.tsx (x2 instances)
│   │   ├── Delivery Terms
│   │   └── Payment Terms
│   ├── CommissionMasterManagement.tsx
│   ├── CciTermManagement.tsx
│   └── LocationManagement.tsx
└── Tab: Financial Year Management
    └── FYManagement.tsx
```

## Access Control

### Role-Based Access

```typescript
if (currentUser.role !== 'Admin') {
  return (
    <Card title="Access Denied">
      <p className="text-red-600">
        You do not have permission to view this page. 
        Please contact an administrator.
      </p>
    </Card>
  );
}
```

**Allowed Roles:**
- ✅ Admin (full access)
- ❌ Sales Manager (denied)
- ❌ Account Manager (denied)
- ❌ Auditor (denied)
- ❌ Viewer (denied)

## Module Components

### 1. Organization Management

**Component:** `OrganizationManagement.tsx`  
**Purpose:** Manage legal entities and branches

**Fields:**
- Name (required)
- Code (required)
- GSTIN (required)
- PAN (required)
- Address (street, city, state, pincode)
- Phone, Email, Website
- Bank Details (name, account, IFSC, branch)
- Status (Active/Inactive)

**Features:**
- Create, Edit, Delete organizations
- Status toggle
- Detailed bank information
- Audit logging for all operations

**Data Flow:**
```
User Action → Modal Form → Validation → State Update → Audit Log
```

### 2. Master Data Management (Generic)

**Component:** `MasterDataManagement.tsx`  
**Purpose:** Reusable CRUD for simple master data lists

**Used For:**
1. Trade Types
2. Bargain Types
3. Varieties
4. Dispute Reasons
5. Weightment Terms
6. Passing Terms
7. Financial Years

**Fields:**
- ID (auto-generated)
- Name (required)

**Operations:**
- Add New
- Edit
- Delete
- Search/Filter

### 3. GST Rate Management

**Component:** `GstRateManagement.tsx`  
**Purpose:** Manage GST rates for different product categories

**Fields:**
- Description (product category)
- HSN Code (harmonized system code)
- Rate (percentage)

**Example Data:**
- Cotton Bales - 5200 - 5%
- Cotton Yarn - 5205 - 5%
- Processing Services - 9988 - 18%

### 4. Structured Term Management

**Component:** `StructuredTermManagement.tsx`  
**Purpose:** Manage terms with days/periods

**Used For:**
1. Delivery Terms (e.g., "Ex-Godown", "FOR Destination")
2. Payment Terms (e.g., "Immediate", "30 Days Credit")

**Fields:**
- Name (term description)
- Days (numeric period)

### 5. Commission Master Management

**Component:** `CommissionMasterManagement.tsx`  
**Purpose:** Define commission structures

**Fields:**
- Name (commission structure name)
- Type (PERCENTAGE | PER_BALE)
- Value (numeric value)

**Examples:**
- Standard Commission - PERCENTAGE - 2%
- Fixed Per Bale - PER_BALE - ₹50

### 6. CCI Term Management

**Component:** `CciTermManagement.tsx`  
**Purpose:** Comprehensive CCI trade terms configuration

**Key Fields:**
- Name (term name)
- Effective Period (from/to dates)
- Version (for tracking)
- Status (Active/Inactive)
- Candy Factor (conversion rate)
- GST Rate
- EMD Configuration (by buyer type)
- Carrying Charges (tiered)
- Late Lifting Charges (tiered)
- Interest Rates
- Moisture Adjustment Parameters

**Features:**
- Version tracking
- Date-based activation
- Multiple buyer type support
- Complex calculation parameters

See [CCI_SETTING_MASTER.md](./CCI_SETTING_MASTER.md) for detailed documentation.

### 7. Location Management

**Component:** `LocationManagement.tsx`  
**Purpose:** Manage geographic locations

**Fields:**
- Country
- State
- City

**Usage:** Referenced in contracts, deliveries, and organizations

### 8. Financial Year Management

**Component:** `FYManagement.tsx`  
**Purpose:** FY split and data migration

**Features:**
- Display current FY information
- Show days remaining
- List pending items (invoices, commissions, disputes, contracts)
- Execute FY split operation
- Migrate data to new FY
- Complete audit trail

**Pending Items Tracked:**
- Unpaid Invoices (count + amount)
- Due Commissions (count + amount)
- Open Disputes (count)
- Active Contracts (count)

**FY Split Process:**
1. Display confirmation dialog
2. Validate pending items
3. Close current FY
4. Create new FY
5. Migrate all pending items
6. Update statuses
7. Generate summary report

## Data Flow

### Create/Update Flow

```
1. User clicks "Add New" or "Edit"
   ↓
2. Modal opens with form
   ↓
3. User fills form fields
   ↓
4. Client-side validation
   ↓
5. Submit → State update
   ↓
6. Audit log created
   ↓
7. Modal closes
   ↓
8. Table refreshes
```

### Delete Flow

```
1. User clicks "Delete"
   ↓
2. Confirmation dialog
   ↓
3. User confirms
   ↓
4. Remove from state
   ↓
5. Audit log created
   ↓
6. Table refreshes
```

## State Management

Each management component maintains its own local state:

```typescript
const [items, setItems] = useState<Type[]>(initialData);
const [isModalOpen, setIsModalOpen] = useState(false);
const [editingItem, setEditingItem] = useState<Type | null>(null);
```

**Parent State (Settings.tsx):**
```typescript
const [activeTab, setActiveTab] = useState<'master-data' | 'fy-management'>('master-data');
```

## Audit Logging

All CRUD operations generate audit logs:

```typescript
addAuditLog({
  user: currentUser.name,
  role: currentUser.role,
  action: 'Create' | 'Update' | 'Delete',
  module: 'Settings',
  details: 'Descriptive details of the action',
  reason: 'Master data management'
});
```

**Audit Log Structure:**
- ID (auto-generated)
- Timestamp (auto-generated)
- User (current user name)
- Role (current user role)
- Action (Create/Update/Delete)
- Module (always 'Settings')
- Details (what was changed)
- Reason (why it was changed)

## UI/UX Features

### Responsive Design
- Desktop: 3-column grid for cards
- Tablet: 2-column grid
- Mobile: Single column stack

### Visual Feedback
- Loading states during operations
- Success/error messages
- Confirmation dialogs for destructive actions
- Disabled states for invalid actions

### Accessibility
- Keyboard navigation support
- ARIA labels on all interactive elements
- Focus management in modals
- Screen reader friendly

### Performance Optimizations
- Lazy loading of tabs
- Virtualized tables for large datasets
- Memoized components
- Debounced search/filter

## Integration Points

### Data Sources
- Mock data from `/src/data/mockData.ts`
- Future: API endpoints for persistence

### Dependencies
```typescript
import { mockMasterData, mockLocations, mockOrganizationsDetailed } from '../data/mockData';
import { User, AuditLog } from '../types';
```

### Used By
- Sales Contracts (organizations, terms, GST rates)
- Invoices (GST rates, organizations)
- Payments (payment terms, organizations)
- Commissions (commission structures)
- Disputes (dispute reasons)

## Error Handling

### Validation
- Required field checking
- Format validation (email, phone, GSTIN, PAN)
- Duplicate prevention
- Range checking for numeric values

### Error Messages
```typescript
// Example: Organization Form
if (!gstin.match(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)) {
  errors.gstin = 'Invalid GSTIN format';
}
```

## Security Considerations

### Access Control
- Role-based page access (Admin only)
- Operation-level permissions (future enhancement)
- Audit trail for all changes

### Data Validation
- Input sanitization
- Type checking via TypeScript
- Required field enforcement
- Format validation

### Best Practices
- No inline SQL (frontend only)
- No sensitive data in state
- XSS prevention via React
- CSRF protection (API layer)

## Testing Strategy

### Unit Tests (Recommended)
```typescript
describe('Settings Page', () => {
  test('renders for Admin user', () => {});
  test('denies access for non-Admin', () => {});
  test('switches between tabs', () => {});
});

describe('MasterDataManagement', () => {
  test('adds new item', () => {});
  test('edits existing item', () => {});
  test('deletes item with confirmation', () => {});
  test('creates audit log entry', () => {});
});
```

### Integration Tests (Recommended)
```typescript
describe('Settings Integration', () => {
  test('Organization changes reflect in dropdowns', () => {});
  test('GST rate changes update invoices', () => {});
  test('FY split migrates data correctly', () => {});
});
```

### E2E Tests (Recommended)
```typescript
describe('Settings E2E', () => {
  test('Admin can manage all settings', () => {});
  test('Non-admin sees access denied', () => {});
  test('Changes persist across sessions', () => {});
});
```

## Future Enhancements

### Planned Features
- [ ] Export/Import master data (CSV, Excel)
- [ ] Bulk upload via file
- [ ] Change history viewer
- [ ] Approval workflow for changes
- [ ] Field-level permissions
- [ ] Data validation rules engine
- [ ] Multi-language support
- [ ] Custom field definitions
- [ ] API integration for persistence
- [ ] Real-time sync across users

### Performance Improvements
- [ ] Virtual scrolling for large lists
- [ ] Debounced search
- [ ] Optimistic UI updates
- [ ] Background data sync
- [ ] Cached data with invalidation

### UX Enhancements
- [ ] Drag-and-drop reordering
- [ ] Inline editing in tables
- [ ] Keyboard shortcuts
- [ ] Quick filters
- [ ] Saved searches
- [ ] Recently modified items
- [ ] Favorites/Bookmarks

## Troubleshooting

### Common Issues

**Issue:** "Access Denied" shown to Admin
- **Cause:** User role not properly set
- **Solution:** Check `currentUser.role === 'Admin'`

**Issue:** Changes not persisting
- **Cause:** Using mock data without persistence
- **Solution:** Implement API integration

**Issue:** Modal not closing after save
- **Cause:** Missing `handleCloseModal()` call
- **Solution:** Ensure modal close in success callback

**Issue:** Duplicate entries created
- **Cause:** Missing duplicate checking
- **Solution:** Add uniqueness validation

## Code Examples

### Adding a New Master Data Type

```typescript
// In Settings.tsx, add to grid:
<MasterDataManagement 
  title="New Master Type" 
  initialData={mockMasterData.newType} 
  currentUser={currentUser} 
  addAuditLog={addAuditLog} 
/>

// In mockData.ts, add data:
newType: [
  { id: 1, name: 'Value 1' },
  { id: 2, name: 'Value 2' },
]
```

### Creating a Custom Management Component

```typescript
// Follow the pattern of existing components:
interface CustomManagementProps {
  initialData: CustomType[];
  currentUser: User;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
}

const CustomManagement: React.FC<CustomManagementProps> = ({
  initialData,
  currentUser,
  addAuditLog
}) => {
  const [items, setItems] = useState<CustomType[]>(initialData);
  // Implement CRUD operations...
};
```

## References

- [CCI Setting Master Documentation](./CCI_SETTING_MASTER.md)
- [Design System Documentation](./DESIGN_SYSTEM.md)
- [Main README](../README.md)

## Maintenance

**Last Updated:** November 10, 2025  
**Version:** 1.0.0  
**Maintainer:** Development Team  
**Status:** Production Ready ✅

---

For questions or issues, contact the development team or refer to the comprehensive documentation in the `/docs` folder.
