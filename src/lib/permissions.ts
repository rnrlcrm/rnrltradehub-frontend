import { UserRole, Module, Permission, PermissionsMap } from '../types';

export const mockPermissions: PermissionsMap = {
  'Admin': {
    'Sales Contracts': ['create', 'read', 'update', 'delete', 'approve'],
    'Invoices': ['create', 'read', 'update', 'delete'],
    'Payments': ['create', 'read', 'update', 'delete'],
    'Disputes': ['create', 'read', 'update', 'delete'],
    'Commissions': ['create', 'read', 'update', 'delete'],
    'Vendors & Clients': ['create', 'read', 'update', 'delete'],
    'User Management': ['create', 'read', 'update', 'delete'],
    'Settings': ['create', 'read', 'update', 'delete'],
    'Reports': ['read'],
    'Audit Trail': ['read'],
    'Roles & Rights': ['read', 'update'],
    'Grievance Officer': ['read', 'update'],
    'Business Partner': ['create', 'read', 'update', 'delete', 'approve', 'share'],
  },
  'Sales': {
    'Sales Contracts': ['create', 'read', 'update'],
    'Invoices': ['read'],
    'Payments': ['read'],
    'Disputes': ['create', 'read'],
    'Commissions': ['read'],
    'Vendors & Clients': ['create', 'read', 'update'],
    'User Management': ['read'],
    'Settings': ['read'],
    'Reports': ['read'],
    'Audit Trail': ['read'],
    'Business Partner': ['create', 'read', 'update', 'share'],
  },
  'Accounts': {
    'Sales Contracts': ['read'],
    'Invoices': ['create', 'read', 'update'],
    'Payments': ['create', 'read', 'update'],
    'Disputes': ['read'],
    'Commissions': ['create', 'read', 'update'],
    'Vendors & Clients': ['read'],
    'User Management': ['read'],
    'Settings': ['read'],
    'Reports': ['read'],
    'Audit Trail': ['read'],
    'Business Partner': ['read'],
  },
  'Dispute Manager': {
    'Sales Contracts': ['read'],
    'Invoices': ['read'],
    'Payments': ['read'],
    'Disputes': ['create', 'read', 'update'],
    'Commissions': ['read'],
    'Vendors & Clients': ['read'],
    'User Management': ['read'],
    'Settings': ['read'],
    'Reports': ['read'],
    'Audit Trail': ['read'],
    'Business Partner': ['read'],
  },
  'Vendor/Client': {
    'Sales Contracts': ['read'],
    'Invoices': ['read'],
    'Payments': ['read'],
    'Disputes': ['create', 'read'],
    'Commissions': ['read'],
    'Vendors & Clients': ['read'],
    'Reports': ['read'],
    'Business Partner': ['read'],
  },
};

export const hasPermission = (
  role: UserRole,
  module: Module,
  permission: Permission
): boolean => {
  return mockPermissions[role]?.[module]?.includes(permission) ?? false;
};
