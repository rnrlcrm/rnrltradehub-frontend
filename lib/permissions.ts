import { UserRole, Module, Permission, PermissionsMap } from '../types';

// Define permissions for each role and module
const permissionsMap: PermissionsMap = {
  Admin: {
    'Sales Contracts': ['create', 'read', 'update', 'delete', 'approve', 'share'],
    'Invoices': ['create', 'read', 'update', 'delete'],
    'Payments': ['create', 'read', 'update', 'delete'],
    'Disputes': ['create', 'read', 'update', 'delete'],
    'Commissions': ['create', 'read', 'update', 'delete'],
    'Vendors & Clients': ['create', 'read', 'update', 'delete'],
    'User Management': ['create', 'read', 'update', 'delete'],
    'Settings': ['create', 'read', 'update', 'delete'],
    'Reports': ['read'],
    'Audit Trail': ['read'],
    'Roles & Rights': ['create', 'read', 'update', 'delete'],
    'Grievance Officer': ['create', 'read', 'update', 'delete'],
    'Business Partner': ['create', 'read', 'update', 'delete', 'approve'],
  },
  Sales: {
    'Sales Contracts': ['create', 'read', 'update', 'share'],
    'Invoices': ['read'],
    'Payments': ['read'],
    'Disputes': ['read'],
    'Commissions': ['read'],
    'Vendors & Clients': ['read', 'update'],
    'Reports': ['read'],
    'Business Partner': ['create', 'read', 'update'],
  },
  Accounts: {
    'Sales Contracts': ['read'],
    'Invoices': ['create', 'read', 'update', 'delete'],
    'Payments': ['create', 'read', 'update', 'delete'],
    'Disputes': ['read'],
    'Commissions': ['create', 'read', 'update', 'delete'],
    'Vendors & Clients': ['read'],
    'Reports': ['read'],
    'Business Partner': ['read'],
  },
  'Dispute Manager': {
    'Sales Contracts': ['read'],
    'Disputes': ['create', 'read', 'update', 'delete'],
    'Reports': ['read'],
    'Business Partner': ['read'],
  },
  'Vendor/Client': {
    'Sales Contracts': ['read'],
    'Invoices': ['read'],
    'Payments': ['read'],
    'Disputes': ['create', 'read'],
    'Reports': ['read'],
    'Business Partner': ['read'],
  },
};

/**
 * Check if a user role has a specific permission for a module
 */
export const hasPermission = (
  role: UserRole,
  module: Module,
  permission: Permission
): boolean => {
  const rolePermissions = permissionsMap[role];
  if (!rolePermissions) return false;

  const modulePermissions = rolePermissions[module];
  if (!modulePermissions) return false;

  return modulePermissions.includes(permission);
};

/**
 * Get all permissions for a role and module
 */
export const getModulePermissions = (
  role: UserRole,
  module: Module
): Permission[] => {
  const rolePermissions = permissionsMap[role];
  if (!rolePermissions) return [];

  return rolePermissions[module] || [];
};

/**
 * Get all permissions for a role
 */
export const getRolePermissions = (role: UserRole): PermissionsMap[UserRole] => {
  return permissionsMap[role];
};

/**
 * Export the permissions map for display in the Roles & Rights page
 */
export const mockPermissions = permissionsMap;
