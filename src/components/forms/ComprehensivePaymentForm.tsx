import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Receipt, Send } from 'lucide-react';
import { Payment, Invoice } from '../../types';
import { FormRow, FormLabel, FormInput, FormActions, Button } from '../ui/Form';
import { mockInvoices } from '../../data/mockData';
import OCRService from '../../services/ocrService';
import ValidationService from '../../services/validationService';
import AutoPostingService from '../../services/autoPostingService';
import NotificationService from '../../services/notificationService';

interface ComprehensivePaymentFormProps {
  payment?: Payment | null;
  readOnly: boolean;
  paymentType?: 'invoice' | 'transporter' | 'controller' | 'commission';
  onSave: (data: Payment) => void;
  onCancel: () => void;
}

const ComprehensivePaymentForm: React.FC<ComprehensivePaymentFormProps> = ({ 
  payment, 
  readOnly, 
  paymentType = 'invoice',
  onSave, 
  onCancel 
}) => {
  const [formData, setFormData] = useState<Payment>(payment || { 
    id: '', 
    paymentId: '', 
    invoiceId: '', 
    date: new Date().toISOString().split('T')[0], 
    amount: 0, 
    method: 'RTGS' 
  });
  
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  // OCR and file upload states
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [ocrError, setOcrError] = useState<string>('');
  
  // Additional payment fields
  const [additionalFields, setAdditionalFields] = useState({
    // Payer details
    payerName: '',
    payerGSTIN: '',
    payerPAN: '',
    payerAddress: '',
    payerBankName: '',
    payerAccountNo: '',
    payerIFSC: '',
    
    // Payee details
    payeeName: '',
    payeeGSTIN: '',
    payeePAN: '',
    payeeAddress: '',
    payeeBankName: '',
    payeeAccountNo: '',
    payeeIFSC: '',
    
    // Transaction details
    utrNumber: '',
    chequeNo: '',
    chequeDate: '',
    bankName: '',
    transactionDate: '',
    transactionTime: '',
    transferMode: 'RTGS',
    instrumentNo: '',
    instrumentDate: '',
    
    // TDS details
    tdsApplicable: false,
    tdsAmount: 0,
    tdsPercentage: 0,
    tdsSection: '',
    tdsCertificateNo: '',
    netPayableAmount: 0,
    
    // Additional info
    narration: '',
    remarks: '',
    receiptNo: '',
    attachments: [] as string[],
  });
  
  // Email automation
  const [autoNotify, setAutoNotify] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState('');
  
  // Validation
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const availableInvoices = mockInvoices.filter(
    inv => inv.status === 'Unpaid' || inv.status === 'Partially Paid'
  );

  useEffect(() => {
    if (payment) {
      setFormData(payment);
      const invoice = mockInvoices.find(inv => inv.invoiceNo === payment.invoiceId);
      setSelectedInvoice(invoice || null);
    }
  }, [payment]);

  useEffect(() => {
    // Calculate net payable amount after TDS
    if (additionalFields.tdsApplicable) {
      const netAmount = formData.amount - additionalFields.tdsAmount;
      setAdditionalFields(prev => ({
        ...prev,
        netPayableAmount: netAmount,
      }));
    } else {
      setAdditionalFields(prev => ({
        ...prev,
        netPayableAmount: formData.amount,
      }));
    }
  }, [formData.amount, additionalFields.tdsApplicable, additionalFields.tdsAmount]);

  const handleInvoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const invoiceNo = e.target.value;
    const invoice = availableInvoices.find(inv => inv.invoiceNo === invoiceNo);
    
    if (invoice) {
      setSelectedInvoice(invoice);
      setFormData(prev => ({
        ...prev,
        invoiceId: invoice.invoiceNo,
        amount: invoice.amount,
      }));
      
      // Auto-populate payee details from invoice
      // In real app, this would fetch from the seller's data
      setAdditionalFields(prev => ({
        ...prev,
        payeeName: invoice.salesContractId, // This should be seller name
      }));
    } else {
      setSelectedInvoice(null);
      setFormData(prev => ({
        ...prev,
        invoiceId: '',
        amount: 0,
      }));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setOcrError('Please upload a PDF or image file (JPG, PNG)');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setOcrError('File size must be less than 10MB');
      return;
    }
    
    setReceiptFile(file);
    setOcrError('');
    
    // Process OCR
    setIsProcessingOCR(true);
    try {
      const extractedData = await ocrService.extractPaymentData(file);
      setOcrResult(extractedData);
      
      // Validate extracted data
      const validation = await ValidationService.validatePayment(extractedData);
      
      if (validation.isValid) {
        // Auto-populate form with OCR data
        setFormData(prev => ({
          ...prev,
          amount: extractedData.amount || prev.amount,
          date: extractedData.date || prev.date,
          method: extractedData.method || prev.method,
        }));
        
        setAdditionalFields(prev => ({
          ...prev,
          utrNumber: extractedData.utrNumber || prev.utrNumber,
          bankName: extractedData.bankName || prev.bankName,
          transactionDate: extractedData.transactionDate || prev.transactionDate,
          payerName: extractedData.payerName || prev.payerName,
          payeeName: extractedData.payeeName || prev.payeeName,
          chequeNo: extractedData.chequeNo || prev.chequeNo,
          chequeDate: extractedData.chequeDate || prev.chequeDate,
        }));
        
        setValidationErrors([]);
      } else {
        setValidationErrors(validation.errors);
      }
    } catch (error) {
      setOcrError('Failed to extract data from receipt. Please enter manually.');
      console.error('OCR Error:', error);
    } finally {
      setIsProcessingOCR(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name in additionalFields) {
      setAdditionalFields(prev => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
                type === 'number' ? parseFloat(value) : value 
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'number' ? parseFloat(value) : value 
      }));
    }
  };

  const handleTDSCalculation = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'tdsPercentage') {
      const percentage = parseFloat(value);
      const tdsAmount = (formData.amount * percentage) / 100;
      setAdditionalFields(prev => ({
        ...prev,
        tdsPercentage: percentage,
        tdsAmount: tdsAmount,
      }));
    } else if (name === 'tdsAmount') {
      const amount = parseFloat(value);
      const percentage = (amount / formData.amount) * 100;
      setAdditionalFields(prev => ({
        ...prev,
        tdsAmount: amount,
        tdsPercentage: percentage,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const errors: string[] = [];
    
    if (!formData.invoiceId && paymentType === 'invoice') errors.push('Invoice selection is required');
    if (!formData.paymentId) errors.push('Payment ID is required');
    if (formData.amount <= 0) errors.push('Payment amount must be greater than zero');
    if (!formData.date) errors.push('Payment date is required');
    if (!formData.method) errors.push('Payment method is required');
    if (!additionalFields.payerName) errors.push('Payer name is required');
    if (!additionalFields.payeeName) errors.push('Payee name is required');
    
    // Method-specific validation
    if (formData.method === 'RTGS' || formData.method === 'NEFT' || formData.method === 'IMPS') {
      if (!additionalFields.utrNumber) errors.push('UTR number is required for bank transfer');
    }
    if (formData.method === 'Cheque') {
      if (!additionalFields.chequeNo) errors.push('Cheque number is required');
      if (!additionalFields.chequeDate) errors.push('Cheque date is required');
    }
    
    if (selectedInvoice && formData.amount > selectedInvoice.amount) {
      errors.push('Payment amount cannot exceed invoice amount');
    }
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setValidationErrors([]);
    
    // Create complete payment data
    const completePayment = {
      ...formData,
      ...additionalFields,
    };
    
    // Auto-post to ledger
    try {
      await autoPostingService.postPaymentToLedger(completePayment as any);
      
      // Send notification
      if (autoNotify && notifyEmail) {
        await NotificationService.sendPaymentConfirmation({
          to: notifyEmail,
          payment: completePayment,
          invoice: selectedInvoice,
          attachment: receiptFile,
        } as any);
      }
    } catch (error) {
      console.error('Auto-posting error:', error);
    }
    
    onSave(formData);
  };

  const getPaymentTypeLabel = () => {
    switch (paymentType) {
      case 'transporter': return 'Transporter/Logistics Payment';
      case 'controller': return 'Controller Payment';
      case 'commission': return 'Commission Payment';
      default: return 'Invoice Payment';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="bg-blue-100 border-l-4 border-blue-600 p-4">
        <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
          <Receipt className="w-6 h-6" />
          {getPaymentTypeLabel()} Receipt
        </h2>
      </div>

      {/* OCR Upload Section */}
      {!readOnly && (
        <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Payment Receipt for Auto-Fill (Optional)
          </h3>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileUpload}
            disabled={isProcessingOCR}
            className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-purple-600 file:text-white
              hover:file:bg-purple-700
              cursor-pointer"
          />
          <p className="text-xs text-purple-600 mt-2">
            Upload payment receipt/proof (PDF/Image) - System will extract transaction details
          </p>
          
          {isProcessingOCR && (
            <div className="mt-3 flex items-center gap-2 text-purple-700">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-700"></div>
              <span>Processing receipt with OCR...</span>
            </div>
          )}
          
          {ocrResult && !isProcessingOCR && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-semibold">OCR Successful!</p>
                <p>Form auto-filled with payment details. Please review and confirm.</p>
              </div>
            </div>
          )}
          
          {ocrError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-semibold">OCR Error</p>
                <p>{ocrError}</p>
              </div>
            </div>
          )}
          
          {validationErrors.length > 0 && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="font-semibold text-yellow-900 text-sm mb-1">Validation Issues:</p>
              <ul className="list-disc list-inside text-sm text-yellow-800">
                {validationErrors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Basic Payment Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
        
        <div className="space-y-3">
          <FormRow>
            <FormLabel htmlFor="paymentId">Payment/Receipt ID *</FormLabel>
            <FormInput 
              name="paymentId" 
              id="paymentId" 
              type="text" 
              value={formData.paymentId} 
              onChange={handleChange} 
              isReadOnly={readOnly || !!payment}
              placeholder="PAY-2024-001234"
              required 
            />
          </FormRow>
          
          <FormRow>
            <FormLabel htmlFor="receiptNo">Receipt Number</FormLabel>
            <FormInput 
              name="receiptNo" 
              id="receiptNo" 
              type="text" 
              value={additionalFields.receiptNo} 
              onChange={handleChange} 
              isReadOnly={readOnly}
              placeholder="REC-2024-001234"
            />
          </FormRow>
          
          {paymentType === 'invoice' && (
            <FormRow>
              <FormLabel htmlFor="invoiceId">Invoice Reference *</FormLabel>
              <FormInput 
                component="select" 
                name="invoiceId" 
                id="invoiceId" 
                value={formData.invoiceId} 
                onChange={handleInvoiceChange} 
                isReadOnly={readOnly}
                required
              >
                <option value="">-- Select Invoice --</option>
                {availableInvoices.map(inv => (
                  <option key={inv.id} value={inv.invoiceNo}>
                    {inv.invoiceNo} - {inv.salesContractId} (₹{inv.amount.toLocaleString('en-IN')} - {inv.status})
                  </option>
                ))}
              </FormInput>
            </FormRow>
          )}
          
          {selectedInvoice && paymentType === 'invoice' && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm">
              <p className="font-semibold text-green-900 mb-1">Invoice Details:</p>
              <p className="text-green-800">Invoice No: {selectedInvoice.invoiceNo}</p>
              <p className="text-green-800">Contract: {selectedInvoice.salesContractId}</p>
              <p className="text-green-800">Date: {selectedInvoice.date}</p>
              <p className="text-green-800">Total: ₹{selectedInvoice.amount.toLocaleString('en-IN')}</p>
              <p className="text-green-800">Status: <span className={selectedInvoice.status === 'Unpaid' ? 'text-red-600 font-semibold' : 'text-yellow-600 font-semibold'}>{selectedInvoice.status}</span></p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormRow>
              <FormLabel htmlFor="date">Payment Date *</FormLabel>
              <FormInput 
                name="date" 
                id="date" 
                type="date" 
                value={formData.date} 
                onChange={handleChange} 
                isReadOnly={readOnly}
                required 
              />
            </FormRow>
            
            <FormRow>
              <FormLabel htmlFor="transactionTime">Transaction Time</FormLabel>
              <FormInput 
                name="transactionTime" 
                id="transactionTime" 
                type="time" 
                value={additionalFields.transactionTime} 
                onChange={handleChange} 
                isReadOnly={readOnly}
              />
            </FormRow>
          </div>
          
          <FormRow>
            <FormLabel htmlFor="amount">Payment Amount (₹) *</FormLabel>
            <FormInput 
              name="amount" 
              id="amount" 
              type="number" 
              value={formData.amount} 
              onChange={handleChange} 
              isReadOnly={readOnly}
              step="0.01"
              min="0"
              max={selectedInvoice?.amount}
              required 
            />
          </FormRow>
        </div>
      </div>

      {/* Payer & Payee Details */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payer & Payee Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Payer Details */}
          <div className="space-y-3 border-r pr-4">
            <h4 className="font-semibold text-gray-700">Payer (From)</h4>
            
            <FormRow>
              <FormLabel htmlFor="payerName">Payer Name *</FormLabel>
              <FormInput 
                name="payerName" 
                id="payerName" 
                type="text" 
                value={additionalFields.payerName} 
                onChange={handleChange} 
                isReadOnly={readOnly}
                placeholder="Company/Person Name"
                required 
              />
            </FormRow>
            
            <FormRow>
              <FormLabel htmlFor="payerGSTIN">Payer GSTIN</FormLabel>
              <FormInput 
                name="payerGSTIN" 
                id="payerGSTIN" 
                type="text" 
                value={additionalFields.payerGSTIN} 
                onChange={handleChange} 
                isReadOnly={readOnly}
                placeholder="22AAAAA0000A1Z5"
              />
            </FormRow>
            
            <FormRow>
              <FormLabel htmlFor="payerPAN">Payer PAN</FormLabel>
              <FormInput 
                name="payerPAN" 
                id="payerPAN" 
                type="text" 
                value={additionalFields.payerPAN} 
                onChange={handleChange} 
                isReadOnly={readOnly}
                placeholder="AAAAA0000A"
              />
            </FormRow>
          </div>
          
          {/* Payee Details */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-700">Payee (To)</h4>
            
            <FormRow>
              <FormLabel htmlFor="payeeName">Payee Name *</FormLabel>
              <FormInput 
                name="payeeName" 
                id="payeeName" 
                type="text" 
                value={additionalFields.payeeName} 
                onChange={handleChange} 
                isReadOnly={readOnly}
                placeholder="Company/Person Name"
                required 
              />
            </FormRow>
            
            <FormRow>
              <FormLabel htmlFor="payeeGSTIN">Payee GSTIN</FormLabel>
              <FormInput 
                name="payeeGSTIN" 
                id="payeeGSTIN" 
                type="text" 
                value={additionalFields.payeeGSTIN} 
                onChange={handleChange} 
                isReadOnly={readOnly}
                placeholder="24BBBBB0000B1Z5"
              />
            </FormRow>
            
            <FormRow>
              <FormLabel htmlFor="payeePAN">Payee PAN</FormLabel>
              <FormInput 
                name="payeePAN" 
                id="payeePAN" 
                type="text" 
                value={additionalFields.payeePAN} 
                onChange={handleChange} 
                isReadOnly={readOnly}
                placeholder="BBBBB0000B"
              />
            </FormRow>
          </div>
        </div>
      </div>

      {/* Transaction Details */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Details</h3>
        
        <div className="space-y-3">
          <FormRow>
            <FormLabel htmlFor="method">Payment Method *</FormLabel>
            <FormInput 
              component="select" 
              name="method" 
              id="method" 
              value={formData.method} 
              onChange={handleChange} 
              isReadOnly={readOnly}
              required
            >
              <option value="RTGS">RTGS</option>
              <option value="NEFT">NEFT</option>
              <option value="IMPS">IMPS</option>
              <option value="UPI">UPI</option>
              <option value="Cheque">Cheque</option>
              <option value="Demand Draft">Demand Draft</option>
              <option value="Cash">Cash</option>
              <option value="Online Transfer">Online Transfer</option>
            </FormInput>
          </FormRow>
          
          {(formData.method === 'RTGS' || formData.method === 'NEFT' || formData.method === 'IMPS' || formData.method === 'UPI') && (
            <FormRow>
              <FormLabel htmlFor="utrNumber">UTR/Transaction Number *</FormLabel>
              <FormInput 
                name="utrNumber" 
                id="utrNumber" 
                type="text" 
                value={additionalFields.utrNumber} 
                onChange={handleChange} 
                isReadOnly={readOnly}
                placeholder="UTR123456789012"
                required
              />
            </FormRow>
          )}
          
          {formData.method === 'Cheque' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormRow>
                  <FormLabel htmlFor="chequeNo">Cheque Number *</FormLabel>
                  <FormInput 
                    name="chequeNo" 
                    id="chequeNo" 
                    type="text" 
                    value={additionalFields.chequeNo} 
                    onChange={handleChange} 
                    isReadOnly={readOnly}
                    placeholder="123456"
                    required
                  />
                </FormRow>
                
                <FormRow>
                  <FormLabel htmlFor="chequeDate">Cheque Date *</FormLabel>
                  <FormInput 
                    name="chequeDate" 
                    id="chequeDate" 
                    type="date" 
                    value={additionalFields.chequeDate} 
                    onChange={handleChange} 
                    isReadOnly={readOnly}
                    required
                  />
                </FormRow>
              </div>
            </>
          )}
          
          {(formData.method === 'Demand Draft') && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormRow>
                  <FormLabel htmlFor="instrumentNo">DD Number *</FormLabel>
                  <FormInput 
                    name="instrumentNo" 
                    id="instrumentNo" 
                    type="text" 
                    value={additionalFields.instrumentNo} 
                    onChange={handleChange} 
                    isReadOnly={readOnly}
                    placeholder="DD123456"
                    required
                  />
                </FormRow>
                
                <FormRow>
                  <FormLabel htmlFor="instrumentDate">DD Date *</FormLabel>
                  <FormInput 
                    name="instrumentDate" 
                    id="instrumentDate" 
                    type="date" 
                    value={additionalFields.instrumentDate} 
                    onChange={handleChange} 
                    isReadOnly={readOnly}
                    required
                  />
                </FormRow>
              </div>
            </>
          )}
          
          <FormRow>
            <FormLabel htmlFor="bankName">Bank Name</FormLabel>
            <FormInput 
              name="bankName" 
              id="bankName" 
              type="text" 
              value={additionalFields.bankName} 
              onChange={handleChange} 
              isReadOnly={readOnly}
              placeholder="HDFC Bank / ICICI Bank / SBI"
            />
          </FormRow>
        </div>
      </div>

      {/* Bank Account Details */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Account Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Payer Bank Details */}
          <div className="space-y-3 border-r pr-4">
            <h4 className="font-semibold text-gray-700">Payer Bank Account</h4>
            
            <FormRow>
              <FormLabel htmlFor="payerBankName">Bank Name</FormLabel>
              <FormInput 
                name="payerBankName" 
                id="payerBankName" 
                type="text" 
                value={additionalFields.payerBankName} 
                onChange={handleChange} 
                isReadOnly={readOnly}
              />
            </FormRow>
            
            <FormRow>
              <FormLabel htmlFor="payerAccountNo">Account Number</FormLabel>
              <FormInput 
                name="payerAccountNo" 
                id="payerAccountNo" 
                type="text" 
                value={additionalFields.payerAccountNo} 
                onChange={handleChange} 
                isReadOnly={readOnly}
              />
            </FormRow>
            
            <FormRow>
              <FormLabel htmlFor="payerIFSC">IFSC Code</FormLabel>
              <FormInput 
                name="payerIFSC" 
                id="payerIFSC" 
                type="text" 
                value={additionalFields.payerIFSC} 
                onChange={handleChange} 
                isReadOnly={readOnly}
              />
            </FormRow>
          </div>
          
          {/* Payee Bank Details */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-700">Payee Bank Account</h4>
            
            <FormRow>
              <FormLabel htmlFor="payeeBankName">Bank Name</FormLabel>
              <FormInput 
                name="payeeBankName" 
                id="payeeBankName" 
                type="text" 
                value={additionalFields.payeeBankName} 
                onChange={handleChange} 
                isReadOnly={readOnly}
              />
            </FormRow>
            
            <FormRow>
              <FormLabel htmlFor="payeeAccountNo">Account Number</FormLabel>
              <FormInput 
                name="payeeAccountNo" 
                id="payeeAccountNo" 
                type="text" 
                value={additionalFields.payeeAccountNo} 
                onChange={handleChange} 
                isReadOnly={readOnly}
              />
            </FormRow>
            
            <FormRow>
              <FormLabel htmlFor="payeeIFSC">IFSC Code</FormLabel>
              <FormInput 
                name="payeeIFSC" 
                id="payeeIFSC" 
                type="text" 
                value={additionalFields.payeeIFSC} 
                onChange={handleChange} 
                isReadOnly={readOnly}
              />
            </FormRow>
          </div>
        </div>
      </div>

      {/* TDS Details */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">TDS (Tax Deducted at Source)</h3>
        
        <div className="space-y-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="tdsApplicable"
              checked={additionalFields.tdsApplicable}
              onChange={handleChange}
              disabled={readOnly}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700 font-medium">TDS Applicable</span>
          </label>
          
          {additionalFields.tdsApplicable && (
            <>
              <FormRow>
                <FormLabel htmlFor="tdsSection">TDS Section</FormLabel>
                <FormInput 
                  component="select"
                  name="tdsSection" 
                  id="tdsSection" 
                  value={additionalFields.tdsSection} 
                  onChange={handleChange} 
                  isReadOnly={readOnly}
                >
                  <option value="">-- Select Section --</option>
                  <option value="194C">194C - Payment to Contractors</option>
                  <option value="194H">194H - Commission/Brokerage</option>
                  <option value="194I">194I - Rent</option>
                  <option value="194J">194J - Professional/Technical Services</option>
                  <option value="194Q">194Q - Purchase of Goods</option>
                  <option value="Other">Other</option>
                </FormInput>
              </FormRow>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormRow>
                  <FormLabel htmlFor="tdsPercentage">TDS Rate (%)</FormLabel>
                  <FormInput 
                    name="tdsPercentage" 
                    id="tdsPercentage" 
                    type="number" 
                    value={additionalFields.tdsPercentage} 
                    onChange={handleTDSCalculation} 
                    isReadOnly={readOnly}
                    step="0.01"
                    min="0"
                    max="100"
                  />
                </FormRow>
                
                <FormRow>
                  <FormLabel htmlFor="tdsAmount">TDS Amount (₹)</FormLabel>
                  <FormInput 
                    name="tdsAmount" 
                    id="tdsAmount" 
                    type="number" 
                    value={additionalFields.tdsAmount} 
                    onChange={handleTDSCalculation} 
                    isReadOnly={readOnly}
                    step="0.01"
                    min="0"
                  />
                </FormRow>
              </div>
              
              <FormRow>
                <FormLabel htmlFor="tdsCertificateNo">TDS Certificate No.</FormLabel>
                <FormInput 
                  name="tdsCertificateNo" 
                  id="tdsCertificateNo" 
                  type="text" 
                  value={additionalFields.tdsCertificateNo} 
                  onChange={handleChange} 
                  isReadOnly={readOnly}
                  placeholder="TDS-2024-001234"
                />
              </FormRow>
              
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Payment Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Gross Amount:</span>
                    <span className="font-semibold">₹{formData.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Less: TDS @ {additionalFields.tdsPercentage}%:</span>
                    <span className="font-semibold">₹{additionalFields.tdsAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg text-blue-800 border-t border-blue-300 pt-2 mt-2">
                    <span>Net Payable Amount:</span>
                    <span>₹{additionalFields.netPayableAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
        
        <div className="space-y-3">
          <FormRow>
            <FormLabel htmlFor="narration">Narration/Purpose</FormLabel>
            <textarea
              name="narration"
              id="narration"
              value={additionalFields.narration}
              onChange={handleChange}
              readOnly={readOnly}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Payment towards invoice INV-2024-001234"
            />
          </FormRow>
          
          <FormRow>
            <FormLabel htmlFor="remarks">Remarks</FormLabel>
            <textarea
              name="remarks"
              id="remarks"
              value={additionalFields.remarks}
              onChange={handleChange}
              readOnly={readOnly}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any additional notes"
            />
          </FormRow>
        </div>
      </div>

      {/* Email Notification */}
      {!readOnly && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
            <Send className="w-5 h-5" />
            Payment Confirmation Notification
          </h3>
          
          <div className="space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoNotify}
                onChange={(e) => setAutoNotify(e.target.checked)}
                className="rounded border-slate-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-slate-700 font-medium">
                Send payment confirmation to payee via email
              </span>
            </label>
            
            {autoNotify && (
              <>
                <FormRow>
                  <FormLabel htmlFor="notifyEmail">Notification Email *</FormLabel>
                  <FormInput 
                    name="notifyEmail" 
                    id="notifyEmail" 
                    type="email" 
                    value={notifyEmail} 
                    onChange={(e) => setNotifyEmail(e.target.value)} 
                    isReadOnly={false}
                    placeholder="payee@example.com"
                    required
                  />
                </FormRow>
                
                <div className="bg-white border border-green-300 rounded p-3 text-sm text-green-800">
                  <p className="font-semibold mb-1">Notification will include:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Payment receipt/confirmation</li>
                    <li>Transaction details (UTR/Cheque no.)</li>
                    <li>Amount and date</li>
                    <li>Attached payment proof (if uploaded)</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Form Actions */}
      <FormActions>
        <Button type="button" variant="secondary" onClick={onCancel}>
          {readOnly ? 'Close' : 'Cancel'}
        </Button>
        {!readOnly && (
          <Button type="submit" className="flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            {autoNotify ? 'Record Payment & Send Notification' : 'Record Payment'}
          </Button>
        )}
      </FormActions>
    </form>
  );
};

export default ComprehensivePaymentForm;
