/**
 * Auto-Posting Service for Ledger Entries
 * Automatically posts transactions to ledger
 */

import { LedgerEntry } from '../types';

export interface LedgerPostingResult {
  success: boolean;
  ledgerEntryId?: string;
  error?: string;
  balance?: number;
}

export interface DebitCreditNote {
  id: string;
  noteNumber: string;
  noteType: 'debit' | 'credit';
  date: string;
  partyId: string;
  partyName: string;
  partyType: 'Buyer' | 'Seller';
  amount: number;
  reason: string;
  referenceType: 'Contract' | 'Invoice' | 'Payment' | 'Dispute' | 'Other';
  referenceId: string;
  referenceNumber: string;
  status: 'Draft' | 'Approved' | 'Posted' | 'Rejected';
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  postedAt?: string;
}

/**
 * Auto-Posting Service Class
 */
export class AutoPostingService {
  /**
   * Auto-post invoice to ledger
   */
  static async postInvoiceToLedger(invoice: any): Promise<LedgerPostingResult> {
    try {
      // Create debit entry for buyer (invoice amount)
      const ledgerEntry: Partial<LedgerEntry> = {
        id: `LE-${Date.now()}`,
        date: invoice.date,
        financialYear: invoice.financialYear || this.getCurrentFinancialYear(),
        partyId: invoice.buyerId,
        partyName: invoice.buyerName,
        partyOrg: invoice.buyerOrg || invoice.buyerName,
        partyType: 'Buyer',
        transactionType: 'Sale',
        entryType: 'Debit',
        amount: invoice.totalAmount || invoice.amount,
        referenceType: 'Invoice',
        referenceId: invoice.id,
        referenceNumber: invoice.invoiceNo,
        description: `Sale invoice ${invoice.invoiceNo} for contract ${invoice.salesContractId}`,
        balance: 0, // Will be calculated
        isReconciled: false,
        createdBy: 'System',
        createdAt: new Date().toISOString(),
      };

      // Calculate running balance
      const previousBalance = await this.getPartyBalance(invoice.buyerId);
      ledgerEntry.balance = previousBalance + (invoice.totalAmount || invoice.amount);

      // Save to backend
      await this.saveLedgerEntry(ledgerEntry as LedgerEntry);

      console.log(`Invoice ${invoice.invoiceNo} posted to ledger. Entry ID: ${ledgerEntry.id}`);

      return {
        success: true,
        ledgerEntryId: ledgerEntry.id,
        balance: ledgerEntry.balance,
      };
    } catch (error) {
      console.error('Failed to post invoice to ledger:', error);
      return {
        success: false,
        error: 'Failed to post invoice to ledger',
      };
    }
  }

  /**
   * Auto-post payment to ledger
   */
  static async postPaymentToLedger(payment: any): Promise<LedgerPostingResult> {
    try {
      // Create credit entry for buyer (payment received)
      const ledgerEntry: Partial<LedgerEntry> = {
        id: `LE-${Date.now()}`,
        date: payment.date,
        financialYear: this.getCurrentFinancialYear(),
        partyId: payment.buyerId || payment.payerId,
        partyName: payment.buyerName || payment.payerName,
        partyOrg: payment.buyerOrg || payment.payerName,
        partyType: 'Buyer',
        transactionType: 'Payment',
        entryType: 'Credit',
        amount: payment.amount,
        referenceType: 'Payment',
        referenceId: payment.id,
        referenceNumber: payment.paymentId,
        description: `Payment ${payment.paymentId} for invoice ${payment.invoiceId} via ${payment.method}`,
        balance: 0, // Will be calculated
        isReconciled: false,
        createdBy: 'System',
        createdAt: new Date().toISOString(),
      };

      // Calculate running balance
      const previousBalance = await this.getPartyBalance(payment.buyerId || payment.payerId);
      ledgerEntry.balance = previousBalance - payment.amount;

      // Save to backend
      await this.saveLedgerEntry(ledgerEntry as LedgerEntry);

      console.log(`Payment ${payment.paymentId} posted to ledger. Entry ID: ${ledgerEntry.id}`);

      return {
        success: true,
        ledgerEntryId: ledgerEntry.id,
        balance: ledgerEntry.balance,
      };
    } catch (error) {
      console.error('Failed to post payment to ledger:', error);
      return {
        success: false,
        error: 'Failed to post payment to ledger',
      };
    }
  }

  /**
   * Auto-post debit note to ledger
   */
  static async postDebitNoteToLedger(debitNote: DebitCreditNote): Promise<LedgerPostingResult> {
    try {
      // Debit note increases the amount owed by the party
      const ledgerEntry: Partial<LedgerEntry> = {
        id: `LE-${Date.now()}`,
        date: debitNote.date,
        financialYear: this.getCurrentFinancialYear(),
        partyId: debitNote.partyId,
        partyName: debitNote.partyName,
        partyOrg: debitNote.partyName,
        partyType: debitNote.partyType,
        transactionType: 'Adjustment',
        entryType: 'Debit',
        amount: debitNote.amount,
        referenceType: 'Other',
        referenceId: debitNote.id,
        referenceNumber: debitNote.noteNumber,
        description: `Debit Note ${debitNote.noteNumber}: ${debitNote.reason}`,
        remarks: `Reference: ${debitNote.referenceNumber}`,
        balance: 0,
        isReconciled: false,
        createdBy: debitNote.createdBy,
        createdAt: new Date().toISOString(),
      };

      const previousBalance = await this.getPartyBalance(debitNote.partyId);
      ledgerEntry.balance = previousBalance + debitNote.amount;

      await this.saveLedgerEntry(ledgerEntry as LedgerEntry);

      // Update debit note status
      debitNote.status = 'Posted';
      debitNote.postedAt = new Date().toISOString();

      console.log(`Debit Note ${debitNote.noteNumber} posted to ledger. Entry ID: ${ledgerEntry.id}`);

      return {
        success: true,
        ledgerEntryId: ledgerEntry.id,
        balance: ledgerEntry.balance,
      };
    } catch (error) {
      console.error('Failed to post debit note to ledger:', error);
      return {
        success: false,
        error: 'Failed to post debit note to ledger',
      };
    }
  }

  /**
   * Auto-post credit note to ledger
   */
  static async postCreditNoteToLedger(creditNote: DebitCreditNote): Promise<LedgerPostingResult> {
    try {
      // Credit note decreases the amount owed by the party
      const ledgerEntry: Partial<LedgerEntry> = {
        id: `LE-${Date.now()}`,
        date: creditNote.date,
        financialYear: this.getCurrentFinancialYear(),
        partyId: creditNote.partyId,
        partyName: creditNote.partyName,
        partyOrg: creditNote.partyName,
        partyType: creditNote.partyType,
        transactionType: 'Adjustment',
        entryType: 'Credit',
        amount: creditNote.amount,
        referenceType: 'Other',
        referenceId: creditNote.id,
        referenceNumber: creditNote.noteNumber,
        description: `Credit Note ${creditNote.noteNumber}: ${creditNote.reason}`,
        remarks: `Reference: ${creditNote.referenceNumber}`,
        balance: 0,
        isReconciled: false,
        createdBy: creditNote.createdBy,
        createdAt: new Date().toISOString(),
      };

      const previousBalance = await this.getPartyBalance(creditNote.partyId);
      ledgerEntry.balance = previousBalance - creditNote.amount;

      await this.saveLedgerEntry(ledgerEntry as LedgerEntry);

      // Update credit note status
      creditNote.status = 'Posted';
      creditNote.postedAt = new Date().toISOString();

      console.log(`Credit Note ${creditNote.noteNumber} posted to ledger. Entry ID: ${ledgerEntry.id}`);

      return {
        success: true,
        ledgerEntryId: ledgerEntry.id,
        balance: ledgerEntry.balance,
      };
    } catch (error) {
      console.error('Failed to post credit note to ledger:', error);
      return {
        success: false,
        error: 'Failed to post credit note to ledger',
      };
    }
  }

  /**
   * Auto-post commission to ledger
   */
  static async postCommissionToLedger(commission: any): Promise<LedgerPostingResult> {
    try {
      const ledgerEntry: Partial<LedgerEntry> = {
        id: `LE-${Date.now()}`,
        date: commission.date,
        financialYear: this.getCurrentFinancialYear(),
        partyId: commission.brokerId,
        partyName: commission.brokerName,
        partyOrg: commission.brokerName,
        partyType: 'Broker',
        transactionType: 'Commission',
        entryType: 'Credit',
        amount: commission.amount,
        referenceType: 'Contract',
        referenceId: commission.contractId,
        referenceNumber: commission.contractNo,
        description: `Commission for contract ${commission.contractNo}`,
        balance: 0,
        isReconciled: false,
        createdBy: 'System',
        createdAt: new Date().toISOString(),
      };

      const previousBalance = await this.getPartyBalance(commission.brokerId);
      ledgerEntry.balance = previousBalance + commission.amount;

      await this.saveLedgerEntry(ledgerEntry as LedgerEntry);

      return {
        success: true,
        ledgerEntryId: ledgerEntry.id,
        balance: ledgerEntry.balance,
      };
    } catch (error) {
      console.error('Failed to post commission to ledger:', error);
      return {
        success: false,
        error: 'Failed to post commission to ledger',
      };
    }
  }

  /**
   * Get current party balance
   */
  private static async getPartyBalance(partyId: string): Promise<number> {
    try {
      // In production, this would query the database
      // For now, return mock balance
      const storedLedger = localStorage.getItem('ledgerEntries');
      if (!storedLedger) return 0;

      const entries: LedgerEntry[] = JSON.parse(storedLedger);
      const partyEntries = entries
        .filter(e => e.partyId === partyId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return partyEntries.length > 0 ? partyEntries[0].balance : 0;
    } catch (error) {
      console.error('Failed to get party balance:', error);
      return 0;
    }
  }

  /**
   * Save ledger entry to storage
   */
  private static async saveLedgerEntry(entry: LedgerEntry): Promise<void> {
    try {
      // In production, this would call the backend API
      // For now, store in localStorage
      const storedLedger = localStorage.getItem('ledgerEntries');
      const entries: LedgerEntry[] = storedLedger ? JSON.parse(storedLedger) : [];
      entries.push(entry);
      localStorage.setItem('ledgerEntries', JSON.stringify(entries));

      console.log('Ledger entry saved:', entry.id);
    } catch (error) {
      console.error('Failed to save ledger entry:', error);
      throw error;
    }
  }

  /**
   * Get current financial year
   */
  private static getCurrentFinancialYear(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 0-indexed

    // Financial year starts in April
    if (month >= 4) {
      return `FY ${year}-${(year + 1).toString().slice(-2)}`;
    } else {
      return `FY ${year - 1}-${year.toString().slice(-2)}`;
    }
  }

  /**
   * Bulk post entries (for batch processing)
   */
  static async bulkPostToLedger(
    entries: Array<{ type: 'invoice' | 'payment' | 'debit' | 'credit'; data: any }>
  ): Promise<LedgerPostingResult[]> {
    const results: LedgerPostingResult[] = [];

    for (const entry of entries) {
      let result: LedgerPostingResult;

      switch (entry.type) {
        case 'invoice':
          result = await this.postInvoiceToLedger(entry.data);
          break;
        case 'payment':
          result = await this.postPaymentToLedger(entry.data);
          break;
        case 'debit':
          result = await this.postDebitNoteToLedger(entry.data);
          break;
        case 'credit':
          result = await this.postCreditNoteToLedger(entry.data);
          break;
        default:
          result = { success: false, error: 'Unknown entry type' };
      }

      results.push(result);
    }

    return results;
  }
}

export default AutoPostingService;
