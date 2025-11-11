# Settings Module Implementation Guide

## Overview

This document provides comprehensive implementation guidance for integrating all the enhancements into the Settings module, including both frontend implementation and backend API requirements.

## ✅ Completed (Foundation Layer)

The following foundational components have been implemented:

1. **API Client** (`src/api/client.ts`, `src/api/settingsApi.ts`)
2. **Custom Dialogs** (`src/components/dialogs/CustomDialogs.tsx`)
3. **Error Boundaries** (`src/components/ErrorBoundary.tsx`)
4. **Loading Components** (`src/components/Loading.tsx`)
5. **Validation Utilities** (`src/utils/validation.ts`)
6. **ID Generation** (`src/utils/idGenerator.ts`)
7. **Zod Schemas** (`src/schemas/settingsSchemas.ts`)

## 🚀 Implementation Steps

### Phase 1: Application Setup (20 minutes)

#### 1.1 Wrap App with Providers

**File:** `src/index.tsx` or `src/App.tsx`

```typescript
import { DialogProvider } from './components/dialogs/CustomDialogs';
import ErrorBoundary from './components/ErrorBoundary';

// In your root component
<ErrorBoundary>
  <DialogProvider>
    <App />
  </DialogProvider>
</ErrorBoundary>
```

#### 1.2 Create Environment Configuration

**File:** `.env` (create in root)

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api
VITE_USE_MOCK_API=true

# For production, set:
# VITE_USE_MOCK_API=false
```

### Phase 2: Update Master Data Management (30 minutes)

**File:** `src/components/forms/MasterDataManagement.tsx`

#### Before:
```typescript
const [items, setItems] = useState<MasterDataItem[]>(initialData);
const [isModalOpen, setIsModalOpen] = useState(false);

const handleSave = (name: string) => {
  if (editingItem) {
    const updatedItems = items.map(item => 
      item.id === editingItem.id ? { ...item, name } : item
    );
    setItems(updatedItems);
  } else {
    const newItem: MasterDataItem = { id: Date.now(), name };
    setItems([newItem, ...items]);
  }
  handleCloseModal();
};

const handleDelete = (item: MasterDataItem) => {
  if (window.confirm(`Are you sure...`)) {
    setItems(items.filter(i => i.id !== item.id));
  }
};
```

#### After:
```typescript
import { useState, useEffect } from 'react';
import { masterDataApi, MasterDataType } from '../../api/settingsApi';
import { useDialog } from '../dialogs/CustomDialogs';
import { Spinner } from '../Loading';
import { isDuplicateName } from '../../utils/validation';

// Add type prop to convert title to API type
const getMasterDataType = (title: string): MasterDataType => {
  const typeMap: Record<string, MasterDataType> = {
    'Trade Types': 'trade-types',
    'Bargain Types': 'bargain-types',
    'Varieties': 'varieties',
    'Dispute Reasons': 'dispute-reasons',
    'Weightment Terms': 'weightment-terms',
    'Passing Terms': 'passing-terms',
    'Financial Years': 'financial-years',
  };
  return typeMap[title] || 'trade-types';
};

const MasterDataManagement: React.FC<Props> = ({ title, currentUser, addAuditLog }) => {
  const [items, setItems] = useState<MasterDataItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterDataItem | null>(null);
  const { showAlert, showConfirm } = useDialog();
  
  const dataType = getMasterDataType(title);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const response = await masterDataApi.getAll(dataType);
      setItems(response.data);
    } catch (error) {
      await showAlert('Error', `Failed to load ${title}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (name: string) => {
    // Duplicate check
    if (isDuplicateName(items, name, editingItem?.id)) {
      await showAlert('Duplicate Entry', `An item with the name "${name}" already exists.`);
      return;
    }

    try {
      setIsSaving(true);
      
      if (editingItem) {
        const response = await masterDataApi.update(dataType, editingItem.id, { name });
        setItems(items.map(item => item.id === editingItem.id ? response.data : item));
        addAuditLog({ 
          user: currentUser.name, 
          role: currentUser.role, 
          action: 'Update', 
          module: 'Settings', 
          details: `Updated ${title.slice(0, -1)}: '${editingItem.name}' to '${name}'`, 
          reason: 'Master data management' 
        });
      } else {
        const response = await masterDataApi.create(dataType, { name });
        setItems([response.data, ...items]);
        addAuditLog({ 
          user: currentUser.name, 
          role: currentUser.role, 
          action: 'Create', 
          module: 'Settings', 
          details: `Created new ${title.slice(0, -1)}: '${name}'`, 
          reason: 'Master data management' 
        });
      }
      
      handleCloseModal();
      await showAlert('Success', response.message || 'Operation completed successfully');
    } catch (error: any) {
      await showAlert('Error', error.message || 'Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item: MasterDataItem) => {
    const confirmed = await showConfirm(
      'Confirm Delete',
      `Are you sure you want to delete '${item.name}'? This action cannot be undone.`,
      { variant: 'destructive', confirmText: 'Delete' }
    );

    if (!confirmed) return;

    try {
      await masterDataApi.delete(dataType, item.id);
      setItems(items.filter(i => i.id !== item.id));
      addAuditLog({ 
        user: currentUser.name, 
        role: currentUser.role, 
        action: 'Delete', 
        module: 'Settings', 
        details: `Deleted ${title.slice(0, -1)}: '${item.name}'`, 
        reason: 'Master data management' 
      });
      await showAlert('Success', 'Item deleted successfully');
    } catch (error: any) {
      await showAlert('Error', error.message || 'Failed to delete. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <Card title={title}>
        <div className="flex justify-center items-center h-40">
          <Spinner size="lg" />
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card title={title} actions={
        <Button onClick={() => handleOpenModal()} disabled={isSaving}>
          Add New
        </Button>
      }>
        {/* Table rendering... */}
      </Card>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingItem ? `Edit ${title.slice(0, -1)}` : `Add New ${title.slice(0, -1)}`}>
        <MasterDataForm
          item={editingItem}
          onSave={handleSave}
          onCancel={handleCloseModal}
          items={items}
          isSaving={isSaving}
        />
      </Modal>
    </>
  );
};
```

### Phase 3: Update Master Data Form with Validation (20 minutes)

**File:** `src/components/forms/MasterDataForm.tsx`

#### Before:
```typescript
const MasterDataForm: React.FC<Props> = ({ item, onSave, onCancel }) => {
  const [name, setName] = useState(item?.name || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Name is required');
      return;
    }
    onSave(name);
  };
  // ...
};
```

#### After:
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { masterDataSchema, withUniqueNameValidation } from '../../schemas/settingsSchemas';
import { LoadingButton } from '../Loading';

interface Props {
  item: MasterDataItem | null;
  items: MasterDataItem[];
  onSave: (name: string) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

const MasterDataForm: React.FC<Props> = ({ item, items, onSave, onCancel, isSaving }) => {
  const schema = withUniqueNameValidation(masterDataSchema, items, item?.id);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: item?.name || '',
    },
  });

  const onSubmit = (data: { name: string }) => {
    onSave(data.name);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          {...register('name')}
          type="text"
          className={`w-full px-3 py-2 border rounded-md ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter name"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded"
        >
          Cancel
        </button>
        <LoadingButton
          type="submit"
          loading={isSaving}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          Save
        </LoadingButton>
      </div>
    </form>
  );
};
```

### Phase 4: Similar Updates for Other Components

Apply the same pattern to:

1. **OrganizationManagement.tsx**
   - Use `organizationsApi`
   - Add loading states
   - Replace window.confirm with useDialog
   - Duplicate code checking

2. **GstRateManagement.tsx**
   - Use `gstRatesApi`
   - Add validation with `gstRateSchema`

3. **LocationManagement.tsx**
   - Use `locationsApi`
   - Add validation with `locationSchema`

4. **CommissionMasterManagement.tsx**
   - Use `commissionsApi`
   - Add validation with `commissionSchema`

5. **StructuredTermManagement.tsx**
   - Use `structuredTermsApi`
   - Add validation with `structuredTermSchema`

6. **CciTermManagement.tsx**
   - Use `cciTermsApi`
   - Add validation with `cciTermSchema`

### Phase 5: Update Settings Page (10 minutes)

**File:** `src/pages/Settings.tsx`

```typescript
import ErrorBoundary, { SettingsErrorFallback } from '../components/ErrorBoundary';
import { SettingsSkeleton } from '../components/Loading';

const Settings: React.FC<SettingsProps> = ({ currentUser, addAuditLog }) => {
  const [activeTab, setActiveTab] = useState<'master-data' | 'fy-management'>('master-data');

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

  return (
    <ErrorBoundary fallback={<SettingsErrorFallback />}>
      <div className="space-y-6">
        {/* Tab navigation... */}
        {/* Content... */}
      </div>
    </ErrorBoundary>
  );
};
```

## 🔧 Backend API Implementation Required

### Technology Stack (Recommended)

- **Runtime:** Node.js v18+ / Bun
- **Framework:** Express.js / Fastify / Hono
- **Database:** PostgreSQL / MongoDB
- **ORM:** Prisma / TypeORM / Mongoose
- **Validation:** Zod / Joi
- **Authentication:** JWT / Passport.js

### Database Schema

```sql
-- Organizations Table
CREATE TABLE organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  gstin VARCHAR(15) NOT NULL UNIQUE,
  pan VARCHAR(10) NOT NULL,
  address VARCHAR(200) NOT NULL,
  city VARCHAR(50) NOT NULL,
  state VARCHAR(50) NOT NULL,
  pincode VARCHAR(6) NOT NULL,
  phone VARCHAR(10) NOT NULL,
  email VARCHAR(100) NOT NULL,
  website VARCHAR(200),
  bank_name VARCHAR(100) NOT NULL,
  account_number VARCHAR(20) NOT NULL,
  ifsc_code VARCHAR(11) NOT NULL,
  branch VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Master Data Tables (generic pattern)
CREATE TABLE trade_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- (Repeat for bargain_types, varieties, dispute_reasons, etc.)

-- GST Rates Table
CREATE TABLE gst_rates (
  id SERIAL PRIMARY KEY,
  description VARCHAR(200) NOT NULL,
  hsn_code VARCHAR(8) NOT NULL,
  rate DECIMAL(5,2) NOT NULL CHECK (rate >= 0 AND rate <= 100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Locations Table
CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  country VARCHAR(50) NOT NULL,
  state VARCHAR(50) NOT NULL,
  city VARCHAR(50) NOT NULL,
  UNIQUE(country, state, city),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Commissions Table
CREATE TABLE commissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('PERCENTAGE', 'PER_BALE')),
  value DECIMAL(10,2) NOT NULL CHECK (value > 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CCI Terms Table (simplified)
CREATE TABLE cci_terms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  version INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  candy_factor DECIMAL(10,6) NOT NULL,
  gst_rate DECIMAL(5,2) NOT NULL,
  -- Add other CCI-specific fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Structured Terms Tables
CREATE TABLE delivery_terms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  days INTEGER NOT NULL CHECK (days >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payment_terms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  days INTEGER NOT NULL CHECK (days >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### API Endpoints Implementation Example

**File:** `backend/routes/settings.js` (Express.js example)

```javascript
const express = require('express');
const router = express.Router();
const { authenticateJWT, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { organizationSchema } = require('../schemas/settings');

// Middleware
router.use(authenticateJWT);
router.use(requireAdmin); // All settings routes require Admin role

// ============================================================================
// ORGANIZATIONS
// ============================================================================

router.get('/organizations', async (req, res) => {
  try {
    const organizations = await db.query(
      'SELECT * FROM organizations ORDER BY created_at DESC'
    );
    res.json({ success: true, data: organizations.rows });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch organizations' 
    });
  }
});

router.post('/organizations', validate(organizationSchema), async (req, res) => {
  try {
    const { name, code, gstin, pan, /* ... other fields */ } = req.body;
    
    // Check for duplicates
    const existing = await db.query(
      'SELECT id FROM organizations WHERE code = $1 OR gstin = $2',
      [code, gstin]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Organization with this code or GSTIN already exists'
      });
    }

    const result = await db.query(
      `INSERT INTO organizations 
       (name, code, gstin, pan, address, city, state, pincode, phone, email, 
        website, bank_name, account_number, ifsc_code, branch, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [name, code, gstin, pan, /* ... */]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Organization created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create organization'
    });
  }
});

router.put('/organizations/:id', validate(organizationSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const result = await db.query(
      `UPDATE organizations 
       SET name = $1, code = $2, /* ... */, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [updates.name, updates.code, /* ... */, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Organization updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update organization'
    });
  }
});

router.delete('/organizations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'DELETE FROM organizations WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    res.json({
      success: true,
      message: 'Organization deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete organization'
    });
  }
});

// ============================================================================
// MASTER DATA (Generic pattern)
// ============================================================================

const MASTER_DATA_TABLES = {
  'trade-types': 'trade_types',
  'bargain-types': 'bargain_types',
  'varieties': 'varieties',
  'dispute-reasons': 'dispute_reasons',
  'weightment-terms': 'weightment_terms',
  'passing-terms': 'passing_terms',
  'financial-years': 'financial_years',
};

router.get('/master-data/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const tableName = MASTER_DATA_TABLES[type];
    
    if (!tableName) {
      return res.status(400).json({
        success: false,
        message: 'Invalid master data type'
      });
    }

    const result = await db.query(
      `SELECT * FROM ${tableName} ORDER BY name ASC`
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch master data'
    });
  }
});

router.post('/master-data/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { name } = req.body;
    const tableName = MASTER_DATA_TABLES[type];
    
    if (!tableName) {
      return res.status(400).json({
        success: false,
        message: 'Invalid master data type'
      });
    }

    // Check for duplicate
    const existing = await db.query(
      `SELECT id FROM ${tableName} WHERE LOWER(name) = LOWER($1)`,
      [name]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Item with this name already exists'
      });
    }

    const result = await db.query(
      `INSERT INTO ${tableName} (name) VALUES ($1) RETURNING *`,
      [name]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Item created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create item'
    });
  }
});

// Similar patterns for PUT /master-data/:type/:id and DELETE /master-data/:type/:id

module.exports = router;
```

### Authentication Middleware Example

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

module.exports = { authenticateJWT, requireAdmin };
```

## 📋 Testing Checklist

### Frontend Testing

- [ ] API client connects successfully (mock mode)
- [ ] Loading states display correctly
- [ ] Error boundaries catch errors
- [ ] Custom dialogs replace window.alert/confirm
- [ ] Form validation shows appropriate errors
- [ ] Duplicate checking prevents duplicates
- [ ] UUID generation works
- [ ] All CRUD operations work in mock mode

### Integration Testing

- [ ] API client connects to backend
- [ ] Authentication tokens are sent correctly
- [ ] All API endpoints respond correctly
- [ ] Error handling works for network failures
- [ ] Loading states work with real API delays
- [ ] Data persists after refresh

### Backend Testing

- [ ] All endpoints return correct data format
- [ ] Authentication middleware blocks unauthorized access
- [ ] Admin role check works
- [ ] Input validation rejects invalid data
- [ ] Duplicate checking prevents duplicates
- [ ] Database constraints are enforced
- [ ] Error responses are consistent

## 🚀 Deployment Steps

### Frontend

1. Update `.env` for production:
   ```env
   VITE_API_BASE_URL=https://api.yourdomain.com/api
   VITE_USE_MOCK_API=false
   ```

2. Build production bundle:
   ```bash
   npm run build
   ```

3. Deploy to hosting (Vercel/Netlify/etc.)

### Backend

1. Set up production database
2. Run migrations
3. Configure environment variables
4. Deploy to hosting (AWS/Azure/Heroku/etc.)
5. Enable HTTPS
6. Set up CORS for frontend domain

## 📚 Additional Resources

- [React Hook Form Documentation](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)
- [Radix UI Documentation](https://www.radix-ui.com/)
- [Express.js Guide](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 🎯 Summary

This implementation guide provides everything needed to:

1. ✅ Remove data persistence gap (API client + backend)
2. ✅ Add comprehensive validation (Zod schemas + React Hook Form)
3. ✅ Replace native dialogs (Custom Dialog components)
4. ✅ Add error handling (Error Boundaries)
5. ✅ Add loading states (Loading components)
6. ✅ Fix ID generation (UUID)
7. ✅ Prevent duplicates (Validation utilities)

**Estimated Implementation Time:**
- Frontend integration: 4-6 hours
- Backend API: 8-12 hours
- Testing: 4-6 hours
- **Total: 16-24 hours**

Follow the phases in order for smooth implementation. Each phase builds on the previous one.

---

**Document Version:** 1.0  
**Last Updated:** November 10, 2025  
**Status:** Ready for Implementation
