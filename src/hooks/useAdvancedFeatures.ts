/**
 * Advanced Features Hooks - Phase 3 Optimization
 */

import { useState, useEffect, useCallback } from 'react';
import {
  aiEngine,
  analyticsEngine,
  approvalWorkflow,
  AISuggestion,
  AnalyticsDashboard,
  ApprovalRequest,
  ApprovalRule
} from '../utils/advancedFeatures';
import { Contract } from '../types';

// ============================================================================
// AI Suggestions Hook
// ============================================================================

export function useAISuggestions(contract: Partial<Contract>) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!contract || Object.keys(contract).length === 0) return;

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const results = await aiEngine.analyzeContract(contract);
        setSuggestions(results.filter(s => !dismissed.has(s.id)));
      } catch (error) {
        console.error('Failed to fetch AI suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [contract, dismissed]);

  const applySuggestion = useCallback((suggestion: AISuggestion) => {
    return suggestion.suggestion;
  }, []);

  const dismissSuggestion = useCallback((suggestionId: string) => {
    setDismissed(prev => new Set(prev).add(suggestionId));
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  }, []);

  const dismissAll = useCallback(() => {
    setDismissed(new Set(suggestions.map(s => s.id)));
    setSuggestions([]);
  }, [suggestions]);

  return {
    suggestions,
    loading,
    applySuggestion,
    dismissSuggestion,
    dismissAll,
    hasSuggestions: suggestions.length > 0
  };
}

// ============================================================================
// Analytics Hook
// ============================================================================

export function useAnalytics(contracts: Contract[]) {
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!contracts || contracts.length === 0) {
      setDashboard(null);
      return;
    }

    setLoading(true);
    try {
      const data = analyticsEngine.generateDashboard(contracts);
      setDashboard(data);
    } catch (error) {
      console.error('Failed to generate analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [contracts, refreshKey]);

  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const exportReport = useCallback((format: 'csv' | 'pdf' = 'csv') => {
    if (!dashboard) return null;
    return analyticsEngine.exportReport(dashboard, format);
  }, [dashboard]);

  const downloadReport = useCallback((format: 'csv' | 'pdf' = 'csv') => {
    const report = exportReport(format);
    if (!report) return;

    const blob = new Blob([report], { type: format === 'csv' ? 'text/csv' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportReport]);

  return {
    dashboard,
    loading,
    refresh,
    exportReport,
    downloadReport,
    hasData: dashboard !== null
  };
}

// ============================================================================
// Approval Workflow Hook
// ============================================================================

export function useApprovalWorkflow(userId: string) {
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshPending = useCallback(() => {
    setLoading(true);
    try {
      const pending = approvalWorkflow.getPendingApprovals(userId);
      setPendingApprovals(pending);
    } catch (error) {
      console.error('Failed to fetch pending approvals:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refreshPending();
  }, [refreshPending]);

  const checkApprovalNeeded = useCallback((contract: Partial<Contract>) => {
    return approvalWorkflow.needsApproval(contract);
  }, []);

  const createApprovalRequest = useCallback((contractId: string, contract: Partial<Contract>) => {
    const request = approvalWorkflow.createApprovalRequest(contractId, userId, contract);
    if (request) {
      refreshPending();
    }
    return request;
  }, [userId, refreshPending]);

  const approve = useCallback((requestId: string, comment?: string) => {
    const success = approvalWorkflow.approve(requestId, userId, comment);
    if (success) {
      refreshPending();
    }
    return success;
  }, [userId, refreshPending]);

  const reject = useCallback((requestId: string, reason: string) => {
    const success = approvalWorkflow.reject(requestId, userId, reason);
    if (success) {
      refreshPending();
    }
    return success;
  }, [userId, refreshPending]);

  return {
    pendingApprovals,
    loading,
    checkApprovalNeeded,
    createApprovalRequest,
    approve,
    reject,
    refresh: refreshPending,
    hasPending: pendingApprovals.length > 0
  };
}

// ============================================================================
// Combined Advanced Features Hook
// ============================================================================

export function useAdvancedFeatures(contract: Partial<Contract>, userId: string, allContracts: Contract[]) {
  const aiSuggestions = useAISuggestions(contract);
  const analytics = useAnalytics(allContracts);
  const approvals = useApprovalWorkflow(userId);

  const [activeFeature, setActiveFeature] = useState<'suggestions' | 'analytics' | 'approvals' | null>(null);

  // Auto-show suggestions if high priority ones exist
  useEffect(() => {
    if (aiSuggestions.suggestions.some(s => s.priority === 'high')) {
      setActiveFeature('suggestions');
    }
  }, [aiSuggestions.suggestions]);

  // Auto-show approvals if pending
  useEffect(() => {
    if (approvals.hasPending && !activeFeature) {
      setActiveFeature('approvals');
    }
  }, [approvals.hasPending, activeFeature]);

  const toggleFeature = useCallback((feature: typeof activeFeature) => {
    setActiveFeature(prev => prev === feature ? null : feature);
  }, []);

  return {
    ai: aiSuggestions,
    analytics,
    approvals,
    activeFeature,
    toggleFeature,
    hasActiveFeatures: aiSuggestions.hasSuggestions || approvals.hasPending
  };
}
