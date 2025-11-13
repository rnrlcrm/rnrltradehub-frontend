/**
 * Dynamic RBAC System with Future Module Support
 * Extensible architecture for adding new modules and permissions
 * User can ONLY see deals they are involved in
 */

export type DynamicBusinessType = 
  | 'BUYER' 
  | 'SELLER' 
  | 'TRADER' 
  | 'SUB_BROKER' 
  | 'TRANSPORTER' 
  | 'CONTROLLER'
  | string; // Allow custom business types in future

export type DynamicModuleCategory = 
  | 'TRADE'
  | 'FINANCE'
  | 'LOGISTICS'
  | 'QUALITY'
  | 'REPORTS'
  | 'SETTINGS'
  | string; // Allow custom module categories

export type DynamicPermissionAction = 
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'APPROVE'
  | 'EXPORT'
  | string; // Allow custom actions

/**
 * Dynamic Module Definition
 * Can be extended at runtime to add new modules
 */
export interface DynamicModule {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: DynamicModuleCategory;
  icon?: string;
  path?: string;
  
  // Which business types can access this module
  availableFor: DynamicBusinessType[];
  
  // Is this a system module or custom module
  isSystem: boolean;
  isActive: boolean;
  
  // Module metadata
  metadata?: {
    version: string;
    addedDate: string;
    addedBy: string;
    lastModified: string;
    customFields?: Record<string, any>;
  };
}

/**
 * Dynamic Permission Definition
 * Can be added/modified at runtime
 */
export interface DynamicPermission {
  id: string;
  moduleId: string;
  moduleName: string;
  action: DynamicPermissionAction;
  description: string;
  
  // Which business types can have this permission
  availableFor: DynamicBusinessType[];
  
  // Dependencies (require other permissions first)
  requiredPermissions?: string[];
  
  // Is this permission active
  isActive: boolean;
  
  // Permission metadata
  metadata?: {
    addedDate: string;
    addedBy: string;
    customFields?: Record<string, any>;
  };
}

/**
 * Deal Participant
 * Defines who is involved in a deal/transaction
 */
export interface DealParticipant {
  dealId: string;
  dealType: string; // SALES, PURCHASE, TRADE, etc.
  dealNumber: string;
  
  // Primary parties
  participants: Array<{
    userId: string;
    userName: string;
    businessPartnerId: string;
    businessPartnerName: string;
    role: 'BUYER' | 'SELLER' | 'BROKER' | 'TRANSPORTER' | 'CONTROLLER' | 'OBSERVER';
    canView: boolean;
    canEdit: boolean;
    canApprove: boolean;
  }>;
  
  // Organization context (all participants must be visible to their org)
  organizationIds: string[];
  
  // Branch context
  branchIds: string[];
  
  // Visibility rules
  visibilityLevel: 'PRIVATE' | 'PARTICIPANTS_ONLY' | 'ORGANIZATION' | 'PUBLIC';
}

/**
 * Transaction Visibility Rules
 * Determines who can see what
 */
export interface TransactionVisibilityRules {
  // Core rule: Users can ONLY see transactions they are involved in
  baseRule: 'PARTICIPANT_ONLY';
  
  // Exceptions for specific roles
  exceptions: Array<{
    businessType: DynamicBusinessType;
    rule: 'OWN_ONLY' | 'TEAM_ONLY' | 'ALL_PARTNER' | 'ALL_BRANCH';
    conditions?: Array<{
      field: string;
      operator: 'EQUALS' | 'NOT_EQUALS' | 'IN' | 'NOT_IN';
      value: any;
    }>;
  }>;
  
  // Data masking rules (what fields to hide from non-primary participants)
  maskingRules: Array<{
    role: string;
    maskedFields: string[];
    reason: string;
  }>;
}

/**
 * Deal Access Control
 * Checks if user can access a specific deal
 */
export interface DealAccessControl {
  dealId: string;
  userId: string;
  businessPartnerId: string;
  businessType: DynamicBusinessType;
  
  // Access result
  canAccess: boolean;
  accessLevel: 'NONE' | 'READ' | 'WRITE' | 'APPROVE';
  reason: string;
  
  // What user can see
  visibleFields: string[];
  maskedFields: string[];
  
  // What actions user can perform
  allowedActions: DynamicPermissionAction[];
  restrictedActions: DynamicPermissionAction[];
}

/**
 * Module Registry
 * Central registry for all modules (system + custom)
 */
export class ModuleRegistry {
  private static modules: Map<string, DynamicModule> = new Map();
  private static permissions: Map<string, DynamicPermission> = new Map();
  
  /**
   * Register a new module
   */
  static registerModule(module: DynamicModule): void {
    if (this.modules.has(module.id)) {
      throw new Error(`Module ${module.id} already exists`);
    }
    this.modules.set(module.id, module);
  }
  
  /**
   * Register a new permission
   */
  static registerPermission(permission: DynamicPermission): void {
    if (this.permissions.has(permission.id)) {
      throw new Error(`Permission ${permission.id} already exists`);
    }
    this.permissions.set(permission.id, permission);
  }
  
  /**
   * Get all modules for a business type
   */
  static getModulesForBusinessType(businessType: DynamicBusinessType): DynamicModule[] {
    return Array.from(this.modules.values()).filter(
      module => module.isActive && module.availableFor.includes(businessType)
    );
  }
  
  /**
   * Get all permissions for a module and business type
   */
  static getPermissionsForModule(
    moduleId: string, 
    businessType: DynamicBusinessType
  ): DynamicPermission[] {
    return Array.from(this.permissions.values()).filter(
      permission => 
        permission.isActive &&
        permission.moduleId === moduleId &&
        permission.availableFor.includes(businessType)
    );
  }
  
  /**
   * Check if module exists
   */
  static hasModule(moduleId: string): boolean {
    return this.modules.has(moduleId);
  }
  
  /**
   * Get module by ID
   */
  static getModule(moduleId: string): DynamicModule | undefined {
    return this.modules.get(moduleId);
  }
  
  /**
   * Update module
   */
  static updateModule(moduleId: string, updates: Partial<DynamicModule>): void {
    const module = this.modules.get(moduleId);
    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }
    this.modules.set(moduleId, { ...module, ...updates });
  }
  
  /**
   * Deactivate module (soft delete)
   */
  static deactivateModule(moduleId: string): void {
    const module = this.modules.get(moduleId);
    if (module) {
      module.isActive = false;
      this.modules.set(moduleId, module);
    }
  }
  
  /**
   * Export all modules (for backup/migration)
   */
  static exportModules(): DynamicModule[] {
    return Array.from(this.modules.values());
  }
  
  /**
   * Import modules (for restore/migration)
   */
  static importModules(modules: DynamicModule[]): void {
    modules.forEach(module => {
      this.modules.set(module.id, module);
    });
  }
}

/**
 * Deal Access Service
 * Manages deal-level access control
 */
export class DealAccessService {
  
  /**
   * Check if user can access a deal
   */
  static canAccessDeal(
    dealId: string,
    userId: string,
    businessPartnerId: string,
    businessType: DynamicBusinessType,
    participants: DealParticipant['participants']
  ): DealAccessControl {
    
    // Check if user is a participant
    const userParticipation = participants.find(
      p => p.userId === userId || p.businessPartnerId === businessPartnerId
    );
    
    if (!userParticipation) {
      return {
        dealId,
        userId,
        businessPartnerId,
        businessType,
        canAccess: false,
        accessLevel: 'NONE',
        reason: 'User is not a participant in this deal',
        visibleFields: [],
        maskedFields: [],
        allowedActions: [],
        restrictedActions: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'EXPORT'],
      };
    }
    
    // Determine access level based on role
    let accessLevel: DealAccessControl['accessLevel'] = 'NONE';
    if (userParticipation.canApprove) {
      accessLevel = 'APPROVE';
    } else if (userParticipation.canEdit) {
      accessLevel = 'WRITE';
    } else if (userParticipation.canView) {
      accessLevel = 'READ';
    }
    
    // Determine visible and masked fields based on role
    const { visibleFields, maskedFields } = this.getFieldVisibility(
      userParticipation.role,
      businessType
    );
    
    // Determine allowed actions
    const allowedActions = this.getAllowedActions(accessLevel);
    const allActions: DynamicPermissionAction[] = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'EXPORT'];
    const restrictedActions = allActions.filter(a => !allowedActions.includes(a));
    
    return {
      dealId,
      userId,
      businessPartnerId,
      businessType,
      canAccess: true,
      accessLevel,
      reason: `User is ${userParticipation.role} in this deal`,
      visibleFields,
      maskedFields,
      allowedActions,
      restrictedActions,
    };
  }
  
  /**
   * Get field visibility based on role
   */
  private static getFieldVisibility(
    role: DealParticipant['participants'][0]['role'],
    businessType: DynamicBusinessType
  ): { visibleFields: string[]; maskedFields: string[] } {
    
    // Define fields that should be masked for non-primary participants
    const sensitivePricingFields = [
      'sellerCost',
      'buyerMargin',
      'sellerMargin',
      'commission',
      'netProfit',
    ];
    
    const sensitiveBankFields = [
      'sellerBankAccount',
      'buyerBankAccount',
      'paymentDetails',
    ];
    
    const sensitivePartyFields = [
      'otherDealsWithParty',
      'partyFinancialHistory',
      'partyCreditLimit',
    ];
    
    // BUYER: Can see all their fields, but not seller's sensitive data
    if (businessType === 'BUYER' || role === 'BUYER') {
      return {
        visibleFields: ['*'], // All fields
        maskedFields: [
          'sellerCost',
          'sellerMargin',
          'sellerBankAccount',
          'sellerFinancialHistory',
        ],
      };
    }
    
    // SELLER: Can see all their fields, but not buyer's sensitive data
    if (businessType === 'SELLER' || role === 'SELLER') {
      return {
        visibleFields: ['*'],
        maskedFields: [
          'buyerCost',
          'buyerMargin',
          'buyerBankAccount',
          'buyerFinancialHistory',
        ],
      };
    }
    
    // TRADER: Can see their own trades, but not other traders' margins
    if (businessType === 'TRADER') {
      return {
        visibleFields: ['*'],
        maskedFields: [
          'otherTraderMargins',
          'competitorPricing',
        ],
      };
    }
    
    // BROKER: Can see limited information
    if (businessType === 'SUB_BROKER' || role === 'BROKER') {
      return {
        visibleFields: [
          'dealNumber',
          'dealDate',
          'commodity',
          'quantity',
          'dealValue',
          'commissionAmount',
          'commissionPercentage',
          'paymentStatus',
        ],
        maskedFields: [
          ...sensitivePricingFields,
          ...sensitiveBankFields,
          ...sensitivePartyFields,
        ],
      };
    }
    
    // TRANSPORTER: Can see logistics information only
    if (businessType === 'TRANSPORTER' || role === 'TRANSPORTER') {
      return {
        visibleFields: [
          'dealNumber',
          'commodity',
          'quantity',
          'pickupAddress',
          'deliveryAddress',
          'deliveryDate',
          'freightCharges',
          'vehicleNumber',
          'driverDetails',
        ],
        maskedFields: [
          ...sensitivePricingFields,
          ...sensitiveBankFields,
          ...sensitivePartyFields,
          'dealValue',
          'margin',
        ],
      };
    }
    
    // CONTROLLER: Can see quality information only
    if (businessType === 'CONTROLLER' || role === 'CONTROLLER') {
      return {
        visibleFields: [
          'dealNumber',
          'commodity',
          'quantity',
          'qualityParameters',
          'testResults',
          'certificationDetails',
          'inspectionDate',
        ],
        maskedFields: [
          ...sensitivePricingFields,
          ...sensitiveBankFields,
          ...sensitivePartyFields,
          'dealValue',
          'paymentTerms',
        ],
      };
    }
    
    // Default: Observer role - minimal visibility
    return {
      visibleFields: [
        'dealNumber',
        'dealDate',
        'status',
      ],
      maskedFields: ['*'], // Mask everything else
    };
  }
  
  /**
   * Get allowed actions based on access level
   */
  private static getAllowedActions(
    accessLevel: DealAccessControl['accessLevel']
  ): DynamicPermissionAction[] {
    switch (accessLevel) {
      case 'APPROVE':
        return ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'EXPORT'];
      case 'WRITE':
        return ['CREATE', 'READ', 'UPDATE', 'EXPORT'];
      case 'READ':
        return ['READ', 'EXPORT'];
      case 'NONE':
      default:
        return [];
    }
  }
  
  /**
   * Filter deals based on user participation
   */
  static filterDealsByParticipation(
    deals: Array<{ id: string; participants: DealParticipant['participants'] }>,
    userId: string,
    businessPartnerId: string
  ): string[] {
    return deals
      .filter(deal => 
        deal.participants.some(
          p => p.userId === userId || p.businessPartnerId === businessPartnerId
        )
      )
      .map(deal => deal.id);
  }
  
  /**
   * Get user's deals with filters
   */
  static getUserDeals(
    allDeals: Array<any>,
    userId: string,
    businessPartnerId: string,
    filters?: {
      role?: DealParticipant['participants'][0]['role'];
      dealType?: string;
      status?: string;
      fromDate?: string;
      toDate?: string;
    }
  ): Array<any> {
    
    let userDeals = allDeals.filter(deal =>
      deal.participants?.some(
        (p: any) => p.userId === userId || p.businessPartnerId === businessPartnerId
      )
    );
    
    // Apply filters
    if (filters?.role) {
      userDeals = userDeals.filter(deal =>
        deal.participants?.some(
          (p: any) => 
            (p.userId === userId || p.businessPartnerId === businessPartnerId) &&
            p.role === filters.role
        )
      );
    }
    
    if (filters?.dealType) {
      userDeals = userDeals.filter(deal => deal.dealType === filters.dealType);
    }
    
    if (filters?.status) {
      userDeals = userDeals.filter(deal => deal.status === filters.status);
    }
    
    if (filters?.fromDate) {
      userDeals = userDeals.filter(deal => deal.date >= filters.fromDate);
    }
    
    if (filters?.toDate) {
      userDeals = userDeals.filter(deal => deal.date <= filters.toDate);
    }
    
    return userDeals;
  }
  
  /**
   * Mask sensitive fields in deal data
   */
  static maskDealData(
    dealData: any,
    maskedFields: string[]
  ): any {
    const maskedData = { ...dealData };
    
    // If masking all fields except specific ones
    if (maskedFields.includes('*')) {
      // This means mask everything - implementation depends on visibleFields
      return maskedData;
    }
    
    // Mask specific fields
    maskedFields.forEach(field => {
      if (field in maskedData) {
        maskedData[field] = '***MASKED***';
      }
    });
    
    return maskedData;
  }
}

/**
 * Trader-Specific Rules
 * Traders can see trades between their partners, but not other traders' deals
 */
export class TraderAccessRules {
  
  /**
   * Check if trader can see a deal between two parties
   */
  static canTraderSeeDeal(
    traderId: string,
    traderBusinessPartnerId: string,
    deal: {
      id: string;
      buyerId: string;
      sellerId: string;
      participants: DealParticipant['participants'];
    }
  ): boolean {
    
    // Trader can see deal if they are involved as buyer OR seller OR broker
    const isParticipant = deal.participants.some(
      p => p.userId === traderId || p.businessPartnerId === traderBusinessPartnerId
    );
    
    return isParticipant;
  }
  
  /**
   * Get trader's interaction network
   * Returns list of business partners trader has done deals with
   */
  static getTraderInteractionNetwork(
    traderId: string,
    traderBusinessPartnerId: string,
    allDeals: Array<any>
  ): Array<{
    businessPartnerId: string;
    businessPartnerName: string;
    dealCount: number;
    totalValue: number;
    lastDealDate: string;
  }> {
    
    // Get all deals where trader is involved
    const traderDeals = allDeals.filter(deal =>
      deal.participants?.some(
        (p: any) => p.userId === traderId || p.businessPartnerId === traderBusinessPartnerId
      )
    );
    
    // Group by business partner
    const networkMap = new Map<string, any>();
    
    traderDeals.forEach(deal => {
      deal.participants?.forEach((p: any) => {
        // Skip self
        if (p.businessPartnerId === traderBusinessPartnerId) {
          return;
        }
        
        if (!networkMap.has(p.businessPartnerId)) {
          networkMap.set(p.businessPartnerId, {
            businessPartnerId: p.businessPartnerId,
            businessPartnerName: p.businessPartnerName,
            dealCount: 0,
            totalValue: 0,
            lastDealDate: deal.date,
          });
        }
        
        const entry = networkMap.get(p.businessPartnerId);
        entry.dealCount++;
        entry.totalValue += deal.value || 0;
        if (deal.date > entry.lastDealDate) {
          entry.lastDealDate = deal.date;
        }
      });
    });
    
    return Array.from(networkMap.values());
  }
  
  /**
   * Check if trader can initiate deal between two parties
   */
  static canInitiateDealBetween(
    traderId: string,
    traderBusinessPartnerId: string,
    buyerId: string,
    sellerId: string,
    traderNetwork: Array<{ businessPartnerId: string }>
  ): { allowed: boolean; reason: string } {
    
    // Trader can initiate deal only with partners in their network
    const hasBuyerRelation = traderNetwork.some(
      n => n.businessPartnerId === buyerId
    );
    
    const hasSellerRelation = traderNetwork.some(
      n => n.businessPartnerId === sellerId
    );
    
    if (!hasBuyerRelation && !hasSellerRelation) {
      return {
        allowed: false,
        reason: 'You must have prior business relationship with at least one party',
      };
    }
    
    return {
      allowed: true,
      reason: 'Trader has business relationship with parties',
    };
  }
}

/**
 * Initialize System Modules
 * Register default modules that come with the system
 */
export function initializeSystemModules(): void {
  
  // Trade Modules
  ModuleRegistry.registerModule({
    id: 'sales_contracts',
    name: 'sales_contracts',
    displayName: 'Sales Contracts',
    description: 'Manage sales contracts and agreements',
    category: 'TRADE',
    icon: 'file-contract',
    path: '/trade/sales-contracts',
    availableFor: ['SELLER', 'TRADER'],
    isSystem: true,
    isActive: true,
    metadata: {
      version: '1.0.0',
      addedDate: new Date().toISOString(),
      addedBy: 'SYSTEM',
      lastModified: new Date().toISOString(),
    },
  });
  
  ModuleRegistry.registerModule({
    id: 'purchase_orders',
    name: 'purchase_orders',
    displayName: 'Purchase Orders',
    description: 'Manage purchase orders',
    category: 'TRADE',
    icon: 'shopping-cart',
    path: '/trade/purchase-orders',
    availableFor: ['BUYER', 'TRADER'],
    isSystem: true,
    isActive: true,
    metadata: {
      version: '1.0.0',
      addedDate: new Date().toISOString(),
      addedBy: 'SYSTEM',
      lastModified: new Date().toISOString(),
    },
  });
  
  // More modules can be added similarly...
}

/**
 * Add Custom Module (Future modules)
 */
export function addCustomModule(
  module: Omit<DynamicModule, 'isSystem' | 'isActive' | 'metadata'>
): void {
  ModuleRegistry.registerModule({
    ...module,
    isSystem: false,
    isActive: true,
    metadata: {
      version: '1.0.0',
      addedDate: new Date().toISOString(),
      addedBy: 'ADMIN', // Should be actual user
      lastModified: new Date().toISOString(),
    },
  });
}

/**
 * Add Custom Permission (Future permissions)
 */
export function addCustomPermission(
  permission: Omit<DynamicPermission, 'isActive' | 'metadata'>
): void {
  ModuleRegistry.registerPermission({
    ...permission,
    isActive: true,
    metadata: {
      addedDate: new Date().toISOString(),
      addedBy: 'ADMIN', // Should be actual user
    },
  });
}
