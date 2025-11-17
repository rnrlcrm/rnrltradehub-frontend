/**
 * Auto-Reconciliation Service (RECO)
 * Automatically reconciles ledger entries
 */

import { LedgerEntry, Reconciliation } from '../types';

export interface ReconciliationResult {
  id: string;
  status: 'matched' | 'unmatched' | 'difference';
  systemBalance: number;
  statedBalance: number;
  difference: number;
  matchedItems: number;
  unmatchedItems: number;
  items: ReconciliationItem[];
}

export interface ReconciliationItem {
  id: string;
  date: string;
  description: string;
  systemAmount: number;
  statedAmount: number;
  difference: number;
  status: 'Matched' | 'Unmatched' | 'Disputed';
  remarks?: string;
}

/**
 * Auto-Reconciliation Service Class
 */
export class AutoReconciliationService {
  /**
   * Auto-reconcile party ledger
   */
  static async reconcilePartyLedger(
    partyId: string,
    fromDate: string,
    toDate: string,
    statedBalance?: number
  ): Promise<ReconciliationResult> {
    try {
      // Get ledger entries for the party
      const ledgerEntries = await this.getLedgerEntries(partyId, fromDate, toDate);

      // Calculate system balance
      const systemBalance = this.calculateBalance(ledgerEntries);

      // Compare with stated balance (if provided)
      const stated = statedBalance || systemBalance;
      const difference = systemBalance - stated;

      // Match individual items
      const items = await this.matchLedgerItems(ledgerEntries);

      // Count matched/unmatched items
      const matchedItems = items.filter(i => i.status === 'Matched').length;
      const unmatchedItems = items.filter(i => i.status !== 'Matched').length;

      // Determine overall status
      let status: 'matched' | 'unmatched' | 'difference';
      if (Math.abs(difference) < 1 && unmatchedItems === 0) {
        status = 'matched';
      } else if (unmatchedItems > 0) {
        status = 'unmatched';
      } else {
        status = 'difference';
      }

      const result: ReconciliationResult = {
        id: `RECO-${Date.now()}`,
        status,
        systemBalance,
        statedBalance: stated,
        difference,
        matchedItems,
        unmatchedItems,
        items,
      };

      // Save reconciliation record
      await this.saveReconciliation(result, partyId, fromDate, toDate);

      console.log(`Reconciliation completed for party ${partyId}:`, status);

      return result;
    } catch (error) {
      console.error('Auto-reconciliation failed:', error);
      throw error;
    }
  }

  /**
   * Auto-reconcile contract
   */
  static async reconcileContract(
    contractId: string,
    fromDate: string,
    toDate: string
  ): Promise<ReconciliationResult> {
    try {
      // Get ledger entries for the contract
      const ledgerEntries = await this.getLedgerEntriesByContract(contractId, fromDate, toDate);

      // Calculate balances
      const systemBalance = this.calculateBalance(ledgerEntries);

      // Match items
      const items = await this.matchLedgerItems(ledgerEntries);

      const matchedItems = items.filter(i => i.status === 'Matched').length;
      const unmatchedItems = items.filter(i => i.status !== 'Matched').length;

      const status = unmatchedItems === 0 ? 'matched' : 'unmatched';

      const result: ReconciliationResult = {
        id: `RECO-${Date.now()}`,
        status,
        systemBalance,
        statedBalance: systemBalance,
        difference: 0,
        matchedItems,
        unmatchedItems,
        items,
      };

      await this.saveReconciliation(result, null, fromDate, toDate, contractId);

      return result;
    } catch (error) {
      console.error('Contract reconciliation failed:', error);
      throw error;
    }
  }

  /**
   * Auto-reconcile invoice with payment
   */
  static async reconcileInvoicePayment(invoiceId: string): Promise<ReconciliationResult> {
    try {
      // Get invoice
      const invoice = await this.getInvoice(invoiceId);
      
      // Get payments for invoice
      const payments = await this.getPaymentsForInvoice(invoiceId);

      // Calculate totals
      const invoiceAmount = invoice.totalAmount || invoice.amount;
      const paidAmount = payments.reduce((sum: number, p: any) => sum + p.amount, 0);
      const difference = invoiceAmount - paidAmount;

      // Create reconciliation items
      const items: ReconciliationItem[] = [
        {
          id: `ITEM-${Date.now()}-1`,
          date: invoice.date,
          description: `Invoice ${invoice.invoiceNo}`,
          systemAmount: invoiceAmount,
          statedAmount: invoiceAmount,
          difference: 0,
          status: 'Matched',
        },
        ...payments.map((payment: any, index: number) => ({
          id: `ITEM-${Date.now()}-${index + 2}`,
          date: payment.date,
          description: `Payment ${payment.paymentId}`,
          systemAmount: payment.amount,
          statedAmount: payment.amount,
          difference: 0,
          status: 'Matched' as const,
        })),
      ];

      // Determine status
      let status: 'matched' | 'unmatched' | 'difference';
      if (Math.abs(difference) < 1) {
        status = 'matched';
      } else {
        status = 'difference';
      }

      const result: ReconciliationResult = {
        id: `RECO-${Date.now()}`,
        status,
        systemBalance: invoiceAmount,
        statedBalance: paidAmount,
        difference,
        matchedItems: items.length,
        unmatchedItems: 0,
        items,
      };

      return result;
    } catch (error) {
      console.error('Invoice-payment reconciliation failed:', error);
      throw error;
    }
  }

  /**
   * Batch reconciliation for multiple parties
   */
  static async batchReconcile(
    parties: Array<{ partyId: string; fromDate: string; toDate: string }>,
    onProgress?: (current: number, total: number) => void
  ): Promise<ReconciliationResult[]> {
    const results: ReconciliationResult[] = [];

    for (let i = 0; i < parties.length; i++) {
      const party = parties[i];
      
      try {
        const result = await this.reconcilePartyLedger(
          party.partyId,
          party.fromDate,
          party.toDate
        );
        results.push(result);
      } catch (error) {
        console.error(`Failed to reconcile party ${party.partyId}:`, error);
      }

      if (onProgress) {
        onProgress(i + 1, parties.length);
      }
    }

    return results;
  }

  /**
   * Schedule auto-reconciliation
   */
  static scheduleAutoReconciliation(
    frequency: 'daily' | 'weekly' | 'monthly',
    parties: string[]
  ): void {
    console.log(`Scheduled ${frequency} auto-reconciliation for ${parties.length} parties`);
    
    // In production, this would set up a cron job or scheduled task
    // For demo, just log the schedule
    const intervals = {
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
      monthly: 30 * 24 * 60 * 60 * 1000,
    };

    // Store schedule in localStorage
    const schedule = {
      frequency,
      interval: intervals[frequency],
      parties,
      lastRun: null,
      nextRun: new Date(Date.now() + intervals[frequency]).toISOString(),
    };

    localStorage.setItem('autoRecoSchedule', JSON.stringify(schedule));
  }

  /**
   * Get ledger entries for party
   */
  private static async getLedgerEntries(
    partyId: string,
    fromDate: string,
    toDate: string
  ): Promise<LedgerEntry[]> {
    // In production, this would query the backend
    const stored = localStorage.getItem('ledgerEntries');
    if (!stored) return [];

    const allEntries: LedgerEntry[] = JSON.parse(stored);
    
    return allEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      const from = new Date(fromDate);
      const to = new Date(toDate);
      
      return (
        entry.partyId === partyId &&
        entryDate >= from &&
        entryDate <= to
      );
    });
  }

  /**
   * Get ledger entries by contract
   */
  private static async getLedgerEntriesByContract(
    contractId: string,
    fromDate: string,
    toDate: string
  ): Promise<LedgerEntry[]> {
    const stored = localStorage.getItem('ledgerEntries');
    if (!stored) return [];

    const allEntries: LedgerEntry[] = JSON.parse(stored);
    
    return allEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      const from = new Date(fromDate);
      const to = new Date(toDate);
      
      return (
        entry.referenceId === contractId &&
        entryDate >= from &&
        entryDate <= to
      );
    });
  }

  /**
   * Calculate balance from ledger entries
   */
  private static calculateBalance(entries: LedgerEntry[]): number {
    return entries.reduce((balance, entry) => {
      if (entry.entryType === 'Debit') {
        return balance + entry.amount;
      } else {
        return balance - entry.amount;
      }
    }, 0);
  }

  /**
   * Match ledger items
   */
  private static async matchLedgerItems(
    entries: LedgerEntry[]
  ): Promise<ReconciliationItem[]> {
    return entries.map(entry => ({
      id: entry.id,
      date: entry.date,
      description: entry.description,
      systemAmount: entry.amount,
      statedAmount: entry.amount, // In production, this would come from external source
      difference: 0,
      status: 'Matched' as const,
      remarks: entry.remarks,
    }));
  }

  /**
   * Get invoice by ID
   */
  private static async getInvoice(invoiceId: string): Promise<any> {
    // Mock implementation - in production, query backend
    return {
      id: invoiceId,
      invoiceNo: `INV-${invoiceId}`,
      amount: 100000,
      totalAmount: 105000,
      date: new Date().toISOString(),
    };
  }

  /**
   * Get payments for invoice
   */
  private static async getPaymentsForInvoice(invoiceId: string): Promise<any[]> {
    // Mock implementation - in production, query backend
    return [
      {
        id: 'PAY1',
        paymentId: 'PAY-001',
        invoiceId,
        amount: 50000,
        date: new Date().toISOString(),
      },
    ];
  }

  /**
   * Save reconciliation record
   */
  private static async saveReconciliation(
    result: ReconciliationResult,
    partyId: string | null,
    fromDate: string,
    toDate: string,
    contractId?: string
  ): Promise<void> {
    const reconciliation: Partial<Reconciliation> = {
      id: result.id,
      date: new Date().toISOString(),
      financialYear: this.getCurrentFinancialYear(),
      type: contractId ? 'Contract' : 'Party',
      partyId: partyId || undefined,
      contractId: contractId,
      fromDate,
      toDate,
      systemBalance: result.systemBalance,
      statedBalance: result.statedBalance,
      difference: result.difference,
      items: result.items,
      status: result.status === 'matched' ? 'Completed' : 'In Progress',
      createdBy: 'System',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to storage
    const stored = localStorage.getItem('reconciliations');
    const reconciliations = stored ? JSON.parse(stored) : [];
    reconciliations.push(reconciliation);
    localStorage.setItem('reconciliations', JSON.stringify(reconciliations));

    console.log('Reconciliation saved:', result.id);
  }

  /**
   * Get current financial year
   */
  private static getCurrentFinancialYear(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    if (month >= 4) {
      return `FY ${year}-${(year + 1).toString().slice(-2)}`;
    } else {
      return `FY ${year - 1}-${year.toString().slice(-2)}`;
    }
  }
}

export default AutoReconciliationService;
