# Settings Module - Access Control Analysis

## Overview

This document provides a comprehensive analysis of access control mechanisms in the Settings module, including role-based access control (RBAC), permission checks, and security recommendations.

## Current Access Control Implementation

### Page-Level Access Control

**Location:** `/src/pages/Settings.tsx` (Lines 23-28)

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

### Access Control Matrix

| Role | Settings Page Access | Create | Edit | Delete | View |
|------|---------------------|--------|------|--------|------|
| **Admin** | ✅ Full Access | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Sales Manager** | ❌ Denied | ❌ No | ❌ No | ❌ No | ❌ No |
| **Account Manager** | ❌ Denied | ❌ No | ❌ No | ❌ No | ❌ No |
| **Auditor** | ❌ Denied | ❌ No | ❌ No | ❌ No | ❌ No |
| **Viewer** | ❌ Denied | ❌ No | ❌ No | ❌ No | ❌ No |

## User Roles Defined

### From `/src/data/mockData.ts`

```typescript
export const mockUsers: User[] = [
  {
    id: 1,
    name: 'Rajesh Kumar',
    email: 'rajesh@rnrl.com',
    role: 'Admin',
    department: 'Administration',
  },
  {
    id: 2,
    name: 'Priya Sharma',
    email: 'priya@rnrl.com',
    role: 'Sales Manager',
    department: 'Sales',
  },
  {
    id: 3,
    name: 'Amit Patel',
    email: 'amit@rnrl.com',
    role: 'Account Manager',
    department: 'Accounts',
  },
  {
    id: 4,
    name: 'Sanjay Gupta',
    email: 'sanjay@rnrl.com',
    role: 'Auditor',
    department: 'Compliance',
  },
  {
    id: 5,
    name: 'Neha Singh',
    email: 'neha@rnrl.com',
    role: 'Viewer',
    department: 'Management',
  },
];
```

## Access Control Flow

```
User Login
    ↓
User Object Loaded (with role)
    ↓
Navigate to Settings
    ↓
Settings Component Mounted
    ↓
Role Check: currentUser.role !== 'Admin'
    ↓
  Yes (Non-Admin)          No (Admin)
    ↓                         ↓
Access Denied Card       Full Settings Page
                              ↓
                         All CRUD Operations Available
```

## Security Analysis

### ✅ Strengths

1. **Early Access Check**
   - Access is checked immediately on component mount
   - Unauthorized users see clear denial message
   - No sensitive data is loaded for unauthorized users

2. **Clear Error Message**
   - Users understand why access is denied
   - Directs users to contact administrator

3. **Type-Safe Role Checking**
   - TypeScript ensures role is a string
   - Prevents runtime type errors

### ⚠️ Weaknesses

1. **Single Role-Based Control**
   - No granular permissions
   - All admins have full access
   - No differentiation between read and write

2. **Frontend-Only Enforcement**
   - Access control is only in UI
   - No backend validation mentioned
   - Could be bypassed with browser tools

3. **No Permission Hierarchy**
   - Binary access (all or nothing)
   - No role inheritance
   - No delegated admin roles

4. **No Audit of Access Attempts**
   - Denied access attempts are not logged
   - No security monitoring
   - Can't detect unauthorized access attempts

5. **No Time-Based Access**
   - No expiration of privileges
   - No temporary admin access
   - No session timeout handling

## Recommended Enhancements

### 1. Granular Permissions System

#### Define Permission Model

```typescript
// src/types.ts
export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
}

export interface Role {
  name: string;
  permissions: Permission[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  roles?: Role[]; // Support multiple roles
  customPermissions?: Permission[]; // User-specific overrides
}
```

#### Permission Checking Hook

```typescript
// src/hooks/usePermission.ts
import { useContext } from 'react';
import { UserContext } from '../contexts/UserContext';

export const usePermission = () => {
  const { currentUser } = useContext(UserContext);

  const hasPermission = (
    resource: string, 
    action: 'create' | 'read' | 'update' | 'delete'
  ): boolean => {
    if (!currentUser) return false;

    // Super admin has all permissions
    if (currentUser.role === 'Super Admin') return true;

    // Check role permissions
    const rolePermissions = currentUser.roles?.flatMap(r => r.permissions) || [];
    const hasRolePermission = rolePermissions.some(
      p => p.resource === resource && p.action === action
    );

    // Check custom permissions (overrides)
    const hasCustomPermission = currentUser.customPermissions?.some(
      p => p.resource === resource && p.action === action
    );

    return hasRolePermission || hasCustomPermission || false;
  };

  const canAccessSettings = () => hasPermission('settings', 'read');
  const canEditMasterData = () => hasPermission('master-data', 'update');
  const canDeleteOrganization = () => hasPermission('organization', 'delete');
  const canExecuteFYSplit = () => hasPermission('fy-split', 'create');

  return {
    hasPermission,
    canAccessSettings,
    canEditMasterData,
    canDeleteOrganization,
    canExecuteFYSplit,
  };
};
```

#### Usage in Components

```typescript
// Settings.tsx
import { usePermission } from '../hooks/usePermission';

const Settings: React.FC<SettingsProps> = ({ currentUser, addAuditLog }) => {
  const { canAccessSettings, canEditMasterData } = usePermission();

  if (!canAccessSettings()) {
    return (
      <Card title="Access Denied">
        <p className="text-red-600">
          You do not have permission to view this page.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Read-only view if can't edit */}
      {canEditMasterData() ? (
        <MasterDataManagement /* ... */ />
      ) : (
        <MasterDataViewer /* ... */ />
      )}
    </div>
  );
};
```

```typescript
// MasterDataManagement.tsx
import { usePermission } from '../../hooks/usePermission';

const MasterDataManagement: React.FC<Props> = ({ /* ... */ }) => {
  const { hasPermission } = usePermission();

  const canCreate = hasPermission('master-data', 'create');
  const canUpdate = hasPermission('master-data', 'update');
  const canDelete = hasPermission('master-data', 'delete');

  return (
    <Card 
      title={title} 
      actions={canCreate && <Button onClick={handleAdd}>Add New</Button>}
    >
      <Table data={items} columns={[
        { header: 'Name', accessor: 'name' },
        {
          header: 'Actions',
          accessor: (item) => (
            <div className="space-x-4">
              {canUpdate && (
                <button onClick={() => handleEdit(item)}>Edit</button>
              )}
              {canDelete && (
                <button onClick={() => handleDelete(item)}>Delete</button>
              )}
            </div>
          ),
        },
      ]} />
    </Card>
  );
};
```

### 2. Enhanced Role Definitions

```typescript
// src/data/roles.ts
export const ROLES = {
  SUPER_ADMIN: {
    name: 'Super Admin',
    description: 'Full system access',
    permissions: ['*:*'], // All resources, all actions
  },
  ADMIN: {
    name: 'Admin',
    description: 'Administrative access',
    permissions: [
      'settings:read',
      'settings:update',
      'master-data:*',
      'organization:*',
      'fy-split:create',
    ],
  },
  SETTINGS_MANAGER: {
    name: 'Settings Manager',
    description: 'Can manage settings but not execute FY split',
    permissions: [
      'settings:read',
      'settings:update',
      'master-data:*',
      'organization:read',
      'organization:update',
    ],
  },
  DATA_ENTRY: {
    name: 'Data Entry',
    description: 'Can add master data only',
    permissions: [
      'settings:read',
      'master-data:create',
      'master-data:read',
    ],
  },
  AUDITOR: {
    name: 'Auditor',
    description: 'Read-only access for audit',
    permissions: [
      'settings:read',
      'master-data:read',
      'organization:read',
      'audit-log:read',
    ],
  },
  VIEWER: {
    name: 'Viewer',
    description: 'Read-only system access',
    permissions: [
      'settings:read',
    ],
  },
};
```

### 3. Access Attempt Logging

```typescript
// src/utils/accessControl.ts
export const logAccessAttempt = (
  user: User,
  resource: string,
  action: string,
  granted: boolean
) => {
  const log = {
    timestamp: new Date().toISOString(),
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    resource,
    action,
    granted,
    ipAddress: window.location.hostname, // In real app, get from backend
  };

  // Send to backend audit service
  console.log('Access Attempt:', log);

  // In production, send to API
  // api.post('/audit/access', log);

  return log;
};
```

```typescript
// Usage in Settings.tsx
import { logAccessAttempt } from '../utils/accessControl';

const Settings: React.FC<SettingsProps> = ({ currentUser }) => {
  const hasAccess = currentUser.role === 'Admin';

  useEffect(() => {
    logAccessAttempt(
      currentUser,
      'settings',
      'read',
      hasAccess
    );
  }, [currentUser, hasAccess]);

  if (!hasAccess) {
    return <AccessDenied />;
  }

  // ... rest of component
};
```

### 4. Field-Level Access Control

```typescript
// src/components/forms/OrganizationForm.tsx
import { usePermission } from '../../hooks/usePermission';

const OrganizationForm: React.FC<Props> = ({ organization }) => {
  const { hasPermission } = usePermission();

  const canEditFinancials = hasPermission('organization.financials', 'update');
  const canEditBankDetails = hasPermission('organization.bank', 'update');

  return (
    <form>
      <Input label="Name" {...register('name')} />
      <Input label="Code" {...register('code')} />
      
      {/* Conditional field access */}
      {canEditFinancials && (
        <>
          <Input label="GSTIN" {...register('gstin')} />
          <Input label="PAN" {...register('pan')} />
        </>
      )}

      {canEditBankDetails && (
        <fieldset>
          <legend>Bank Details</legend>
          <Input label="Bank Name" {...register('bankName')} />
          <Input label="Account Number" {...register('accountNumber')} />
          <Input label="IFSC" {...register('ifsc')} />
        </fieldset>
      )}
    </form>
  );
};
```

### 5. Backend API Integration

```typescript
// src/api/accessControl.ts
export const checkPermission = async (
  userId: number,
  resource: string,
  action: string
): Promise<boolean> => {
  try {
    const response = await fetch('/api/access-control/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, resource, action }),
    });

    const { granted } = await response.json();
    return granted;
  } catch (error) {
    console.error('Permission check failed:', error);
    return false; // Fail closed
  }
};
```

```typescript
// Usage in components
const Settings: React.FC<SettingsProps> = ({ currentUser }) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      const granted = await checkPermission(
        currentUser.id,
        'settings',
        'read'
      );
      setHasAccess(granted);
      setIsLoading(false);
    };

    checkAccess();
  }, [currentUser.id]);

  if (isLoading) return <LoadingSpinner />;
  if (!hasAccess) return <AccessDenied />;

  return <SettingsContent />;
};
```

### 6. Session-Based Access Control

```typescript
// src/contexts/AuthContext.tsx
interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  sessionExpiry: Date | null;
  login: (user: User) => void;
  logout: () => void;
  refreshSession: () => void;
}

export const AuthProvider: React.FC = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sessionExpiry, setSessionExpiry] = useState<Date | null>(null);

  // Check session expiry
  useEffect(() => {
    const checkSession = setInterval(() => {
      if (sessionExpiry && new Date() > sessionExpiry) {
        logout();
        alert('Your session has expired. Please log in again.');
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkSession);
  }, [sessionExpiry]);

  const login = (user: User) => {
    setCurrentUser(user);
    // Set session to expire in 8 hours
    setSessionExpiry(new Date(Date.now() + 8 * 60 * 60 * 1000));
  };

  const logout = () => {
    setCurrentUser(null);
    setSessionExpiry(null);
    localStorage.removeItem('currentUser');
  };

  const refreshSession = () => {
    setSessionExpiry(new Date(Date.now() + 8 * 60 * 60 * 1000));
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthenticated: !!currentUser,
      sessionExpiry,
      login,
      logout,
      refreshSession,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

## Access Control Best Practices

### 1. Defense in Depth
- ✅ Frontend checks for UX
- ✅ Backend validation for security
- ✅ Database constraints for integrity

### 2. Principle of Least Privilege
- ✅ Users get minimum permissions needed
- ✅ Admin access is time-limited
- ✅ Critical operations require re-authentication

### 3. Fail Closed
```typescript
// Always default to denying access
const hasPermission = (resource: string, action: string): boolean => {
  try {
    // Check permissions
    return checkPermissions(resource, action);
  } catch (error) {
    console.error('Permission check failed:', error);
    return false; // Deny access on error
  }
};
```

### 4. Audit Everything
```typescript
// Log all access attempts, granted or denied
const trackAccess = (resource: string, action: string, granted: boolean) => {
  logAccessAttempt(currentUser, resource, action, granted);
  
  if (!granted) {
    // Alert on repeated denied attempts
    checkForBruteForce(currentUser.id, resource);
  }
};
```

### 5. Regular Access Reviews
```typescript
// Automated access review reporting
export const generateAccessReport = async (): Promise<AccessReport> => {
  const users = await fetchAllUsers();
  const permissions = await fetchAllPermissions();
  
  return {
    timestamp: new Date(),
    totalUsers: users.length,
    adminUsers: users.filter(u => u.role === 'Admin'),
    unusedPermissions: findUnusedPermissions(permissions),
    recommendations: generateRecommendations(users, permissions),
  };
};
```

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Define permission model and types
- [ ] Create usePermission hook
- [ ] Implement basic permission checking
- [ ] Add access attempt logging

### Phase 2: Component Integration (Week 2)
- [ ] Update Settings page with granular permissions
- [ ] Add permission checks to all management components
- [ ] Implement field-level access control
- [ ] Update UI to show/hide based on permissions

### Phase 3: Backend Integration (Week 3)
- [ ] Create backend permission API
- [ ] Implement session management
- [ ] Add database-level constraints
- [ ] Create admin interface for permission management

### Phase 4: Monitoring & Reporting (Week 4)
- [ ] Set up access audit logging
- [ ] Create access reports dashboard
- [ ] Implement alerting for suspicious activity
- [ ] Document permission model

## Testing Access Control

### Unit Tests
```typescript
describe('usePermission', () => {
  it('grants access to admin for all resources', () => {
    const { hasPermission } = renderHook(() => usePermission(), {
      wrapper: ({ children }) => (
        <UserContext.Provider value={{ currentUser: adminUser }}>
          {children}
        </UserContext.Provider>
      ),
    });

    expect(hasPermission('settings', 'read')).toBe(true);
    expect(hasPermission('master-data', 'delete')).toBe(true);
  });

  it('denies access to viewer for create operations', () => {
    const { hasPermission } = renderHook(() => usePermission(), {
      wrapper: ({ children }) => (
        <UserContext.Provider value={{ currentUser: viewerUser }}>
          {children}
        </UserContext.Provider>
      ),
    });

    expect(hasPermission('master-data', 'create')).toBe(false);
    expect(hasPermission('master-data', 'read')).toBe(true);
  });
});
```

### Integration Tests
```typescript
describe('Settings Access Control', () => {
  it('shows full settings page to admin', async () => {
    render(<Settings currentUser={adminUser} />);
    expect(screen.getByText('Master Data Management')).toBeInTheDocument();
    expect(screen.getByText('Add New')).toBeInTheDocument();
  });

  it('shows access denied to non-admin', async () => {
    render(<Settings currentUser={viewerUser} />);
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.queryByText('Add New')).not.toBeInTheDocument();
  });
});
```

## Conclusion

The current access control implementation provides basic protection but should be enhanced with:

1. **Granular permissions** for fine-tuned access control
2. **Backend validation** for security
3. **Access logging** for audit and monitoring
4. **Session management** for time-limited access
5. **Field-level controls** for sensitive data

**Priority:** High - Implement enhanced access control before production deployment with real data.

---

**Document Version:** 1.0  
**Last Updated:** November 10, 2025  
**Next Review:** After implementing Phase 1 enhancements
