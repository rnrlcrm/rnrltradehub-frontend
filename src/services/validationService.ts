/**
 * Automated Validation Service
 * Validates OCR-extracted data against system records
 */

import { OCRInvoiceData, OCRPaymentData, OCRLogisticsData } from './ocrService';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  matchedContract?: any;
  matchedInvoice?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'critical' | 'high' | 'medium';
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

/**
 * Validation Service Class
 */
export class ValidationService {
  /**
   * Validate invoice data against sales contract
   */
  static async validateInvoice(
    invoiceData: OCRInvoiceData,
    contracts?: any[]
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let matchedContract = null;

    // 1. Validate invoice number format
    if (!invoiceData.invoiceNumber || invoiceData.invoiceNumber.trim() === '') {
      errors.push({
        field: 'invoiceNumber',
        message: 'Invoice number is required',
        severity: 'critical',
      });
    }

    // 2. Validate dates
    if (!invoiceData.invoiceDate) {
      errors.push({
        field: 'invoiceDate',
        message: 'Invoice date is required',
        severity: 'critical',
      });
    } else {
      const invoiceDate = new Date(invoiceData.invoiceDate);
      const today = new Date();
      if (invoiceDate > today) {
        errors.push({
          field: 'invoiceDate',
          message: 'Invoice date cannot be in the future',
          severity: 'high',
        });
      }
    }

    // 3. Validate party details
    if (!invoiceData.sellerName) {
      errors.push({
        field: 'sellerName',
        message: 'Seller name is required',
        severity: 'critical',
      });
    }

    if (!invoiceData.buyerName) {
      errors.push({
        field: 'buyerName',
        message: 'Buyer name is required',
        severity: 'critical',
      });
    }

    // 4. Validate GSTIN format (if provided)
    if (invoiceData.sellerGSTIN && !this.isValidGSTIN(invoiceData.sellerGSTIN)) {
      errors.push({
        field: 'sellerGSTIN',
        message: 'Invalid seller GSTIN format',
        severity: 'high',
      });
    }

    if (invoiceData.buyerGSTIN && !this.isValidGSTIN(invoiceData.buyerGSTIN)) {
      errors.push({
        field: 'buyerGSTIN',
        message: 'Invalid buyer GSTIN format',
        severity: 'high',
      });
    }

    // 5. Validate against sales contract (if contract number provided)
    if (invoiceData.salesContractNumber && contracts) {
      matchedContract = contracts.find(
        c => c.scNo === invoiceData.salesContractNumber
      );

      if (!matchedContract) {
        errors.push({
          field: 'salesContractNumber',
          message: `Sales contract ${invoiceData.salesContractNumber} not found in system`,
          severity: 'critical',
        });
      } else {
        // Validate seller matches
        if (!this.fuzzyMatch(matchedContract.vendorName, invoiceData.sellerName)) {
          errors.push({
            field: 'sellerName',
            message: `Seller name mismatch. Expected: ${matchedContract.vendorName}, Found: ${invoiceData.sellerName}`,
            severity: 'high',
          });
        }

        // Validate buyer matches
        if (!this.fuzzyMatch(matchedContract.clientName, invoiceData.buyerName)) {
          errors.push({
            field: 'buyerName',
            message: `Buyer name mismatch. Expected: ${matchedContract.clientName}, Found: ${invoiceData.buyerName}`,
            severity: 'high',
          });
        }

        // Validate amount within tolerance
        const contractAmount = matchedContract.quantityBales * matchedContract.rate;
        const tolerance = contractAmount * 0.10; // 10% tolerance
        if (Math.abs(invoiceData.totalAmount - contractAmount) > tolerance) {
          warnings.push({
            field: 'totalAmount',
            message: `Invoice amount (${invoiceData.totalAmount}) differs from contract amount (${contractAmount})`,
            suggestion: 'Verify quantities and rates match the contract',
          });
        }
      }
    }

    // 6. Validate items
    if (!invoiceData.items || invoiceData.items.length === 0) {
      errors.push({
        field: 'items',
        message: 'At least one item is required',
        severity: 'critical',
      });
    } else {
      invoiceData.items.forEach((item, index) => {
        if (!item.description || item.description.trim() === '') {
          errors.push({
            field: `items[${index}].description`,
            message: `Item ${index + 1}: Description is required`,
            severity: 'medium',
          });
        }
        if (!item.quantity || item.quantity <= 0) {
          errors.push({
            field: `items[${index}].quantity`,
            message: `Item ${index + 1}: Quantity must be greater than 0`,
            severity: 'high',
          });
        }
        if (!item.rate || item.rate <= 0) {
          errors.push({
            field: `items[${index}].rate`,
            message: `Item ${index + 1}: Rate must be greater than 0`,
            severity: 'high',
          });
        }
      });
    }

    // 7. Validate amounts
    if (!invoiceData.totalAmount || invoiceData.totalAmount <= 0) {
      errors.push({
        field: 'totalAmount',
        message: 'Total amount must be greater than 0',
        severity: 'critical',
      });
    }

    // 8. Validate GST calculations
    const calculatedSubtotal = invoiceData.items.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    if (Math.abs(calculatedSubtotal - invoiceData.subtotal) > 1) {
      warnings.push({
        field: 'subtotal',
        message: `Calculated subtotal (${calculatedSubtotal}) differs from invoice subtotal (${invoiceData.subtotal})`,
      });
    }

    // Validate total with GST
    const calculatedTotal =
      invoiceData.subtotal +
      (invoiceData.cgst || 0) +
      (invoiceData.sgst || 0) +
      (invoiceData.igst || 0);

    if (Math.abs(calculatedTotal - invoiceData.totalAmount) > 1) {
      errors.push({
        field: 'totalAmount',
        message: `Total amount mismatch. Calculated: ${calculatedTotal}, Invoice: ${invoiceData.totalAmount}`,
        severity: 'high',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      matchedContract,
    };
  }

  /**
   * Validate payment data
   */
  static async validatePayment(
    paymentData: OCRPaymentData,
    invoices?: any[]
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let matchedInvoice = null;

    // 1. Validate payment date
    if (!paymentData.paymentDate) {
      errors.push({
        field: 'paymentDate',
        message: 'Payment date is required',
        severity: 'critical',
      });
    }

    // 2. Validate amount
    if (!paymentData.amount || paymentData.amount <= 0) {
      errors.push({
        field: 'amount',
        message: 'Payment amount must be greater than 0',
        severity: 'critical',
      });
    }

    // 3. Validate transaction ID
    if (!paymentData.transactionId) {
      errors.push({
        field: 'transactionId',
        message: 'Transaction ID is required',
        severity: 'critical',
      });
    }

    // 4. Validate against invoice (if invoice number provided)
    if (paymentData.invoiceNumber && invoices) {
      matchedInvoice = invoices.find(
        inv => inv.invoiceNo === paymentData.invoiceNumber
      );

      if (!matchedInvoice) {
        errors.push({
          field: 'invoiceNumber',
          message: `Invoice ${paymentData.invoiceNumber} not found in system`,
          severity: 'critical',
        });
      } else {
        // Check if payment exceeds invoice amount
        const outstandingAmount = matchedInvoice.amount - (matchedInvoice.paidAmount || 0);
        if (paymentData.amount > outstandingAmount + 100) {
          warnings.push({
            field: 'amount',
            message: `Payment amount (${paymentData.amount}) exceeds outstanding (${outstandingAmount})`,
            suggestion: 'Verify payment amount is correct',
          });
        }
      }
    }

    // 5. Validate UTR for RTGS/NEFT
    if (['RTGS', 'NEFT'].includes(paymentData.paymentMode) && !paymentData.utrNumber) {
      warnings.push({
        field: 'utrNumber',
        message: 'UTR number is recommended for RTGS/NEFT payments',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      matchedInvoice,
    };
  }

  /**
   * Validate logistics bill data
   */
  static async validateLogisticsBill(
    logisticsData: OCRLogisticsData
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 1. Validate bill number
    if (!logisticsData.billNumber) {
      errors.push({
        field: 'billNumber',
        message: 'Bill number is required',
        severity: 'critical',
      });
    }

    // 2. Validate LR number
    if (!logisticsData.lrNumber) {
      errors.push({
        field: 'lrNumber',
        message: 'LR number is required',
        severity: 'critical',
      });
    }

    // 3. Validate vehicle number
    if (!logisticsData.vehicleNumber) {
      errors.push({
        field: 'vehicleNumber',
        message: 'Vehicle number is required',
        severity: 'high',
      });
    }

    // 4. Validate locations
    if (!logisticsData.fromLocation) {
      errors.push({
        field: 'fromLocation',
        message: 'From location is required',
        severity: 'high',
      });
    }

    if (!logisticsData.toLocation) {
      errors.push({
        field: 'toLocation',
        message: 'To location is required',
        severity: 'high',
      });
    }

    // 5. Validate amounts
    if (!logisticsData.freightAmount || logisticsData.freightAmount <= 0) {
      errors.push({
        field: 'freightAmount',
        message: 'Freight amount must be greater than 0',
        severity: 'critical',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Fuzzy match for party names (handles minor variations)
   */
  private static fuzzyMatch(str1: string, str2: string): boolean {
    if (!str1 || !str2) return false;

    // Normalize strings
    const normalize = (s: string) =>
      s.toLowerCase().replace(/[^a-z0-9]/g, '');

    const n1 = normalize(str1);
    const n2 = normalize(str2);

    // Exact match
    if (n1 === n2) return true;

    // Check if one contains the other
    if (n1.includes(n2) || n2.includes(n1)) return true;

    // Calculate Levenshtein distance for similarity
    const similarity = this.calculateSimilarity(n1, n2);
    return similarity > 0.8; // 80% similarity threshold
  }

  /**
   * Calculate string similarity (0 to 1)
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Validate GSTIN format
   */
  private static isValidGSTIN(gstin: string): boolean {
    if (!gstin) return false;

    // GSTIN format: 2 digits state code + 10 digits PAN + 1 digit entity number + 1 letter 'Z' + 1 check digit
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin);
  }
}

export default ValidationService;
