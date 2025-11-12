/**
 * Data Isolation Utility
 * Enforces strict data access control
 * Users can ONLY see their own data
 */

import { DataAccessScope } from '../config/rbac';
import { EnhancedUser } from '../types/accessControl';

export class DataIsolationService {
  /**
   * Build data filter based on user's access scope
   * This ensures users can ONLY see their own data
   */
  static buildDataFilter(user: EnhancedUser, scope: DataAccessScope): DataFilter {
    const filter: DataFilter = {
      businessPartnerId: [],
      branchIds: [],
      userId: [],
      createdBy: [],
      excludeOtherPartners: true,
    };

    // CRITICAL: Always filter by business partner
    if (scope.ownPartnerOnly && user.businessPartnerId) {
      filter.businessPartnerId = [user.businessPartnerId];
    }

    // Branch level filtering
    if (scope.ownBranchOnly && user.branchIds && user.branchIds.length > 0) {
      filter.branchIds = user.branchIds;
    } else if (scope.allBranches && user.businessPartnerId) {
      // Get all branches for this partner
      filter.branchIds = []; // Empty = all branches of partner
    } else if (scope.specificBranches.length > 0) {
      filter.branchIds = scope.specificBranches;
    }

    // Transaction level filtering
    if (scope.ownTransactionsOnly) {
      filter.createdBy = [user.id];
    } else if (scope.partnerTransactions && user.businessPartnerId) {
      filter.businessPartnerId = [user.businessPartnerId];
    }

    return filter;
  }

  /**
   * Check if user can access specific record
   */
  static canAccessRecord(
    user: EnhancedUser,
    scope: DataAccessScope,
    record: DataRecord
  ): AccessCheckResult {
    const reasons: string[] = [];

    // Check business partner access
    if (scope.ownPartnerOnly) {
      if (record.businessPartnerId !== user.businessPartnerId) {
        reasons.push('Record belongs to different business partner');
      }
    }

    // Check branch access
    if (scope.ownBranchOnly || scope.specificBranches.length > 0) {
      const allowedBranches = scope.specificBranches.length > 0 
        ? scope.specificBranches 
        : user.branchIds || [];
      
      if (record.branchId && !allowedBranches.includes(record.branchId)) {
        reasons.push('Record belongs to branch user does not have access to');
      }
    }

    // Check transaction ownership
    if (scope.ownTransactionsOnly) {
      if (record.createdBy !== user.id) {
        reasons.push('Record created by different user');
      }
    }

    // Check document access
    if (scope.ownDocumentsOnly && record.type === 'DOCUMENT') {
      if (record.ownerId !== user.id) {
        reasons.push('Document belongs to different user');
      }
    }

    return {
      allowed: reasons.length === 0,
      reasons,
    };
  }

  /**
   * Filter array of records based on user access
   */
  static filterRecords<T extends DataRecord>(
    user: EnhancedUser,
    scope: DataAccessScope,
    records: T[]
  ): T[] {
    return records.filter(record => {
      const check = this.canAccessRecord(user, scope, record);
      return check.allowed;
    });
  }

  /**
   * Apply data isolation to query parameters
   * This ensures API calls include proper filters
   */
  static applyIsolationToQuery(
    user: EnhancedUser,
    scope: DataAccessScope,
    query: Record<string, any>
  ): Record<string, any> {
    const isolatedQuery = { ...query };

    // Always add business partner filter
    if (scope.ownPartnerOnly && user.businessPartnerId) {
      isolatedQuery.businessPartnerId = user.businessPartnerId;
    }

    // Add branch filter
    if (scope.ownBranchOnly && user.branchIds && user.branchIds.length > 0) {
      isolatedQuery.branchId = user.branchIds.join(',');
    } else if (scope.specificBranches.length > 0) {
      isolatedQuery.branchId = scope.specificBranches.join(',');
    }

    // Add user filter for own transactions
    if (scope.ownTransactionsOnly) {
      isolatedQuery.createdBy = user.id;
    }

    return isolatedQuery;
  }

  /**
   * Get accessible branches for user
   */
  static getAccessibleBranches(
    user: EnhancedUser,
    scope: DataAccessScope,
    allBranches: Array<{ id: string; partnerId: string }>
  ): string[] {
    if (scope.allBranches && user.businessPartnerId) {
      // All branches of user's partner
      return allBranches
        .filter(branch => branch.partnerId === user.businessPartnerId)
        .map(branch => branch.id);
    }

    if (scope.ownBranchOnly && user.branchIds) {
      // Only user's assigned branches
      return user.branchIds;
    }

    if (scope.specificBranches.length > 0) {
      // Specific branches
      return scope.specificBranches;
    }

    return [];
  }

  /**
   * Validate report access
   * Ensures users can only see reports with their data
   */
  static validateReportAccess(
    user: EnhancedUser,
    scope: DataAccessScope,
    reportType: string
  ): ReportAccessValidation {
    const validation: ReportAccessValidation = {
      allowed: false,
      requiresDataFilter: true,
      filters: {},
      warnings: [],
    };

    // Check if user can access this report type
    if (scope.ownReportsOnly) {
      validation.allowed = true;
      validation.requiresDataFilter = true;
      validation.filters = {
        businessPartnerId: user.businessPartnerId,
        createdBy: user.id,
      };
      validation.warnings.push('Report limited to your own data');
    } else if (scope.partnerReports) {
      validation.allowed = true;
      validation.requiresDataFilter = true;
      validation.filters = {
        businessPartnerId: user.businessPartnerId,
      };
      validation.warnings.push('Report limited to your business partner data');
    } else if (scope.consolidatedReports) {
      validation.allowed = true;
      validation.requiresDataFilter = false;
      // No filters - can see all data (Admin only)
    }

    return validation;
  }

  /**
   * Mask sensitive data if user shouldn't see it
   */
  static maskSensitiveData<T extends Record<string, any>>(
    user: EnhancedUser,
    scope: DataAccessScope,
    record: T,
    sensitiveFields: string[]
  ): T {
    const masked = { ...record };

    // If user doesn't have access to other users' data
    if (!scope.canViewOtherUsers && record.userId !== user.id) {
      sensitiveFields.forEach(field => {
        if (field in masked) {
          masked[field] = '***MASKED***';
        }
      });
    }

    // If user doesn't have access to partner documents
    if (scope.ownDocumentsOnly && !scope.partnerDocuments) {
      if (record.ownerId !== user.id) {
        sensitiveFields.forEach(field => {
          if (field in masked) {
            masked[field] = '***MASKED***';
          }
        });
      }
    }

    return masked;
  }

  /**
   * Check if user can perform action on record
   */
  static canPerformAction(
    user: EnhancedUser,
    scope: DataAccessScope,
    record: DataRecord,
    action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE'
  ): ActionAccessResult {
    const result: ActionAccessResult = {
      allowed: false,
      reasons: [],
    };

    // First check if user can access the record
    const accessCheck = this.canAccessRecord(user, scope, record);
    if (!accessCheck.allowed) {
      result.reasons = accessCheck.reasons;
      return result;
    }

    // Check action-specific permissions
    switch (action) {
      case 'CREATE':
        // Can create if within own partner
        if (scope.ownPartnerOnly && user.businessPartnerId) {
          result.allowed = true;
        }
        break;

      case 'READ':
        // Already checked by canAccessRecord
        result.allowed = true;
        break;

      case 'UPDATE':
        // Can update if created by user (for ownTransactionsOnly)
        if (scope.ownTransactionsOnly) {
          result.allowed = record.createdBy === user.id;
          if (!result.allowed) {
            result.reasons.push('Can only update records you created');
          }
        } else if (scope.partnerTransactions && user.businessPartnerId) {
          result.allowed = record.businessPartnerId === user.businessPartnerId;
        }
        break;

      case 'DELETE':
        // Can delete if created by user
        result.allowed = record.createdBy === user.id;
        if (!result.allowed) {
          result.reasons.push('Can only delete records you created');
        }
        break;
    }

    return result;
  }

  /**
   * Log access attempt for audit
   */
  static logAccessAttempt(
    user: EnhancedUser,
    action: string,
    resource: string,
    resourceId: string,
    allowed: boolean,
    reason?: string
  ): void {
    const log = {
      timestamp: new Date().toISOString(),
      userId: user.id,
      userEmail: user.email,
      businessPartnerId: user.businessPartnerId,
      action,
      resource,
      resourceId,
      allowed,
      reason,
      ipAddress: 'CAPTURED_BY_BACKEND',
    };

    // Send to audit log
    console.log('[AUDIT]', log);
    
    // In production, send to backend audit service
    // auditApi.logAccess(log);
  }
}

// Type definitions
export interface DataFilter {
  businessPartnerId: string[];
  branchIds: string[];
  userId: string[];
  createdBy: string[];
  excludeOtherPartners: boolean;
}

export interface DataRecord {
  id: string;
  type?: string;
  businessPartnerId?: string;
  branchId?: string;
  createdBy: string;
  ownerId?: string;
  [key: string]: any;
}

export interface AccessCheckResult {
  allowed: boolean;
  reasons: string[];
}

export interface ActionAccessResult {
  allowed: boolean;
  reasons: string[];
}

export interface ReportAccessValidation {
  allowed: boolean;
  requiresDataFilter: boolean;
  filters: Record<string, any>;
  warnings: string[];
}
