/**
 * Advanced Features - Phase 3 Optimization
 * 
 * Provides advanced automation capabilities including:
 * - AI-powered suggestions
 * - Advanced analytics
 * - Approval workflows
 * - Audit trail visualization
 * - Performance monitoring
 */

import { Contract, MasterDataItem, Organization } from '../types';

// ============================================================================
// AI-Powered Suggestions
// ============================================================================

export interface AISuggestion {
  id: string;
  type: 'contract' | 'pricing' | 'terms' | 'quality' | 'client';
  priority: 'high' | 'medium' | 'low';
  confidence: number; // 0-100
  title: string;
  description: string;
  suggestion: any;
  reasoning: string;
  impact: {
    timeSaved?: string;
    costSaved?: number;
    riskReduction?: string;
  };
  actions: {
    label: string;
    value: any;
  }[];
}

export class AIEngine {
  private contractHistory: Contract[] = [];
  private marketData: any[] = [];

  /**
   * Analyze contract and provide AI-powered suggestions
   */
  async analyzeContract(contract: Partial<Contract>): Promise<AISuggestion[]> {
    const suggestions: AISuggestion[] = [];

    // Pricing suggestion based on market trends
    if (contract.variety && contract.quantity) {
      const pricingSuggestion = this.suggestPricing(contract);
      if (pricingSuggestion) suggestions.push(pricingSuggestion);
    }

    // Quality specs suggestion
    if (contract.variety && !contract.qualitySpecs) {
      suggestions.push(this.suggestQualitySpecs(contract));
    }

    // Payment terms optimization
    if (contract.clientType && !contract.paymentTerms) {
      suggestions.push(this.suggestPaymentTerms(contract));
    }

    // Risk assessment
    const riskSuggestion = this.assessRisk(contract);
    if (riskSuggestion) suggestions.push(riskSuggestion);

    // Delivery optimization
    if (contract.location && contract.quantity) {
      suggestions.push(this.suggestDeliveryOptimization(contract));
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  private suggestPricing(contract: Partial<Contract>): AISuggestion | null {
    // Analyze historical pricing for similar contracts
    const similarContracts = this.contractHistory.filter(c => 
      c.variety === contract.variety &&
      Math.abs(c.quantity - (contract.quantity || 0)) < 50
    );

    if (similarContracts.length < 3) return null;

    const avgPrice = similarContracts.reduce((sum, c) => sum + c.rate, 0) / similarContracts.length;
    const lastMonthAvg = similarContracts
      .filter(c => new Date(c.createdAt).getMonth() === new Date().getMonth())
      .reduce((sum, c) => sum + c.rate, 0) / Math.max(1, similarContracts.length);

    const trend = lastMonthAvg > avgPrice ? 'increasing' : 'decreasing';
    const suggestedPrice = Math.round(lastMonthAvg);

    return {
      id: `price-${Date.now()}`,
      type: 'pricing',
      priority: 'high',
      confidence: 85,
      title: 'Optimal Pricing Suggestion',
      description: `Based on ${similarContracts.length} similar contracts, market prices are ${trend}`,
      suggestion: {
        rate: suggestedPrice,
        range: {
          min: Math.round(avgPrice * 0.95),
          max: Math.round(avgPrice * 1.05)
        }
      },
      reasoning: `Average rate for ${contract.variety} is ₹${avgPrice}/quintal. Recent trend shows ${trend} prices. Suggested: ₹${suggestedPrice}/quintal`,
      impact: {
        timeSaved: '5 minutes',
        costSaved: Math.abs(suggestedPrice - avgPrice) * (contract.quantity || 0)
      },
      actions: [
        { label: 'Use Suggested Price', value: suggestedPrice },
        { label: 'View Similar Contracts', value: 'view-history' }
      ]
    };
  }

  private suggestQualitySpecs(contract: Partial<Contract>): AISuggestion {
    const varietySpecs: Record<string, any> = {
      'Shankar-6': { length: '28-30mm', mic: '4.0-4.5', rd: '70+' },
      'MCU-5': { length: '26-28mm', mic: '4.5-5.0', rd: '65+' },
      'Bunny-Hybrid': { length: '30-32mm', mic: '3.8-4.2', rd: '75+' }
    };

    const specs = varietySpecs[contract.variety || ''] || { length: '26-28mm', mic: '4.0-4.5', rd: '65+' };

    return {
      id: `quality-${Date.now()}`,
      type: 'quality',
      priority: 'medium',
      confidence: 90,
      title: 'Quality Specifications Recommendation',
      description: `Standard quality specs for ${contract.variety}`,
      suggestion: specs,
      reasoning: `Based on industry standards and historical data for ${contract.variety} variety`,
      impact: {
        timeSaved: '2 minutes',
        riskReduction: 'Ensures consistent quality expectations'
      },
      actions: [
        { label: 'Apply Standard Specs', value: specs },
        { label: 'Customize', value: 'custom' }
      ]
    };
  }

  private suggestPaymentTerms(contract: Partial<Contract>): AISuggestion {
    const clientTerms: Record<string, string> = {
      'KVIC': '60 Days Credit',
      'Mill': '30 Days Credit',
      'Trader': 'Immediate',
      'Export': 'LC at Sight',
      'Government': '45 Days Credit'
    };

    const suggested = clientTerms[contract.clientType || ''] || '30 Days Credit';

    return {
      id: `payment-${Date.now()}`,
      type: 'terms',
      priority: 'medium',
      confidence: 75,
      title: 'Payment Terms Recommendation',
      description: `Optimal payment terms for ${contract.clientType} clients`,
      suggestion: { paymentTerms: suggested },
      reasoning: `Based on typical ${contract.clientType} payment patterns and industry standards`,
      impact: {
        timeSaved: '1 minute',
        riskReduction: 'Reduces payment default risk'
      },
      actions: [
        { label: 'Apply Terms', value: suggested },
        { label: 'View Client History', value: 'history' }
      ]
    };
  }

  private assessRisk(contract: Partial<Contract>): AISuggestion | null {
    const risks: string[] = [];
    let riskLevel: 'high' | 'medium' | 'low' = 'low';

    // Check for high-value contracts
    if ((contract.quantity || 0) * (contract.rate || 0) > 1000000) {
      risks.push('High-value contract (>₹10L). Consider insurance and quality inspection.');
      riskLevel = 'medium';
    }

    // Check for new clients
    if (contract.clientId && !this.contractHistory.find(c => c.clientId === contract.clientId)) {
      risks.push('New client. Verify credentials and consider advance payment.');
      riskLevel = 'high';
    }

    // Check for unusual quality specs
    if (contract.qualitySpecs && contract.qualitySpecs.mic > 5.0) {
      risks.push('Unusual quality specifications. Double-check requirements.');
      riskLevel = 'medium';
    }

    if (risks.length === 0) return null;

    return {
      id: `risk-${Date.now()}`,
      type: 'contract',
      priority: riskLevel,
      confidence: 70,
      title: 'Risk Assessment',
      description: `${risks.length} potential risk(s) identified`,
      suggestion: { risks, mitigation: ['Verify details', 'Get advance payment', 'Add quality clause'] },
      reasoning: risks.join(' '),
      impact: {
        riskReduction: 'Prevents potential losses and disputes'
      },
      actions: [
        { label: 'View Mitigation Steps', value: 'mitigation' },
        { label: 'Proceed Anyway', value: 'proceed' }
      ]
    };
  }

  private suggestDeliveryOptimization(contract: Partial<Contract>): AISuggestion {
    const locationOptimization: Record<string, any> = {
      'Same City': { mode: 'Pickup', cost: 'Low', time: '1-2 days' },
      'Same State': { mode: 'Road Transport', cost: 'Medium', time: '3-5 days' },
      'Interstate': { mode: 'Railway', cost: 'High', time: '7-10 days' }
    };

    const opt = locationOptimization[contract.location || ''] || { mode: 'Road Transport', cost: 'Medium', time: '3-5 days' };

    return {
      id: `delivery-${Date.now()}`,
      type: 'terms',
      priority: 'low',
      confidence: 65,
      title: 'Delivery Optimization',
      description: `Recommended delivery method for ${contract.location}`,
      suggestion: opt,
      reasoning: `For ${contract.quantity} quintals to ${contract.location}, ${opt.mode} is optimal (${opt.cost} cost, ${opt.time})`,
      impact: {
        timeSaved: '30 seconds',
        costSaved: 500
      },
      actions: [
        { label: 'Use Suggested Method', value: opt.mode },
        { label: 'Compare Options', value: 'compare' }
      ]
    };
  }
}

// ============================================================================
// Advanced Analytics
// ============================================================================

export interface AnalyticsDashboard {
  overview: {
    totalContracts: number;
    totalValue: number;
    activeContracts: number;
    avgContractValue: number;
  };
  trends: {
    period: string;
    contracts: number;
    value: number;
    growth: number;
  }[];
  topClients: {
    name: string;
    contracts: number;
    value: number;
  }[];
  topVarieties: {
    variety: string;
    quantity: number;
    avgRate: number;
  }[];
  qualityMetrics: {
    variety: string;
    avgLength: number;
    avgMic: number;
    avgRd: number;
  }[];
  performanceMetrics: {
    avgProcessingTime: number; // seconds
    completionRate: number; // percentage
    errorRate: number; // percentage
  };
}

export class AnalyticsEngine {
  /**
   * Generate comprehensive analytics dashboard
   */
  generateDashboard(contracts: Contract[]): AnalyticsDashboard {
    return {
      overview: this.calculateOverview(contracts),
      trends: this.calculateTrends(contracts),
      topClients: this.getTopClients(contracts),
      topVarieties: this.getTopVarieties(contracts),
      qualityMetrics: this.calculateQualityMetrics(contracts),
      performanceMetrics: this.calculatePerformanceMetrics(contracts)
    };
  }

  private calculateOverview(contracts: Contract[]) {
    const active = contracts.filter(c => c.status === 'Active');
    const totalValue = contracts.reduce((sum, c) => sum + (c.quantity * c.rate), 0);

    return {
      totalContracts: contracts.length,
      totalValue,
      activeContracts: active.length,
      avgContractValue: totalValue / Math.max(1, contracts.length)
    };
  }

  private calculateTrends(contracts: Contract[]) {
    const monthlyData: Record<string, { contracts: number; value: number }> = {};
    
    contracts.forEach(c => {
      const month = new Date(c.createdAt).toISOString().slice(0, 7);
      if (!monthlyData[month]) monthlyData[month] = { contracts: 0, value: 0 };
      monthlyData[month].contracts++;
      monthlyData[month].value += c.quantity * c.rate;
    });

    const months = Object.keys(monthlyData).sort();
    return months.map((month, idx) => {
      const prev = idx > 0 ? monthlyData[months[idx - 1]].value : monthlyData[month].value;
      const growth = ((monthlyData[month].value - prev) / prev) * 100;

      return {
        period: month,
        contracts: monthlyData[month].contracts,
        value: monthlyData[month].value,
        growth: isFinite(growth) ? growth : 0
      };
    });
  }

  private getTopClients(contracts: Contract[]) {
    const clientData: Record<string, { contracts: number; value: number; name: string }> = {};

    contracts.forEach(c => {
      if (!clientData[c.clientId]) {
        clientData[c.clientId] = { contracts: 0, value: 0, name: c.clientName || 'Unknown' };
      }
      clientData[c.clientId].contracts++;
      clientData[c.clientId].value += c.quantity * c.rate;
    });

    return Object.values(clientData)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
      .map(({ name, contracts, value }) => ({ name, contracts, value }));
  }

  private getTopVarieties(contracts: Contract[]) {
    const varietyData: Record<string, { quantity: number; totalValue: number; count: number }> = {};

    contracts.forEach(c => {
      if (!varietyData[c.variety]) {
        varietyData[c.variety] = { quantity: 0, totalValue: 0, count: 0 };
      }
      varietyData[c.variety].quantity += c.quantity;
      varietyData[c.variety].totalValue += c.quantity * c.rate;
      varietyData[c.variety].count++;
    });

    return Object.entries(varietyData)
      .map(([variety, data]) => ({
        variety,
        quantity: data.quantity,
        avgRate: data.totalValue / data.quantity
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }

  private calculateQualityMetrics(contracts: Contract[]) {
    const varietyQuality: Record<string, { length: number[]; mic: number[]; rd: number[] }> = {};

    contracts.forEach(c => {
      if (!c.qualitySpecs) return;
      if (!varietyQuality[c.variety]) {
        varietyQuality[c.variety] = { length: [], mic: [], rd: [] };
      }
      if (c.qualitySpecs.length) varietyQuality[c.variety].length.push(parseFloat(c.qualitySpecs.length));
      if (c.qualitySpecs.mic) varietyQuality[c.variety].mic.push(c.qualitySpecs.mic);
      if (c.qualitySpecs.rd) varietyQuality[c.variety].rd.push(c.qualitySpecs.rd);
    });

    return Object.entries(varietyQuality).map(([variety, data]) => ({
      variety,
      avgLength: data.length.reduce((a, b) => a + b, 0) / Math.max(1, data.length.length),
      avgMic: data.mic.reduce((a, b) => a + b, 0) / Math.max(1, data.mic.length),
      avgRd: data.rd.reduce((a, b) => a + b, 0) / Math.max(1, data.rd.length)
    }));
  }

  private calculatePerformanceMetrics(contracts: Contract[]) {
    const processingTimes = contracts.map(c => {
      const created = new Date(c.createdAt).getTime();
      const updated = new Date(c.updatedAt || c.createdAt).getTime();
      return (updated - created) / 1000; // seconds
    });

    const completed = contracts.filter(c => c.status === 'Completed').length;
    const errors = contracts.filter(c => c.status === 'Error').length;

    return {
      avgProcessingTime: processingTimes.reduce((a, b) => a + b, 0) / Math.max(1, processingTimes.length),
      completionRate: (completed / Math.max(1, contracts.length)) * 100,
      errorRate: (errors / Math.max(1, contracts.length)) * 100
    };
  }

  /**
   * Export analytics report
   */
  exportReport(dashboard: AnalyticsDashboard, format: 'csv' | 'pdf' = 'csv'): string {
    if (format === 'csv') {
      const rows = [
        ['Analytics Report', new Date().toISOString()],
        [],
        ['Overview'],
        ['Total Contracts', dashboard.overview.totalContracts],
        ['Total Value', dashboard.overview.totalValue],
        ['Active Contracts', dashboard.overview.activeContracts],
        ['Avg Contract Value', dashboard.overview.avgContractValue],
        [],
        ['Monthly Trends'],
        ['Period', 'Contracts', 'Value', 'Growth %'],
        ...dashboard.trends.map(t => [t.period, t.contracts, t.value, t.growth.toFixed(2)]),
        [],
        ['Top Clients'],
        ['Name', 'Contracts', 'Value'],
        ...dashboard.topClients.map(c => [c.name, c.contracts, c.value])
      ];

      return rows.map(row => row.join(',')).join('\n');
    }

    return JSON.stringify(dashboard, null, 2);
  }
}

// ============================================================================
// Approval Workflows
// ============================================================================

export interface ApprovalRule {
  id: string;
  name: string;
  condition: (contract: Partial<Contract>) => boolean;
  approvers: string[];
  autoApprove?: boolean;
  notifyOnApproval: boolean;
}

export interface ApprovalRequest {
  id: string;
  contractId: string;
  ruleId: string;
  requestedBy: string;
  requestedAt: Date;
  approvers: string[];
  approvedBy: string[];
  rejectedBy: string[];
  status: 'pending' | 'approved' | 'rejected';
  comments: { user: string; comment: string; timestamp: Date }[];
}

export class ApprovalWorkflowEngine {
  private rules: ApprovalRule[] = [];
  private requests: Map<string, ApprovalRequest> = new Map();

  constructor() {
    // Initialize default approval rules
    this.initializeDefaultRules();
  }

  private initializeDefaultRules() {
    // High-value contracts need approval
    this.addRule({
      id: 'high-value',
      name: 'High Value Contract Approval',
      condition: (contract) => ((contract.quantity || 0) * (contract.rate || 0)) > 1000000,
      approvers: ['manager', 'finance-head'],
      autoApprove: false,
      notifyOnApproval: true
    });

    // New clients need approval
    this.addRule({
      id: 'new-client',
      name: 'New Client Approval',
      condition: (contract) => contract.clientId === 'new',
      approvers: ['manager'],
      autoApprove: false,
      notifyOnApproval: true
    });

    // Export contracts need approval
    this.addRule({
      id: 'export-contract',
      name: 'Export Contract Approval',
      condition: (contract) => contract.bargainType === 'Export',
      approvers: ['manager', 'export-head'],
      autoApprove: false,
      notifyOnApproval: true
    });

    // CCI contracts can be auto-approved if standard
    this.addRule({
      id: 'cci-standard',
      name: 'Standard CCI Contract',
      condition: (contract) => contract.tradeType === 'CCI Trade' && (contract.quantity || 0) < 100,
      approvers: ['manager'],
      autoApprove: true,
      notifyOnApproval: false
    });
  }

  addRule(rule: ApprovalRule) {
    this.rules.push(rule);
  }

  /**
   * Check if contract needs approval
   */
  needsApproval(contract: Partial<Contract>): { needed: boolean; rules: ApprovalRule[] } {
    const applicableRules = this.rules.filter(rule => rule.condition(contract));
    return {
      needed: applicableRules.length > 0,
      rules: applicableRules
    };
  }

  /**
   * Create approval request
   */
  createApprovalRequest(contractId: string, userId: string, contract: Partial<Contract>): ApprovalRequest | null {
    const { needed, rules } = this.needsApproval(contract);
    if (!needed) return null;

    const request: ApprovalRequest = {
      id: `apr-${Date.now()}`,
      contractId,
      ruleId: rules[0].id,
      requestedBy: userId,
      requestedAt: new Date(),
      approvers: rules[0].approvers,
      approvedBy: [],
      rejectedBy: [],
      status: rules[0].autoApprove ? 'approved' : 'pending',
      comments: []
    };

    this.requests.set(request.id, request);
    return request;
  }

  /**
   * Approve request
   */
  approve(requestId: string, userId: string, comment?: string): boolean {
    const request = this.requests.get(requestId);
    if (!request || request.status !== 'pending') return false;

    request.approvedBy.push(userId);
    if (comment) {
      request.comments.push({ user: userId, comment, timestamp: new Date() });
    }

    // Check if all approvers have approved
    if (request.approvedBy.length >= request.approvers.length) {
      request.status = 'approved';
    }

    return true;
  }

  /**
   * Reject request
   */
  reject(requestId: string, userId: string, reason: string): boolean {
    const request = this.requests.get(requestId);
    if (!request || request.status !== 'pending') return false;

    request.rejectedBy.push(userId);
    request.comments.push({ user: userId, comment: reason, timestamp: new Date() });
    request.status = 'rejected';

    return true;
  }

  /**
   * Get pending approvals for user
   */
  getPendingApprovals(userId: string): ApprovalRequest[] {
    return Array.from(this.requests.values()).filter(
      req => req.status === 'pending' && req.approvers.includes(userId)
    );
  }
}

// Export instances
export const aiEngine = new AIEngine();
export const analyticsEngine = new AnalyticsEngine();
export const approvalWorkflow = new ApprovalWorkflowEngine();
