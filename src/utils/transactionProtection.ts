/**
 * Transaction Protection System
 * Ensures data integrity for active transactions
 * Prevents amendments that could affect ongoing deals
 */

export type TransactionStatus = 
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ON_HOLD';

export type TransactionType =
  | 'SALES_CONTRACT'
  | 'PURCHASE_ORDER'
  | 'INVOICE'
  | 'PAYMENT'
  | 'RECEIPT'
  | 'DELIVERY_ORDER'
  | 'QUALITY_CERTIFICATE';

export type LockType = 'READ_ONLY' | 'PARTIAL_LOCK' | 'FULL_LOCK';

/**
 * Transaction Lock Configuration
 * Defines which fields are locked during active transactions
 */
export interface TransactionLockConfig {
  transactionType: TransactionType;
  statuses: TransactionStatus[];
  
  // Fields that are LOCKED (cannot be modified)
  lockedFields: {
    critical: string[]; // Never modifiable (price, quantity, terms)
    financial: string[]; // Locked after approval (GST, bank details)
    party: string[]; // Locked after start (buyer, seller details)
    documents: string[]; // Locked documents
  };
  
  // Fields that can be modified with approval
  modifiableWithApproval: {
    fields: string[];
    requiredRole: string[]; // Roles that can approve
    requiresReason: boolean;
    notifyParties: boolean;
  };
  
  // Fields that can be freely modified
  alwaysModifiable: string[];
}

/**
 * Transaction Lock Status
 * Current lock state of a transaction
 */
export interface TransactionLock {
  id: string;
  transactionId: string;
  transactionType: TransactionType;
  transactionNumber: string;
  transactionStatus: TransactionStatus;
  
  // Lock details
  lockType: LockType;
  isLocked: boolean;
  lockedFields: string[];
  lockedReason: string;
  lockedAt: string;
  lockedBy: string;
  
  // Auto-unlock conditions
  autoUnlockWhen: TransactionStatus[]; // Unlock when status changes to these
  manualUnlockRequired: boolean;
  
  // Related entities also locked
  lockedEntities: Array<{
    entityType: 'BUSINESS_PARTNER' | 'BRANCH' | 'USER' | 'DOCUMENT';
    entityId: string;
    lockedFields: string[];
  }>;
  
  // Override tracking
  overrides: Array<{
    id: string;
    overriddenBy: string;
    overriddenByName: string;
    overriddenByRole: string;
    overriddenAt: string;
    reason: string;
    approvedBy?: string; // Secondary approval
    approvedAt?: string;
    fields: string[];
    oldValues: Record<string, any>;
    newValues: Record<string, any>;
  }>;
}

/**
 * Lock Configurations for Different Transaction Types
 */
export const TRANSACTION_LOCK_CONFIGS: Record<TransactionType, TransactionLockConfig> = {
  
  SALES_CONTRACT: {
    transactionType: 'SALES_CONTRACT',
    statuses: ['APPROVED', 'IN_PROGRESS'],
    
    lockedFields: {
      critical: [
        'buyerId',
        'sellerId',
        'commodity',
        'quantity',
        'price',
        'totalAmount',
        'deliveryTerms',
        'paymentTerms',
        'validityDate',
      ],
      financial: [
        'gstRate',
        'gstAmount',
        'bankAccountId',
        'paymentMethod',
        'advanceAmount',
      ],
      party: [
        'buyerName',
        'buyerAddress',
        'buyerGST',
        'sellerName',
        'sellerAddress',
        'sellerGST',
      ],
      documents: [
        'contractDocument',
        'signedAgreement',
        'stampedCopy',
      ],
    },
    
    modifiableWithApproval: {
      fields: [
        'contactPerson',
        'contactPhone',
        'contactEmail',
        'deliveryAddress', // Only if delivery not started
        'additionalTerms',
      ],
      requiredRole: ['BACK_OFFICE_MANAGER', 'SUPER_ADMIN'],
      requiresReason: true,
      notifyParties: true,
    },
    
    alwaysModifiable: [
      'notes',
      'internalComments',
      'statusUpdates',
      'communicationLog',
    ],
  },

  PURCHASE_ORDER: {
    transactionType: 'PURCHASE_ORDER',
    statuses: ['APPROVED', 'IN_PROGRESS'],
    
    lockedFields: {
      critical: [
        'supplierId',
        'items',
        'quantities',
        'rates',
        'totalValue',
        'deliveryDate',
        'deliveryLocation',
      ],
      financial: [
        'gstRate',
        'gstAmount',
        'paymentTerms',
        'advancePayment',
      ],
      party: [
        'supplierName',
        'supplierAddress',
        'supplierGST',
        'supplierPAN',
      ],
      documents: [
        'purchaseOrderDocument',
        'supplierAgreement',
      ],
    },
    
    modifiableWithApproval: {
      fields: [
        'contactPerson',
        'contactDetails',
        'deliveryInstructions',
      ],
      requiredRole: ['OPERATIONS_TEAM', 'BACK_OFFICE_MANAGER', 'SUPER_ADMIN'],
      requiresReason: true,
      notifyParties: true,
    },
    
    alwaysModifiable: [
      'notes',
      'trackingUpdates',
      'communicationLog',
    ],
  },

  INVOICE: {
    transactionType: 'INVOICE',
    statuses: ['APPROVED', 'IN_PROGRESS', 'COMPLETED'],
    
    lockedFields: {
      critical: [
        'invoiceNumber',
        'invoiceDate',
        'customerId',
        'customerName',
        'customerGST',
        'items',
        'quantities',
        'rates',
        'subtotal',
        'gstAmount',
        'totalAmount',
      ],
      financial: [
        'bankAccountDetails',
        'paymentDueDate',
        'paymentTerms',
      ],
      party: [
        'billingAddress',
        'shippingAddress',
        'customerPAN',
      ],
      documents: [
        'invoiceDocument',
        'eInvoiceIRN',
        'eWayBill',
      ],
    },
    
    modifiableWithApproval: {
      fields: [], // Invoices generally cannot be modified, only credit note can be issued
      requiredRole: ['ACCOUNTS_TEAM', 'BACK_OFFICE_MANAGER', 'SUPER_ADMIN'],
      requiresReason: true,
      notifyParties: true,
    },
    
    alwaysModifiable: [
      'notes',
      'paymentStatus',
      'paymentReceivedDate',
    ],
  },

  PAYMENT: {
    transactionType: 'PAYMENT',
    statuses: ['APPROVED', 'COMPLETED'],
    
    lockedFields: {
      critical: [
        'paymentAmount',
        'paymentDate',
        'paymentMode',
        'beneficiaryId',
        'beneficiaryName',
        'beneficiaryAccount',
        'transactionReference',
      ],
      financial: [
        'bankAccountUsed',
        'gstTDS',
        'netAmount',
      ],
      party: [
        'beneficiaryDetails',
      ],
      documents: [
        'paymentReceipt',
        'bankStatement',
      ],
    },
    
    modifiableWithApproval: {
      fields: [], // Payments cannot be modified, only reversed
      requiredRole: ['ACCOUNTS_TEAM', 'BACK_OFFICE_MANAGER', 'SUPER_ADMIN'],
      requiresReason: true,
      notifyParties: true,
    },
    
    alwaysModifiable: [
      'notes',
      'reconciliationStatus',
    ],
  },

  RECEIPT: {
    transactionType: 'RECEIPT',
    statuses: ['APPROVED', 'COMPLETED'],
    
    lockedFields: {
      critical: [
        'receiptAmount',
        'receiptDate',
        'receiptMode',
        'customerId',
        'customerName',
        'transactionReference',
      ],
      financial: [
        'bankAccountReceived',
        'gstTDS',
        'netAmount',
      ],
      party: [
        'customerDetails',
      ],
      documents: [
        'receiptDocument',
        'bankStatement',
      ],
    },
    
    modifiableWithApproval: {
      fields: [], // Receipts cannot be modified
      requiredRole: ['ACCOUNTS_TEAM', 'BACK_OFFICE_MANAGER', 'SUPER_ADMIN'],
      requiresReason: true,
      notifyParties: true,
    },
    
    alwaysModifiable: [
      'notes',
      'reconciliationStatus',
    ],
  },

  DELIVERY_ORDER: {
    transactionType: 'DELIVERY_ORDER',
    statuses: ['APPROVED', 'IN_PROGRESS'],
    
    lockedFields: {
      critical: [
        'orderId',
        'customerId',
        'items',
        'quantities',
        'deliveryAddress',
        'deliveryDate',
      ],
      financial: [
        'freightCharges',
        'insuranceCharges',
      ],
      party: [
        'customerDetails',
        'transporterDetails',
      ],
      documents: [
        'deliveryOrderDocument',
        'lrCopy',
      ],
    },
    
    modifiableWithApproval: {
      fields: [
        'deliveryDate', // Only if not dispatched
        'transporterDetails', // Only before dispatch
        'deliveryInstructions',
      ],
      requiredRole: ['OPERATIONS_TEAM', 'BACK_OFFICE_MANAGER', 'SUPER_ADMIN'],
      requiresReason: true,
      notifyParties: true,
    },
    
    alwaysModifiable: [
      'notes',
      'trackingStatus',
      'deliveryUpdates',
    ],
  },

  QUALITY_CERTIFICATE: {
    transactionType: 'QUALITY_CERTIFICATE',
    statuses: ['APPROVED', 'COMPLETED'],
    
    lockedFields: {
      critical: [
        'certificateNumber',
        'certificateDate',
        'sampleId',
        'commodity',
        'testResults',
        'qualityParameters',
        'certifiedBy',
        'certifiedDate',
      ],
      financial: [],
      party: [
        'supplierDetails',
        'buyerDetails',
      ],
      documents: [
        'certificateDocument',
        'testReports',
        'labReports',
      ],
    },
    
    modifiableWithApproval: {
      fields: [], // Quality certificates cannot be modified once approved
      requiredRole: ['SUPER_ADMIN'],
      requiresReason: true,
      notifyParties: true,
    },
    
    alwaysModifiable: [
      'notes',
    ],
  },
};

/**
 * Check if field is locked for transaction
 */
export function isFieldLocked(
  transactionType: TransactionType,
  transactionStatus: TransactionStatus,
  fieldName: string
): boolean {
  const config = TRANSACTION_LOCK_CONFIGS[transactionType];
  
  // Check if transaction status triggers lock
  if (!config.statuses.includes(transactionStatus)) {
    return false; // Transaction not in locked status
  }
  
  // Check if field is in locked categories
  const allLockedFields = [
    ...config.lockedFields.critical,
    ...config.lockedFields.financial,
    ...config.lockedFields.party,
    ...config.lockedFields.documents,
  ];
  
  return allLockedFields.includes(fieldName);
}

/**
 * Check if field can be modified with approval
 */
export function canModifyWithApproval(
  transactionType: TransactionType,
  fieldName: string,
  userRole: string
): { allowed: boolean; requiresApproval: boolean; requiredRoles: string[] } {
  const config = TRANSACTION_LOCK_CONFIGS[transactionType];
  
  // Check if field is always modifiable
  if (config.alwaysModifiable.includes(fieldName)) {
    return { allowed: true, requiresApproval: false, requiredRoles: [] };
  }
  
  // Check if field can be modified with approval
  if (config.modifiableWithApproval.fields.includes(fieldName)) {
    const allowed = config.modifiableWithApproval.requiredRole.includes(userRole);
    return {
      allowed,
      requiresApproval: true,
      requiredRoles: config.modifiableWithApproval.requiredRole,
    };
  }
  
  // Check if field is locked
  if (isFieldLocked(transactionType, 'APPROVED', fieldName)) {
    // Only Super Admin can override with emergency protocol
    return {
      allowed: userRole === 'SUPER_ADMIN',
      requiresApproval: true,
      requiredRoles: ['SUPER_ADMIN'],
    };
  }
  
  return { allowed: true, requiresApproval: false, requiredRoles: [] };
}

/**
 * Emergency Override Request
 * For critical situations where locked fields must be modified
 */
export interface EmergencyOverride {
  id: string;
  transactionId: string;
  transactionType: TransactionType;
  transactionNumber: string;
  
  // Override details
  requestedBy: string;
  requestedByName: string;
  requestedByRole: string;
  requestedAt: string;
  
  // What needs to be changed
  fieldsToModify: Array<{
    field: string;
    currentValue: any;
    proposedValue: any;
    reason: string;
  }>;
  
  // Justification
  reason: string;
  urgency: 'MEDIUM' | 'HIGH' | 'CRITICAL';
  businessImpact: string;
  
  // Approval workflow
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  primaryApprover?: string; // Super Admin
  primaryApprovedAt?: string;
  secondaryApprover?: string; // Another Super Admin for verification
  secondaryApprovedAt?: string;
  
  // MFA verification
  mfaVerified: boolean;
  mfaVerifiedAt?: string;
  
  // Implementation
  implementedAt?: string;
  implementedBy?: string;
  
  // Notifications sent
  notificationsSent: Array<{
    recipientId: string;
    recipientEmail: string;
    sentAt: string;
    channel: 'EMAIL' | 'SMS' | 'IN_APP';
  }>;
  
  // Rejection
  rejectionReason?: string;
  rejectedAt?: string;
}

/**
 * Create emergency override request
 */
export function createEmergencyOverride(
  transactionId: string,
  fields: EmergencyOverride['fieldsToModify'],
  reason: string,
  urgency: EmergencyOverride['urgency'],
  businessImpact: string,
  requestedBy: string
): EmergencyOverride {
  return {
    id: `EMG-${Date.now()}`,
    transactionId,
    transactionType: 'SALES_CONTRACT', // Will be fetched from transaction
    transactionNumber: '', // Will be fetched
    requestedBy,
    requestedByName: '', // Will be fetched
    requestedByRole: 'SUPER_ADMIN', // Must be Super Admin
    requestedAt: new Date().toISOString(),
    fieldsToModify: fields,
    reason,
    urgency,
    businessImpact,
    status: 'PENDING',
    mfaVerified: false,
    notificationsSent: [],
  };
}

/**
 * Validate emergency override request
 */
export function validateEmergencyOverride(
  override: EmergencyOverride
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check if requester is Super Admin
  if (override.requestedByRole !== 'SUPER_ADMIN') {
    errors.push('Only Super Admin can request emergency overrides');
  }
  
  // Check if reason is provided
  if (!override.reason || override.reason.length < 50) {
    errors.push('Detailed reason (minimum 50 characters) is required');
  }
  
  // Check if business impact is provided
  if (!override.businessImpact || override.businessImpact.length < 50) {
    errors.push('Business impact description (minimum 50 characters) is required');
  }
  
  // Check if fields are provided
  if (!override.fieldsToModify || override.fieldsToModify.length === 0) {
    errors.push('At least one field must be specified for modification');
  }
  
  // Check if each field has reason
  override.fieldsToModify.forEach((field, index) => {
    if (!field.reason || field.reason.length < 20) {
      errors.push(`Field ${index + 1} (${field.field}) requires detailed reason (minimum 20 characters)`);
    }
  });
  
  // Check urgency
  if (!['MEDIUM', 'HIGH', 'CRITICAL'].includes(override.urgency)) {
    errors.push('Valid urgency level must be specified');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get impact of modifying locked fields
 */
export function getModificationImpact(
  transactionType: TransactionType,
  fields: string[]
): {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedAreas: string[];
  requiredActions: string[];
  warnings: string[];
} {
  const config = TRANSACTION_LOCK_CONFIGS[transactionType];
  const impact = {
    riskLevel: 'LOW' as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    affectedAreas: [] as string[],
    requiredActions: [] as string[],
    warnings: [] as string[],
  };
  
  // Check critical fields
  const criticalFieldsAffected = fields.filter(f => 
    config.lockedFields.critical.includes(f)
  );
  if (criticalFieldsAffected.length > 0) {
    impact.riskLevel = 'CRITICAL';
    impact.affectedAreas.push('Transaction critical terms');
    impact.requiredActions.push('Notify all parties immediately');
    impact.requiredActions.push('Obtain written consent from all parties');
    impact.warnings.push('May require contract renegotiation');
  }
  
  // Check financial fields
  const financialFieldsAffected = fields.filter(f => 
    config.lockedFields.financial.includes(f)
  );
  if (financialFieldsAffected.length > 0) {
    impact.riskLevel = impact.riskLevel === 'CRITICAL' ? 'CRITICAL' : 'HIGH';
    impact.affectedAreas.push('Financial terms and accounting');
    impact.requiredActions.push('Update accounting entries');
    impact.requiredActions.push('Recalculate GST and taxes');
    impact.warnings.push('May affect financial reports');
  }
  
  // Check party fields
  const partyFieldsAffected = fields.filter(f => 
    config.lockedFields.party.includes(f)
  );
  if (partyFieldsAffected.length > 0) {
    impact.riskLevel = impact.riskLevel === 'LOW' ? 'MEDIUM' : impact.riskLevel;
    impact.affectedAreas.push('Party information');
    impact.requiredActions.push('Update party records');
    impact.requiredActions.push('Verify new information');
    impact.warnings.push('Ensure party consent is obtained');
  }
  
  return impact;
}
