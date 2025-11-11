/**
 * Mock Multi-Tenant Data
 * For testing the multi-tenant access control system
 */

import { User, SubUser } from '../types/multiTenant';

// Mock Users for different portals
export const mockMultiTenantUsers: User[] = [
  // Back Office Users
  {
    id: '1',
    email: 'admin@rnrl.com',
    name: 'Admin User',
    userType: 'back_office',
    portal: 'back_office',
    isSubUser: false,
    role: 'Admin',
    permissions: ['all'],
    status: 'active',
    isVerified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    email: 'sales@rnrl.com',
    name: 'Sales Manager',
    userType: 'back_office',
    portal: 'back_office',
    isSubUser: false,
    role: 'Sales',
    permissions: ['sales.read', 'sales.create', 'sales.update'],
    status: 'active',
    isVerified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  
  // Client Users
  {
    id: '3',
    email: 'client@example.com',
    name: 'ABC Textiles Ltd',
    userType: 'client',
    portal: 'client',
    isSubUser: false,
    clientId: 'client-1',
    permissions: ['contracts.read', 'payments.read', 'reports.read'],
    status: 'active',
    isVerified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '4',
    email: 'client.employee@example.com',
    name: 'John Smith',
    userType: 'client',
    portal: 'client',
    isSubUser: true,
    parentUserId: '3',
    clientId: 'client-1',
    subUserPermissions: {
      canViewContracts: true,
      canDownloadReports: true,
      canApproveInvoices: false,
    },
    permissions: ['contracts.read', 'reports.read'],
    status: 'active',
    isVerified: true,
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
    lastLoginAt: '2024-11-10T10:00:00Z',
  },
  
  // Vendor Users
  {
    id: '5',
    email: 'vendor@example.com',
    name: 'XYZ Cotton Suppliers',
    userType: 'vendor',
    portal: 'vendor',
    isSubUser: false,
    vendorId: 'vendor-1',
    permissions: ['supplies.read', 'deliveries.update', 'invoices.create'],
    status: 'active',
    isVerified: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '6',
    email: 'vendor.employee@example.com',
    name: 'Jane Doe',
    userType: 'vendor',
    portal: 'vendor',
    isSubUser: true,
    parentUserId: '5',
    vendorId: 'vendor-1',
    subUserPermissions: {
      canViewContracts: true,
      canUpdateDeliveries: true,
      canApproveInvoices: false,
    },
    permissions: ['supplies.read', 'deliveries.update'],
    status: 'active',
    isVerified: true,
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
    lastLoginAt: '2024-11-09T15:30:00Z',
  },
];

// Mock Sub-Users for client
export const mockClientSubUsers: SubUser[] = [
  {
    id: '4',
    email: 'client.employee@example.com',
    name: 'John Smith',
    status: 'active',
    permissions: {
      canViewContracts: true,
      canDownloadReports: true,
      canApproveInvoices: false,
      canUpdateDeliveries: false,
    },
    lastLoginAt: '2024-11-10T10:00:00Z',
    createdAt: '2024-02-01T00:00:00Z',
    isActive: true,
  },
];

// Mock Sub-Users for vendor
export const mockVendorSubUsers: SubUser[] = [
  {
    id: '6',
    email: 'vendor.employee@example.com',
    name: 'Jane Doe',
    status: 'active',
    permissions: {
      canViewContracts: true,
      canDownloadReports: true,
      canApproveInvoices: false,
      canUpdateDeliveries: true,
    },
    lastLoginAt: '2024-11-09T15:30:00Z',
    createdAt: '2024-02-01T00:00:00Z',
    isActive: true,
  },
];

/**
 * Get user by email (for login)
 */
export function getUserByEmail(email: string): User | undefined {
  return mockMultiTenantUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
}

/**
 * Get sub-users for a user
 */
export function getSubUsersForUser(userId: string): SubUser[] {
  const user = mockMultiTenantUsers.find(u => u.id === userId);
  if (!user) return [];
  
  if (user.userType === 'client' && user.clientId === 'client-1') {
    return mockClientSubUsers;
  }
  
  if (user.userType === 'vendor' && user.vendorId === 'vendor-1') {
    return mockVendorSubUsers;
  }
  
  return [];
}
