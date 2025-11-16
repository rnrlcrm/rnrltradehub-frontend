/**
 * Interest Calculation Service
 * Automatically calculates interest on late payments
 * IMPORTANT: EMD Interest and Carrying Charges are ONLY for CCI trades
 * Normal trades only have optional payment delay interest
 */

export interface InterestCalculation {
  entityId: string;
  entityType: 'invoice' | 'payment' | 'contract';
  tradeType: 'normal' | 'cci'; // Distinguish between normal and CCI trades
  principalAmount: number;
  dueDate: string;
  actualDate?: string;
  gracePeriodDays: number;
  interestRate: number; // Annual percentage
  lateFeeRate?: number; // Flat late fee (optional)
  daysOverdue: number;
  interestAmount: number;
  lateFeeAmount: number;
  totalAmount: number;
  status: 'on_time' | 'within_grace' | 'overdue' | 'severely_overdue';
  isInterestApplicable: boolean; // Whether interest is actually charged (optional in normal trades)
  interestOptedIn: boolean; // Whether parties agreed to charge interest
}

export interface PaymentTerms {
  paymentDays: number; // e.g., 15 days, 30 days
  gracePeriodDays: number; // e.g., 5 days grace
  interestRatePerAnnum: number; // e.g., 18%, 12%
  lateFeeFlat?: number; // e.g., ₹500 flat fee (optional)
  compoundingFrequency: 'daily' | 'monthly' | 'annually';
  chargeInterest: boolean; // Whether to actually charge interest (optional in normal trades)
}

/**
 * CCI-specific charges (ONLY for CCI trades)
 */
export interface CCICharges {
  emdAmount: number;
  emdDueDate: string;
  emdPaidDate?: string;
  emdInterestRate: number;
  carryingChargeTier1Days: number;
  carryingChargeTier1Rate: number;
  carryingChargeTier2Rate: number;
  freeLiftingDays: number;
}

/**
 * Interest Calculation Service Class
 */
export class InterestCalculationService {
  /**
   * Calculate interest on late payment for NORMAL TRADES
   * Interest is OPTIONAL - calculated for information but only charged if opted in
   */
  static calculatePaymentInterest(
    invoiceAmount: number,
    invoiceDate: string,
    paymentTerms: PaymentTerms,
    actualPaymentDate?: string
  ): InterestCalculation {
    const invoiceDateObj = new Date(invoiceDate);
    const dueDate = new Date(invoiceDateObj);
    dueDate.setDate(dueDate.getDate() + paymentTerms.paymentDays);

    const actualDate = actualPaymentDate ? new Date(actualPaymentDate) : new Date();
    const gracePeriodEnd = new Date(dueDate);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + paymentTerms.gracePeriodDays);

    // Calculate days overdue
    const daysOverdue = Math.max(
      0,
      Math.floor((actualDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Calculate interest (only if beyond grace period)
    let interestAmount = 0;
    let isInterestApplicable = false;
    
    if (daysOverdue > paymentTerms.gracePeriodDays) {
      isInterestApplicable = true;
      const overdueWithoutGrace = daysOverdue - paymentTerms.gracePeriodDays;
      
      if (paymentTerms.compoundingFrequency === 'daily') {
        // Daily compounding: A = P(1 + r/365)^days
        const dailyRate = paymentTerms.interestRatePerAnnum / 100 / 365;
        interestAmount = invoiceAmount * Math.pow(1 + dailyRate, overdueWithoutGrace) - invoiceAmount;
      } else {
        // Simple interest: I = P * R * T / 365
        interestAmount = (invoiceAmount * paymentTerms.interestRatePerAnnum * overdueWithoutGrace) / (100 * 365);
      }
    }

    // Calculate late fee (only if opted in)
    const lateFeeAmount = (daysOverdue > paymentTerms.gracePeriodDays && paymentTerms.lateFeeFlat) 
      ? paymentTerms.lateFeeFlat 
      : 0;

    // Determine status
    let status: InterestCalculation['status'];
    if (daysOverdue === 0) {
      status = 'on_time';
    } else if (daysOverdue <= paymentTerms.gracePeriodDays) {
      status = 'within_grace';
    } else if (daysOverdue <= 30) {
      status = 'overdue';
    } else {
      status = 'severely_overdue';
    }

    return {
      entityId: 'INV-TEMP',
      entityType: 'invoice',
      tradeType: 'normal',
      principalAmount: invoiceAmount,
      dueDate: dueDate.toISOString().split('T')[0],
      actualDate: actualDate.toISOString().split('T')[0],
      gracePeriodDays: paymentTerms.gracePeriodDays,
      interestRate: paymentTerms.interestRatePerAnnum,
      lateFeeRate: paymentTerms.lateFeeFlat,
      daysOverdue,
      interestAmount: Math.round(interestAmount * 100) / 100,
      lateFeeAmount,
      totalAmount: paymentTerms.chargeInterest 
        ? Math.round((invoiceAmount + interestAmount + lateFeeAmount) * 100) / 100
        : invoiceAmount,
      status,
      isInterestApplicable,
      interestOptedIn: paymentTerms.chargeInterest,
    };
  }

  /**
   * Calculate EMD interest - ONLY FOR CCI TRADES
   * This should NOT be used for normal trades
   */
  static calculateCCIEMDInterest(
    emdAmount: number,
    contractDate: string,
    emdPaymentDays: number,
    interestRate: number,
    actualPaymentDate?: string
  ): InterestCalculation {
    const contractDateObj = new Date(contractDate);
    const dueDate = new Date(contractDateObj);
    dueDate.setDate(dueDate.getDate() + emdPaymentDays);

    const actualDate = actualPaymentDate ? new Date(actualPaymentDate) : new Date();
    
    const daysLate = Math.max(
      0,
      Math.floor((actualDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Calculate penalty interest for late EMD (CCI specific)
    const interestAmount = daysLate > 0 
      ? (emdAmount * interestRate * daysLate) / (100 * 365)
      : 0;

    return {
      entityId: 'EMD-TEMP',
      entityType: 'contract',
      tradeType: 'cci', // CCI only
      principalAmount: emdAmount,
      dueDate: dueDate.toISOString().split('T')[0],
      actualDate: actualDate.toISOString().split('T')[0],
      gracePeriodDays: 0, // No grace for EMD in CCI
      interestRate,
      daysOverdue: daysLate,
      interestAmount: Math.round(interestAmount * 100) / 100,
      lateFeeAmount: 0,
      totalAmount: Math.round((emdAmount + interestAmount) * 100) / 100,
      status: daysLate === 0 ? 'on_time' : daysLate <= 30 ? 'overdue' : 'severely_overdue',
      isInterestApplicable: daysLate > 0,
      interestOptedIn: true, // CCI always charges
    };
  }

  /**
   * Calculate carrying charges - ONLY FOR CCI TRADES
   * This should NOT be used for normal trades
   */
  static calculateCCICarryingCharges(
    contractValue: number,
    liftingDate: string,
    freeLiftingDays: number,
    tier1Days: number,
    tier1Rate: number,
    tier2Rate: number
  ): number {
    const liftingDateObj = new Date(liftingDate);
    const freePeriodEnd = new Date(liftingDateObj);
    freePeriodEnd.setDate(freePeriodEnd.getDate() + freeLiftingDays);

    const today = new Date();
    const daysInStorage = Math.max(
      0,
      Math.floor((today.getTime() - freePeriodEnd.getTime()) / (1000 * 60 * 60 * 24))
    );

    if (daysInStorage === 0) return 0;

    let charges = 0;

    if (daysInStorage <= tier1Days) {
      // Tier 1 charges
      charges = (contractValue * tier1Rate * daysInStorage) / (100 * 30);
    } else {
      // Tier 1 charges for first period
      const tier1Charges = (contractValue * tier1Rate * tier1Days) / (100 * 30);
      // Tier 2 charges for remaining period
      const tier2Days = daysInStorage - tier1Days;
      const tier2Charges = (contractValue * tier2Rate * tier2Days) / (100 * 30);
      charges = tier1Charges + tier2Charges;
    }

    return Math.round(charges * 100) / 100;
  }

  /**
   * Batch calculate interest for multiple invoices
   */
  static batchCalculateInvoiceInterest(
    invoices: Array<{
      id: string;
      amount: number;
      date: string;
      paymentTerms: PaymentTerms;
      paidDate?: string;
    }>
  ): InterestCalculation[] {
    return invoices.map(invoice => ({
      ...this.calculatePaymentInterest(
        invoice.amount,
        invoice.date,
        invoice.paymentTerms,
        invoice.paidDate
      ),
      entityId: invoice.id,
    }));
  }

  /**
   * Get interest summary for a party
   */
  static getPartySummary(calculations: InterestCalculation[]): {
    totalPrincipal: number;
    totalInterest: number;
    totalLateFees: number;
    totalDue: number;
    overdueCount: number;
    severelyOverdueCount: number;
    interestChargedCount: number; // Invoices where interest is actually charged
    interestWarningCount: number; // Invoices where interest is calculated but not charged
  } {
    return calculations.reduce(
      (summary, calc) => ({
        totalPrincipal: summary.totalPrincipal + calc.principalAmount,
        totalInterest: summary.totalInterest + (calc.interestOptedIn ? calc.interestAmount : 0),
        totalLateFees: summary.totalLateFees + (calc.interestOptedIn ? calc.lateFeeAmount : 0),
        totalDue: summary.totalDue + calc.totalAmount,
        overdueCount: summary.overdueCount + (calc.status === 'overdue' ? 1 : 0),
        severelyOverdueCount: summary.severelyOverdueCount + (calc.status === 'severely_overdue' ? 1 : 0),
        interestChargedCount: summary.interestChargedCount + (calc.isInterestApplicable && calc.interestOptedIn ? 1 : 0),
        interestWarningCount: summary.interestWarningCount + (calc.isInterestApplicable && !calc.interestOptedIn ? 1 : 0),
      }),
      {
        totalPrincipal: 0,
        totalInterest: 0,
        totalLateFees: 0,
        totalDue: 0,
        overdueCount: 0,
        severelyOverdueCount: 0,
        interestChargedCount: 0,
        interestWarningCount: 0,
      }
    );
  }

  /**
   * Check if party should be blocked from new trades
   */
  static shouldBlockParty(calculations: InterestCalculation[]): {
    shouldBlock: boolean;
    reason: string;
    severity: 'warning' | 'critical';
  } {
    const summary = this.getPartySummary(calculations);

    // Block if severely overdue transactions
    if (summary.severelyOverdueCount > 0) {
      return {
        shouldBlock: true,
        reason: `${summary.severelyOverdueCount} payment(s) severely overdue (>30 days). Total outstanding: ₹${summary.totalDue.toLocaleString()}`,
        severity: 'critical',
      };
    }

    // Warning if multiple overdue
    if (summary.overdueCount >= 3) {
      return {
        shouldBlock: true,
        reason: `${summary.overdueCount} payments overdue. Please clear dues before new trades.`,
        severity: 'critical',
      };
    }

    // Warning if high potential interest (even if not charging)
    const potentialInterest = calculations.reduce((sum, calc) => 
      sum + (calc.isInterestApplicable ? calc.interestAmount : 0), 0);
    
    if (potentialInterest > 50000) {
      return {
        shouldBlock: false,
        reason: summary.interestWarningCount > 0
          ? `High potential interest charges (₹${potentialInterest.toLocaleString()}). ${summary.interestWarningCount} payment(s) delayed. Please settle soon to avoid future interest.`
          : `High interest charges (₹${potentialInterest.toLocaleString()}). Please settle soon.`,
        severity: 'warning',
      };
    }

    return {
      shouldBlock: false,
      reason: '',
      severity: 'warning',
    };
  }

  /**
   * Generate interest reminder message (for warning, not necessarily charging)
   */
  static generateInterestReminder(calculation: InterestCalculation): string {
    if (!calculation.isInterestApplicable) {
      return '';
    }

    if (calculation.interestOptedIn) {
      // Interest will be charged
      return `⚠️ PAYMENT OVERDUE NOTICE\n\n` +
        `Invoice ${calculation.entityId} is ${calculation.daysOverdue} days overdue.\n\n` +
        `Principal Amount: ₹${calculation.principalAmount.toLocaleString()}\n` +
        `Interest (${calculation.interestRate}% p.a.): ₹${calculation.interestAmount.toLocaleString()}\n` +
        `Late Fee: ₹${calculation.lateFeeAmount.toLocaleString()}\n` +
        `Total Due: ₹${calculation.totalAmount.toLocaleString()}\n\n` +
        `Interest charges will be applied. Please make payment immediately.`;
    } else {
      // Interest not charged but calculated for warning
      return `⚠️ PAYMENT DELAY REMINDER\n\n` +
        `Invoice ${calculation.entityId} is ${calculation.daysOverdue} days overdue.\n\n` +
        `Amount Due: ₹${calculation.principalAmount.toLocaleString()}\n` +
        `Days Overdue: ${calculation.daysOverdue} days\n\n` +
        `📊 Informational Interest Calculation:\n` +
        `If interest were charged at ${calculation.interestRate}% p.a., it would be: ₹${calculation.interestAmount.toLocaleString()}\n\n` +
        `Please make payment soon to maintain good standing.`;
    }
  }

  /**
   * Generate interest debit note (only if opted in)
   */
  static generateInterestDebitNote(calculation: InterestCalculation): {
    noteNumber: string;
    date: string;
    amount: number;
    description: string;
  } | null {
    // Only generate debit note if interest is actually being charged
    if (!calculation.interestOptedIn || !calculation.isInterestApplicable) {
      return null;
    }

    return {
      noteNumber: `DN-INT-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      amount: calculation.interestAmount + calculation.lateFeeAmount,
      description: `Interest charges for ${calculation.daysOverdue} days overdue on ${calculation.entityType} ${calculation.entityId}. Principal: ₹${calculation.principalAmount.toLocaleString()}, Interest Rate: ${calculation.interestRate}% p.a., Interest: ₹${calculation.interestAmount.toLocaleString()}, Late Fee: ₹${calculation.lateFeeAmount.toLocaleString()}`,
    };
  }
}

export default InterestCalculationService;
