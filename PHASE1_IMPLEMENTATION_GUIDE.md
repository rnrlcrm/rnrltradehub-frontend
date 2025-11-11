# Phase 1 Implementation Guide: Multi-Tenant Portal Routing & Sub-User Management

**Status:** Ready for Implementation  
**Estimated Time:** 12-15 hours  
**Prerequisites:** Backend API endpoints from MULTI_TENANT_ACCESS_CONTROL.md implemented and accessible

---

## Overview

Phase 1 implements the frontend multi-tenant architecture with:
1. **Portal Routing** - Auto-detect user type and redirect to appropriate portal
2. **User Context** - Global user state with role and permissions
3. **"My Team" Management** - Sub-user management interface for Client/Vendor portals
4. **Sub-User Forms** - Add, edit, and manage sub-users (max 2 per primary user)
5. **Activity Logs** - View sub-user activity history
6. **Data Isolation** - Ensure users only see their own data

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Login (Auth)                     │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  User Context Provider │
        │  - userType            │
        │  - portal              │
        │  - isSubUser           │
        │  - parentUserId        │
        │  - permissions         │
        └───────────┬────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌────────────────┐    ┌────────────────┐
│  Back Office   │    │ Client/Vendor  │
│    Portal      │    │    Portal      │
│                │    │                │
│ - Dashboard    │    │ - My Contracts │
│ - Contracts    │    │ - My Team ✨   │
│ - Reports      │    │ - Documents    │
│ - Settings     │    │ - Support      │
│ - Analytics    │    │                │
└────────────────┘    └────────────────┘
```

---

## Implementation Steps

### Step 1: Create User Context (2 hours)

**File:** `src/contexts/UserContext.tsx`

```typescript
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/api/client';

export type UserType = 'admin' | 'sales' | 'finance' | 'client' | 'vendor';
export type Portal = 'back-office' | 'client' | 'vendor';

export interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  userType: UserType;
  portal: Portal;
  isSubUser: boolean;
  parentUserId?: string;
  permissions: Permission[];
  organizationId: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call backend API to get current user
      const response = await apiClient.get('/users/me');
      setUser(response.data);
    } catch (err) {
      setError(err as Error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('rnrl_auth_token');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('rnrl_auth_token');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <UserContext.Provider 
      value={{ 
        user, 
        loading, 
        error, 
        refreshUser: fetchUser,
        logout 
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
```

**Integration in App.tsx:**

```typescript
import { UserProvider } from '@/contexts/UserContext';

function App() {
  return (
    <UserProvider>
      <DialogProvider>
        <ErrorBoundary>
          {/* Your app content */}
        </ErrorBoundary>
      </DialogProvider>
    </UserProvider>
  );
}
```

---

### Step 2: Portal Routing (2 hours)

**File:** `src/components/PortalRouter.tsx`

```typescript
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { Spinner } from '@/components/Loading';

export function PortalRouter({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="large" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Auto-redirect based on portal
  const currentPath = window.location.pathname;
  
  if (user.portal === 'client' && !currentPath.startsWith('/client')) {
    return <Navigate to="/client/dashboard" replace />;
  }
  
  if (user.portal === 'vendor' && !currentPath.startsWith('/vendor')) {
    return <Navigate to="/vendor/dashboard" replace />;
  }
  
  if (user.portal === 'back-office' && (currentPath.startsWith('/client') || currentPath.startsWith('/vendor'))) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
```

**File:** `src/components/ProtectedRoute.tsx`

```typescript
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedPortals?: ('back-office' | 'client' | 'vendor')[];
  requiredPermission?: {
    resource: string;
    action: 'create' | 'read' | 'update' | 'delete';
  };
}

export function ProtectedRoute({ 
  children, 
  allowedPortals,
  requiredPermission 
}: ProtectedRouteProps) {
  const { user, loading } = useUser();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check portal access
  if (allowedPortals && !allowedPortals.includes(user.portal)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check permission
  if (requiredPermission) {
    const hasPermission = user.permissions.some(
      p => p.resource === requiredPermission.resource && 
           p.actions.includes(requiredPermission.action)
    );
    
    if (!hasPermission) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
}
```

---

### Step 3: "My Team" Management UI (4 hours)

**File:** `src/pages/MyTeam.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/Loading';
import { useDialog } from '@/components/dialogs/CustomDialogs';
import { SubUserForm } from '@/components/SubUserForm';
import { SubUserCard } from '@/components/SubUserCard';

interface SubUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  permissions: {
    canApprove: boolean;
    canEdit: boolean;
    canView: boolean;
  };
  createdAt: string;
  lastActive: string;
}

export function MyTeamPage() {
  const { user } = useUser();
  const { showDialog, showAlert } = useDialog();
  const [subUsers, setSubUsers] = useState<SubUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchSubUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/users/my-team');
      setSubUsers(response.data);
    } catch (error) {
      showAlert('Failed to load team members', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubUsers();
  }, []);

  const handleAddSubUser = async (data: any) => {
    try {
      await apiClient.post('/users/my-team', data);
      showAlert('Sub-user added successfully', 'success');
      setShowAddForm(false);
      fetchSubUsers();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to add sub-user';
      showAlert(message, 'error');
    }
  };

  const handleRemoveSubUser = async (subUserId: string) => {
    const confirmed = await showDialog(
      'Remove Team Member',
      'Are you sure you want to remove this team member? They will immediately lose access to the system.',
      'destructive'
    );

    if (confirmed) {
      try {
        await apiClient.delete(`/users/my-team/${subUserId}`);
        showAlert('Sub-user removed successfully', 'success');
        fetchSubUsers();
      } catch (error) {
        showAlert('Failed to remove sub-user', 'error');
      }
    }
  };

  const handleToggleStatus = async (subUserId: string, isActive: boolean) => {
    try {
      await apiClient.put(`/users/my-team/${subUserId}`, { isActive: !isActive });
      showAlert(`Sub-user ${!isActive ? 'activated' : 'deactivated'} successfully`, 'success');
      fetchSubUsers();
    } catch (error) {
      showAlert('Failed to update sub-user status', 'error');
    }
  };

  const canAddMore = subUsers.length < 2;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Team</h1>
        <p className="text-gray-600 mt-2">
          Manage your team members (Maximum 2 employees)
        </p>
      </div>

      {/* Add Sub-User Button */}
      <div className="mb-6">
        <Button
          onClick={() => setShowAddForm(true)}
          disabled={!canAddMore}
        >
          Add Team Member {!canAddMore && '(Limit Reached)'}
        </Button>
        {!canAddMore && (
          <p className="text-sm text-amber-600 mt-2">
            ⚠️ You have reached the maximum limit of 2 team members
          </p>
        )}
      </div>

      {/* Sub-User List */}
      {subUsers.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">No team members added yet</p>
          <p className="text-sm text-gray-500 mt-2">
            Add team members to delegate work and improve efficiency
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {subUsers.map((subUser) => (
            <SubUserCard
              key={subUser.id}
              subUser={subUser}
              onRemove={() => handleRemoveSubUser(subUser.id)}
              onToggleStatus={() => handleToggleStatus(subUser.id, subUser.isActive)}
            />
          ))}
        </div>
      )}

      {/* Add Sub-User Form Dialog */}
      {showAddForm && (
        <SubUserForm
          onSubmit={handleAddSubUser}
          onCancel={() => setShowAddForm(false)}
        />
      )}
    </div>
  );
}
```

**File:** `src/components/SubUserCard.tsx`

```typescript
import React from 'react';
import { Button } from '@/components/ui/button';

interface SubUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  permissions: {
    canApprove: boolean;
    canEdit: boolean;
    canView: boolean;
  };
  createdAt: string;
  lastActive: string;
}

interface SubUserCardProps {
  subUser: SubUser;
  onRemove: () => void;
  onToggleStatus: () => void;
}

export function SubUserCard({ subUser, onRemove, onToggleStatus }: SubUserCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">{subUser.name}</h3>
            {subUser.isActive ? (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                Active
              </span>
            ) : (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                Inactive
              </span>
            )}
          </div>
          
          <div className="mt-2 space-y-1 text-sm text-gray-600">
            <p>📧 {subUser.email}</p>
            <p>📱 {subUser.phone}</p>
            <p className="text-xs text-gray-500 mt-2">
              Last active: {new Date(subUser.lastActive).toLocaleDateString()}
            </p>
          </div>

          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Permissions:</p>
            <div className="flex gap-2">
              {subUser.permissions.canView && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                  👀 View
                </span>
              )}
              {subUser.permissions.canEdit && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                  ✏️ Edit
                </span>
              )}
              {subUser.permissions.canApprove && (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                  ✅ Approve
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleStatus}
          >
            {subUser.isActive ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onRemove}
          >
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

### Step 4: Sub-User Form (2 hours)

**File:** `src/components/SubUserForm.tsx`

```typescript
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

const subUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  permissions: z.object({
    canView: z.boolean().default(true),
    canEdit: z.boolean().default(false),
    canApprove: z.boolean().default(false),
  }),
});

type SubUserFormData = z.infer<typeof subUserSchema>;

interface SubUserFormProps {
  onSubmit: (data: SubUserFormData) => void;
  onCancel: () => void;
}

export function SubUserForm({ onSubmit, onCancel }: SubUserFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SubUserFormData>({
    resolver: zodResolver(subUserSchema),
    defaultValues: {
      permissions: {
        canView: true,
        canEdit: false,
        canApprove: false,
      },
    },
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Add Team Member</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <Input
              {...register('name')}
              placeholder="Enter full name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              {...register('email')}
              placeholder="email@example.com"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              An invitation email will be sent to this address
            </p>
          </div>

          {/* Phone Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <Input
              type="tel"
              {...register('phone')}
              placeholder="+91 1234567890"
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && (
              <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
            )}
          </div>

          {/* Permissions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Permissions
            </label>
            <div className="space-y-2 bg-gray-50 p-3 rounded">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('permissions.canView')}
                  disabled
                  className="rounded"
                />
                <span className="text-sm">View access (always enabled)</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('permissions.canEdit')}
                  className="rounded"
                />
                <span className="text-sm">Can edit contracts</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('permissions.canApprove')}
                  className="rounded"
                />
                <span className="text-sm">Can approve contracts</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Adding...' : 'Add Team Member'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

---

### Step 5: Activity Log Viewer (2 hours)

**File:** `src/components/ActivityLog.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';
import { Spinner } from '@/components/Loading';

interface Activity {
  id: string;
  subUserId: string;
  subUserName: string;
  action: string;
  resource: string;
  timestamp: string;
  details: string;
}

interface ActivityLogProps {
  subUserId?: string; // If provided, shows logs for specific sub-user
}

export function ActivityLog({ subUserId }: ActivityLogProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const url = subUserId 
          ? `/users/my-team/${subUserId}/activity`
          : `/users/my-team/activity`;
        const response = await apiClient.get(url);
        setActivities(response.data);
      } catch (error) {
        console.error('Failed to fetch activity logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [subUserId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Spinner />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">No activity logs found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Activity Log</h3>
      <div className="space-y-2">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="bg-white border border-gray-200 rounded-lg p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {activity.subUserName}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {activity.action} on {activity.resource}
                </p>
                {activity.details && (
                  <p className="text-xs text-gray-500 mt-1">
                    {activity.details}
                  </p>
                )}
              </div>
              <p className="text-xs text-gray-500 whitespace-nowrap ml-4">
                {new Date(activity.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### Step 6: Update Routing Configuration (1 hour)

**File:** Update `src/App.tsx` or routing configuration

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UserProvider } from '@/contexts/UserContext';
import { PortalRouter } from '@/components/PortalRouter';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { MyTeamPage } from '@/pages/MyTeam';

function App() {
  return (
    <UserProvider>
      <DialogProvider>
        <ErrorBoundary>
          <BrowserRouter>
            <PortalRouter>
              <Routes>
                {/* Client Portal Routes */}
                <Route path="/client">
                  <Route
                    path="dashboard"
                    element={
                      <ProtectedRoute allowedPortals={['client']}>
                        <ClientDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="my-team"
                    element={
                      <ProtectedRoute allowedPortals={['client']}>
                        <MyTeamPage />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                {/* Vendor Portal Routes */}
                <Route path="/vendor">
                  <Route
                    path="dashboard"
                    element={
                      <ProtectedRoute allowedPortals={['vendor']}>
                        <VendorDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="my-team"
                    element={
                      <ProtectedRoute allowedPortals={['vendor']}>
                        <MyTeamPage />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                {/* Back Office Portal Routes */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/settings" element={<Settings />} />
                
                {/* Other routes... */}
              </Routes>
            </PortalRouter>
          </BrowserRouter>
        </ErrorBoundary>
      </DialogProvider>
    </UserProvider>
  );
}
```

---

## API Integration Points

### Required Backend Endpoints

All endpoints use base URL: `http://localhost:8080/api/settings`

**1. Get Current User:**
```
GET /users/me

Response:
{
  "id": "user-123",
  "name": "John Doe",
  "email": "john@example.com",
  "userType": "client",
  "portal": "client",
  "isSubUser": false,
  "parentUserId": null,
  "permissions": [
    { "resource": "contracts", "actions": ["create", "read", "update"] }
  ],
  "organizationId": "org-456"
}
```

**2. List Sub-Users:**
```
GET /users/my-team

Response:
{
  "subUsers": [
    {
      "id": "sub-user-1",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "phone": "+91 9876543210",
      "isActive": true,
      "permissions": {
        "canApprove": false,
        "canEdit": true,
        "canView": true
      },
      "createdAt": "2024-01-15T10:00:00Z",
      "lastActive": "2024-01-20T14:30:00Z"
    }
  ],
  "count": 1,
  "limit": 2
}
```

**3. Add Sub-User:**
```
POST /users/my-team

Request:
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+91 9876543210",
  "permissions": {
    "canView": true,
    "canEdit": true,
    "canApprove": false
  }
}

Response:
{
  "id": "sub-user-1",
  "message": "Sub-user created successfully. Invitation email sent."
}
```

**4. Update Sub-User:**
```
PUT /users/my-team/:subUserId

Request:
{
  "isActive": false,
  "permissions": {
    "canApprove": true
  }
}
```

**5. Remove Sub-User:**
```
DELETE /users/my-team/:subUserId
```

**6. Get Activity Logs:**
```
GET /users/my-team/:subUserId/activity?limit=50

Response:
{
  "activities": [
    {
      "id": "activity-1",
      "subUserId": "sub-user-1",
      "subUserName": "Jane Smith",
      "action": "Updated",
      "resource": "Contract #12345",
      "timestamp": "2024-01-20T14:30:00Z",
      "details": "Changed delivery date"
    }
  ]
}
```

---

## Testing Checklist

### Unit Tests

- [ ] UserContext provides correct user data
- [ ] Portal routing redirects correctly based on userType
- [ ] ProtectedRoute blocks unauthorized access
- [ ] SubUserForm validates input correctly
- [ ] Activity log displays correctly

### Integration Tests

- [ ] User can add sub-user (max 2 limit enforced)
- [ ] User can deactivate/activate sub-user
- [ ] User can remove sub-user
- [ ] Sub-user receives invitation email
- [ ] Activity logs track all sub-user actions
- [ ] Data isolation works (users only see their data)

### E2E Tests

- [ ] Complete flow: Login → Add sub-user → Grant permissions → View activity
- [ ] Sub-user login and permission verification
- [ ] Parent user deactivation cascades to sub-users

---

## Security Considerations

1. **Row-Level Security (RLS):**
   - Backend must filter all queries by `userId` or `parentUserId`
   - Sub-users can only access data from their parent user's organization

2. **Permission Validation:**
   - All API requests must validate user permissions on backend
   - Frontend permission checks are for UX only, not security

3. **Audit Trail:**
   - All sub-user actions must be logged with attribution
   - Logs are immutable and timestamped

4. **Invitation Security:**
   - Email invitations should have expiry (24-48 hours)
   - One-time use token for account activation
   - Verify email ownership before activation

---

## Next Steps

1. **Verify Backend API:**
   - Test all endpoints with Postman/curl
   - Confirm data structures match specifications
   - Verify authentication and authorization

2. **Implement Frontend:**
   - Follow this guide step-by-step
   - Test each component in isolation
   - Build incrementally (Context → Routing → UI → Integration)

3. **Integration Testing:**
   - Test with real backend
   - Verify data isolation
   - Check error handling

4. **Production Deployment:**
   - Update environment variables
   - Enable monitoring and logging
   - Set up error tracking (Sentry, etc.)

---

## Estimated Timeline

| Task | Time | Dependencies |
|------|------|--------------|
| User Context | 2h | None |
| Portal Routing | 2h | User Context |
| Protected Routes | 1h | User Context |
| My Team Page | 2h | All above |
| Sub-User Card | 1h | My Team Page |
| Sub-User Form | 2h | My Team Page |
| Activity Log | 2h | My Team Page |
| Testing | 2h | All components |
| **Total** | **14h** | Sequential |

---

## Support & Resources

- **Specification:** MULTI_TENANT_ACCESS_CONTROL.md
- **API Client:** src/api/client.ts
- **Dialogs:** src/components/dialogs/CustomDialogs.tsx
- **Validation:** src/utils/validation.ts
- **Loading States:** src/components/Loading.tsx

---

**Status:** ✅ Ready for Implementation  
**Last Updated:** 2025-01-11

This guide provides everything needed to implement Phase 1 of the multi-tenant architecture. Follow the steps sequentially, test thoroughly, and integrate with the backend API when ready.
