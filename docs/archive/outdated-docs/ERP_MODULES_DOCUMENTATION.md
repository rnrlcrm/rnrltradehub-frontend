# ERP Frontend - New Modules Documentation

## Overview

This document describes the newly implemented modules for the RNRL ERP Trade Hub frontend application. These modules complete the full flow and logic as specified in the ERP Frontend Full Flow & Logic Documentation requirements.

## Table of Contents

1. [Quality Inspection & Inventory](#quality-inspection--inventory)
2. [Logistics & Delivery](#logistics--delivery)
3. [Ledger & Accounts](#ledger--accounts)
4. [Reconciliation](#reconciliation)
5. [Technical Architecture](#technical-architecture)
6. [API Integration Points](#api-integration-points)
7. [RBAC & Permissions](#rbac--permissions)

---

## Quality Inspection & Inventory

### Quality Inspection Module

**File**: `src/pages/QualityInspection.tsx`

#### Features

- **Dashboard Views**
  - Pending Inspections: Shows all inspections awaiting review
  - My Organization: Filtered view for organization-specific inspections
  - All Inspections: Complete history of all inspections

- **Inspection Workflow**
  - Create inspection requests linked to contracts
  - Document upload with OCR summary support
  - Quality parameter tracking (Staple Length, Micronaire, Trash, Moisture, etc.)
  - Approve/Reject/Resample actions
  - Complete audit trail with timestamps and user tracking

- **Quality Parameters**
  - Expected vs Actual value comparison
  - Tolerance range specification
  - Pass/Fail/Warning status for each parameter
  - Visual indicators for compliance

- **Document Management**
  - Inspection reports
  - Sample photos
  - Quality certificates
  - OCR-enabled document summary

#### User Roles

- **Admin**: Full access to all inspections
- **Sales**: Can view and manage inspections for their contracts
- **Accounts**: Can view inspection status for invoicing

#### UI Components

```typescript
// Inspection Status Badge
<Badge variant={status === 'Approved' ? 'success' : 'warning'}>{status}</Badge>

// Quality Parameter Table
<table>
  <thead>
    <tr>
      <th>Parameter</th>
      <th>Expected</th>
      <th>Actual</th>
      <th>Tolerance</th>
      <th>Status</th>
    </tr>
  </thead>
  // ... rows
</table>
```

---

### Inventory Module

**File**: `src/pages/Inventory.tsx`

#### Features

- **Multi-Location Tracking**
  - Warehouse management across multiple locations
  - Storage location and rack number tracking
  - Real-time inventory summary by location

- **Item Management**
  - Lot number and bale number tracking
  - Quality grade integration with inspections
  - Weight and package count
  - Status tracking (In Stock, Reserved, In Transit, Delivered, Damaged)

- **Document Management**
  - GRN (Goods Receipt Note)
  - Weighment slips
  - Quality certificates
  - Photos and other documents

- **Summary Dashboard**
  - Total items count
  - Total quantity across all locations
  - Total weight in metric tons
  - Number of active locations

#### User Roles

- **Admin**: Full inventory access
- **Sales**: View inventory for contracts
- **Accounts**: View inventory for reconciliation

#### Filter Options

- Status filter
- Location filter
- Commodity filter
- Text search (Contract, Lot, Owner)

---

## Logistics & Delivery

**File**: `src/pages/Logistics.tsx`

### Features

#### Delivery Order Management

- **Order Creation & Assignment**
  - Link to sales contracts
  - Assign to transporters
  - Vehicle and driver details
  - Transport mode selection (Road, Rail, Air, Sea)

- **Status Tracking**
  - Pending: Awaiting transporter assignment
  - Assigned: Transporter assigned
  - In Transit: Shipment in progress
  - Delivered: Successfully delivered
  - Cancelled: Order cancelled
  - Partial: Partial delivery completed

- **Route Management**
  - From location (warehouse)
  - To location (customer)
  - Expected vs actual delivery dates
  - Real-time status updates

- **Document Management**
  - Delivery challan
  - LR (Lorry Receipt) copy
  - Invoice
  - E-Way Bill (EWB)
  - Weighment slips
  - Photos
  - OCR-enabled document summary

#### Financial Tracking

- Transport cost
- Other charges
- Automatic cost calculation and tracking

#### Audit Trail

Complete history of all actions:
- Order creation
- Transporter assignment
- Dispatch
- Status updates
- Delivery confirmation
- Cancellations

### User Roles

- **Admin**: Full logistics access
- **Sales**: Manage deliveries for their contracts
- **Accounts**: View delivery status for invoicing

### Actions Available

```typescript
// Based on status
Pending → Assign Transporter
Assigned → Mark as Dispatched
In Transit → (Auto-update via GPS/tracking)
Any → Cancel Order (with reason)
```

---

## Ledger & Accounts

**File**: `src/pages/Ledger.tsx`

### Features

#### Account Summary View

- **Account Balances**
  - Opening balance
  - Total debit
  - Total credit
  - Closing balance
  - Outstanding amount
  - Overdue amount

- **Party Information**
  - Party name and organization
  - Party type (Buyer, Seller, Broker, Vendor)
  - Last transaction date
  - Account status (Active, Inactive, Blocked)

- **Transaction Summary**
  - Total contracts
  - Total invoices
  - Total payments

#### Detailed Ledger View

- **Ledger Entries**
  - Date and financial year
  - Transaction type (Sale, Purchase, Payment, Receipt, Commission)
  - Entry type (Debit, Credit)
  - Amount
  - Reference to source document
  - Description
  - Running balance

- **Reconciliation Status**
  - Reconciled/Not Reconciled indicator
  - Reconciliation date and user
  - Link to reconciliation record

#### Filtering & Search

- Party type filter
- Transaction type filter
- Reconciliation status filter
- Date range filter
- Text search

#### Export Options

- Export to Excel
- Export to PDF
- Custom date ranges
- Party-wise or overall reports

### User Roles

- **Admin**: Full access
- **Accounts**: Full access
- Other roles: View-only for their own transactions

### Dashboard Cards

```
┌─────────────────────┬─────────────────────┬─────────────────────┬─────────────────────┐
│ Total Balance       │ Total Outstanding   │ Overdue Amount      │ Total Parties       │
│ ₹X,XXX,XXX         │ ₹X,XXX,XXX         │ ₹X,XXX,XXX         │ XX                  │
└─────────────────────┴─────────────────────┴─────────────────────┴─────────────────────┘
```

---

## Reconciliation

**File**: `src/pages/Reconciliation.tsx`

### Features

#### Reconciliation Types

1. **Party Reconciliation**
   - Reconcile all transactions with a specific party
   - Compare system balance vs party's stated balance
   - Identify discrepancies

2. **Contract Reconciliation**
   - Reconcile all transactions for a specific contract
   - Verify invoice amounts, payments, adjustments
   - Track contract-wise outstanding

3. **Period Reconciliation**
   - Reconcile all transactions within a date range
   - Month-end or year-end reconciliation
   - Financial year closing

#### Reconciliation Items

Each reconciliation contains multiple items:
- Date
- Description
- System amount
- Stated amount
- Difference
- Status (Matched, Unmatched, Disputed)
- Remarks

#### Workflow

1. **Create Reconciliation**
   - Select type (Party/Contract/Period)
   - Define date range
   - System auto-populates items

2. **Review Items**
   - Compare system vs stated amounts
   - Mark items as matched/unmatched
   - Add remarks for discrepancies

3. **Complete Reconciliation**
   - Verify all items reviewed
   - Mark as completed (only if difference = 0)
   - Generate reconciliation report

4. **Dispute Resolution**
   - Unmatched items can be marked as disputed
   - Link to dispute management module
   - Track resolution

#### Status Flow

```
Pending → In Progress → Completed
                     ↓
                  Disputed
```

### User Roles

- **Admin**: Full access
- **Accounts**: Full access

### Summary Dashboard

```
┌─────────────────────┬─────────────────────┬─────────────────────┬─────────────────────┐
│ Total               │ Pending             │ Unmatched Items     │ Total Difference    │
│ Reconciliations     │                     │                     │                     │
│ XX                  │ XX                  │ XX                  │ ₹X,XXX,XXX         │
└─────────────────────┴─────────────────────┴─────────────────────┴─────────────────────┘
```

---

## Technical Architecture

### Type System

All new modules use strongly-typed TypeScript interfaces:

```typescript
// Quality Inspection
interface QualityInspection {
  id: string;
  contractId: string;
  status: InspectionStatus;
  qualityParams: QualityParameter[];
  documents: Document[];
  auditTrail: AuditEntry[];
  // ... other fields
}

// Inventory
interface InventoryItem {
  id: string;
  lotNumber: string;
  location: string;
  warehouse: string;
  quantity: number;
  qualityGrade?: string;
  // ... other fields
}

// Logistics
interface DeliveryOrder {
  id: string;
  doNumber: string;
  contractId: string;
  status: DeliveryStatus;
  fromLocation: string;
  toLocation: string;
  // ... other fields
}

// Ledger
interface LedgerEntry {
  id: string;
  date: string;
  partyId: string;
  transactionType: TransactionType;
  entryType: LedgerEntryType;
  amount: number;
  // ... other fields
}

// Reconciliation
interface Reconciliation {
  id: string;
  type: 'Party' | 'Contract' | 'Period';
  systemBalance: number;
  statedBalance: number;
  difference: number;
  items: ReconciliationItem[];
  // ... other fields
}
```

### Component Structure

All modules follow consistent patterns:

```tsx
// 1. Imports
import React, { useState } from 'react';
import { User, ModuleType } from '../types';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

// 2. Props Interface
interface ModuleProps {
  currentUser: User;
}

// 3. Mock Data
const mockData: ModuleType[] = [ /* ... */ ];

// 4. Component
const ModulePage: React.FC<ModuleProps> = ({ currentUser }) => {
  // State
  const [data, setData] = useState<ModuleType[]>(mockData);
  const [selectedItem, setSelectedItem] = useState<ModuleType | null>(null);
  const [filter, setFilter] = useState({});

  // Functions
  const getFilteredData = () => { /* ... */ };
  const handleAction = () => { /* ... */ };

  // Render
  return (
    <div className="space-y-6">
      {/* Header */}
      {/* Summary Cards */}
      {/* Filters */}
      {/* Data Table/List */}
      {/* Detail Modal */}
    </div>
  );
};
```

### State Management

Currently using local state with useState. Ready for integration with:
- Redux/Zustand for global state
- React Query for server state
- Context API for theme/user preferences

### Styling

- **Framework**: Tailwind CSS
- **Components**: Shadcn UI (via design system)
- **Icons**: Lucide React
- **Responsive**: Mobile-first approach
- **Theme**: Supports light/dark mode

---

## API Integration Points

### Quality Inspection APIs

```typescript
// GET /api/inspections
// GET /api/inspections/:id
// POST /api/inspections
// PUT /api/inspections/:id
// POST /api/inspections/:id/approve
// POST /api/inspections/:id/reject
// POST /api/inspections/:id/resample
// POST /api/inspections/:id/documents
```

### Inventory APIs

```typescript
// GET /api/inventory
// GET /api/inventory/:id
// POST /api/inventory
// PUT /api/inventory/:id
// GET /api/inventory/by-location/:location
// POST /api/inventory/:id/reserve
// POST /api/inventory/:id/release
```

### Logistics APIs

```typescript
// GET /api/delivery-orders
// GET /api/delivery-orders/:id
// POST /api/delivery-orders
// PUT /api/delivery-orders/:id
// POST /api/delivery-orders/:id/assign
// POST /api/delivery-orders/:id/dispatch
// POST /api/delivery-orders/:id/cancel
// POST /api/delivery-orders/:id/documents
```

### Ledger APIs

```typescript
// GET /api/ledger/entries
// GET /api/ledger/balances
// GET /api/ledger/party/:partyId
// GET /api/ledger/contract/:contractId
// POST /api/ledger/entries
// GET /api/ledger/export/excel
// GET /api/ledger/export/pdf
```

### Reconciliation APIs

```typescript
// GET /api/reconciliation
// GET /api/reconciliation/:id
// POST /api/reconciliation
// PUT /api/reconciliation/:id
// POST /api/reconciliation/:id/complete
// POST /api/reconciliation/:id/dispute
// GET /api/reconciliation/:id/export
```

---

## RBAC & Permissions

### Role-Based Access Control

| Module               | Admin | Sales | Accounts | Dispute Manager | Business Partner |
|---------------------|-------|-------|----------|-----------------|------------------|
| Quality Inspection  | ✅    | ✅    | ✅       | ❌              | ❌               |
| Inventory           | ✅    | ✅    | ✅       | ❌              | ❌               |
| Logistics           | ✅    | ✅    | ✅       | ❌              | ❌               |
| Ledger              | ✅    | ❌    | ✅       | ❌              | ❌               |
| Reconciliation      | ✅    | ❌    | ✅       | ❌              | ❌               |

### Action-Level Permissions

#### Quality Inspection
- **View**: All roles with access
- **Create**: Sales, Admin
- **Approve**: Admin, designated inspectors
- **Reject**: Admin, designated inspectors
- **Resample**: Admin, designated inspectors

#### Inventory
- **View**: All roles with access
- **Create/Update**: Admin, Warehouse staff
- **Reserve**: Sales, Admin
- **Transfer**: Admin, Warehouse staff

#### Logistics
- **View**: All roles with access
- **Create**: Sales, Admin
- **Assign**: Admin, Logistics staff
- **Dispatch**: Warehouse staff, Admin
- **Cancel**: Sales, Admin

#### Ledger
- **View All**: Admin, Accounts
- **View Own**: Business Partners (their own transactions)
- **Create Entries**: Accounts, Admin
- **Export**: Admin, Accounts

#### Reconciliation
- **Create**: Accounts, Admin
- **Review**: Accounts, Admin
- **Complete**: Accounts, Admin
- **Dispute**: Accounts, Admin

---

## Future Enhancements

### Notification System
- Real-time notifications for status changes
- Email alerts for critical actions
- In-app notification center
- Push notifications for mobile

### Advanced Features
- Bulk operations (approve/reject multiple inspections)
- Template-based reconciliation
- AI-powered discrepancy detection
- Automated matching algorithms
- Predictive inventory management
- Route optimization for logistics
- Dynamic pricing based on quality parameters

### Integration
- IoT device integration for real-time tracking
- Barcode/QR code scanning for inventory
- GPS tracking for deliveries
- Automated document extraction via OCR
- WhatsApp notifications
- SMS alerts

### Reporting
- Advanced analytics dashboards
- Custom report builder
- Scheduled report generation
- KPI tracking and alerts
- Trend analysis
- Forecasting

---

## Testing

### Unit Tests
All modules are ready for unit testing with:
- Component rendering tests
- State management tests
- Filter and search functionality tests
- Action handler tests

### Integration Tests
- API integration tests
- End-to-end workflow tests
- RBAC enforcement tests
- Document upload tests

### Test Data
Mock data is provided for all modules for testing purposes.

---

## Deployment

### Build
```bash
npm run build
```

### Environment Variables
```env
VITE_API_URL=https://api.rnrltradehub.com
VITE_ENABLE_OCR=true
VITE_MAX_UPLOAD_SIZE=10485760
```

### Performance
- Code splitting enabled
- Lazy loading for large components
- Optimized bundle size
- Image optimization
- Caching strategies

---

## Support

For issues or questions:
- GitHub Issues: [repository issues page]
- Documentation: See main README.md
- API Documentation: See BACKEND_API_REQUIREMENTS.md

---

## License

This project is proprietary software. All rights reserved.

---

## Changelog

### v1.0.0 - 2024-11-15
- ✨ Added Quality Inspection module
- ✨ Added Inventory Management module
- ✨ Added Logistics & Delivery module
- ✨ Added Ledger & Accounts module
- ✨ Added Reconciliation module
- 🎨 Added new icons for modules
- 🔧 Updated navigation and routing
- 📝 Added comprehensive type definitions
- ✅ All modules fully integrated with RBAC
