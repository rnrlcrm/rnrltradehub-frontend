/**
 * Back Office Complete RBAC System
 * Defines all back-office roles with proper access control
 */

export type BackOfficeRole = 
  | 'SUPER_ADMIN' 
  | 'ADMIN' 
  | 'MANAGER' 
  | 'SALES_STAFF' 
  | 'ACCOUNTS_STAFF' 
  | 'LOGISTICS_STAFF'
  | 'QUALITY_STAFF'
  | 'SUPPORT_STAFF';

/**
 * Back Office Module Access Matrix
 */
export interface BackOfficeModuleAccess {
  moduleId: string;
  moduleName: string;
  category: string;
  actions: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    approve: boolean;
    export: boolean;
    import: boolean;
  };
  restrictions?: string[]; // Special restrictions
}

/**
 * Complete Back Office Role Definition
 */
export interface BackOfficeRoleDefinition {
  role: BackOfficeRole;
  displayName: string;
  description: string;
  hierarchy: number; // 1 = highest, 10 = lowest
  
  // System access
  canAccessAllModules: boolean;
  allowedModules: string[];
  
  // Data access
  canViewAllPartners: boolean;
  canViewAllTransactions: boolean;
  canViewAllBranches: boolean;
  canViewAllUsers: boolean;
  
  // Critical permissions
  canApprovePartners: boolean;
  canApproveUsers: boolean;
  canApproveTransactions: boolean;
  canApproveAmendments: boolean;
  canApproveKYC: boolean;
  
  // Amendment permissions (CRITICAL)
  canAmendOngoingTransactions: boolean; // ONLY for back-office
  canAmendCompletedTransactions: boolean;
  canAmendPartnerData: boolean;
  canAmendFinancialData: boolean;
  
  // User management
  canCreateUsers: boolean;
  canModifyUsers: boolean;
  canDeleteUsers: boolean;
  canAssignRoles: boolean;
  canResetPasswords: boolean;
  
  // Partner management
  canCreatePartners: boolean;
  canModifyPartners: boolean;
  canDeletePartners: boolean;
  canBlacklistPartners: boolean;
  
  // Financial permissions
  canViewFinancials: boolean;
  canModifyFinancials: boolean;
  canApprovePayments: boolean;
  canProcessRefunds: boolean;
  
  // System settings
  canManageSettings: boolean;
  canManageRoles: boolean;
  canViewAuditLogs: boolean;
  canExportData: boolean;
  
  // Module access
  moduleAccess: BackOfficeModuleAccess[];
}

/**
 * SUPER ADMIN - Highest authority
 * Can do EVERYTHING including critical amendments
 */
export const SUPER_ADMIN_ROLE: BackOfficeRoleDefinition = {
  role: 'SUPER_ADMIN',
  displayName: 'Super Administrator',
  description: 'Full system access with all permissions',
  hierarchy: 1,
  
  canAccessAllModules: true,
  allowedModules: ['*'], // All modules
  
  canViewAllPartners: true,
  canViewAllTransactions: true,
  canViewAllBranches: true,
  canViewAllUsers: true,
  
  canApprovePartners: true,
  canApproveUsers: true,
  canApproveTransactions: true,
  canApproveAmendments: true,
  canApproveKYC: true,
  
  // CRITICAL: Can amend ongoing transactions
  canAmendOngoingTransactions: true,
  canAmendCompletedTransactions: true,
  canAmendPartnerData: true,
  canAmendFinancialData: true,
  
  canCreateUsers: true,
  canModifyUsers: true,
  canDeleteUsers: true,
  canAssignRoles: true,
  canResetPasswords: true,
  
  canCreatePartners: true,
  canModifyPartners: true,
  canDeletePartners: true,
  canBlacklistPartners: true,
  
  canViewFinancials: true,
  canModifyFinancials: true,
  canApprovePayments: true,
  canProcessRefunds: true,
  
  canManageSettings: true,
  canManageRoles: true,
  canViewAuditLogs: true,
  canExportData: true,
  
  moduleAccess: [], // Will be populated with all modules
};

/**
 * ADMIN - High authority
 * Can approve and manage but limited critical amendments
 */
export const ADMIN_ROLE: BackOfficeRoleDefinition = {
  role: 'ADMIN',
  displayName: 'Administrator',
  description: 'High-level access with approval rights',
  hierarchy: 2,
  
  canAccessAllModules: true,
  allowedModules: ['*'],
  
  canViewAllPartners: true,
  canViewAllTransactions: true,
  canViewAllBranches: true,
  canViewAllUsers: true,
  
  canApprovePartners: true,
  canApproveUsers: true,
  canApproveTransactions: true,
  canApproveAmendments: true,
  canApproveKYC: true,
  
  // CRITICAL: Can amend ongoing transactions (but not completed)
  canAmendOngoingTransactions: true,
  canAmendCompletedTransactions: false, // Requires Super Admin
  canAmendPartnerData: true,
  canAmendFinancialData: false, // Requires Super Admin
  
  canCreateUsers: true,
  canModifyUsers: true,
  canDeleteUsers: false, // Requires Super Admin
  canAssignRoles: true,
  canResetPasswords: true,
  
  canCreatePartners: true,
  canModifyPartners: true,
  canDeletePartners: false,
  canBlacklistPartners: true,
  
  canViewFinancials: true,
  canModifyFinancials: false,
  canApprovePayments: true,
  canProcessRefunds: false,
  
  canManageSettings: false,
  canManageRoles: false,
  canViewAuditLogs: true,
  canExportData: true,
  
  moduleAccess: [],
};

/**
 * MANAGER - Department heads
 * Can manage their department but no critical amendments
 */
export const MANAGER_ROLE: BackOfficeRoleDefinition = {
  role: 'MANAGER',
  displayName: 'Manager',
  description: 'Department management with limited approvals',
  hierarchy: 3,
  
  canAccessAllModules: false,
  allowedModules: [
    'dashboard',
    'partners',
    'users',
    'transactions',
    'reports',
    'my_team',
  ],
  
  canViewAllPartners: true,
  canViewAllTransactions: true,
  canViewAllBranches: true,
  canViewAllUsers: true,
  
  canApprovePartners: false,
  canApproveUsers: false,
  canApproveTransactions: false,
  canApproveAmendments: false,
  canApproveKYC: false,
  
  // NO critical amendment rights
  canAmendOngoingTransactions: false,
  canAmendCompletedTransactions: false,
  canAmendPartnerData: false,
  canAmendFinancialData: false,
  
  canCreateUsers: false,
  canModifyUsers: false,
  canDeleteUsers: false,
  canAssignRoles: false,
  canResetPasswords: true,
  
  canCreatePartners: false,
  canModifyPartners: false,
  canDeletePartners: false,
  canBlacklistPartners: false,
  
  canViewFinancials: true,
  canModifyFinancials: false,
  canApprovePayments: false,
  canProcessRefunds: false,
  
  canManageSettings: false,
  canManageRoles: false,
  canViewAuditLogs: true,
  canExportData: true,
  
  moduleAccess: [],
};

/**
 * SALES STAFF - Handles partner onboarding and sales
 */
export const SALES_STAFF_ROLE: BackOfficeRoleDefinition = {
  role: 'SALES_STAFF',
  displayName: 'Sales Staff',
  description: 'Partner onboarding and sales contract management',
  hierarchy: 4,
  
  canAccessAllModules: false,
  allowedModules: [
    'dashboard',
    'partners',
    'sales_contracts',
    'purchase_orders',
    'reports',
  ],
  
  canViewAllPartners: true,
  canViewAllTransactions: true,
  canViewAllBranches: true,
  canViewAllUsers: false,
  
  canApprovePartners: false,
  canApproveUsers: false,
  canApproveTransactions: false,
  canApproveAmendments: false,
  canApproveKYC: false,
  
  // NO amendment rights
  canAmendOngoingTransactions: false,
  canAmendCompletedTransactions: false,
  canAmendPartnerData: false,
  canAmendFinancialData: false,
  
  canCreateUsers: false,
  canModifyUsers: false,
  canDeleteUsers: false,
  canAssignRoles: false,
  canResetPasswords: false,
  
  canCreatePartners: true, // Can create, but needs approval
  canModifyPartners: false,
  canDeletePartners: false,
  canBlacklistPartners: false,
  
  canViewFinancials: false,
  canModifyFinancials: false,
  canApprovePayments: false,
  canProcessRefunds: false,
  
  canManageSettings: false,
  canManageRoles: false,
  canViewAuditLogs: false,
  canExportData: true,
  
  moduleAccess: [],
};

/**
 * ACCOUNTS STAFF - Handles financial operations
 */
export const ACCOUNTS_STAFF_ROLE: BackOfficeRoleDefinition = {
  role: 'ACCOUNTS_STAFF',
  displayName: 'Accounts Staff',
  description: 'Financial and accounting operations',
  hierarchy: 4,
  
  canAccessAllModules: false,
  allowedModules: [
    'dashboard',
    'invoices',
    'payments',
    'receipts',
    'ledger',
    'reports',
  ],
  
  canViewAllPartners: true,
  canViewAllTransactions: true,
  canViewAllBranches: true,
  canViewAllUsers: false,
  
  canApprovePartners: false,
  canApproveUsers: false,
  canApproveTransactions: false,
  canApproveAmendments: false,
  canApproveKYC: false,
  
  // NO amendment rights (financial data is CRITICAL)
  canAmendOngoingTransactions: false,
  canAmendCompletedTransactions: false,
  canAmendPartnerData: false,
  canAmendFinancialData: false,
  
  canCreateUsers: false,
  canModifyUsers: false,
  canDeleteUsers: false,
  canAssignRoles: false,
  canResetPasswords: false,
  
  canCreatePartners: false,
  canModifyPartners: false,
  canDeletePartners: false,
  canBlacklistPartners: false,
  
  canViewFinancials: true,
  canModifyFinancials: false, // Can record, but not amend
  canApprovePayments: false,
  canProcessRefunds: false,
  
  canManageSettings: false,
  canManageRoles: false,
  canViewAuditLogs: false,
  canExportData: true,
  
  moduleAccess: [],
};

/**
 * LOGISTICS STAFF - Handles dispatch and delivery
 */
export const LOGISTICS_STAFF_ROLE: BackOfficeRoleDefinition = {
  role: 'LOGISTICS_STAFF',
  displayName: 'Logistics Staff',
  description: 'Dispatch and delivery management',
  hierarchy: 5,
  
  canAccessAllModules: false,
  allowedModules: [
    'dashboard',
    'delivery_orders',
    'dispatch_orders',
    'shipments',
    'reports',
  ],
  
  canViewAllPartners: true,
  canViewAllTransactions: true,
  canViewAllBranches: true,
  canViewAllUsers: false,
  
  canApprovePartners: false,
  canApproveUsers: false,
  canApproveTransactions: false,
  canApproveAmendments: false,
  canApproveKYC: false,
  
  // NO amendment rights
  canAmendOngoingTransactions: false,
  canAmendCompletedTransactions: false,
  canAmendPartnerData: false,
  canAmendFinancialData: false,
  
  canCreateUsers: false,
  canModifyUsers: false,
  canDeleteUsers: false,
  canAssignRoles: false,
  canResetPasswords: false,
  
  canCreatePartners: false,
  canModifyPartners: false,
  canDeletePartners: false,
  canBlacklistPartners: false,
  
  canViewFinancials: false,
  canModifyFinancials: false,
  canApprovePayments: false,
  canProcessRefunds: false,
  
  canManageSettings: false,
  canManageRoles: false,
  canViewAuditLogs: false,
  canExportData: true,
  
  moduleAccess: [],
};

/**
 * QUALITY STAFF - Handles quality control
 */
export const QUALITY_STAFF_ROLE: BackOfficeRoleDefinition = {
  role: 'QUALITY_STAFF',
  displayName: 'Quality Staff',
  description: 'Quality inspection and certification',
  hierarchy: 5,
  
  canAccessAllModules: false,
  allowedModules: [
    'dashboard',
    'quality_reports',
    'quality_certificates',
    'disputes',
    'reports',
  ],
  
  canViewAllPartners: true,
  canViewAllTransactions: true,
  canViewAllBranches: true,
  canViewAllUsers: false,
  
  canApprovePartners: false,
  canApproveUsers: false,
  canApproveTransactions: false,
  canApproveAmendments: false,
  canApproveKYC: false,
  
  // NO amendment rights
  canAmendOngoingTransactions: false,
  canAmendCompletedTransactions: false,
  canAmendPartnerData: false,
  canAmendFinancialData: false,
  
  canCreateUsers: false,
  canModifyUsers: false,
  canDeleteUsers: false,
  canAssignRoles: false,
  canResetPasswords: false,
  
  canCreatePartners: false,
  canModifyPartners: false,
  canDeletePartners: false,
  canBlacklistPartners: false,
  
  canViewFinancials: false,
  canModifyFinancials: false,
  canApprovePayments: false,
  canProcessRefunds: false,
  
  canManageSettings: false,
  canManageRoles: false,
  canViewAuditLogs: false,
  canExportData: true,
  
  moduleAccess: [],
};

/**
 * SUPPORT STAFF - Customer support
 */
export const SUPPORT_STAFF_ROLE: BackOfficeRoleDefinition = {
  role: 'SUPPORT_STAFF',
  displayName: 'Support Staff',
  description: 'Customer support and assistance',
  hierarchy: 6,
  
  canAccessAllModules: false,
  allowedModules: [
    'dashboard',
    'partners',
    'users',
    'tickets',
    'reports',
  ],
  
  canViewAllPartners: true,
  canViewAllTransactions: false,
  canViewAllBranches: true,
  canViewAllUsers: true,
  
  canApprovePartners: false,
  canApproveUsers: false,
  canApproveTransactions: false,
  canApproveAmendments: false,
  canApproveKYC: false,
  
  // NO amendment rights
  canAmendOngoingTransactions: false,
  canAmendCompletedTransactions: false,
  canAmendPartnerData: false,
  canAmendFinancialData: false,
  
  canCreateUsers: false,
  canModifyUsers: false,
  canDeleteUsers: false,
  canAssignRoles: false,
  canResetPasswords: true, // Can reset for support
  
  canCreatePartners: false,
  canModifyPartners: false,
  canDeletePartners: false,
  canBlacklistPartners: false,
  
  canViewFinancials: false,
  canModifyFinancials: false,
  canApprovePayments: false,
  canProcessRefunds: false,
  
  canManageSettings: false,
  canManageRoles: false,
  canViewAuditLogs: false,
  canExportData: false,
  
  moduleAccess: [],
};

/**
 * All Back Office Roles
 */
export const ALL_BACK_OFFICE_ROLES: Record<BackOfficeRole, BackOfficeRoleDefinition> = {
  SUPER_ADMIN: SUPER_ADMIN_ROLE,
  ADMIN: ADMIN_ROLE,
  MANAGER: MANAGER_ROLE,
  SALES_STAFF: SALES_STAFF_ROLE,
  ACCOUNTS_STAFF: ACCOUNTS_STAFF_ROLE,
  LOGISTICS_STAFF: LOGISTICS_STAFF_ROLE,
  QUALITY_STAFF: QUALITY_STAFF_ROLE,
  SUPPORT_STAFF: SUPPORT_STAFF_ROLE,
};

/**
 * Critical Amendment Authorization
 * ONLY these roles can amend ongoing transactions
 */
export const CRITICAL_AMENDMENT_ROLES: BackOfficeRole[] = [
  'SUPER_ADMIN',
  'ADMIN',
];

/**
 * Check if user has critical amendment rights
 */
export function canAmendOngoingTransaction(userRole: BackOfficeRole | string): boolean {
  return CRITICAL_AMENDMENT_ROLES.includes(userRole as BackOfficeRole);
}

/**
 * Check if user has financial amendment rights
 */
export function canAmendFinancialData(userRole: BackOfficeRole | string): boolean {
  return userRole === 'SUPER_ADMIN';
}

/**
 * Get role hierarchy level
 */
export function getRoleHierarchy(userRole: BackOfficeRole | string): number {
  const role = ALL_BACK_OFFICE_ROLES[userRole as BackOfficeRole];
  return role?.hierarchy || 999;
}

/**
 * Check if role A can manage role B
 */
export function canManageRole(roleA: BackOfficeRole, roleB: BackOfficeRole): boolean {
  const hierarchyA = getRoleHierarchy(roleA);
  const hierarchyB = getRoleHierarchy(roleB);
  return hierarchyA < hierarchyB; // Lower number = higher authority
}
