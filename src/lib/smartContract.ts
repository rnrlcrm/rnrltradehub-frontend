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

// Contract Lifecycle States
export type ContractLifecycleState = 
  | 'DRAFT'
  | 'PENDING_VALIDATION'
  | 'VALIDATION_FAILED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'ACTIVE'
  | 'PENDING_EXECUTION'
  | 'IN_EXECUTION'
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
