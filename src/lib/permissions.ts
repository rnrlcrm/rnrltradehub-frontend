
import { UserRole, Module, Permission, PermissionsMap } from '../types';

export const mockPermissions: PermissionsMap = {
  'Admin': {
    'Sales Contracts': ['create', 'read', 'update', 'delete'],
    'Invoices': ['create', 'read', 'update', 'delete'],
    'Payments': ['create', 'read', 'update', 'delete'],
    'Disputes': ['create', 'read', 'update', 'delete'],
    'Commissions': ['create', 'read', 'update', 'delete'],
    'Business Partners': ['create', 'read', 'update', 'delete', 'approve', 'share'],
    'User Management': ['create', 'read', 'update', 'delete'],
    'Settings': ['read', 'update'],
    'Reports': ['read'],
    'Audit Trail': ['read'],
    'Roles & Rights': ['read', 'update'],
    'Grievance Officer': ['read'],
  },
  'Sales': {
    'Sales Contracts': ['create', 'read', 'update'],
    'Business Partners': ['create', 'read', 'update', 'share'],
    'Disputes': ['create', 'read'],
    'Reports': ['read'],
    'Grievance Officer': ['read'],
  },
  'Accounts': {
    'Sales Contracts': ['read'],
    'Invoices': ['create', 'read', 'update'],
    'Payments': ['create', 'read', 'update'],
    'Commissions': ['read', 'update'],
    'Business Partners': ['read'],
    'Reports': ['read'],
    'Grievance Officer': ['read'],
  },
  'Dispute Manager': {
    'Sales Contracts': ['read'],
    'Disputes': ['read', 'update'],
    'Grievance Officer': ['read'],
  },
  'Vendor/Client': {
    'Sales Contracts': ['read'],
    'Invoices': ['read'],
    'Payments': ['read'],
    'Grievance Officer': ['read'],
  },
};

export const hasPermission = (role: UserRole, module: Module, permission: Permission): boolean => {
  if (role === 'Admin') return true; // Admin has all permissions
  const rolePermissions = mockPermissions[role];
  if (!rolePermissions) return false;

  const modulePermissions = rolePermissions[module];
  if (!modulePermissions) return false;

  return modulePermissions.includes(permission);
};
