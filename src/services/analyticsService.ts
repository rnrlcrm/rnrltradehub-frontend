/**
 * Advanced Analytics Service
 * Payment behavior, delay patterns, interest trends, party credit scoring
 */

export interface PaymentBehaviorAnalysis {
  partyId: string;
  partyName: string;
  totalInvoices: number;
  totalPaid: number;
  totalOutstanding: number;
  avgPaymentDays: number;
  onTimePaymentRate: number;
  avgDelayDays: number;
  paymentReliabilityScore: number; // 0-100
  trend: 'improving' | 'stable' | 'declining';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface DelayPattern {
  activityType: string;
  avgDelay: number;
  maxDelay: number;
  delayFrequency: number; // % of activities delayed
  commonReasons: {
    reason: string;
    occurrences: number;
    percentage: number;
  }[];
  seasonalTrend: {
    month: string;
    avgDelay: number;
  }[];
  byParty: {
    partyId: string;
    partyName: string;
    avgDelay: number;
    frequency: number;
  }[];
}

export interface InterestTrendAnalysis {
  period: string;
  totalInterestCharged: number;
  totalInterestCalculated: number;
  totalInterestWaived: number;
  avgInterestRate: number;
  byMonth: {
    month: string;
    interestCharged: number;
    interestCalculated: number;
  }[];
  topParties: {
    partyId: string;
    partyName: string;
    totalInterest: number;
    avgDaysOverdue: number;
  }[];
}

export interface PartyCreditScore {
  partyId: string;
  partyName: string;
  creditScore: number; // 0-1000 (like CIBIL)
  grade: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'C' | 'D';
  factors: {
    paymentHistory: {
      score: number;
      weight: number;
      onTimePayments: number;
      latePayments: number;
    };
    outstandingAmount: {
      score: number;
      weight: number;
      totalOutstanding: number;
      overdueAmount: number;
    };
    tradingDuration: {
      score: number;
      weight: number;
      months: number;
    };
    volumeConsistency: {
      score: number;
      weight: number;
      avgMonthlyVolume: number;
      volatility: number;
    };
    disputeHistory: {
      score: number;
      weight: number;
      totalDisputes: number;
      resolvedDisputes: number;
    };
  };
  recommendations: string[];
  creditLimit: number;
  reviewDate: string;
}

/**
 * Advanced Analytics Service Class
 */
export class AnalyticsService {
  /**
   * Analyze payment behavior for a party
   */
  static analyzePaymentBehavior(
    partyId: string,
    invoices: any[],
    payments: any[]
  ): PaymentBehaviorAnalysis {
    const partyInvoices = invoices.filter(inv => 
      inv.buyerId === partyId || inv.sellerId === partyId
    );

    const partyPayments = payments.filter(pay =>
      pay.buyerId === partyId || pay.sellerId === partyId
    );

    const totalInvoices = partyInvoices.length;
    const totalPaid = partyPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalInvoiced = partyInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalOutstanding = totalInvoiced - totalPaid;

    // Calculate payment timing
    const paymentTimings: number[] = [];
    let onTimePayments = 0;

    partyInvoices.forEach(invoice => {
      const relatedPayments = partyPayments.filter(p => p.invoiceId === invoice.id);
      
      relatedPayments.forEach(payment => {
        const invoiceDate = new Date(invoice.date);
        const paymentDate = new Date(payment.date);
        const paymentTermDays = invoice.paymentTerms?.paymentDays || 15;
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + paymentTermDays);

        const actualDays = Math.floor(
          (paymentDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        paymentTimings.push(actualDays);

        if (paymentDate <= dueDate) {
          onTimePayments++;
        }
      });
    });

    const avgPaymentDays = paymentTimings.length > 0
      ? paymentTimings.reduce((sum, d) => sum + d, 0) / paymentTimings.length
      : 0;

    const expectedPaymentDays = 15; // Assume 15 days standard
    const avgDelayDays = Math.max(0, avgPaymentDays - expectedPaymentDays);

    const onTimePaymentRate = partyPayments.length > 0
      ? (onTimePayments / partyPayments.length) * 100
      : 0;

    // Calculate reliability score (0-100)
    const paymentReliabilityScore = Math.round(
      (onTimePaymentRate * 0.7) + // 70% weight to on-time rate
      (Math.max(0, 100 - avgDelayDays * 2) * 0.3) // 30% weight to delay
    );

    // Determine trend (last 3 months vs previous 3 months)
    const trend = this.calculatePaymentTrend(partyPayments);

    // Determine risk level
    let riskLevel: PaymentBehaviorAnalysis['riskLevel'];
    if (paymentReliabilityScore >= 80) {
      riskLevel = 'low';
    } else if (paymentReliabilityScore >= 60) {
      riskLevel = 'medium';
    } else if (paymentReliabilityScore >= 40) {
      riskLevel = 'high';
    } else {
      riskLevel = 'critical';
    }

    return {
      partyId,
      partyName: partyInvoices[0]?.buyerName || partyInvoices[0]?.sellerName || 'Unknown',
      totalInvoices,
      totalPaid,
      totalOutstanding,
      avgPaymentDays,
      onTimePaymentRate,
      avgDelayDays,
      paymentReliabilityScore,
      trend,
      riskLevel,
    };
  }

  /**
   * Analyze delay patterns across activities
   */
  static analyzeDelayPatterns(activities: any[]): DelayPattern {
    const activityType = activities[0]?.type || 'all';
    
    const delays = activities.filter(a => a.currentDelay > 0);
    const avgDelay = delays.length > 0
      ? delays.reduce((sum, a) => sum + a.currentDelay, 0) / delays.length
      : 0;

    const maxDelay = delays.length > 0
      ? Math.max(...delays.map(a => a.currentDelay))
      : 0;

    const delayFrequency = activities.length > 0
      ? (delays.length / activities.length) * 100
      : 0;

    // Common reasons (if available in data)
    const reasonCounts: Record<string, number> = {};
    delays.forEach(a => {
      if (a.delayReason) {
        reasonCounts[a.delayReason] = (reasonCounts[a.delayReason] || 0) + 1;
      }
    });

    const commonReasons = Object.entries(reasonCounts)
      .map(([reason, count]) => ({
        reason,
        occurrences: count,
        percentage: (count / delays.length) * 100,
      }))
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, 5);

    // Seasonal trend
    const monthlyDelays: Record<string, { total: number; count: number }> = {};
    delays.forEach(a => {
      const month = new Date(a.expectedDate).toLocaleString('default', { month: 'short' });
      if (!monthlyDelays[month]) {
        monthlyDelays[month] = { total: 0, count: 0 };
      }
      monthlyDelays[month].total += a.currentDelay;
      monthlyDelays[month].count++;
    });

    const seasonalTrend = Object.entries(monthlyDelays)
      .map(([month, data]) => ({
        month,
        avgDelay: data.total / data.count,
      }))
      .sort((a, b) => new Date(`${a.month} 1`).getMonth() - new Date(`${b.month} 1`).getMonth());

    // By party
    const partyDelays: Record<string, { total: number; count: number; name: string }> = {};
    delays.forEach(a => {
      if (!partyDelays[a.partyId]) {
        partyDelays[a.partyId] = { total: 0, count: 0, name: a.partyName };
      }
      partyDelays[a.partyId].total += a.currentDelay;
      partyDelays[a.partyId].count++;
    });

    const byParty = Object.entries(partyDelays)
      .map(([partyId, data]) => ({
        partyId,
        partyName: data.name,
        avgDelay: data.total / data.count,
        frequency: (data.count / activities.filter(a => a.partyId === partyId).length) * 100,
      }))
      .sort((a, b) => b.avgDelay - a.avgDelay)
      .slice(0, 10);

    return {
      activityType,
      avgDelay,
      maxDelay,
      delayFrequency,
      commonReasons,
      seasonalTrend,
      byParty,
    };
  }

  /**
   * Analyze interest trends
   */
  static analyzeInterestTrends(
    interestCalculations: any[],
    period: string = 'Last 12 Months'
  ): InterestTrendAnalysis {
    const totalInterestCharged = interestCalculations
      .filter(calc => calc.interestOptedIn)
      .reduce((sum, calc) => sum + calc.interestAmount, 0);

    const totalInterestCalculated = interestCalculations
      .reduce((sum, calc) => sum + calc.interestAmount, 0);

    const totalInterestWaived = totalInterestCalculated - totalInterestCharged;

    const avgInterestRate = interestCalculations.length > 0
      ? interestCalculations.reduce((sum, calc) => sum + calc.interestRate, 0) / interestCalculations.length
      : 0;

    // By month
    const monthlyInterest: Record<string, { charged: number; calculated: number }> = {};
    interestCalculations.forEach(calc => {
      const month = new Date(calc.dueDate).toLocaleString('default', { month: 'short-year' });
      if (!monthlyInterest[month]) {
        monthlyInterest[month] = { charged: 0, calculated: 0 };
      }
      monthlyInterest[month].calculated += calc.interestAmount;
      if (calc.interestOptedIn) {
        monthlyInterest[month].charged += calc.interestAmount;
      }
    });

    const byMonth = Object.entries(monthlyInterest)
      .map(([month, data]) => ({
        month,
        interestCharged: data.charged,
        interestCalculated: data.calculated,
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    // Top parties
    const partyInterest: Record<string, { 
      name: string; 
      total: number; 
      totalDays: number;
      count: number;
    }> = {};

    interestCalculations.forEach(calc => {
      const partyId = calc.entityId.split('-')[0]; // Simplified
      if (!partyInterest[partyId]) {
        partyInterest[partyId] = { name: 'Party', total: 0, totalDays: 0, count: 0 };
      }
      partyInterest[partyId].total += calc.interestAmount;
      partyInterest[partyId].totalDays += calc.daysOverdue;
      partyInterest[partyId].count++;
    });

    const topParties = Object.entries(partyInterest)
      .map(([partyId, data]) => ({
        partyId,
        partyName: data.name,
        totalInterest: data.total,
        avgDaysOverdue: data.totalDays / data.count,
      }))
      .sort((a, b) => b.totalInterest - a.totalInterest)
      .slice(0, 10);

    return {
      period,
      totalInterestCharged,
      totalInterestCalculated,
      totalInterestWaived,
      avgInterestRate,
      byMonth,
      topParties,
    };
  }

  /**
   * Calculate party credit score (0-1000)
   */
  static calculatePartyCreditScore(
    partyId: string,
    paymentHistory: any[],
    outstandingData: any,
    tradingHistory: any[],
    disputes: any[]
  ): PartyCreditScore {
    const partyName = paymentHistory[0]?.partyName || 'Unknown';

    // Factor 1: Payment History (40% weight)
    const onTimePayments = paymentHistory.filter(p => p.onTime).length;
    const latePayments = paymentHistory.length - onTimePayments;
    const paymentHistoryScore = Math.round(
      (onTimePayments / Math.max(1, paymentHistory.length)) * 400
    );

    // Factor 2: Outstanding Amount (25% weight)
    const outstandingScore = Math.round(
      Math.max(0, 250 - (outstandingData.overdueAmount / 10000))
    );

    // Factor 3: Trading Duration (15% weight)
    const tradingMonths = tradingHistory.length || 1;
    const durationScore = Math.min(150, tradingMonths * 2.5);

    // Factor 4: Volume Consistency (10% weight)
    const avgVolume = tradingHistory.reduce((sum, t) => sum + (t.value || 0), 0) / tradingHistory.length;
    const volatility = this.calculateVolatility(tradingHistory);
    const consistencyScore = Math.round(100 * (1 - Math.min(1, volatility / 50)));

    // Factor 5: Dispute History (10% weight)
    const resolvedDisputes = disputes.filter(d => d.status === 'Resolved').length;
    const disputeScore = disputes.length === 0 
      ? 100 
      : Math.round((resolvedDisputes / disputes.length) * 100);

    // Total score
    const creditScore = Math.min(1000,
      paymentHistoryScore +
      outstandingScore +
      durationScore +
      consistencyScore +
      disputeScore
    );

    // Grade
    let grade: PartyCreditScore['grade'];
    if (creditScore >= 900) grade = 'AAA';
    else if (creditScore >= 800) grade = 'AA';
    else if (creditScore >= 700) grade = 'A';
    else if (creditScore >= 600) grade = 'BBB';
    else if (creditScore >= 500) grade = 'BB';
    else if (creditScore >= 400) grade = 'B';
    else if (creditScore >= 300) grade = 'C';
    else grade = 'D';

    // Recommendations
    const recommendations: string[] = [];
    if (paymentHistoryScore < 300) {
      recommendations.push('Improve payment timeliness to increase credit score');
    }
    if (outstandingScore < 200) {
      recommendations.push('Reduce overdue amount to improve credit standing');
    }
    if (disputeScore < 80) {
      recommendations.push('Resolve pending disputes to improve trust score');
    }
    if (creditScore >= 800) {
      recommendations.push('Excellent credit standing - eligible for premium benefits');
    }

    // Credit limit based on score
    const creditLimit = Math.round((creditScore / 1000) * 5000000); // Max 50 lakh

    return {
      partyId,
      partyName,
      creditScore,
      grade,
      factors: {
        paymentHistory: {
          score: paymentHistoryScore,
          weight: 0.40,
          onTimePayments,
          latePayments,
        },
        outstandingAmount: {
          score: outstandingScore,
          weight: 0.25,
          totalOutstanding: outstandingData.totalOutstanding || 0,
          overdueAmount: outstandingData.overdueAmount || 0,
        },
        tradingDuration: {
          score: durationScore,
          weight: 0.15,
          months: tradingMonths,
        },
        volumeConsistency: {
          score: consistencyScore,
          weight: 0.10,
          avgMonthlyVolume: avgVolume,
          volatility,
        },
        disputeHistory: {
          score: disputeScore,
          weight: 0.10,
          totalDisputes: disputes.length,
          resolvedDisputes,
        },
      },
      recommendations,
      creditLimit,
      reviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days
    };
  }

  /**
   * Private helper methods
   */
  private static calculatePaymentTrend(payments: any[]): 'improving' | 'stable' | 'declining' {
    if (payments.length < 6) return 'stable';

    const recent = payments.slice(-3);
    const previous = payments.slice(-6, -3);

    const recentAvgDelay = this.getAvgDelay(recent);
    const previousAvgDelay = this.getAvgDelay(previous);

    const improvement = previousAvgDelay - recentAvgDelay;

    if (improvement > 2) return 'improving';
    if (improvement < -2) return 'declining';
    return 'stable';
  }

  private static getAvgDelay(payments: any[]): number {
    const delays = payments.map(p => p.delay || 0);
    return delays.reduce((sum, d) => sum + d, 0) / delays.length;
  }

  private static calculateVolatility(tradingHistory: any[]): number {
    if (tradingHistory.length < 2) return 0;

    const values = tradingHistory.map(t => t.value || 0);
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return avg > 0 ? (stdDev / avg) * 100 : 0; // CV as percentage
  }
}

export default AnalyticsService;
