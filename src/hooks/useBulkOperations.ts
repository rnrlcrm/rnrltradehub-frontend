/**
 * React Hook for Bulk Operations
 */

import { useState, useCallback } from 'react';
import {
  exportToCSV,
  importFromCSV,
  exportMasterData,
  exportOrganizations,
  exportGSTRates,
  importMasterData,
  applyBulkUpdates,
  applyBulkDelete,
  validateImportedData,
  generateMasterDataTemplate,
  generateOrganizationTemplate,
  generateGSTRateTemplate,
  mergeImportedData,
  type BulkUpdateOperation
} from '../utils/bulkOperations';
import type { MasterData, Organization, GstRate } from '../types';

export interface UseBulkOperationsReturn {
  // Export operations
  exportCSV: <T extends Record<string, any>>(
    data: T[],
    filename: string,
    columns?: { key: keyof T; label: string }[]
  ) => void;
  exportMaster: (data: MasterData[], type: string) => void;
  exportOrgs: (data: Organization[]) => void;
  exportGST: (data: GstRate[]) => void;
  
  // Import operations
  importCSV: <T>(
    file: File,
    mapping: Record<string, keyof T>
  ) => Promise<T[]>;
  importMaster: (file: File) => Promise<MasterData[]>;
  
  // Bulk operations
  bulkUpdate: <T extends { id: string | number }>(
    items: T[],
    operation: BulkUpdateOperation<T>
  ) => T[];
  
  bulkDelete: <T extends { id: string | number }>(
    items: T[],
    ids: (string | number)[]
  ) => T[];
  
  // Validation
  validateImport: <T>(
    data: T[],
    validators: {
      field: keyof T;
      validate: (value: any) => boolean;
      errorMessage: string;
    }[]
  ) => {
    valid: T[];
    invalid: { row: number; data: T; errors: string[] }[];
  };
  
  // Merge
  mergeData: <T extends Record<string, any>>(
    existing: T[],
    imported: T[],
    keyField: keyof T,
    strategy?: 'skip' | 'replace' | 'merge'
  ) => {
    merged: T[];
    skipped: T[];
    updated: T[];
    added: T[];
  };
  
  // Templates
  downloadMasterTemplate: (type: string) => void;
  downloadOrgTemplate: () => void;
  downloadGSTTemplate: () => void;
  
  // State
  isProcessing: boolean;
  progress: number;
  error: string | null;
  selectedIds: Set<string | number>;
  toggleSelection: (id: string | number) => void;
  selectAll: (ids: (string | number)[]) => void;
  clearSelection: () => void;
}

export function useBulkOperations(): UseBulkOperationsReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  
  const exportCSV = useCallback(<T extends Record<string, any>>(
    data: T[],
    filename: string,
    columns?: { key: keyof T; label: string }[]
  ) => {
    try {
      setIsProcessing(true);
      setError(null);
      exportToCSV(data, filename, columns);
      setIsProcessing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
      setIsProcessing(false);
    }
  }, []);
  
  const exportMaster = useCallback((data: MasterData[], type: string) => {
    try {
      setIsProcessing(true);
      setError(null);
      exportMasterData(data, type);
      setIsProcessing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
      setIsProcessing(false);
    }
  }, []);
  
  const exportOrgs = useCallback((data: Organization[]) => {
    try {
      setIsProcessing(true);
      setError(null);
      exportOrganizations(data);
      setIsProcessing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
      setIsProcessing(false);
    }
  }, []);
  
  const exportGST = useCallback((data: GstRate[]) => {
    try {
      setIsProcessing(true);
      setError(null);
      exportGSTRates(data);
      setIsProcessing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
      setIsProcessing(false);
    }
  }, []);
  
  const importCSV = useCallback(async <T,>(
    file: File,
    mapping: Record<string, keyof T>
  ): Promise<T[]> => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    
    try {
      const data = await importFromCSV<T>(file, mapping);
      setProgress(100);
      setIsProcessing(false);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setIsProcessing(false);
      throw err;
    }
  }, []);
  
  const importMaster = useCallback(async (file: File): Promise<MasterData[]> => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    
    try {
      const data = await importMasterData(file);
      setProgress(100);
      setIsProcessing(false);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setIsProcessing(false);
      throw err;
    }
  }, []);
  
  const bulkUpdate = useCallback(<T extends { id: string | number }>(
    items: T[],
    operation: BulkUpdateOperation<T>
  ): T[] => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const updated = applyBulkUpdates(items, operation);
      setIsProcessing(false);
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk update failed');
      setIsProcessing(false);
      throw err;
    }
  }, []);
  
  const bulkDelete = useCallback(<T extends { id: string | number }>(
    items: T[],
    ids: (string | number)[]
  ): T[] => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const remaining = applyBulkDelete(items, ids);
      setIsProcessing(false);
      return remaining;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk delete failed');
      setIsProcessing(false);
      throw err;
    }
  }, []);
  
  const validateImport = useCallback(<T,>(
    data: T[],
    validators: {
      field: keyof T;
      validate: (value: any) => boolean;
      errorMessage: string;
    }[]
  ) => {
    return validateImportedData(data, validators);
  }, []);
  
  const mergeData = useCallback(<T extends Record<string, any>>(
    existing: T[],
    imported: T[],
    keyField: keyof T,
    strategy: 'skip' | 'replace' | 'merge' = 'skip'
  ) => {
    return mergeImportedData(existing, imported, keyField, strategy);
  }, []);
  
  const downloadMasterTemplate = useCallback((type: string) => {
    generateMasterDataTemplate(type);
  }, []);
  
  const downloadOrgTemplate = useCallback(() => {
    generateOrganizationTemplate();
  }, []);
  
  const downloadGSTTemplate = useCallback(() => {
    generateGSTRateTemplate();
  }, []);
  
  const toggleSelection = useCallback((id: string | number) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);
  
  const selectAll = useCallback((ids: (string | number)[]) => {
    setSelectedIds(new Set(ids));
  }, []);
  
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);
  
  return {
    exportCSV,
    exportMaster,
    exportOrgs,
    exportGST,
    importCSV,
    importMaster,
    bulkUpdate,
    bulkDelete,
    validateImport,
    mergeData,
    downloadMasterTemplate,
    downloadOrgTemplate,
    downloadGSTTemplate,
    isProcessing,
    progress,
    error,
    selectedIds,
    toggleSelection,
    selectAll,
    clearSelection
  };
}
