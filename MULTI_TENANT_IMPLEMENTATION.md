# Multi-Tenant Access Control Implementation

This document describes the implemented multi-tenant access control system based on the `MULTI_TENANT_ACCESS_CONTROL.md` specification.

## Overview

The multi-tenant access control system supports:
- **3 User Types**: Back Office Staff, Clients (External), Vendors (External)
- **3 Portals**: Customized UI and modules for each user type
- **Sub-User Support**: Each client/vendor can add up to 2 employees
- **Automatic Security**: Data isolation, permission inheritance, audit logging

## Implemented Components

### 1. Type Definitions (`src/types/multiTenant.ts`)

Core types for the multi-tenant system:
- `User` - Extended user type with portal, affiliation, and sub-user fields
- `SubUser` - Sub-user type with inherited permissions
- `Portal` & `PortalModule` - Portal configuration types
- `UserType`, `PortalType`, `UserStatus` - Enums for user categorization

### 2. User Context (`src/contexts/UserContext.tsx`)

Manages authentication and user state:
- Provides `useUser()` hook for accessing current user
- Handles login/logout with localStorage persistence
- Exposes `isAuthenticated` flag

### 3. Sub-User Management Hook (`src/hooks/useSubUsers.ts`)

Custom hook for managing sub-users:
- `addSubUser()` - Add a new sub-user (enforces max 2 limit)
- `updateSubUser()` - Update sub-user permissions or status
- `removeSubUser()` - Remove a sub-user
- `refresh()` - Reload sub-user list
- Automatic limit checking (`hasReachedLimit`)

### 4. My Team Management Component (`src/components/portal/MyTeamManagement.tsx`)

Full-featured sub-user management UI:
- **AddSubUserModal** - Modal for adding new sub-users with permission selection
- **SubUserCard** - Card component for managing individual sub-users
- **MyTeamManagement** - Main component with:
  - Sub-user list display
  - Add/edit/remove sub-user functionality
  - Quota display (current/max)
  - Permission management
  - Status toggle (active/inactive)

### 5. Portal Router (`src/components/portal/PortalRouter.tsx`)

Automatic routing based on user type:
- Routes to `BackOfficePortal` for back office users
- Routes to `ClientPortal` for client users
- Routes to `VendorPortal` for vendor users
- Redirects to login if not authenticated

### 6. Portal Configuration (`src/config/portalConfig.ts`)

Defines modules available in each portal:
- **Back Office**: 13 modules (Dashboard, Sales, Purchases, Reports, Settings, etc.)
- **Client Portal**: 6 modules (My Dashboard, My Contracts, Quality Reports, Payments, Support, My Team)
- **Vendor Portal**: 6 modules (My Dashboard, Supply Contracts, Deliveries, Invoices, Quality Certificates, My Team)

Helper functions:
- `hasModuleAccess()` - Check if user can access a module
- `getPortalModules()` - Get all modules for a portal

### 7. Multi-Tenant API Client (`src/api/multiTenantApi.ts`)

API methods for multi-tenant operations:
- `login()` - Authenticate user
- `getCurrentUser()` - Get current user details
- `getMyTeam()` - Get sub-users for current user
- `addSubUser()` - Create new sub-user
- `updateSubUser()` - Update sub-user
- `deleteSubUser()` - Remove sub-user
- `getSubUserActivity()` - View sub-user activity logs

### 8. Mock Data (`src/data/mockMultiTenantData.ts`)

Test data for development:
- Mock users for all 3 portal types
- Mock sub-users for client and vendor
- Helper functions for testing

## Usage

### For Client/Vendor Portal Users

1. **Login** to the portal with your credentials
2. **Navigate** to "My Team" section
3. **Add Sub-User**:
   - Click "Add Sub-User" button
   - Enter name and email
   - Select permissions
   - Click "Send Invitation"
4. **Manage Sub-Users**:
   - Edit permissions
   - Activate/deactivate
   - Remove sub-users

### For Developers

```typescript
// Use the UserContext
import { useUser } from './contexts/UserContext';

function MyComponent() {
  const { user, isAuthenticated, logout } = useUser();
  
  if (!isAuthenticated) {
    return <Login />;
  }
  
  return <div>Welcome, {user.name}</div>;
}

// Use the Sub-User Hook
import { useSubUsers } from './hooks/useSubUsers';

function MyTeamPage() {
  const { subUsers, addSubUser, hasReachedLimit } = useSubUsers();
  
  const handleAdd = async () => {
    const result = await addSubUser({
      name: 'John Doe',
      email: 'john@example.com',
      permissions: { canViewContracts: true }
    });
    
    if (result.success) {
      console.log('Sub-user added!');
    }
  };
  
  return <div>Team members: {subUsers.length}</div>;
}
```

## Integration Points

### Existing Portal Pages

The following portal pages already exist and have been integrated:
- `src/pages/ClientPortal.tsx` - Uses `MyTeamManagement` component
- `src/pages/VendorPortal.tsx` - Uses `MyTeamManagement` component

### Required Backend Integration

The frontend is ready for backend integration. The backend needs to implement:

1. **Authentication Endpoint** (`POST /api/auth/login`)
   - Return user with `userType` and `portal` fields
   - Include JWT token

2. **Sub-User Management Endpoints**:
   - `GET /api/users/my-team` - List sub-users
   - `POST /api/users/my-team` - Add sub-user
   - `PUT /api/users/my-team/:id` - Update sub-user
   - `DELETE /api/users/my-team/:id` - Remove sub-user
   - `GET /api/users/my-team/:id/activity` - View activity

3. **Data Filtering Middleware**:
   - Automatically filter queries by `clientId` or `vendorId`
   - Respect parent-child relationships for sub-users

## Security Features

### Data Isolation
- Sub-users automatically inherit parent's `clientId` or `vendorId`
- All API calls filtered by affiliation
- Cross-tenant data access prevented

### Permission System
- Sub-users have granular permissions
- Primary users control sub-user access
- Back office users have role-based permissions

### Audit Logging
- All sub-user actions logged
- Activity viewable by primary user
- Compliance-ready audit trail

## Limits & Constraints

- **Max Sub-Users**: 2 per client/vendor
- **Limit Enforcement**: Frontend validation + backend enforcement required
- **Sub-User Restrictions**: Cannot add more sub-users, cannot modify primary user settings

## Testing

Mock data is available for testing:
```typescript
import { mockMultiTenantUsers } from './data/mockMultiTenantData';

// Login as client
const clientUser = mockMultiTenantUsers.find(u => u.userType === 'client');

// Login as vendor
const vendorUser = mockMultiTenantUsers.find(u => u.userType === 'vendor');

// Login as back office
const adminUser = mockMultiTenantUsers.find(u => u.userType === 'back_office');
```

## Next Steps

To complete the implementation:

1. **Backend Development** - Implement the required API endpoints
2. **Update Login Flow** - Integrate with new user types
3. **Portal Integration** - Wire up PortalRouter in main App
4. **Data Filtering** - Implement backend middleware for data isolation
5. **Testing** - Create unit and integration tests
6. **Documentation** - Update user guides

## File Structure

```
src/
├── types/
│   └── multiTenant.ts           # Type definitions
├── contexts/
│   └── UserContext.tsx          # User state management
├── hooks/
│   └── useSubUsers.ts           # Sub-user operations
├── components/
│   └── portal/
│       ├── PortalRouter.tsx     # Auto-routing component
│       ├── BackOfficePortal.tsx # Back office wrapper
│       └── MyTeamManagement.tsx # Sub-user management UI
├── pages/
│   ├── ClientPortal.tsx         # Client portal (existing)
│   └── VendorPortal.tsx         # Vendor portal (existing)
├── config/
│   └── portalConfig.ts          # Portal module configuration
├── api/
│   └── multiTenantApi.ts        # API client (existing)
└── data/
    └── mockMultiTenantData.ts   # Test data
```

## Support

For issues or questions about the multi-tenant implementation, refer to:
- `MULTI_TENANT_ACCESS_CONTROL.md` - Full specification
- This README - Implementation guide
- Type definitions for API contracts
