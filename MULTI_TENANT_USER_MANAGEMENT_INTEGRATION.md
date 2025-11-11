# Multi-Tenant User Management - Backend API Integration

## Overview

This document describes the integration of the User Management frontend with the multi-tenant backend APIs.

## What Was Implemented

### 1. Updated Components

#### UserManagement.tsx (`src/pages/UserManagement.tsx`)
- **Replaced mock data** with real API calls using `multiTenantApi`
- **Added state management** for loading and error states
- **Integrated CRUD operations:**
  - `getAllUsers(filters)` - Fetch users with optional filters
  - `createUser(user)` - Create new user
  - `updateUser(userId, updates)` - Update existing user
  - `deleteUser(userId)` - Delete user
- **Added filtering:**
  - Filter by user type (back_office, client, vendor)
  - Filter by status (active, inactive)
- **Enhanced UI:**
  - Loading spinner while fetching data
  - Error message display
  - User type badges (Back Office, Client, Vendor)
  - Status badges (Active, Inactive, Suspended)
  - Sub-user indicator badge

#### UserForm.tsx (`src/components/forms/UserForm.tsx`)
- **Updated to use multi-tenant User type** from `types/multiTenant`
- **Added new fields:**
  - User Type dropdown (back_office, client, vendor)
  - Status dropdown (active, inactive, suspended)
  - Made role optional (for client/vendor users who may not have roles)
- **Type safety improvements:**
  - Created `UserWithCustomPermissions` interface
  - Removed all `any` types
  - Proper TypeScript typing throughout

### 2. API Integration

The components now call these backend endpoints:

```typescript
// List users with optional filters
GET /api/settings/users?userType=back_office&isActive=true

// Create a new user
POST /api/settings/users
Body: {
  name: string,
  email: string,
  userType: 'back_office' | 'client' | 'vendor',
  status: 'active' | 'inactive' | 'suspended',
  role?: string,
  portal: string,
  isSubUser: boolean,
  isVerified: boolean
}

// Update a user
PUT /api/settings/users/:id
Body: Partial<User>

// Delete a user
DELETE /api/settings/users/:id
```

### 3. Features

#### User Listing
- Displays all users from the backend
- Shows user type, role, status
- Indicates sub-users with badge
- Shows custom permissions indicator

#### User Filtering
- Filter by user type (Back Office, Client, Vendor)
- Filter by status (Active, Inactive)
- Filters applied automatically when changed

#### User Creation
- Add new users via modal form
- Select user type, set status
- Assign role (optional for client/vendor)
- Set custom permissions (optional)

#### User Editing
- Update existing user details
- Change status (activate/deactivate)
- Modify permissions

#### User Deletion
- Delete users with confirmation
- Prevents deleting current user

## How to Test

### Prerequisites
1. Backend API must be running with the multi-tenant user endpoints
2. Backend should have authentication middleware
3. Admin user should be logged in

### Test Cases

#### 1. List Users
**Steps:**
1. Navigate to Settings → Access Control → User Management
2. Users should be fetched from backend and displayed

**Expected:**
- Loading spinner appears briefly
- User table populates with data from backend
- User type, role, and status badges display correctly

#### 2. Filter Users
**Steps:**
1. Select "Back Office" from User Type filter
2. Only back office users should display

**Expected:**
- API called with `?userType=back_office`
- Table updates to show only back office users

#### 3. Create User
**Steps:**
1. Click "Add User" button
2. Fill in form:
   - Name: "Test User"
   - Email: "test@example.com"
   - User Type: "Back Office"
   - Status: "Active"
   - Role: "Sales"
3. Click "Save User"

**Expected:**
- API POST call to `/api/settings/users`
- Modal closes
- User list refreshes
- New user appears in table

#### 4. Edit User
**Steps:**
1. Click "Edit" on any user
2. Change status to "Inactive"
3. Click "Save User"

**Expected:**
- API PUT call to `/api/settings/users/:id`
- Modal closes
- User list refreshes
- User status updated in table

#### 5. Delete User
**Steps:**
1. Click "Delete" on any user (not current user)
2. Confirm deletion

**Expected:**
- Confirmation dialog appears
- API DELETE call to `/api/settings/users/:id`
- User list refreshes
- User removed from table

#### 6. Error Handling
**Steps:**
1. Stop backend server
2. Try to load users

**Expected:**
- Error message displays: "Failed to fetch users"
- No crash or blank screen

### API Response Examples

#### Success Response
```json
{
  "success": true,
  "data": [
    {
      "id": "user-123",
      "email": "admin@example.com",
      "name": "Admin User",
      "userType": "back_office",
      "portal": "back_office",
      "isSubUser": false,
      "status": "active",
      "isVerified": true,
      "role": "Admin",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Error Response
```json
{
  "success": false,
  "message": "Unauthorized",
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing authentication token"
  }
}
```

## Type Definitions

### Multi-Tenant User Type
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  
  // User Type & Portal
  userType: 'back_office' | 'client' | 'vendor';
  portal: 'back_office' | 'client' | 'vendor';
  
  // Sub-User Support
  isSubUser: boolean;
  parentUserId?: string;
  
  // Affiliation
  clientId?: string;
  vendorId?: string;
  
  // Role (for back office only)
  roleId?: string;
  role?: string;
  permissions?: string[];
  
  // Status
  status: 'active' | 'inactive' | 'suspended';
  isVerified: boolean;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}
```

## Compatibility

The implementation maintains backward compatibility:
- Accepts both old `User` type and new `MultiTenantUser` type for `currentUser` prop
- Custom permissions stored as optional field, not breaking existing functionality
- Graceful error handling for API failures

## Next Steps

To complete the integration:

1. **Backend Implementation:**
   - Ensure all 4 endpoints are implemented
   - Add proper authentication/authorization
   - Implement filtering logic
   - Add validation

2. **Testing:**
   - Test with real backend
   - Verify all CRUD operations work
   - Test error scenarios
   - Verify filters work correctly

3. **Enhancement Opportunities:**
   - Add pagination for large user lists
   - Add search by name/email
   - Add bulk operations
   - Add user import/export

## Files Changed

- `src/pages/UserManagement.tsx` - Main component with API integration
- `src/components/forms/UserForm.tsx` - Form component updated for new User type
- `MULTI_TENANT_USER_MANAGEMENT_INTEGRATION.md` - This documentation

## Support

For questions or issues:
1. Check the `MULTI_TENANT_ACCESS_CONTROL.md` for overall architecture
2. Check the `BACKEND_API_REQUIREMENTS.md` for API specifications
3. Review type definitions in `src/types/multiTenant.ts`
