/**
 * OCR Service for Document Processing
 * Handles invoice, payment receipt, and logistics document extraction
 */

export interface OCRResult {
  success: boolean;
  confidence: number;
  data?: OCRInvoiceData | OCRPaymentData | OCRLogisticsData;
  errors?: string[];
  rawText?: string;
}

export interface OCRInvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  sellerName: string;
  sellerGSTIN?: string;
  buyerName: string;
  buyerGSTIN?: string;
  salesContractNumber?: string;
  items: {
    description: string;
    quantity: number;
    unit: string;
    rate: number;
    amount: number;
  }[];
  subtotal: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  totalAmount: number;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
}

export interface OCRPaymentData {
  transactionId: string;
  utrNumber?: string;
  paymentDate: string;
  amount: number;
  payerName: string;
  payeeAccountNumber: string;
  paymentMode: 'RTGS' | 'NEFT' | 'IMPS' | 'Cheque' | 'Cash' | 'UPI';
  referenceNumber?: string;
  invoiceNumber?: string;
}

export interface OCRLogisticsData {
  billNumber: string;
  billDate: string;
  lrNumber: string;
  transporterName: string;
  vehicleNumber: string;
  fromLocation: string;
  toLocation: string;
  quantity: number;
  freightAmount: number;
  otherCharges?: number;
  totalAmount: number;
}

/**
 * OCR Service Class
 */
export class OCRService {
  private static API_ENDPOINT = '/api/ocr/extract';

  /**
   * Process invoice document using OCR
   */
  static async processInvoice(file: File): Promise<OCRResult> {
    try {
      // In real implementation, this would call a backend OCR service
      // (Google Vision API, Tesseract, AWS Textract, etc.)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', 'invoice');

      // Simulate API call
      const response = await this.simulateOCRExtraction(file, 'invoice');
      
      return response;
    } catch (error) {
      console.error('OCR processing failed:', error);
      return {
        success: false,
        confidence: 0,
        errors: ['Failed to process document. Please try again.'],
      };
    }
  }

  /**
   * Process payment receipt using OCR
   */
  static async processPaymentReceipt(file: File): Promise<OCRResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', 'payment');

      const response = await this.simulateOCRExtraction(file, 'payment');
      
      return response;
    } catch (error) {
      console.error('OCR processing failed:', error);
      return {
        success: false,
        confidence: 0,
        errors: ['Failed to process payment receipt. Please try again.'],
      };
    }
  }

  /**
   * Process logistics bill using OCR
   */
  static async processLogisticsBill(file: File): Promise<OCRResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', 'logistics');

      const response = await this.simulateOCRExtraction(file, 'logistics');
      
      return response;
    } catch (error) {
      console.error('OCR processing failed:', error);
      return {
        success: false,
        confidence: 0,
        errors: ['Failed to process logistics bill. Please try again.'],
      };
    }
  }

  /**
   * Simulate OCR extraction (for demo purposes)
   * In production, this would call actual OCR API
   */
  private static async simulateOCRExtraction(
    file: File,
    documentType: 'invoice' | 'payment' | 'logistics'
  ): Promise<OCRResult> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate sample data based on document type
    if (documentType === 'invoice') {
      return {
        success: true,
        confidence: 0.95,
        data: {
          invoiceNumber: `INV-${Date.now()}`,
          invoiceDate: new Date().toISOString().split('T')[0],
          sellerName: 'ABC Traders',
          sellerGSTIN: '27AABCT1234D1Z5',
          buyerName: 'XYZ Mills',
          buyerGSTIN: '29AABCT5678E1Z2',
          salesContractNumber: 'SC-2024-001',
          items: [
            {
              description: 'Cotton MCU-5',
              quantity: 100,
              unit: 'Bales',
              rate: 5000,
              amount: 500000,
            },
          ],
          subtotal: 500000,
          cgst: 12500,
          sgst: 12500,
          totalAmount: 525000,
          bankDetails: {
            accountName: 'ABC Traders',
            accountNumber: '1234567890',
            ifscCode: 'SBIN0001234',
            bankName: 'State Bank of India',
          },
        } as OCRInvoiceData,
      };
    } else if (documentType === 'payment') {
      return {
        success: true,
        confidence: 0.92,
        data: {
          transactionId: `TXN${Date.now()}`,
          utrNumber: `UTR${Date.now()}`,
          paymentDate: new Date().toISOString().split('T')[0],
          amount: 250000,
          payerName: 'XYZ Mills',
          payeeAccountNumber: '1234567890',
          paymentMode: 'RTGS',
          referenceNumber: 'INV-2024-001',
        } as OCRPaymentData,
      };
    } else {
      return {
        success: true,
        confidence: 0.90,
        data: {
          billNumber: `LR-${Date.now()}`,
          billDate: new Date().toISOString().split('T')[0],
          lrNumber: 'LR-2024-001',
          transporterName: 'Fast Transport Services',
          vehicleNumber: 'MH-12-AB-1234',
          fromLocation: 'Mumbai',
          toLocation: 'Ahmedabad',
          quantity: 100,
          freightAmount: 25000,
          otherCharges: 2000,
          totalAmount: 27000,
        } as OCRLogisticsData,
      };
    }
  }

  /**
   * Extract text from image using OCR
   */
  static async extractText(file: File): Promise<string> {
    // This would call actual OCR API
    // For now, return placeholder
    return 'Extracted text from document...';
  }

  /**
   * Validate OCR confidence score
   */
  static isConfidenceAcceptable(confidence: number): boolean {
    return confidence >= 0.85; // 85% confidence threshold
  }

  /**
   * Get human-readable confidence level
   */
  static getConfidenceLevel(confidence: number): string {
    if (confidence >= 0.95) return 'Excellent';
    if (confidence >= 0.85) return 'Good';
    if (confidence >= 0.70) return 'Fair';
    return 'Poor';
  }
}

export default OCRService;
