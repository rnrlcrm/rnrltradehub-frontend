/**
 * Smart Contract Business Logic Module
 * 
 * This module provides automated contract processing with business rules,
 * manual override capabilities, and workflow escalation support.
 */

import { SalesContract } from '../types';

// Business Rule Types
export type RuleType = 
  | 'VALIDATION'      // Validate contract data
  | 'APPROVAL'        // Auto-approve or require manual approval
  | 'PRICING'         // Price validation and adjustment
  | 'QUANTITY'        // Quantity limits and validation
  | 'CREDIT'          // Credit limit checks
  | 'COMPLIANCE';     // Compliance and regulatory checks

export type RuleSeverity = 'ERROR' | 'WARNING' | 'INFO';

export type RuleCondition = {
  field: string;
  operator: 'equals' | 'greaterThan' | 'lessThan' | 'contains' | 'between';
  value: string | number | boolean;
  value2?: string | number; // For 'between' operator
};

export type BusinessRule = {
  id: string;
  name: string;
  description: string;
  type: RuleType;
  severity: RuleSeverity;
  enabled: boolean;
  conditions: RuleCondition[];
  action: 'BLOCK' | 'WARN' | 'AUTO_APPROVE' | 'ESCALATE';
  escalateTo?: string; // Role to escalate to
  compensatingAction?: string; // Action to take if rule fails
};

// Rule Evaluation Result
export type RuleEvaluationResult = {
  ruleId: string;
  ruleName: string;
  passed: boolean;
  severity: RuleSeverity;
  message: string;
  action: BusinessRule['action'];
  requiresOverride: boolean;
  escalateTo?: string;
};

// Contract Lifecycle States - Enhanced for Full Trade Cycle
export type ContractLifecycleState = 
  | 'DRAFT'
  | 'PENDING_VALIDATION'
  | 'VALIDATION_FAILED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'ACTIVE'
  // Execution phase - detailed trade cycle
  | 'AWAITING_QUALITY_PASSING'  // Optional quality check
  | 'QUALITY_PASSED'
  | 'QUALITY_FAILED'
  | 'AWAITING_DELIVERY'
  | 'PARTIAL_DELIVERY'
  | 'DELIVERED'
  | 'AWAITING_PAYMENT'
  | 'PARTIAL_PAYMENT'
  | 'PAYMENT_RECEIVED'
  | 'RECONCILIATION_PENDING'
  | 'RECONCILED'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'CANCELLED'
  | 'AMENDED';

// Lifecycle Event
export type LifecycleEvent = {
  id: string;
  contractId: string;
  timestamp: string;
  fromState: ContractLifecycleState | null;
  toState: ContractLifecycleState;
  triggeredBy: 'SYSTEM' | 'USER';
  actor: string; // User name or 'SYSTEM'
  reason: string;
  automated: boolean;
  overridden?: boolean;
  metadata?: Record<string, string | number | boolean>;
};

// Manual Override Request
export type OverrideRequest = {
  id: string;
  contractId: string;
  ruleId: string;
  ruleName: string;
  requestedBy: string;
  requestedAt: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
};

// Escalation
export type Escalation = {
  id: string;
  contractId: string;
  type: 'EXCEPTION' | 'APPROVAL_REQUIRED' | 'MANUAL_REVIEW';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  escalatedTo: string; // Role
  escalatedAt: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolution?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
};

// Automated Notification/Reminder System
export type NotificationType = 
  | 'PAYMENT_DUE'
  | 'DELIVERY_PENDING'
  | 'QUALITY_CHECK_REQUIRED'
  | 'RECONCILIATION_PENDING'
  | 'CONTRACT_EXPIRING'
  | 'DISPUTE_RAISED'
  | 'STATE_CHANGE'
  | 'APPROVAL_REQUIRED'
  | 'OVERRIDE_REQUESTED';

export type NotificationChannel = 'CHAT' | 'EMAIL' | 'SMS' | 'WHATSAPP' | 'DASHBOARD';

export type AutomatedNotification = {
  id: string;
  contractId: string;
  type: NotificationType;
  recipient: string; // User or role
  recipientType: 'BUYER' | 'SELLER' | 'ADMIN' | 'BOTH_PARTIES';
  channel: NotificationChannel[];
  message: string;
  scheduledAt: string;
  sentAt?: string;
  status: 'SCHEDULED' | 'SENT' | 'FAILED' | 'CANCELLED';
  metadata?: Record<string, string | number | boolean>;
};

// Trade Type Specific Configuration
export type TradeTypeConfig = {
  tradeType: 'Normal Trade' | 'CCI Trade';
  requiresQualityPassing: boolean;
  requiresEMDPayment: boolean;
  automaticReminders: {
    paymentDueDays: number[];
    deliveryReminderDays: number[];
    qualityCheckDays: number[];
  };
  workflowSteps: ContractLifecycleState[];
};

// Complete Trade Cycle Tracker
export type TradeCycleStatus = {
  contractId: string;
  contractNo: string;
  tradeType: 'Normal Trade' | 'CCI Trade';
  currentState: ContractLifecycleState;
  
  // Contract phase
  contractCreated: boolean;
  contractApproved: boolean;
  
  // Quality phase (optional for Normal Trade)
  qualityCheckRequired: boolean;
  qualityCheckPassed?: boolean;
  qualityCheckDate?: string;
  
  // Delivery phase
  deliveryOrders: {
    doNo: string;
    quantity: number;
    date: string;
    status: string;
  }[];
  totalDelivered: number;
  deliveryComplete: boolean;
  
  // Payment phase
  invoices: {
    invoiceNo: string;
    amount: number;
    date: string;
    status: string;
  }[];
  payments: {
    paymentId: string;
    amount: number;
    date: string;
    method: string;
  }[];
  totalInvoiced: number;
  totalPaid: number;
  paymentComplete: boolean;
  
  // Reconciliation phase
  reconciled: boolean;
  reconciliationDate?: string;
  
  // Dispute tracking
  disputes: {
    disputeId: string;
    reason: string;
    status: string;
    raisedDate: string;
  }[];
  
  // Transparency flags
  buyerCanView: boolean;
  sellerCanView: boolean;
  lastUpdated: string;
  nextReminderDue?: string;
};

// Default Business Rules
export const DEFAULT_BUSINESS_RULES: BusinessRule[] = [
  {
    id: 'rule_001',
    name: 'Minimum Rate Validation',
    description: 'Ensure contract rate is above minimum threshold',
    type: 'PRICING',
    severity: 'WARNING',
    enabled: true,
    conditions: [
      { field: 'rate', operator: 'lessThan', value: 5000 }
    ],
    action: 'WARN',
  },
  {
    id: 'rule_002',
    name: 'Maximum Quantity Check',
    description: 'Flag contracts exceeding 1000 bales for review',
    type: 'QUANTITY',
    severity: 'WARNING',
    enabled: true,
    conditions: [
      { field: 'quantityBales', operator: 'greaterThan', value: 1000 }
    ],
    action: 'ESCALATE',
    escalateTo: 'Admin',
  },
  {
    id: 'rule_003',
    name: 'Required Fields Validation',
    description: 'Ensure all mandatory fields are filled',
    type: 'VALIDATION',
    severity: 'ERROR',
    enabled: true,
    conditions: [
      { field: 'clientId', operator: 'equals', value: '' },
      { field: 'vendorId', operator: 'equals', value: '' },
    ],
    action: 'BLOCK',
  },
  {
    id: 'rule_004',
    name: 'Auto-Approve Small Contracts',
    description: 'Auto-approve contracts under 100 bales with standard terms',
    type: 'APPROVAL',
    severity: 'INFO',
    enabled: true,
    conditions: [
      { field: 'quantityBales', operator: 'lessThan', value: 100 },
      { field: 'bargainType', operator: 'equals', value: 'Pucca Sauda' },
    ],
    action: 'AUTO_APPROVE',
  },
  {
    id: 'rule_005',
    name: 'Quality Specs Validation',
    description: 'Ensure quality specifications are within acceptable ranges',
    type: 'COMPLIANCE',
    severity: 'WARNING',
    enabled: true,
    conditions: [
      { field: 'qualitySpecs.length', operator: 'between', value: 20, value2: 35 },
    ],
    action: 'WARN',
  },
];

/**
 * Evaluate a single condition against contract data
 */
function evaluateCondition(contract: SalesContract, condition: RuleCondition): boolean {
  const fieldValue = getNestedValue(contract, condition.field);
  
  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value;
    case 'greaterThan':
      return Number(fieldValue) > Number(condition.value);
    case 'lessThan':
      return Number(fieldValue) < Number(condition.value);
    case 'contains':
      return String(fieldValue).includes(String(condition.value));
    case 'between':
      return Number(fieldValue) >= Number(condition.value) && 
             Number(fieldValue) <= Number(condition.value2);
    default:
      return false;
  }
}

/**
 * Get nested property value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current: any, prop) => current?.[prop], obj);
}

/**
 * Evaluate all business rules against a contract
 */
export function evaluateBusinessRules(
  contract: SalesContract,
  rules: BusinessRule[] = DEFAULT_BUSINESS_RULES
): RuleEvaluationResult[] {
  const results: RuleEvaluationResult[] = [];
  
  for (const rule of rules) {
    if (!rule.enabled) continue;
    
    // Evaluate all conditions (ALL must pass for rule to trigger)
    const conditionsMet = rule.conditions.every(condition => 
      evaluateCondition(contract, condition)
    );
    
    if (conditionsMet) {
      results.push({
        ruleId: rule.id,
        ruleName: rule.name,
        passed: false,
        severity: rule.severity,
        message: rule.description,
        action: rule.action,
        requiresOverride: rule.action === 'BLOCK',
        escalateTo: rule.escalateTo,
      });
    } else {
      // Rule conditions not met, so rule passes
      results.push({
        ruleId: rule.id,
        ruleName: rule.name,
        passed: true,
        severity: rule.severity,
        message: `${rule.name} - OK`,
        action: rule.action,
        requiresOverride: false,
      });
    }
  }
  
  return results;
}

/**
 * Determine if contract can proceed based on rule evaluation
 */
export function canProceed(results: RuleEvaluationResult[]): boolean {
  // Cannot proceed if any BLOCK action is triggered
  return !results.some(r => !r.passed && r.action === 'BLOCK');
}

/**
 * Check if contract requires manual approval
 */
export function requiresManualApproval(results: RuleEvaluationResult[]): boolean {
  return results.some(r => !r.passed && r.action === 'ESCALATE');
}

/**
 * Check if contract can be auto-approved
 */
export function canAutoApprove(results: RuleEvaluationResult[]): boolean {
  const hasAutoApproveRule = results.some(r => r.passed && r.action === 'AUTO_APPROVE');
  const hasBlockingIssues = results.some(r => !r.passed && (r.action === 'BLOCK' || r.action === 'ESCALATE'));
  
  return hasAutoApproveRule && !hasBlockingIssues;
}

/**
 * Get escalations needed from rule evaluation
 */
export function getRequiredEscalations(
  contract: SalesContract,
  results: RuleEvaluationResult[]
): Omit<Escalation, 'id' | 'escalatedAt' | 'status'>[] {
  const escalations: Omit<Escalation, 'id' | 'escalatedAt' | 'status'>[] = [];
  
  results
    .filter(r => !r.passed && r.action === 'ESCALATE' && r.escalateTo)
    .forEach(r => {
      escalations.push({
        contractId: contract.id,
        type: 'APPROVAL_REQUIRED',
        severity: r.severity === 'ERROR' ? 'HIGH' : r.severity === 'WARNING' ? 'MEDIUM' : 'LOW',
        description: r.message,
        escalatedTo: r.escalateTo!,
      });
    });
  
  return escalations;
}

/**
 * Transition contract to next lifecycle state
 */
export function transitionState(
  contract: SalesContract,
  toState: ContractLifecycleState,
  actor: string,
  reason: string,
  automated: boolean = false
): LifecycleEvent {
  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    contractId: contract.id,
    timestamp: new Date().toISOString(),
    fromState: contract.status as ContractLifecycleState,
    toState,
    triggeredBy: automated ? 'SYSTEM' : 'USER',
    actor,
    reason,
    automated,
    metadata: {
      contractNo: contract.scNo,
      version: contract.version,
    },
  };
}

/**
 * Create an override request
 */
export function createOverrideRequest(
  contractId: string,
  ruleId: string,
  ruleName: string,
  requestedBy: string,
  reason: string
): OverrideRequest {
  return {
    id: `ovr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    contractId,
    ruleId,
    ruleName,
    requestedBy,
    requestedAt: new Date().toISOString(),
    reason,
    status: 'PENDING',
  };
}

// Trade Type Configurations
export const TRADE_TYPE_CONFIGS: TradeTypeConfig[] = [
  {
    tradeType: 'Normal Trade',
    requiresQualityPassing: false, // Optional for normal trade
    requiresEMDPayment: false,
    automaticReminders: {
      paymentDueDays: [3, 1, 0], // 3 days before, 1 day before, on due date
      deliveryReminderDays: [7, 3, 1],
      qualityCheckDays: [2, 1],
    },
    workflowSteps: [
      'DRAFT',
      'PENDING_VALIDATION',
      'PENDING_APPROVAL',
      'APPROVED',
      'ACTIVE',
      'AWAITING_DELIVERY',
      'DELIVERED',
      'AWAITING_PAYMENT',
      'PAYMENT_RECEIVED',
      'RECONCILIATION_PENDING',
      'RECONCILED',
      'COMPLETED',
    ],
  },
  {
    tradeType: 'CCI Trade',
    requiresQualityPassing: true, // Mandatory for CCI trade
    requiresEMDPayment: true,
    automaticReminders: {
      paymentDueDays: [5, 3, 1, 0],
      deliveryReminderDays: [10, 7, 3, 1],
      qualityCheckDays: [3, 2, 1],
    },
    workflowSteps: [
      'DRAFT',
      'PENDING_VALIDATION',
      'PENDING_APPROVAL',
      'APPROVED',
      'ACTIVE',
      'AWAITING_QUALITY_PASSING',
      'QUALITY_PASSED',
      'AWAITING_DELIVERY',
      'DELIVERED',
      'AWAITING_PAYMENT',
      'PAYMENT_RECEIVED',
      'RECONCILIATION_PENDING',
      'RECONCILED',
      'COMPLETED',
    ],
  },
];

/**
 * Get trade type configuration
 */
export function getTradeTypeConfig(tradeType: 'Normal Trade' | 'CCI Trade'): TradeTypeConfig {
  const config = TRADE_TYPE_CONFIGS.find(c => c.tradeType === tradeType);
  if (!config) {
    return TRADE_TYPE_CONFIGS[0]; // Default to Normal Trade
  }
  return config;
}

/**
 * Get next expected lifecycle state based on trade type and current state
 */
export function getNextLifecycleState(
  currentState: ContractLifecycleState,
  tradeType: 'Normal Trade' | 'CCI Trade'
): ContractLifecycleState | null {
  const config = getTradeTypeConfig(tradeType);
  const currentIndex = config.workflowSteps.indexOf(currentState);
  
  if (currentIndex === -1 || currentIndex === config.workflowSteps.length - 1) {
    return null; // Current state not in workflow or already at end
  }
  
  return config.workflowSteps[currentIndex + 1];
}

/**
 * Check if quality passing is required for this trade type
 */
export function requiresQualityPassing(tradeType: 'Normal Trade' | 'CCI Trade'): boolean {
  const config = getTradeTypeConfig(tradeType);
  return config.requiresQualityPassing;
}

/**
 * Create automated notification/reminder
 */
export function createAutomatedNotification(
  contractId: string,
  type: NotificationType,
  recipient: string,
  recipientType: 'BUYER' | 'SELLER' | 'ADMIN' | 'BOTH_PARTIES',
  message: string,
  channels: NotificationChannel[] = ['CHAT', 'DASHBOARD']
): AutomatedNotification {
  return {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    contractId,
    type,
    recipient,
    recipientType,
    channel: channels,
    message,
    scheduledAt: new Date().toISOString(),
    status: 'SCHEDULED',
  };
}

/**
 * Generate reminders based on trade type and current state
 */
export function generateAutomatedReminders(
  contractId: string,
  tradeType: 'Normal Trade' | 'CCI Trade',
  currentState: ContractLifecycleState,
  dueDate: Date,
  buyer: string,
  seller: string
): AutomatedNotification[] {
  const config = getTradeTypeConfig(tradeType);
  const reminders: AutomatedNotification[] = [];
  const now = new Date();
  const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Payment reminders
  if (currentState === 'AWAITING_PAYMENT') {
    config.automaticReminders.paymentDueDays.forEach(daysBefore => {
      if (daysUntilDue <= daysBefore) {
        const message = daysBefore === 0
          ? `Payment is due today for contract ${contractId}`
          : `Payment is due in ${daysBefore} days for contract ${contractId}`;
        
        reminders.push(createAutomatedNotification(
          contractId,
          'PAYMENT_DUE',
          buyer,
          'BUYER',
          message,
          ['CHAT', 'EMAIL', 'DASHBOARD']
        ));
      }
    });
  }

  // Delivery reminders
  if (currentState === 'AWAITING_DELIVERY' || currentState === 'QUALITY_PASSED') {
    config.automaticReminders.deliveryReminderDays.forEach(daysBefore => {
      if (daysUntilDue <= daysBefore) {
        const message = `Delivery is expected in ${daysBefore} days for contract ${contractId}`;
        
        reminders.push(createAutomatedNotification(
          contractId,
          'DELIVERY_PENDING',
          seller,
          'SELLER',
          message,
          ['CHAT', 'DASHBOARD']
        ));
      }
    });
  }

  // Quality check reminders (for CCI Trade)
  if (currentState === 'AWAITING_QUALITY_PASSING' && config.requiresQualityPassing) {
    config.automaticReminders.qualityCheckDays.forEach(daysBefore => {
      if (daysUntilDue <= daysBefore) {
        const message = `Quality check required in ${daysBefore} days for contract ${contractId}`;
        
        reminders.push(createAutomatedNotification(
          contractId,
          'QUALITY_CHECK_REQUIRED',
          buyer,
          'BOTH_PARTIES',
          message,
          ['CHAT', 'DASHBOARD']
        ));
      }
    });
  }

  return reminders;
}

/**
 * Get complete trade cycle status
 */
export function getTradeCycleStatus(
  contract: any,
  invoices: any[],
  payments: any[],
  deliveryOrders: any[],
  disputes: any[]
): TradeCycleStatus {
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = payments.reduce((sum, pay) => sum + pay.amount, 0);
  const totalDelivered = deliveryOrders.reduce((sum, _do) => sum + _do.quantityBales, 0);
  
  const config = getTradeTypeConfig(contract.tradeType);
  
  return {
    contractId: contract.id,
    contractNo: contract.scNo,
    tradeType: contract.tradeType,
    currentState: contract.status,
    
    contractCreated: true,
    contractApproved: ['APPROVED', 'ACTIVE'].includes(contract.status),
    
    qualityCheckRequired: config.requiresQualityPassing,
    qualityCheckPassed: contract.qualityCheckPassed,
    qualityCheckDate: contract.qualityCheckDate,
    
    deliveryOrders: deliveryOrders.map(dO => ({
      doNo: dO.doNo,
      quantity: dO.quantityBales,
      date: dO.date,
      status: dO.status,
    })),
    totalDelivered,
    deliveryComplete: totalDelivered >= contract.quantityBales,
    
    invoices: invoices.map(inv => ({
      invoiceNo: inv.invoiceNo,
      amount: inv.amount,
      date: inv.date,
      status: inv.status,
    })),
    payments: payments.map(pay => ({
      paymentId: pay.paymentId,
      amount: pay.amount,
      date: pay.date,
      method: pay.method,
    })),
    totalInvoiced,
    totalPaid,
    paymentComplete: totalPaid >= totalInvoiced && totalInvoiced > 0,
    
    reconciled: contract.status === 'RECONCILED' || contract.status === 'COMPLETED',
    reconciliationDate: contract.reconciliationDate,
    
    disputes: disputes.map(d => ({
      disputeId: d.disputeId,
      reason: d.reason,
      status: d.status,
      raisedDate: d.dateRaised,
    })),
    
    buyerCanView: true, // Always transparent to buyer
    sellerCanView: true, // Always transparent to seller
    lastUpdated: new Date().toISOString(),
  };
}
