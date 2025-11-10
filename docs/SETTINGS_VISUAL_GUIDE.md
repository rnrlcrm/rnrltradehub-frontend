# Settings Module - Visual Architecture Guide

## Table of Contents
1. [Component Hierarchy](#component-hierarchy)
2. [Data Flow Diagrams](#data-flow-diagrams)
3. [Access Control Flow](#access-control-flow)
4. [State Management](#state-management)
5. [User Journey Maps](#user-journey-maps)

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                         App.tsx                                  │
│                    (Main Application)                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
                    ┌────────────────┐
                    │  Settings.tsx  │
                    │  (Main Page)   │
                    └────────┬───────┘
                             │
        ┌────────────────────┴────────────────────┐
        │                                         │
        ↓                                         ↓
┌───────────────────┐                  ┌──────────────────┐
│ Master Data Tab   │                  │ FY Management    │
└────────┬──────────┘                  │     Tab          │
         │                             └──────────────────┘
         │
         ├─→ OrganizationManagement.tsx
         │   ├─→ Modal (Dialog)
         │   ├─→ OrganizationForm.tsx
         │   └─→ Table
         │
         ├─→ MasterDataManagement.tsx (7 instances)
         │   │   ├─→ Trade Types
         │   │   ├─→ Bargain Types
         │   │   ├─→ Varieties
         │   │   ├─→ Dispute Reasons
         │   │   ├─→ Weightment Terms
         │   │   ├─→ Passing Terms
         │   │   └─→ Financial Years
         │   ├─→ Modal (Dialog)
         │   ├─→ MasterDataForm.tsx
         │   └─→ Table
         │
         ├─→ GstRateManagement.tsx
         │   ├─→ Modal (Dialog)
         │   ├─→ GstRateForm.tsx
         │   └─→ Table
         │
         ├─→ StructuredTermManagement.tsx (2 instances)
         │   │   ├─→ Delivery Terms
         │   │   └─→ Payment Terms
         │   ├─→ Modal (Dialog)
         │   ├─→ StructuredTermForm.tsx
         │   └─→ Table
         │
         ├─→ CommissionMasterManagement.tsx
         │   ├─→ Modal (Dialog)
         │   ├─→ CommissionMasterForm.tsx
         │   └─→ Table
         │
         ├─→ CciTermManagement.tsx
         │   ├─→ Modal (Dialog)
         │   ├─→ CciTermForm.tsx
         │   └─→ Table
         │
         └─→ LocationManagement.tsx
             ├─→ Modal (Dialog)
             ├─→ LocationForm.tsx
             └─→ Table
```

## Data Flow Diagrams

### Create New Item Flow

```
┌──────────┐
│   User   │
└────┬─────┘
     │
     │ 1. Click "Add New"
     ↓
┌─────────────────────┐
│ Management Component│
└─────────┬───────────┘
          │
          │ 2. Open Modal
          ↓
┌─────────────────────┐
│   Modal (Dialog)    │
└─────────┬───────────┘
          │
          │ 3. Display Form
          ↓
┌─────────────────────┐
│   Form Component    │
└─────────┬───────────┘
          │
          │ 4. User fills fields
          │ 5. Click Save
          ↓
┌─────────────────────┐
│ Validation (Client) │
└─────────┬───────────┘
          │
          │ Valid? ──────── No ──→ Show Errors
          │                           │
          Yes                         │
          │                           │
          │ 6. onSave callback        │
          ↓                           │
┌─────────────────────┐              │
│ Management Component│              │
│   handleSave()      │              │
└─────────┬───────────┘              │
          │                           │
          │ 7. Create item            │
          │    with Date.now() ID     │
          ↓                           │
┌─────────────────────┐              │
│   Update State      │              │
│  setItems([...])    │              │
└─────────┬───────────┘              │
          │                           │
          │ 8. Create audit log       │
          ↓                           │
┌─────────────────────┐              │
│   addAuditLog()     │              │
└─────────┬───────────┘              │
          │                           │
          │ 9. Close modal            │
          ↓                           │
┌─────────────────────┐              │
│   Modal closes      │              │
│   Table refreshes   │ ←────────────┘
└─────────────────────┘
```

### Edit Item Flow

```
┌──────────┐
│   User   │
└────┬─────┘
     │
     │ 1. Click "Edit" on row
     ↓
┌─────────────────────┐
│ Management Component│
│  handleOpenModal()  │
└─────────┬───────────┘
          │
          │ 2. Set editingItem
          │    Open Modal
          ↓
┌─────────────────────┐
│   Modal (Dialog)    │
└─────────┬───────────┘
          │
          │ 3. Display Form
          │    with existing data
          ↓
┌─────────────────────┐
│   Form Component    │
│ (pre-filled fields) │
└─────────┬───────────┘
          │
          │ 4. User modifies
          │ 5. Click Save
          ↓
┌─────────────────────┐
│ Validation (Client) │
└─────────┬───────────┘
          │
          │ Valid?
          Yes
          │
          │ 6. onSave callback
          ↓
┌─────────────────────┐
│ Management Component│
│   handleSave()      │
└─────────┬───────────┘
          │
          │ 7. Map over items
          │    Replace edited item
          ↓
┌─────────────────────┐
│   Update State      │
│  setItems([...])    │
└─────────┬───────────┘
          │
          │ 8. Create audit log
          │    with before/after
          ↓
┌─────────────────────┐
│   addAuditLog()     │
└─────────┬───────────┘
          │
          │ 9. Close modal
          ↓
┌─────────────────────┐
│   Modal closes      │
│   Table refreshes   │
└─────────────────────┘
```

### Delete Item Flow

```
┌──────────┐
│   User   │
└────┬─────┘
     │
     │ 1. Click "Delete"
     ↓
┌─────────────────────┐
│ Management Component│
│  handleDelete()     │
└─────────┬───────────┘
          │
          │ 2. Show confirmation
          ↓
┌─────────────────────┐
│ window.confirm()    │
│ "Are you sure...?"  │
└─────────┬───────────┘
          │
          │ Confirmed?
          Yes
          │
          │ 3. Filter item out
          ↓
┌─────────────────────┐
│   Update State      │
│  setItems(filtered) │
└─────────┬───────────┘
          │
          │ 4. Create audit log
          ↓
┌─────────────────────┐
│   addAuditLog()     │
└─────────┬───────────┘
          │
          │ 5. Table refreshes
          ↓
┌─────────────────────┐
│   Table re-renders  │
│   (item removed)    │
└─────────────────────┘
```

## Access Control Flow

```
┌──────────────────┐
│   User Login     │
└────────┬─────────┘
         │
         │ User object with role loaded
         ↓
┌──────────────────────────┐
│  Navigate to #settings   │
└────────┬─────────────────┘
         │
         │ Settings component mounts
         ↓
┌────────────────────────────────────┐
│  Settings.tsx                      │
│                                    │
│  if (currentUser.role !== 'Admin')│
└────────┬───────────────────────────┘
         │
    ┌────┴────┐
    │         │
   Yes       No
    │         │
    │         ↓
    │    ┌──────────────────────┐
    │    │  Render Full Page    │
    │    │  - Master Data Tab   │
    │    │  - FY Management Tab │
    │    └──────────────────────┘
    │
    ↓
┌────────────────────────┐
│  Render Access Denied  │
│  Card with error msg   │
└────────────────────────┘

ROLES:
✅ Admin          → Full Access
❌ Sales Manager  → Access Denied
❌ Account Mgr    → Access Denied
❌ Auditor        → Access Denied
❌ Viewer         → Access Denied
```

## State Management

### Settings.tsx State

```typescript
┌─────────────────────────────────────┐
│         Settings.tsx State          │
├─────────────────────────────────────┤
│                                     │
│ activeTab: 'master-data' | 'fy-...'│
│                                     │
│ ↓ Passed to children via props:    │
│   - currentUser: User               │
│   - addAuditLog: Function           │
│                                     │
└─────────────────────────────────────┘
```

### Management Component State (Pattern)

```typescript
┌─────────────────────────────────────┐
│    Management Component State       │
│    (e.g., MasterDataManagement)     │
├─────────────────────────────────────┤
│                                     │
│ items: T[]                          │
│   └─ Initial: from props.initialData│
│   └─ Updated: on CRUD operations    │
│                                     │
│ isModalOpen: boolean                │
│   └─ Controls modal visibility      │
│                                     │
│ editingItem: T | null               │
│   └─ null = creating new item       │
│   └─ T = editing existing item      │
│                                     │
└─────────────────────────────────────┘
```

### State Flow on Create

```
Initial State:
  items: [item1, item2, ...]
  isModalOpen: false
  editingItem: null

User clicks "Add New":
  isModalOpen: true
  editingItem: null

User fills form and saves:
  items: [newItem, item1, item2, ...]
  isModalOpen: false
  editingItem: null
  
  + Audit log created
  + Table re-renders with new data
```

### State Flow on Edit

```
Initial State:
  items: [item1, item2, ...]
  isModalOpen: false
  editingItem: null

User clicks "Edit" on item2:
  isModalOpen: true
  editingItem: item2

User modifies and saves:
  items: [item1, updatedItem2, ...]
  isModalOpen: false
  editingItem: null
  
  + Audit log created
  + Table re-renders with updated data
```

## User Journey Maps

### Journey 1: Admin Managing Master Data

```
1. LOGIN
   └─→ User logs in as Admin
        └─→ Role: Admin stored in currentUser

2. NAVIGATE TO SETTINGS
   └─→ Click "Settings" in sidebar
        └─→ URL: #settings
        └─→ Access check: PASS ✅

3. VIEW MASTER DATA
   └─→ Master Data tab active (default)
        └─→ See all management sections
        └─→ Organizations, Trade Types, etc.

4. ADD NEW TRADE TYPE
   └─→ Scroll to "Trade Types" card
        └─→ Click "Add New" button
             └─→ Modal opens
                  └─→ Enter name: "Export"
                       └─→ Click "Save"
                            └─→ Item added to list
                            └─→ Audit log created
                            └─→ Modal closes
                            └─→ Success ✅

5. EDIT ORGANIZATION
   └─→ Find organization in list
        └─→ Click "Edit" button
             └─→ Modal opens with form
                  └─→ Modify GSTIN field
                       └─→ Click "Save"
                            └─→ Organization updated
                            └─→ Audit log created
                            └─→ Modal closes
                            └─→ Success ✅

6. DELETE VARIETY
   └─→ Find variety in list
        └─→ Click "Delete" button
             └─→ Confirmation dialog
                  └─→ Click "OK"
                       └─→ Item removed
                       └─→ Audit log created
                       └─→ Success ✅
```

### Journey 2: Non-Admin Attempting Access

```
1. LOGIN
   └─→ User logs in as Sales Manager
        └─→ Role: Sales Manager

2. NAVIGATE TO SETTINGS
   └─→ Click "Settings" in sidebar
        └─→ URL: #settings
        └─→ Access check: FAIL ❌

3. ACCESS DENIED
   └─→ See red error card
        └─→ Message: "You do not have permission"
        └─→ Suggested action: "Contact administrator"
        └─→ Cannot see or modify any settings
        └─→ Journey ends ❌
```

### Journey 3: Admin Executing FY Split

```
1. LOGIN & NAVIGATE
   └─→ Login as Admin
        └─→ Navigate to Settings
        └─→ Access granted ✅

2. SWITCH TO FY MANAGEMENT TAB
   └─→ Click "Financial Year Management" tab
        └─→ Tab switches
        └─→ See current FY info

3. REVIEW PENDING ITEMS
   └─→ View FY summary:
        ├─→ Current FY: 2024-2025
        ├─→ Days Remaining: 45 days
        ├─→ Pending Items:
             ├─→ Unpaid Invoices: 5 (₹2,50,000)
             ├─→ Due Commissions: 3 (₹50,000)
             ├─→ Open Disputes: 2
             └─→ Active Contracts: 8

4. INITIATE FY SPLIT
   └─→ Click "Execute FY Split" button
        └─→ Confirmation dialog opens
             ├─→ Shows migration summary
             ├─→ Warning: "Cannot be undone"
             └─→ User reviews details

5. CONFIRM SPLIT
   └─→ Click "Confirm Split"
        └─→ Processing...
             ├─→ Close FY 2024-2025
             ├─→ Create FY 2025-2026
             ├─→ Migrate 5 invoices
             ├─→ Migrate 3 commissions
             ├─→ Migrate 2 disputes
             ├─→ Migrate 8 contracts
             └─→ Generate summary report

6. VIEW RESULTS
   └─→ Success message displayed
        ├─→ From FY: 2024-2025 (CLOSED)
        ├─→ To FY: 2025-2026 (ACTIVE)
        ├─→ Executed by: Admin
        ├─→ Items migrated: 18
        └─→ Split completed ✅
```

## Component Interaction Map

```
┌─────────────────────────────────────────────────────────────┐
│                        Settings.tsx                          │
│                                                              │
│  Props Received:                                            │
│    - currentUser: User                                      │
│    - addAuditLog: (log) => void                            │
│                                                              │
│  Props Passed Down:                                         │
│    ↓                                                         │
│    └─→ To all Management Components:                       │
│         - initialData: T[]                                  │
│         - currentUser: User                                 │
│         - addAuditLog: Function                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              Management Component (e.g., MasterData)         │
│                                                              │
│  Props Received:                                            │
│    - initialData: T[]                                       │
│    - currentUser: User                                      │
│    - addAuditLog: Function                                 │
│                                                              │
│  State:                                                      │
│    - items: T[]                                             │
│    - isModalOpen: boolean                                   │
│    - editingItem: T | null                                  │
│                                                              │
│  Handlers:                                                   │
│    - handleOpenModal(item?)                                 │
│    - handleCloseModal()                                     │
│    - handleSave(data)                                       │
│    - handleDelete(item)                                     │
│                                                              │
│  Props Passed Down:                                         │
│    ↓                                                         │
│    └─→ To Form Component:                                  │
│         - item: T | null                                    │
│         - onSave: (data) => void                           │
│         - onCancel: () => void                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Form Component                             │
│                                                              │
│  Props Received:                                            │
│    - item: T | null (null = new, T = edit)                 │
│    - onSave: Function                                       │
│    - onCancel: Function                                     │
│                                                              │
│  State:                                                      │
│    - formData: T (controlled inputs)                        │
│    - errors: ValidationErrors                               │
│                                                              │
│  Methods:                                                    │
│    - handleChange(field, value)                             │
│    - handleSubmit()                                         │
│    - validate()                                             │
│                                                              │
│  Calls Up:                                                   │
│    - onSave(formData) on successful submit                 │
│    - onCancel() on cancel/close                            │
└─────────────────────────────────────────────────────────────┘
```

## Responsive Layout Visualization

### Desktop View (≥1024px)

```
┌────────────────────────────────────────────────────────────────┐
│  Header: Settings & Master Data                               │
├────────────────────────────────────────────────────────────────┤
│  Tabs: [Master Data Management] [FY Management]               │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────────────────────────┐    │
│  │           Organizations (Full Width)                  │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                                │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐                │
│  │Trade Types│  │Bargain    │  │Varieties  │                │
│  │           │  │Types      │  │           │                │
│  └───────────┘  └───────────┘  └───────────┘                │
│                                                                │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐                │
│  │Dispute    │  │Weightment │  │Passing    │                │
│  │Reasons    │  │Terms      │  │Terms      │                │
│  └───────────┘  └───────────┘  └───────────┘                │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              GST Rates (Full Width)                   │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                                │
│  ┌─────────────────────────┐  ┌─────────────────────────┐   │
│  │    Delivery Terms       │  │    Payment Terms        │   │
│  └─────────────────────────┘  └─────────────────────────┘   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Tablet View (768px - 1023px)

```
┌────────────────────────────────────────────────┐
│  Header: Settings & Master Data               │
├────────────────────────────────────────────────┤
│  Tabs: [Master Data] [FY Management]          │
├────────────────────────────────────────────────┤
│                                                │
│  ┌────────────────────────────────────────┐  │
│  │     Organizations (Full Width)         │  │
│  └────────────────────────────────────────┘  │
│                                                │
│  ┌──────────────┐  ┌──────────────┐          │
│  │Trade Types   │  │Bargain Types │          │
│  └──────────────┘  └──────────────┘          │
│                                                │
│  ┌──────────────┐  ┌──────────────┐          │
│  │Varieties     │  │Dispute       │          │
│  │              │  │Reasons       │          │
│  └──────────────┘  └──────────────┘          │
│                                                │
│  ┌────────────────────────────────────────┐  │
│  │        GST Rates (Full Width)          │  │
│  └────────────────────────────────────────┘  │
│                                                │
└────────────────────────────────────────────────┘
```

### Mobile View (<768px)

```
┌──────────────────────────┐
│  Settings & Master Data  │
├──────────────────────────┤
│  [Master] [FY Mgmt]      │
├──────────────────────────┤
│                          │
│  ┌──────────────────┐   │
│  │  Organizations   │   │
│  │  (Full Width)    │   │
│  └──────────────────┘   │
│                          │
│  ┌──────────────────┐   │
│  │  Trade Types     │   │
│  └──────────────────┘   │
│                          │
│  ┌──────────────────┐   │
│  │  Bargain Types   │   │
│  └──────────────────┘   │
│                          │
│  ┌──────────────────┐   │
│  │  Varieties       │   │
│  └──────────────────┘   │
│                          │
│  ┌──────────────────┐   │
│  │  GST Rates       │   │
│  └──────────────────┘   │
│                          │
│  (Stack vertically)      │
│                          │
└──────────────────────────┘
```

## Summary

This visual guide provides a comprehensive overview of the Settings module architecture, including:

- **Component Hierarchy**: Clear parent-child relationships
- **Data Flow**: Step-by-step CRUD operations
- **Access Control**: Role-based authorization flow
- **State Management**: Component state patterns
- **User Journeys**: Real-world usage scenarios
- **Component Interactions**: Props and callbacks
- **Responsive Design**: Layout at different breakpoints

Use this guide in conjunction with:
- [SETTINGS_MODULE.md](./SETTINGS_MODULE.md) - Detailed documentation
- [SETTINGS_CODE_REVIEW.md](./SETTINGS_CODE_REVIEW.md) - Code quality analysis
- [SETTINGS_ACCESS_CONTROL.md](./SETTINGS_ACCESS_CONTROL.md) - Security details

---

**Version:** 1.0  
**Last Updated:** November 10, 2025  
**Maintainer:** Development Team
