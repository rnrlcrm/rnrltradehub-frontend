/**
 * Financial Year API Service
 * 
 * Handles Financial Year management with full accounting standards compliance
 * As per Indian Income Tax Act and accounting principles
 */

import { apiClient, USE_MOCK_API, ApiResponse } from './client';
import { FinancialYear, FYPendingItems, FYSplitSummary } from '../types';

// Mock data for development
const mockFinancialYears: FinancialYear[] = [
  {
    id: 1,
    fyCode: '2024-2025',
    startDate: '2024-04-01',
    endDate: '2025-03-31',
    status: 'ACTIVE',
    createdAt: '2024-04-01T00:00:00Z',
  },
  {
    id: 2,
    fyCode: '2023-2024',
    startDate: '2023-04-01',
    endDate: '2024-03-31',
    status: 'CLOSED',
    closedBy: 'Admin',
    closedDate: '2024-04-01T00:00:00Z',
    createdAt: '2023-04-01T00:00:00Z',
  },
];

// ============================================================================
// FINANCIAL YEAR API
// ============================================================================

export const financialYearApi = {
  /**
   * Get all Financial Years
   */
  getAll: async (): Promise<ApiResponse<FinancialYear[]>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        data: mockFinancialYears,
        success: true,
      };
    }
    return apiClient.get<FinancialYear[]>('/settings/financial-years');
  },

  /**
   * Get active Financial Year
   */
  getActive: async (): Promise<ApiResponse<FinancialYear>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const activeFY = mockFinancialYears.find(fy => fy.status === 'ACTIVE');
      if (!activeFY) {
        throw { message: 'No active Financial Year found', code: '404' };
      }
      return { data: activeFY, success: true };
    }
    return apiClient.get<FinancialYear>('/settings/financial-years/active');
  },

  /**
   * Get Financial Year by ID
   */
  getById: async (id: number): Promise<ApiResponse<FinancialYear>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const fy = mockFinancialYears.find(f => f.id === id);
      if (!fy) {
        throw { message: 'Financial Year not found', code: '404' };
      }
      return { data: fy, success: true };
    }
    return apiClient.get<FinancialYear>(`/settings/financial-years/${id}`);
  },

  /**
   * Create new Financial Year
   * Note: Should validate that no active FY exists before creating
   */
  create: async (data: Omit<FinancialYear, 'id' | 'createdAt'>): Promise<ApiResponse<FinancialYear>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Validate: Only one active FY allowed
      const hasActiveFY = mockFinancialYears.some(fy => fy.status === 'ACTIVE');
      if (data.status === 'ACTIVE' && hasActiveFY) {
        throw { 
          message: 'Cannot create active Financial Year. Another FY is already active.', 
          code: '400' 
        };
      }
      
      const newFY: FinancialYear = {
        ...data,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      };
      return { data: newFY, success: true, message: 'Financial Year created successfully' };
    }
    return apiClient.post<FinancialYear>('/settings/financial-years', data);
  },

  /**
   * Update Financial Year
   * Note: Status changes should be validated
   */
  update: async (id: number, data: Partial<FinancialYear>): Promise<ApiResponse<FinancialYear>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 400));
      const existing = mockFinancialYears.find(f => f.id === id);
      if (!existing) {
        throw { message: 'Financial Year not found', code: '404' };
      }
      
      const updated: FinancialYear = {
        ...existing,
        ...data,
        id,
      };
      return { data: updated, success: true, message: 'Financial Year updated successfully' };
    }
    return apiClient.put<FinancialYear>(`/settings/financial-years/${id}`, data);
  },

  /**
   * Get pending items for FY split
   * Returns all items that need to be migrated to next FY
   */
  getPendingItems: async (fyId: number): Promise<ApiResponse<FYPendingItems>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock pending items calculation
      const mockPendingItems: FYPendingItems = {
        unpaidInvoices: { count: 12, totalAmount: 2450000, items: [] },
        dueCommissions: { count: 8, totalAmount: 125000, items: [] },
        openDisputes: { count: 3, items: [] },
        activeContracts: { count: 25, items: [] },
      };
      
      return { data: mockPendingItems, success: true };
    }
    return apiClient.get<FYPendingItems>(`/settings/financial-years/${fyId}/pending-items`);
  },

  /**
   * Validate FY split readiness with comprehensive data integrity checks
   * Checks if FY can be safely split without data loss or corruption
   */
  validateSplit: async (fyId: number): Promise<ApiResponse<{
    canSplit: boolean;
    warnings: string[];
    blockers: string[];
    pendingItems: FYPendingItems;
    dataIntegrityReport: {
      overallStatus: 'PASS' | 'FAIL' | 'WARNING';
      checks: Array<{
        checkName: string;
        status: 'PASS' | 'FAIL' | 'WARNING';
        message: string;
        affectedRecords?: number;
      }>;
    };
    accountingBalance: {
      totalDebit: number;
      totalCredit: number;
      isBalanced: boolean;
      openingBalance: number;
      closingBalance: number;
    };
    moduleWiseSummary: {
      salesContracts: { pending: number; ongoing: number; completed: number };
      purchaseContracts: { pending: number; ongoing: number; completed: number };
      invoices: { unpaid: number; partiallyPaid: number; paid: number };
      payments: { pending: number; cleared: number };
      commissions: { due: number; paid: number; pending: number };
      deliveryOrders: { pending: number; inTransit: number; delivered: number };
      disputes: { open: number; underReview: number; resolved: number };
    };
  }>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockValidation = {
        canSplit: true,
        warnings: [
          '12 unpaid invoices will be carried forward',
          '8 due commissions will be migrated',
          '3 open disputes need attention',
          'Some bank statements are not reconciled',
        ],
        blockers: [],
        pendingItems: {
          unpaidInvoices: { count: 12, totalAmount: 2450000, items: [] },
          dueCommissions: { count: 8, totalAmount: 125000, items: [] },
          openDisputes: { count: 3, items: [] },
          activeContracts: { count: 25, items: [] },
        },
        dataIntegrityReport: {
          overallStatus: 'WARNING' as const,
          checks: [
            {
              checkName: 'Accounting Balance Check (Double Entry)',
              status: 'PASS' as const,
              message: 'All accounting entries are balanced (Debit = Credit)',
            },
            {
              checkName: 'Orphaned Records Check',
              status: 'PASS' as const,
              message: 'No orphaned records found',
              affectedRecords: 0,
            },
            {
              checkName: 'Cross-Module Consistency Check',
              status: 'PASS' as const,
              message: 'All modules are consistent',
            },
            {
              checkName: 'Foreign Key Integrity Check',
              status: 'PASS' as const,
              message: 'All foreign key references are valid',
            },
            {
              checkName: 'Bank Reconciliation Check',
              status: 'WARNING' as const,
              message: 'Some bank statements are not reconciled',
              affectedRecords: 3,
            },
            {
              checkName: 'Tax Calculation Check (GST, TDS)',
              status: 'PASS' as const,
              message: 'All tax calculations are correct',
            },
          ],
        },
        accountingBalance: {
          totalDebit: 10000000,
          totalCredit: 10000000,
          isBalanced: true,
          openingBalance: 500000,
          closingBalance: 500000,
        },
        moduleWiseSummary: {
          salesContracts: { pending: 8, ongoing: 12, completed: 45 },
          purchaseContracts: { pending: 5, ongoing: 10, completed: 38 },
          invoices: { unpaid: 12, partiallyPaid: 5, paid: 156 },
          payments: { pending: 8, cleared: 145 },
          commissions: { due: 8, paid: 78, pending: 3 },
          deliveryOrders: { pending: 6, inTransit: 4, delivered: 142 },
          disputes: { open: 3, underReview: 2, resolved: 15 },
        },
      };
      
      return { data: mockValidation, success: true };
    }
    return apiClient.get<any>(`/settings/financial-years/${fyId}/validate-split`);
  },

  /**
   * Execute FY split
   * This is a critical operation that:
   * 1. Closes current FY
   * 2. Creates new FY
   * 3. Migrates all pending items
   * 4. Updates all references
   * 
   * IMPORTANT: This operation is IRREVERSIBLE
   */
  executeSplit: async (
    fyId: number,
    data: {
      newFyCode: string;
      adminPassword: string;
      acknowledgeIrreversible: boolean;
    }
  ): Promise<ApiResponse<FYSplitSummary>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate long operation
      
      if (!data.acknowledgeIrreversible) {
        throw { 
          message: 'You must acknowledge that this action is irreversible', 
          code: '400' 
        };
      }
      
      const currentFY = mockFinancialYears.find(f => f.id === fyId);
      if (!currentFY) {
        throw { message: 'Financial Year not found', code: '404' };
      }
      
      const mockSummary: FYSplitSummary = {
        fromFY: currentFY.fyCode,
        toFY: data.newFyCode,
        executedBy: 'Admin',
        executedAt: new Date().toISOString(),
        invoicesMigrated: 12,
        commissionsMigrated: 8,
        contractsMigrated: 25,
        disputesMigrated: 3,
        notes: 'FY split completed successfully. All pending items migrated to new FY.',
      };
      
      return { 
        data: mockSummary, 
        success: true, 
        message: 'Financial Year split completed successfully' 
      };
    }
    return apiClient.post<FYSplitSummary>(`/settings/financial-years/${fyId}/split`, data);
  },

  /**
   * Close Financial Year manually
   * Alternative to FY split when no new FY is needed
   */
  close: async (
    fyId: number,
    data: {
      closedBy: string;
      adminPassword: string;
      reason: string;
    }
  ): Promise<ApiResponse<FinancialYear>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const existing = mockFinancialYears.find(f => f.id === fyId);
      if (!existing) {
        throw { message: 'Financial Year not found', code: '404' };
      }
      
      if (existing.status === 'CLOSED') {
        throw { message: 'Financial Year is already closed', code: '400' };
      }
      
      const closed: FinancialYear = {
        ...existing,
        status: 'CLOSED',
        closedBy: data.closedBy,
        closedDate: new Date().toISOString(),
      };
      
      return { data: closed, success: true, message: 'Financial Year closed successfully' };
    }
    return apiClient.post<FinancialYear>(`/settings/financial-years/${fyId}/close`, data);
  },

  /**
   * Reopen a closed Financial Year
   * Emergency operation - should be restricted to super admins
   */
  reopen: async (
    fyId: number,
    data: {
      reopenedBy: string;
      adminPassword: string;
      reason: string;
    }
  ): Promise<ApiResponse<FinancialYear>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const existing = mockFinancialYears.find(f => f.id === fyId);
      if (!existing) {
        throw { message: 'Financial Year not found', code: '404' };
      }
      
      if (existing.status !== 'CLOSED') {
        throw { message: 'Only closed Financial Years can be reopened', code: '400' };
      }
      
      const reopened: FinancialYear = {
        ...existing,
        status: 'ACTIVE',
        closedBy: undefined,
        closedDate: undefined,
      };
      
      return { data: reopened, success: true, message: 'Financial Year reopened successfully' };
    }
    return apiClient.post<FinancialYear>(`/settings/financial-years/${fyId}/reopen`, data);
  },

  /**
   * Get FY split history/audit log
   */
  getSplitHistory: async (): Promise<ApiResponse<FYSplitSummary[]>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const mockHistory: FYSplitSummary[] = [
        {
          fromFY: '2023-2024',
          toFY: '2024-2025',
          executedBy: 'Admin',
          executedAt: '2024-04-01T00:00:00Z',
          invoicesMigrated: 15,
          commissionsMigrated: 10,
          contractsMigrated: 30,
          disputesMigrated: 2,
          notes: 'Annual FY split - All items migrated successfully',
        },
      ];
      
      return { data: mockHistory, success: true };
    }
    return apiClient.get<FYSplitSummary[]>('/settings/financial-years/split-history');
  },
};

export default financialYearApi;
