/**
 * Role-Based Access Control (RBAC) based on Business Type
 * Each business type has specific modules and permissions
 */

export type BusinessType = 'BUYER' | 'SELLER' | 'TRADER' | 'SUB_BROKER' | 'TRANSPORTER' | 'CONTROLLER';
export type UserType = 'BACK_OFFICE' | 'BUSINESS_PARTNER' | 'SUB_USER';
export type PermissionAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'EXPORT';

/**
 * Module Definition
 */
export interface Module {
  id: string;
  name: string;
  description: string;
  category: 'TRADE' | 'FINANCE' | 'LOGISTICS' | 'QUALITY' | 'REPORTS' | 'SETTINGS';
  icon: string;
  path: string;
  availableFor: BusinessType[]; // Which business types can access
  requiresApproval: boolean; // Does this module require approval workflow
}

/**
 * Permission Definition
 */
export interface Permission {
  id: string;
  moduleId: string;
  moduleName: string;
  action: PermissionAction;
  description: string;
  availableFor: BusinessType[];
}

/**
 * Role Definition by Business Type
 */
export interface BusinessTypeRole {
  id: string;
  name: string;
  businessType: BusinessType;
  userType: UserType;
  description: string;
  
  // Modules accessible
  modules: string[]; // Module IDs
  
  // Permissions
  permissions: Array<{
    moduleId: string;
    actions: PermissionAction[];
  }>;
  
  // Data access scope
  dataScope: DataAccessScope;
  
  // System role (cannot be modified)
  isSystem: boolean;
}

/**
 * Data Access Scope
 * Defines what data user can see
 */
export interface DataAccessScope {
  // Partner level access
  ownPartnerOnly: boolean; // Can only see own business partner data
  
  // Branch level access
  ownBranchOnly: boolean; // Can only see own branch data
  allBranches: boolean; // Can see all branches of own partner
  specificBranches: string[]; // Specific branch IDs
  
  // Transaction access
  ownTransactionsOnly: boolean; // Can only see transactions they created
  partnerTransactions: boolean; // Can see all partner's transactions
  
  // User access
  canViewOtherUsers: boolean; // Can see other users in same partner
  canManageSubUsers: boolean; // Can create/manage sub-users
  
  // Document access
  ownDocumentsOnly: boolean; // Can only see own documents
  partnerDocuments: boolean; // Can see partner's documents
  
  // Report access
  ownReportsOnly: boolean; // Can only see own data in reports
  partnerReports: boolean; // Can see partner-level reports
  consolidatedReports: boolean; // Can see cross-partner reports (Admin only)
}

/**
 * Complete Module and Permission Matrix by Business Type
 */
export const BUSINESS_TYPE_MODULES: Record<BusinessType, Module[]> = {
  BUYER: [
    {
      id: 'purchase_orders',
      name: 'Purchase Orders',
      description: 'Create and manage purchase orders',
      category: 'TRADE',
      icon: 'shopping-cart',
      path: '/purchase-orders',
      availableFor: ['BUYER', 'TRADER'],
      requiresApproval: false,
    },
    {
      id: 'quality_reports',
      name: 'Quality Reports',
      description: 'View quality inspection reports',
      category: 'QUALITY',
      icon: 'clipboard-check',
      path: '/quality-reports',
      availableFor: ['BUYER', 'SELLER', 'TRADER'],
      requiresApproval: false,
    },
    {
      id: 'delivery_orders',
      name: 'Delivery Orders',
      description: 'Track delivery schedules',
      category: 'LOGISTICS',
      icon: 'truck',
      path: '/delivery-orders',
      availableFor: ['BUYER', 'SELLER', 'TRADER'],
      requiresApproval: false,
    },
    {
      id: 'invoices',
      name: 'Invoices',
      description: 'View and manage invoices',
      category: 'FINANCE',
      icon: 'file-text',
      path: '/invoices',
      availableFor: ['BUYER', 'SELLER', 'TRADER', 'SUB_BROKER'],
      requiresApproval: false,
    },
    {
      id: 'payments',
      name: 'Payments',
      description: 'Track payments and receipts',
      category: 'FINANCE',
      icon: 'credit-card',
      path: '/payments',
      availableFor: ['BUYER', 'SELLER', 'TRADER'],
      requiresApproval: false,
    },
    {
      id: 'reports',
      name: 'Reports',
      description: 'View business reports',
      category: 'REPORTS',
      icon: 'bar-chart',
      path: '/reports',
      availableFor: ['BUYER', 'SELLER', 'TRADER', 'SUB_BROKER'],
      requiresApproval: false,
    },
    {
      id: 'my_team',
      name: 'My Team',
      description: 'Manage team members',
      category: 'SETTINGS',
      icon: 'users',
      path: '/my-team',
      availableFor: ['BUYER', 'SELLER', 'TRADER', 'SUB_BROKER', 'TRANSPORTER', 'CONTROLLER'],
      requiresApproval: false,
    },
  ],
  
  SELLER: [
    {
      id: 'sales_contracts',
      name: 'Sales Contracts',
      description: 'Create and manage sales contracts',
      category: 'TRADE',
      icon: 'file-text',
      path: '/sales-contracts',
      availableFor: ['SELLER', 'TRADER'],
      requiresApproval: false,
    },
    {
      id: 'quality_certificates',
      name: 'Quality Certificates',
      description: 'Upload quality certificates',
      category: 'QUALITY',
      icon: 'award',
      path: '/quality-certificates',
      availableFor: ['SELLER', 'TRADER'],
      requiresApproval: false,
    },
    {
      id: 'dispatch_orders',
      name: 'Dispatch Orders',
      description: 'Manage dispatch schedules',
      category: 'LOGISTICS',
      icon: 'send',
      path: '/dispatch-orders',
      availableFor: ['SELLER', 'TRADER'],
      requiresApproval: false,
    },
    {
      id: 'invoices',
      name: 'Invoices',
      description: 'Create and send invoices',
      category: 'FINANCE',
      icon: 'file-text',
      path: '/invoices',
      availableFor: ['BUYER', 'SELLER', 'TRADER', 'SUB_BROKER'],
      requiresApproval: false,
    },
    {
      id: 'receipts',
      name: 'Receipts',
      description: 'Track payment receipts',
      category: 'FINANCE',
      icon: 'dollar-sign',
      path: '/receipts',
      availableFor: ['SELLER', 'TRADER'],
      requiresApproval: false,
    },
    {
      id: 'inventory',
      name: 'Inventory',
      description: 'Manage stock inventory',
      category: 'TRADE',
      icon: 'package',
      path: '/inventory',
      availableFor: ['SELLER', 'TRADER'],
      requiresApproval: false,
    },
    {
      id: 'reports',
      name: 'Reports',
      description: 'View business reports',
      category: 'REPORTS',
      icon: 'bar-chart',
      path: '/reports',
      availableFor: ['BUYER', 'SELLER', 'TRADER', 'SUB_BROKER'],
      requiresApproval: false,
    },
    {
      id: 'my_team',
      name: 'My Team',
      description: 'Manage team members',
      category: 'SETTINGS',
      icon: 'users',
      path: '/my-team',
      availableFor: ['BUYER', 'SELLER', 'TRADER', 'SUB_BROKER', 'TRANSPORTER', 'CONTROLLER'],
      requiresApproval: false,
    },
  ],
  
  TRADER: [
    // Trader gets BOTH buyer and seller modules
    {
      id: 'purchase_orders',
      name: 'Purchase Orders',
      description: 'Create and manage purchase orders',
      category: 'TRADE',
      icon: 'shopping-cart',
      path: '/purchase-orders',
      availableFor: ['BUYER', 'TRADER'],
      requiresApproval: false,
    },
    {
      id: 'sales_contracts',
      name: 'Sales Contracts',
      description: 'Create and manage sales contracts',
      category: 'TRADE',
      icon: 'file-text',
      path: '/sales-contracts',
      availableFor: ['SELLER', 'TRADER'],
      requiresApproval: false,
    },
    {
      id: 'trading_dashboard',
      name: 'Trading Dashboard',
      description: 'Overview of buy and sell positions',
      category: 'TRADE',
      icon: 'activity',
      path: '/trading-dashboard',
      availableFor: ['TRADER'],
      requiresApproval: false,
    },
    {
      id: 'quality_management',
      name: 'Quality Management',
      description: 'View and upload quality documents',
      category: 'QUALITY',
      icon: 'clipboard-check',
      path: '/quality-management',
      availableFor: ['TRADER'],
      requiresApproval: false,
    },
    {
      id: 'logistics',
      name: 'Logistics',
      description: 'Manage dispatch and delivery',
      category: 'LOGISTICS',
      icon: 'truck',
      path: '/logistics',
      availableFor: ['TRADER'],
      requiresApproval: false,
    },
    {
      id: 'invoices',
      name: 'Invoices',
      description: 'View and manage invoices',
      category: 'FINANCE',
      icon: 'file-text',
      path: '/invoices',
      availableFor: ['BUYER', 'SELLER', 'TRADER', 'SUB_BROKER'],
      requiresApproval: false,
    },
    {
      id: 'payments',
      name: 'Payments & Receipts',
      description: 'Track all financial transactions',
      category: 'FINANCE',
      icon: 'credit-card',
      path: '/payments',
      availableFor: ['TRADER'],
      requiresApproval: false,
    },
    {
      id: 'inventory',
      name: 'Inventory',
      description: 'Manage stock inventory',
      category: 'TRADE',
      icon: 'package',
      path: '/inventory',
      availableFor: ['SELLER', 'TRADER'],
      requiresApproval: false,
    },
    {
      id: 'reports',
      name: 'Reports',
      description: 'View business reports',
      category: 'REPORTS',
      icon: 'bar-chart',
      path: '/reports',
      availableFor: ['BUYER', 'SELLER', 'TRADER', 'SUB_BROKER'],
      requiresApproval: false,
    },
    {
      id: 'my_team',
      name: 'My Team',
      description: 'Manage team members',
      category: 'SETTINGS',
      icon: 'users',
      path: '/my-team',
      availableFor: ['BUYER', 'SELLER', 'TRADER', 'SUB_BROKER', 'TRANSPORTER', 'CONTROLLER'],
      requiresApproval: false,
    },
  ],
  
  SUB_BROKER: [
    {
      id: 'deals',
      name: 'Deals',
      description: 'View deals and commissions',
      category: 'TRADE',
      icon: 'briefcase',
      path: '/deals',
      availableFor: ['SUB_BROKER'],
      requiresApproval: false,
    },
    {
      id: 'commissions',
      name: 'Commissions',
      description: 'Track commission earnings',
      category: 'FINANCE',
      icon: 'percent',
      path: '/commissions',
      availableFor: ['SUB_BROKER'],
      requiresApproval: false,
    },
    {
      id: 'clients',
      name: 'My Clients',
      description: 'Manage client relationships',
      category: 'TRADE',
      icon: 'users',
      path: '/my-clients',
      availableFor: ['SUB_BROKER'],
      requiresApproval: false,
    },
    {
      id: 'invoices',
      name: 'Invoices',
      description: 'View commission invoices',
      category: 'FINANCE',
      icon: 'file-text',
      path: '/invoices',
      availableFor: ['BUYER', 'SELLER', 'TRADER', 'SUB_BROKER'],
      requiresApproval: false,
    },
    {
      id: 'reports',
      name: 'Reports',
      description: 'View commission reports',
      category: 'REPORTS',
      icon: 'bar-chart',
      path: '/reports',
      availableFor: ['BUYER', 'SELLER', 'TRADER', 'SUB_BROKER'],
      requiresApproval: false,
    },
    {
      id: 'my_team',
      name: 'My Team',
      description: 'Manage team members',
      category: 'SETTINGS',
      icon: 'users',
      path: '/my-team',
      availableFor: ['BUYER', 'SELLER', 'TRADER', 'SUB_BROKER', 'TRANSPORTER', 'CONTROLLER'],
      requiresApproval: false,
    },
  ],
  
  TRANSPORTER: [
    {
      id: 'shipments',
      name: 'Shipments',
      description: 'Manage shipment assignments',
      category: 'LOGISTICS',
      icon: 'truck',
      path: '/shipments',
      availableFor: ['TRANSPORTER'],
      requiresApproval: false,
    },
    {
      id: 'delivery_tracking',
      name: 'Delivery Tracking',
      description: 'Track delivery status',
      category: 'LOGISTICS',
      icon: 'map-pin',
      path: '/delivery-tracking',
      availableFor: ['TRANSPORTER'],
      requiresApproval: false,
    },
    {
      id: 'vehicles',
      name: 'Fleet Management',
      description: 'Manage transport vehicles',
      category: 'LOGISTICS',
      icon: 'truck',
      path: '/vehicles',
      availableFor: ['TRANSPORTER'],
      requiresApproval: false,
    },
    {
      id: 'invoices',
      name: 'Freight Invoices',
      description: 'Create and track freight invoices',
      category: 'FINANCE',
      icon: 'file-text',
      path: '/freight-invoices',
      availableFor: ['TRANSPORTER'],
      requiresApproval: false,
    },
    {
      id: 'reports',
      name: 'Reports',
      description: 'View logistics reports',
      category: 'REPORTS',
      icon: 'bar-chart',
      path: '/reports',
      availableFor: ['TRANSPORTER'],
      requiresApproval: false,
    },
    {
      id: 'my_team',
      name: 'My Team',
      description: 'Manage drivers and staff',
      category: 'SETTINGS',
      icon: 'users',
      path: '/my-team',
      availableFor: ['BUYER', 'SELLER', 'TRADER', 'SUB_BROKER', 'TRANSPORTER', 'CONTROLLER'],
      requiresApproval: false,
    },
  ],
  
  CONTROLLER: [
    {
      id: 'quality_inspection',
      name: 'Quality Inspection',
      description: 'Perform quality inspections',
      category: 'QUALITY',
      icon: 'search',
      path: '/quality-inspection',
      availableFor: ['CONTROLLER'],
      requiresApproval: false,
    },
    {
      id: 'disputes',
      name: 'Disputes',
      description: 'Handle quality disputes',
      category: 'QUALITY',
      icon: 'alert-circle',
      path: '/disputes',
      availableFor: ['CONTROLLER'],
      requiresApproval: false,
    },
    {
      id: 'quality_reports',
      name: 'Quality Reports',
      description: 'Generate quality reports',
      category: 'QUALITY',
      icon: 'clipboard-check',
      path: '/quality-reports',
      availableFor: ['CONTROLLER'],
      requiresApproval: false,
    },
    {
      id: 'certifications',
      name: 'Certifications',
      description: 'Manage quality certifications',
      category: 'QUALITY',
      icon: 'award',
      path: '/certifications',
      availableFor: ['CONTROLLER'],
      requiresApproval: false,
    },
    {
      id: 'reports',
      name: 'Reports',
      description: 'View quality analytics',
      category: 'REPORTS',
      icon: 'bar-chart',
      path: '/reports',
      availableFor: ['CONTROLLER'],
      requiresApproval: false,
    },
    {
      id: 'my_team',
      name: 'My Team',
      description: 'Manage inspection team',
      category: 'SETTINGS',
      icon: 'users',
      path: '/my-team',
      availableFor: ['BUYER', 'SELLER', 'TRADER', 'SUB_BROKER', 'TRANSPORTER', 'CONTROLLER'],
      requiresApproval: false,
    },
  ],
};

/**
 * Default Data Access Scope by Business Type
 */
export const DEFAULT_DATA_SCOPE: Record<BusinessType, DataAccessScope> = {
  BUYER: {
    ownPartnerOnly: true,
    ownBranchOnly: false,
    allBranches: true,
    specificBranches: [],
    ownTransactionsOnly: false,
    partnerTransactions: true,
    canViewOtherUsers: true,
    canManageSubUsers: true,
    ownDocumentsOnly: false,
    partnerDocuments: true,
    ownReportsOnly: false,
    partnerReports: true,
    consolidatedReports: false,
  },
  SELLER: {
    ownPartnerOnly: true,
    ownBranchOnly: false,
    allBranches: true,
    specificBranches: [],
    ownTransactionsOnly: false,
    partnerTransactions: true,
    canViewOtherUsers: true,
    canManageSubUsers: true,
    ownDocumentsOnly: false,
    partnerDocuments: true,
    ownReportsOnly: false,
    partnerReports: true,
    consolidatedReports: false,
  },
  TRADER: {
    ownPartnerOnly: true,
    ownBranchOnly: false,
    allBranches: true,
    specificBranches: [],
    ownTransactionsOnly: false,
    partnerTransactions: true,
    canViewOtherUsers: true,
    canManageSubUsers: true,
    ownDocumentsOnly: false,
    partnerDocuments: true,
    ownReportsOnly: false,
    partnerReports: true,
    consolidatedReports: false,
  },
  SUB_BROKER: {
    ownPartnerOnly: true,
    ownBranchOnly: false,
    allBranches: true,
    specificBranches: [],
    ownTransactionsOnly: true, // Can only see deals they brokered
    partnerTransactions: false,
    canViewOtherUsers: false,
    canManageSubUsers: true,
    ownDocumentsOnly: true,
    partnerDocuments: false,
    ownReportsOnly: true,
    partnerReports: false,
    consolidatedReports: false,
  },
  TRANSPORTER: {
    ownPartnerOnly: true,
    ownBranchOnly: false,
    allBranches: true,
    specificBranches: [],
    ownTransactionsOnly: true, // Can only see assigned shipments
    partnerTransactions: false,
    canViewOtherUsers: true,
    canManageSubUsers: true,
    ownDocumentsOnly: true,
    partnerDocuments: false,
    ownReportsOnly: true,
    partnerReports: false,
    consolidatedReports: false,
  },
  CONTROLLER: {
    ownPartnerOnly: true,
    ownBranchOnly: false,
    allBranches: true,
    specificBranches: [],
    ownTransactionsOnly: true, // Can only see inspections they performed
    partnerTransactions: false,
    canViewOtherUsers: true,
    canManageSubUsers: true,
    ownDocumentsOnly: false,
    partnerDocuments: true,
    ownReportsOnly: false,
    partnerReports: true,
    consolidatedReports: false,
  },
};

/**
 * Back Office Roles (Super Admin, Admin, Staff)
 */
export const BACK_OFFICE_ROLES = {
  SUPER_ADMIN: {
    canViewAll: true,
    canApproveAll: true,
    canDeleteAny: true,
    canManageUsers: true,
    canManageRoles: true,
    canAccessAllModules: true,
    dataScope: {
      ownPartnerOnly: false,
      ownBranchOnly: false,
      allBranches: true,
      specificBranches: [],
      ownTransactionsOnly: false,
      partnerTransactions: false,
      canViewOtherUsers: true,
      canManageSubUsers: true,
      ownDocumentsOnly: false,
      partnerDocuments: false,
      ownReportsOnly: false,
      partnerReports: false,
      consolidatedReports: true, // Can see ALL data
    },
  },
  ADMIN: {
    canViewPartners: true,
    canApprovePartners: true,
    canDeletePartners: false,
    canManageUsers: true,
    canManageRoles: false,
    canAccessAllModules: true,
    dataScope: {
      ownPartnerOnly: false,
      ownBranchOnly: false,
      allBranches: true,
      specificBranches: [],
      ownTransactionsOnly: false,
      partnerTransactions: false,
      canViewOtherUsers: true,
      canManageSubUsers: true,
      ownDocumentsOnly: false,
      partnerDocuments: false,
      ownReportsOnly: false,
      partnerReports: false,
      consolidatedReports: true,
    },
  },
  STAFF: {
    canViewPartners: true,
    canApprovePartners: false,
    canDeletePartners: false,
    canManageUsers: false,
    canManageRoles: false,
    canAccessModules: ['sales_contracts', 'purchase_orders', 'invoices', 'reports'],
    dataScope: {
      ownPartnerOnly: false,
      ownBranchOnly: false,
      allBranches: true,
      specificBranches: [],
      ownTransactionsOnly: false,
      partnerTransactions: false,
      canViewOtherUsers: true,
      canManageSubUsers: false,
      ownDocumentsOnly: false,
      partnerDocuments: false,
      ownReportsOnly: false,
      partnerReports: false,
      consolidatedReports: true,
    },
  },
};
