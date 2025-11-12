/**
 * Back Office Roles and Rights Configuration
 * Comprehensive hierarchy with complete access control
 */

export type BackOfficeRole = 
  | 'SUPER_ADMIN'
  | 'BACK_OFFICE_MANAGER'
  | 'SALES_TEAM'
  | 'OPERATIONS_TEAM'
  | 'ACCOUNTS_TEAM'
  | 'SUPPORT_TEAM';

export type PermissionLevel = 'NONE' | 'READ' | 'WRITE' | 'APPROVE' | 'ADMIN';

export type ModuleCategory = 
  | 'BUSINESS_PARTNER'
  | 'USER_MANAGEMENT'
  | 'TRANSACTIONS'
  | 'INVENTORY'
  | 'FINANCE'
  | 'REPORTS'
  | 'SETTINGS'
  | 'AUDIT';

/**
 * Back Office Permission Matrix
 * Defines what each role can do
 */
export interface BackOfficePermission {
  role: BackOfficeRole;
  modules: Record<ModuleCategory, {
    access: PermissionLevel;
    actions: {
      create?: boolean;
      read?: boolean;
      update?: boolean;
      delete?: boolean;
      approve?: boolean;
      export?: boolean;
      configure?: boolean;
    };
    restrictions?: string[];
    requiresApproval?: boolean;
  }>;
  
  // Special permissions
  specialPermissions: {
    canOverrideLocks: boolean; // Can override transaction locks
    canApproveHighValue: boolean; // Can approve >$50,000 transactions
    canModifyActiveTransactions: boolean; // Can modify ongoing transactions
    canAccessAuditLogs: boolean; // Can view audit logs
    canManageSystemSettings: boolean; // Can change system configuration
    canDelegateApproval: boolean; // Can delegate approval to others
    requiresMFA: boolean; // Requires multi-factor authentication
    requiresSecondaryApproval: boolean; // Needs another approval
  };
  
  // Data access scope
  dataAccess: {
    allOrganizations: boolean;
    allBusinessPartners: boolean;
    allTransactions: boolean;
    ownDataOnly: boolean;
    teamDataOnly: boolean;
  };
}

/**
 * Complete Back Office Roles Configuration
 */
export const BACK_OFFICE_ROLES: Record<BackOfficeRole, BackOfficePermission> = {
  
  /**
   * SUPER ADMIN - Highest Authority
   * Full access to everything, with MFA required
   */
  SUPER_ADMIN: {
    role: 'SUPER_ADMIN',
    modules: {
      BUSINESS_PARTNER: {
        access: 'ADMIN',
        actions: {
          create: true,
          read: true,
          update: true,
          delete: true,
          approve: true,
          export: true,
          configure: true,
        },
      },
      USER_MANAGEMENT: {
        access: 'ADMIN',
        actions: {
          create: true,
          read: true,
          update: true,
          delete: true,
          approve: true,
          export: true,
          configure: true,
        },
      },
      TRANSACTIONS: {
        access: 'ADMIN',
        actions: {
          create: true,
          read: true,
          update: true,
          delete: false, // Transactions can only be reversed, not deleted
          approve: true,
          export: true,
        },
        restrictions: ['Cannot delete transactions, only reverse'],
      },
      INVENTORY: {
        access: 'ADMIN',
        actions: {
          create: true,
          read: true,
          update: true,
          delete: true,
          approve: true,
          export: true,
        },
      },
      FINANCE: {
        access: 'ADMIN',
        actions: {
          create: true,
          read: true,
          update: true,
          delete: false,
          approve: true,
          export: true,
        },
        restrictions: ['Cannot delete financial records, only reverse'],
      },
      REPORTS: {
        access: 'ADMIN',
        actions: {
          create: true,
          read: true,
          update: true,
          delete: true,
          export: true,
        },
      },
      SETTINGS: {
        access: 'ADMIN',
        actions: {
          read: true,
          update: true,
          configure: true,
        },
      },
      AUDIT: {
        access: 'ADMIN',
        actions: {
          read: true,
          export: true,
        },
        restrictions: ['Audit logs cannot be modified or deleted'],
      },
    },
    specialPermissions: {
      canOverrideLocks: true,
      canApproveHighValue: true,
      canModifyActiveTransactions: true,
      canAccessAuditLogs: true,
      canManageSystemSettings: true,
      canDelegateApproval: true,
      requiresMFA: true,
      requiresSecondaryApproval: true, // For emergency overrides
    },
    dataAccess: {
      allOrganizations: true,
      allBusinessPartners: true,
      allTransactions: true,
      ownDataOnly: false,
      teamDataOnly: false,
    },
  },

  /**
   * BACK OFFICE MANAGER - Approval Authority
   * Can approve business partners, users, and high-value transactions
   */
  BACK_OFFICE_MANAGER: {
    role: 'BACK_OFFICE_MANAGER',
    modules: {
      BUSINESS_PARTNER: {
        access: 'APPROVE',
        actions: {
          create: true,
          read: true,
          update: true,
          delete: false,
          approve: true,
          export: true,
        },
        requiresApproval: false, // Manager can approve
      },
      USER_MANAGEMENT: {
        access: 'APPROVE',
        actions: {
          create: true,
          read: true,
          update: true,
          delete: false, // Can only deactivate
          approve: true,
          export: true,
        },
      },
      TRANSACTIONS: {
        access: 'APPROVE',
        actions: {
          create: false,
          read: true,
          update: false,
          delete: false,
          approve: true, // Can approve high-value transactions
          export: true,
        },
        restrictions: ['Can only approve transactions >$50,000'],
      },
      INVENTORY: {
        access: 'READ',
        actions: {
          read: true,
          export: true,
        },
      },
      FINANCE: {
        access: 'APPROVE',
        actions: {
          create: false,
          read: true,
          update: false,
          delete: false,
          approve: true, // Can approve payments >$25,000
          export: true,
        },
      },
      REPORTS: {
        access: 'READ',
        actions: {
          read: true,
          export: true,
        },
      },
      SETTINGS: {
        access: 'READ',
        actions: {
          read: true,
        },
      },
      AUDIT: {
        access: 'READ',
        actions: {
          read: true,
          export: true,
        },
      },
    },
    specialPermissions: {
      canOverrideLocks: false,
      canApproveHighValue: true,
      canModifyActiveTransactions: false,
      canAccessAuditLogs: true,
      canManageSystemSettings: false,
      canDelegateApproval: true,
      requiresMFA: true,
      requiresSecondaryApproval: false,
    },
    dataAccess: {
      allOrganizations: true,
      allBusinessPartners: true,
      allTransactions: true,
      ownDataOnly: false,
      teamDataOnly: false,
    },
  },

  /**
   * SALES TEAM - Customer Facing
   * Can create partners and quotes, requires approval
   */
  SALES_TEAM: {
    role: 'SALES_TEAM',
    modules: {
      BUSINESS_PARTNER: {
        access: 'WRITE',
        actions: {
          create: true,
          read: true,
          update: true,
          delete: false,
          approve: false,
          export: true,
        },
        requiresApproval: true, // All changes require manager approval
        restrictions: ['Cannot approve business partners'],
      },
      USER_MANAGEMENT: {
        access: 'READ',
        actions: {
          read: true,
        },
        restrictions: ['Can only view users, cannot modify'],
      },
      TRANSACTIONS: {
        access: 'WRITE',
        actions: {
          create: true,
          read: true,
          update: true,
          delete: false,
          approve: false,
          export: true,
        },
        requiresApproval: true, // Transactions >$50,000 need manager approval
        restrictions: ['Cannot modify approved transactions', 'High-value needs approval'],
      },
      INVENTORY: {
        access: 'READ',
        actions: {
          read: true,
        },
      },
      FINANCE: {
        access: 'NONE',
        actions: {},
        restrictions: ['No access to financial data'],
      },
      REPORTS: {
        access: 'READ',
        actions: {
          read: true,
          export: true,
        },
        restrictions: ['Can only see sales reports, not financial'],
      },
      SETTINGS: {
        access: 'NONE',
        actions: {},
      },
      AUDIT: {
        access: 'NONE',
        actions: {},
      },
    },
    specialPermissions: {
      canOverrideLocks: false,
      canApproveHighValue: false,
      canModifyActiveTransactions: false,
      canAccessAuditLogs: false,
      canManageSystemSettings: false,
      canDelegateApproval: false,
      requiresMFA: false,
      requiresSecondaryApproval: false,
    },
    dataAccess: {
      allOrganizations: false,
      allBusinessPartners: true, // Can see all partners
      allTransactions: false, // Can only see own transactions
      ownDataOnly: true,
      teamDataOnly: false,
    },
  },

  /**
   * OPERATIONS TEAM - Order Processing
   * Can manage orders, logistics, and quality
   */
  OPERATIONS_TEAM: {
    role: 'OPERATIONS_TEAM',
    modules: {
      BUSINESS_PARTNER: {
        access: 'READ',
        actions: {
          read: true,
        },
        restrictions: ['Read-only access to partner details'],
      },
      USER_MANAGEMENT: {
        access: 'READ',
        actions: {
          read: true,
        },
      },
      TRANSACTIONS: {
        access: 'WRITE',
        actions: {
          create: false,
          read: true,
          update: true, // Can update status, logistics info
          delete: false,
          approve: false,
          export: true,
        },
        restrictions: ['Cannot modify pricing or financial terms'],
      },
      INVENTORY: {
        access: 'WRITE',
        actions: {
          create: true,
          read: true,
          update: true,
          delete: false,
          export: true,
        },
      },
      FINANCE: {
        access: 'NONE',
        actions: {},
        restrictions: ['No access to financial data'],
      },
      REPORTS: {
        access: 'READ',
        actions: {
          read: true,
          export: true,
        },
        restrictions: ['Can only see operations reports, not financial'],
      },
      SETTINGS: {
        access: 'NONE',
        actions: {},
      },
      AUDIT: {
        access: 'NONE',
        actions: {},
      },
    },
    specialPermissions: {
      canOverrideLocks: false,
      canApproveHighValue: false,
      canModifyActiveTransactions: false,
      canAccessAuditLogs: false,
      canManageSystemSettings: false,
      canDelegateApproval: false,
      requiresMFA: false,
      requiresSecondaryApproval: false,
    },
    dataAccess: {
      allOrganizations: false,
      allBusinessPartners: false,
      allTransactions: true, // Can see all transactions for processing
      ownDataOnly: false,
      teamDataOnly: true,
    },
  },

  /**
   * ACCOUNTS TEAM - Financial Management
   * Can manage invoices, payments, and accounting
   */
  ACCOUNTS_TEAM: {
    role: 'ACCOUNTS_TEAM',
    modules: {
      BUSINESS_PARTNER: {
        access: 'READ',
        actions: {
          read: true,
        },
        restrictions: ['Read-only access to partner financial details'],
      },
      USER_MANAGEMENT: {
        access: 'READ',
        actions: {
          read: true,
        },
      },
      TRANSACTIONS: {
        access: 'READ',
        actions: {
          read: true,
          export: true,
        },
        restrictions: ['Read-only access to transaction details'],
      },
      INVENTORY: {
        access: 'READ',
        actions: {
          read: true,
        },
      },
      FINANCE: {
        access: 'WRITE',
        actions: {
          create: true,
          read: true,
          update: true,
          delete: false,
          approve: false,
          export: true,
        },
        requiresApproval: true, // Payments >$25,000 need manager approval
        restrictions: ['Cannot delete financial records', 'High-value needs approval'],
      },
      REPORTS: {
        access: 'READ',
        actions: {
          read: true,
          export: true,
        },
      },
      SETTINGS: {
        access: 'NONE',
        actions: {},
      },
      AUDIT: {
        access: 'READ',
        actions: {
          read: true,
        },
        restrictions: ['Can only view financial audit logs'],
      },
    },
    specialPermissions: {
      canOverrideLocks: false,
      canApproveHighValue: false,
      canModifyActiveTransactions: false,
      canAccessAuditLogs: true, // Only financial audit logs
      canManageSystemSettings: false,
      canDelegateApproval: false,
      requiresMFA: true, // Required for financial operations
      requiresSecondaryApproval: false,
    },
    dataAccess: {
      allOrganizations: false,
      allBusinessPartners: false,
      allTransactions: true, // Can see all for accounting
      ownDataOnly: false,
      teamDataOnly: true,
    },
  },

  /**
   * SUPPORT TEAM - Help Desk
   * Can help users with basic account issues
   */
  SUPPORT_TEAM: {
    role: 'SUPPORT_TEAM',
    modules: {
      BUSINESS_PARTNER: {
        access: 'READ',
        actions: {
          read: true,
        },
        restrictions: ['Can only view basic info, no financial data'],
      },
      USER_MANAGEMENT: {
        access: 'WRITE',
        actions: {
          read: true,
          update: true, // Can reset passwords, unlock accounts
        },
        restrictions: ['Can only help with account issues, cannot modify permissions'],
      },
      TRANSACTIONS: {
        access: 'NONE',
        actions: {},
        restrictions: ['No access to transaction data'],
      },
      INVENTORY: {
        access: 'NONE',
        actions: {},
      },
      FINANCE: {
        access: 'NONE',
        actions: {},
        restrictions: ['No access to financial data'],
      },
      REPORTS: {
        access: 'NONE',
        actions: {},
      },
      SETTINGS: {
        access: 'NONE',
        actions: {},
      },
      AUDIT: {
        access: 'NONE',
        actions: {},
      },
    },
    specialPermissions: {
      canOverrideLocks: false,
      canApproveHighValue: false,
      canModifyActiveTransactions: false,
      canAccessAuditLogs: false,
      canManageSystemSettings: false,
      canDelegateApproval: false,
      requiresMFA: false,
      requiresSecondaryApproval: false,
    },
    dataAccess: {
      allOrganizations: false,
      allBusinessPartners: false,
      allTransactions: false,
      ownDataOnly: false,
      teamDataOnly: false, // Limited data access only
    },
  },
};

/**
 * Check if user has specific permission
 */
export function hasPermission(
  role: BackOfficeRole,
  module: ModuleCategory,
  action: keyof BackOfficePermission['modules'][ModuleCategory]['actions']
): boolean {
  const roleConfig = BACK_OFFICE_ROLES[role];
  const moduleConfig = roleConfig.modules[module];
  
  return moduleConfig.actions[action] === true;
}

/**
 * Check if action requires approval
 */
export function requiresApproval(
  role: BackOfficeRole,
  module: ModuleCategory,
  transactionValue?: number
): boolean {
  const roleConfig = BACK_OFFICE_ROLES[role];
  const moduleConfig = roleConfig.modules[module];
  
  // Check base requirement
  if (moduleConfig.requiresApproval) {
    return true;
  }
  
  // Check high-value transaction threshold
  if (module === 'TRANSACTIONS' && transactionValue) {
    if (transactionValue > 50000 && role !== 'SUPER_ADMIN' && role !== 'BACK_OFFICE_MANAGER') {
      return true;
    }
  }
  
  // Check high-value payment threshold
  if (module === 'FINANCE' && transactionValue) {
    if (transactionValue > 25000 && role !== 'SUPER_ADMIN' && role !== 'BACK_OFFICE_MANAGER') {
      return true;
    }
  }
  
  return false;
}

/**
 * Get approval authority for specific action
 */
export function getApprovalAuthority(
  module: ModuleCategory,
  transactionValue?: number
): BackOfficeRole[] {
  // Super Admin can always approve
  const authorities: BackOfficeRole[] = ['SUPER_ADMIN'];
  
  // Add Back Office Manager for most approvals
  if (module === 'BUSINESS_PARTNER' || module === 'USER_MANAGEMENT') {
    authorities.push('BACK_OFFICE_MANAGER');
  }
  
  // High-value transactions require Manager or Super Admin
  if (transactionValue && transactionValue > 50000) {
    if (!authorities.includes('BACK_OFFICE_MANAGER')) {
      authorities.push('BACK_OFFICE_MANAGER');
    }
  }
  
  return authorities;
}

/**
 * Check if user can modify active transactions
 */
export function canModifyActiveTransaction(role: BackOfficeRole): boolean {
  return BACK_OFFICE_ROLES[role].specialPermissions.canModifyActiveTransactions;
}

/**
 * Check if user can override transaction locks
 */
export function canOverrideTransactionLock(role: BackOfficeRole): boolean {
  return BACK_OFFICE_ROLES[role].specialPermissions.canOverrideLocks;
}

/**
 * Get data access restrictions for role
 */
export function getDataAccessRestrictions(role: BackOfficeRole) {
  return BACK_OFFICE_ROLES[role].dataAccess;
}
