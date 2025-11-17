import React, { useState, useEffect } from 'react';
import { Receipt, Upload, CheckCircle, AlertCircle, Send, FileText } from 'lucide-react';
import { FormRow, FormLabel, FormInput, FormActions, Button } from '../ui/Form';
import OCRService from '../../services/ocrService';
import ValidationService from '../../services/validationService';
import AutoPostingService from '../../services/autoPostingService';
import NotificationService from '../../services/notificationService';
import { calculateGST, GST_RATES } from '../../utils/gstCalculations';

interface UnifiedPaymentReceiptFormProps {
  entry?: any;
  readOnly: boolean;
  onSave: (data: any) => void;
  onCancel: () => void;
}

const UnifiedPaymentReceiptForm: React.FC<UnifiedPaymentReceiptFormProps> = ({ 
  entry, 
  readOnly, 
  onSave, 
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    // Transaction Type
    transactionType: 'payment', // payment or receipt
    entryType: 'invoice', // invoice, transporter, controller, commission, other
    
    // Basic Information
    voucherNo: '',
    voucherDate: new Date().toISOString().split('T')[0],
    referenceNo: '', // Invoice/Bill/Contract reference
    
    // Party Details
    partyType: 'Buyer', // Buyer, Seller, Transporter, Controller, Broker
    partyName: '',
    partyGSTIN: '',
    partyPAN: '',
    partyAddress: '',
    partyState: '',
    
    // Our Company Details
    companyState: 'Maharashtra',
    
    // Amount Details
    amount: 0,
    description: '',
    
    // Additional Charges (for transporters, controllers)
    additionalCharges: [] as Array<{name: string, amount: number}>,
    totalAdditionalCharges: 0,
    
    // GST Calculation
    taxableAmount: 0,
    gstApplicable: true,
    gstRate: GST_RATES.COTTON,
    cgst: 0,
    sgst: 0,
    igst: 0,
    isInterState: false,
    totalAmount: 0,
    
    // TDS (for payments)
    tdsApplicable: false,
    tdsSection: '',
    tdsRate: 0,
    tdsAmount: 0,
    netAmount: 0,
    
    // Payment/Receipt Method
    paymentMethod: 'RTGS',
    
    // Bank/Transaction Details
    bankName: '',
    accountNo: '',
    ifscCode: '',
    branchName: '',
    utrNumber: '',
    chequeNo: '',
    chequeDate: '',
    transactionDate: '',
    
    // Payment Terms
    paymentTerms: 'Net 30 days',
    dueDate: '',
    
    // Status
    status: 'Pending',
    
    // Notes
    narration: '',
    remarks: '',
  });
  
  const [file, setFile] = useState<File | null>(null);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrError, setOcrError] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const [autoNotify, setAutoNotify] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState('');
  
  const [newCharge, setNewCharge] = useState({name: '', amount: 0});

  useEffect(() => {
    if (entry) {
      setFormData(entry);
    } else {
      // Generate voucher number based on type
      generateVoucherNumber();
    }
  }, [entry]);

  useEffect(() => {
    // Calculate totals
    const additionalTotal = formData.additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);
    const baseAmount = formData.amount + additionalTotal;
    
    let gstCalc = {
      taxableAmount: baseAmount,
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalAmount: baseAmount,
      isInterState: false,
    };
    
    if (formData.gstApplicable) {
      gstCalc = calculateGST(
        baseAmount,
        formData.partyState,
        formData.companyState,
        formData.gstRate
      );
    }
    
    const netAmount = formData.transactionType === 'payment' && formData.tdsApplicable
      ? gstCalc.totalAmount - formData.tdsAmount
      : gstCalc.totalAmount;
    
    setFormData(prev => ({
      ...prev,
      totalAdditionalCharges: additionalTotal,
      taxableAmount: gstCalc.taxableAmount,
      cgst: gstCalc.cgst,
      sgst: gstCalc.sgst,
      igst: gstCalc.igst,
      isInterState: gstCalc.isInterState,
      totalAmount: gstCalc.totalAmount,
      netAmount: netAmount,
    }));
  }, [
    formData.amount,
    formData.additionalCharges,
    formData.gstApplicable,
    formData.gstRate,
    formData.partyState,
    formData.companyState,
    formData.tdsApplicable,
    formData.tdsAmount,
    formData.transactionType,
  ]);

  const generateVoucherNumber = () => {
    const prefix = formData.transactionType === 'payment' ? 'PAY' : 'REC';
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const voucherNo = `${prefix}-${year}-${random}`;
    setFormData(prev => ({ ...prev, voucherNo }));
  };

  useEffect(() => {
    generateVoucherNumber();
  }, [formData.transactionType]);

  useEffect(() => {
    // Auto-set GST rate based on entry type
    let gstRate = GST_RATES.COTTON;
    
    if (formData.entryType === 'transporter') {
      gstRate = 5; // 5% for transport
    } else if (formData.entryType === 'controller' || formData.entryType === 'commission') {
      gstRate = GST_RATES.STANDARD_SERVICES; // 18% for services
    }
    
    setFormData(prev => ({ ...prev, gstRate }));
  }, [formData.entryType]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(uploadedFile.type)) {
      setOcrError('Please upload a PDF or image file');
      return;
    }
    
    if (uploadedFile.size > 10 * 1024 * 1024) {
      setOcrError('File size must be less than 10MB');
      return;
    }
    
    setFile(uploadedFile);
    setOcrError('');
    
    setIsProcessingOCR(true);
    try {
      let extractedData;
      if (formData.transactionType === 'payment') {
        extractedData = await OCRService.extractPaymentData(uploadedFile);
      } else {
        extractedData = await OCRService.extractInvoiceData(uploadedFile);
      }
      
      const validation = await validationService.validatePayment(extractedData);
      
      if (validation.isValid) {
        setFormData(prev => ({
          ...prev,
          partyName: extractedData.partyName || prev.partyName,
          partyGSTIN: extractedData.partyGSTIN || prev.partyGSTIN,
          amount: extractedData.amount || prev.amount,
          voucherDate: extractedData.date || prev.voucherDate,
          referenceNo: extractedData.referenceNo || prev.referenceNo,
          utrNumber: extractedData.utrNumber || prev.utrNumber,
          chequeNo: extractedData.chequeNo || prev.chequeNo,
          bankName: extractedData.bankName || prev.bankName,
        }));
        setValidationErrors([]);
      } else {
        setValidationErrors(validation.errors);
      }
    } catch (error) {
      setOcrError('Failed to extract data. Please enter manually.');
    } finally {
      setIsProcessingOCR(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
              type === 'number' ? parseFloat(value) || 0 : value 
    }));
  };

  const handleTDSCalculation = (field: 'rate' | 'amount', value: number) => {
    if (field === 'rate') {
      const tdsAmount = (formData.totalAmount * value) / 100;
      setFormData(prev => ({
        ...prev,
        tdsRate: value,
        tdsAmount: tdsAmount,
      }));
    } else {
      const tdsRate = (value / formData.totalAmount) * 100;
      setFormData(prev => ({
        ...prev,
        tdsAmount: value,
        tdsRate: tdsRate,
      }));
    }
  };

  const addAdditionalCharge = () => {
    if (newCharge.name && newCharge.amount > 0) {
      setFormData(prev => ({
        ...prev,
        additionalCharges: [...prev.additionalCharges, { ...newCharge }],
      }));
      setNewCharge({name: '', amount: 0});
    }
  };

  const removeAdditionalCharge = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additionalCharges: prev.additionalCharges.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: string[] = [];
    if (!formData.voucherNo) errors.push('Voucher number is required');
    if (!formData.partyName) errors.push('Party name is required');
    if (formData.amount <= 0 && formData.additionalCharges.length === 0) 
      errors.push('Amount must be greater than zero');
    
    if (formData.paymentMethod === 'RTGS' || formData.paymentMethod === 'NEFT' || formData.paymentMethod === 'IMPS') {
      if (!formData.utrNumber) errors.push('UTR number is required');
    }
    if (formData.paymentMethod === 'Cheque') {
      if (!formData.chequeNo) errors.push('Cheque number is required');
      if (!formData.chequeDate) errors.push('Cheque date is required');
    }
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setValidationErrors([]);
    
    try {
      await autoPostingService.postToLedger(formData);
      
      if (autoNotify && notifyEmail) {
        await NotificationService.sendNotification({
          to: notifyEmail,
          type: formData.transactionType,
          data: formData,
          attachment: file,
        } as any);
      }
    } catch (error) {
      console.error('Error saving entry:', error);
    }
    
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-100 to-indigo-100 border-l-4 border-blue-600 p-4">
        <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
          <Receipt className="w-6 h-6" />
          Payment & Receipt Entry (Universal Form)
        </h2>
        <p className="text-sm text-blue-700 mt-1">
          One form for all transactions - Invoice payments, Transporter bills, Controller fees, Commission, etc.
        </p>
      </div>

      {/* Transaction Type Selection */}
      <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Select Transaction Type</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FormLabel>Transaction Nature *</FormLabel>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, transactionType: 'payment' }))}
                disabled={readOnly}
                className={`p-3 border-2 rounded-lg font-semibold transition-all ${
                  formData.transactionType === 'payment'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-red-300'
                }`}
              >
                💸 Payment (Out)
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, transactionType: 'receipt' }))}
                disabled={readOnly}
                className={`p-3 border-2 rounded-lg font-semibold transition-all ${
                  formData.transactionType === 'receipt'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-green-300'
                }`}
              >
                💰 Receipt (In)
              </button>
            </div>
          </div>
          
          <div>
            <FormLabel htmlFor="entryType">Entry Category *</FormLabel>
            <FormInput 
              component="select"
              name="entryType" 
              id="entryType" 
              value={formData.entryType} 
              onChange={handleChange} 
              isReadOnly={readOnly}
              required
            >
              <option value="invoice">Invoice Payment/Receipt</option>
              <option value="transporter">Transporter/Logistics Bill</option>
              <option value="controller">Controller Service Fee</option>
              <option value="commission">Broker Commission</option>
              <option value="other">Other</option>
            </FormInput>
          </div>
        </div>
      </div>

      {/* OCR Upload */}
      {!readOnly && (
        <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Document for Auto-Fill (Optional)
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
            Upload invoice/bill/receipt - System will auto-fill the form
          </p>
          
          {isProcessingOCR && (
            <div className="mt-3 flex items-center gap-2 text-purple-700">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-700"></div>
              <span>Processing document...</span>
            </div>
          )}
          
          {ocrError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{ocrError}</p>
            </div>
          )}
          
          {validationErrors.length > 0 && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="font-semibold text-yellow-900 text-sm mb-1">Please fix:</p>
              <ul className="list-disc list-inside text-sm text-yellow-800">
                {validationErrors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 2: Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FormRow>
            <FormLabel htmlFor="voucherNo">Voucher No. *</FormLabel>
            <FormInput 
              name="voucherNo" 
              id="voucherNo" 
              type="text" 
              value={formData.voucherNo} 
              onChange={handleChange} 
              isReadOnly={true}
              required 
            />
          </FormRow>
          
          <FormRow>
            <FormLabel htmlFor="voucherDate">Date *</FormLabel>
            <FormInput 
              name="voucherDate" 
              id="voucherDate" 
              type="date" 
              value={formData.voucherDate} 
              onChange={handleChange} 
              isReadOnly={readOnly}
              required 
            />
          </FormRow>
          
          <FormRow>
            <FormLabel htmlFor="referenceNo">Reference No.</FormLabel>
            <FormInput 
              name="referenceNo" 
              id="referenceNo" 
              type="text" 
              value={formData.referenceNo} 
              onChange={handleChange} 
              isReadOnly={readOnly}
              placeholder="Invoice/Bill/Contract No."
            />
          </FormRow>
        </div>
      </div>

      {/* Party Details */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Step 3: Party Details ({formData.transactionType === 'payment' ? 'Pay To' : 'Receive From'})
        </h3>
        
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormRow>
              <FormLabel htmlFor="partyType">Party Type *</FormLabel>
              <FormInput 
                component="select"
                name="partyType" 
                id="partyType" 
                value={formData.partyType} 
                onChange={handleChange} 
                isReadOnly={readOnly}
                required
              >
                <option value="Buyer">Buyer</option>
                <option value="Seller">Seller</option>
                <option value="Transporter">Transporter</option>
                <option value="Controller">Controller</option>
                <option value="Broker">Broker/Agent</option>
                <option value="Other">Other</option>
              </FormInput>
            </FormRow>
            
            <FormRow>
              <FormLabel htmlFor="partyName">Party Name *</FormLabel>
              <FormInput 
                name="partyName" 
                id="partyName" 
                type="text" 
                value={formData.partyName} 
                onChange={handleChange} 
                isReadOnly={readOnly}
                placeholder="Company/Person Name"
                required 
              />
            </FormRow>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FormRow>
              <FormLabel htmlFor="partyGSTIN">GSTIN</FormLabel>
              <FormInput 
                name="partyGSTIN" 
                id="partyGSTIN" 
                type="text" 
                value={formData.partyGSTIN} 
                onChange={handleChange} 
                isReadOnly={readOnly}
                placeholder="22XXXXX0000X1ZX"
              />
            </FormRow>
            
            <FormRow>
              <FormLabel htmlFor="partyPAN">PAN</FormLabel>
              <FormInput 
                name="partyPAN" 
                id="partyPAN" 
                type="text" 
                value={formData.partyPAN} 
                onChange={handleChange} 
                isReadOnly={readOnly}
                placeholder="XXXXX0000X"
              />
            </FormRow>
            
            <FormRow>
              <FormLabel htmlFor="partyState">State</FormLabel>
              <FormInput 
                name="partyState" 
                id="partyState" 
                type="text" 
                value={formData.partyState} 
                onChange={handleChange} 
                isReadOnly={readOnly}
                placeholder="Maharashtra"
              />
            </FormRow>
          </div>
          
          <FormRow>
            <FormLabel htmlFor="partyAddress">Address</FormLabel>
            <textarea
              name="partyAddress"
              id="partyAddress"
              value={formData.partyAddress}
              onChange={handleChange}
              readOnly={readOnly}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Complete address"
            />
          </FormRow>
        </div>
      </div>

      {/* Amount Details */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 4: Amount Details</h3>
        
        <div className="space-y-3">
          <FormRow>
            <FormLabel htmlFor="description">Description *</FormLabel>
            <textarea
              name="description"
              id="description"
              value={formData.description}
              onChange={handleChange}
              readOnly={readOnly}
              rows={2}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Payment for Invoice INV-2024-001 / Freight charges for 100 bales / Controller fee for quality check"
            />
          </FormRow>
          
          <FormRow>
            <FormLabel htmlFor="amount">Base Amount (₹) *</FormLabel>
            <FormInput 
              name="amount" 
              id="amount" 
              type="number" 
              value={formData.amount} 
              onChange={handleChange} 
              isReadOnly={readOnly}
              step="0.01"
              min="0"
              required 
            />
          </FormRow>
          
          {/* Additional Charges (for transporters, controllers) */}
          {(formData.entryType === 'transporter' || formData.entryType === 'controller') && !readOnly && (
            <div className="border border-blue-200 rounded-lg p-3 bg-blue-50">
              <h4 className="font-semibold text-blue-900 mb-2 text-sm">Additional Charges</h4>
              
              <div className="grid grid-cols-3 gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Charge name"
                  value={newCharge.name}
                  onChange={(e) => setNewCharge(prev => ({ ...prev, name: e.target.value }))}
                  className="px-3 py-2 border border-blue-300 rounded-md text-sm"
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={newCharge.amount}
                  onChange={(e) => setNewCharge(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  className="px-3 py-2 border border-blue-300 rounded-md text-sm"
                  step="0.01"
                />
                <button
                  type="button"
                  onClick={addAdditionalCharge}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700"
                >
                  + Add
                </button>
              </div>
              
              {formData.additionalCharges.length > 0 && (
                <div className="mt-2 space-y-1">
                  {formData.additionalCharges.map((charge, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-blue-200 text-sm">
                      <span>{charge.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">₹{charge.amount.toLocaleString('en-IN')}</span>
                        <button
                          type="button"
                          onClick={() => removeAdditionalCharge(idx)}
                          className="text-red-600 hover:text-red-800 font-bold"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* GST Section */}
          <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-yellow-900">GST Calculation</h4>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="gstApplicable"
                  checked={formData.gstApplicable}
                  onChange={handleChange}
                  disabled={readOnly}
                  className="rounded border-slate-300 text-yellow-600 focus:ring-yellow-500"
                />
                <span className="text-sm text-slate-700 font-medium">GST Applicable</span>
              </label>
            </div>
            
            {formData.gstApplicable && (
              <>
                <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                  <div>
                    <p className="text-gray-600">Party State:</p>
                    <p className="font-semibold">{formData.partyState || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Our State:</p>
                    <p className="font-semibold">{formData.companyState}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Transaction Type:</p>
                    <p className="font-semibold text-blue-600">
                      {formData.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">GST Rate:</p>
                    <p className="font-semibold">{formData.gstRate}%</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm border-t border-yellow-300 pt-3">
                  <div className="flex justify-between">
                    <span>Base Amount:</span>
                    <span className="font-semibold">₹{formData.amount.toLocaleString('en-IN')}</span>
                  </div>
                  {formData.totalAdditionalCharges > 0 && (
                    <div className="flex justify-between">
                      <span>Additional Charges:</span>
                      <span className="font-semibold">₹{formData.totalAdditionalCharges.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold">
                    <span>Taxable Amount:</span>
                    <span>₹{formData.taxableAmount.toLocaleString('en-IN')}</span>
                  </div>
                  
                  {formData.isInterState ? (
                    <div className="flex justify-between text-green-700">
                      <span>IGST @ {formData.gstRate}%:</span>
                      <span className="font-semibold">₹{formData.igst.toLocaleString('en-IN')}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-green-700">
                        <span>CGST @ {formData.gstRate / 2}%:</span>
                        <span className="font-semibold">₹{formData.cgst.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-green-700">
                        <span>SGST @ {formData.gstRate / 2}%:</span>
                        <span className="font-semibold">₹{formData.sgst.toLocaleString('en-IN')}</span>
                      </div>
                    </>
                  )}
                  
                  <div className="flex justify-between font-bold text-lg text-yellow-900 border-t border-yellow-300 pt-2">
                    <span>Total Amount:</span>
                    <span>₹{formData.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* TDS Section (only for payments) */}
          {formData.transactionType === 'payment' && (
            <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-orange-900">TDS (Tax Deducted at Source)</h4>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="tdsApplicable"
                    checked={formData.tdsApplicable}
                    onChange={handleChange}
                    disabled={readOnly}
                    className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-sm text-slate-700 font-medium">TDS Applicable</span>
                </label>
              </div>
              
              {formData.tdsApplicable && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <FormRow>
                      <FormLabel htmlFor="tdsSection">TDS Section</FormLabel>
                      <FormInput 
                        component="select"
                        name="tdsSection" 
                        id="tdsSection" 
                        value={formData.tdsSection} 
                        onChange={handleChange} 
                        isReadOnly={readOnly}
                      >
                        <option value="">-- Select --</option>
                        <option value="194C">194C - Contractors</option>
                        <option value="194H">194H - Commission</option>
                        <option value="194I">194I - Rent</option>
                        <option value="194J">194J - Professional Services</option>
                        <option value="194Q">194Q - Purchase of Goods</option>
                      </FormInput>
                    </FormRow>
                    
                    <FormRow>
                      <FormLabel htmlFor="tdsRate">TDS Rate (%)</FormLabel>
                      <FormInput 
                        name="tdsRate" 
                        id="tdsRate" 
                        type="number" 
                        value={formData.tdsRate} 
                        onChange={(e) => handleTDSCalculation('rate', parseFloat(e.target.value) || 0)} 
                        isReadOnly={readOnly}
                        step="0.01"
                      />
                    </FormRow>
                    
                    <FormRow>
                      <FormLabel htmlFor="tdsAmount">TDS Amount (₹)</FormLabel>
                      <FormInput 
                        name="tdsAmount" 
                        id="tdsAmount" 
                        type="number" 
                        value={formData.tdsAmount} 
                        onChange={(e) => handleTDSCalculation('amount', parseFloat(e.target.value) || 0)} 
                        isReadOnly={readOnly}
                        step="0.01"
                      />
                    </FormRow>
                  </div>
                  
                  <div className="bg-white border border-orange-300 rounded p-3 text-sm">
                    <div className="flex justify-between">
                      <span>Total Amount:</span>
                      <span className="font-semibold">₹{formData.totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Less: TDS @ {formData.tdsRate}%:</span>
                      <span className="font-semibold">₹{formData.tdsAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg text-orange-900 border-t border-orange-300 pt-2 mt-2">
                      <span>Net Payable:</span>
                      <span>₹{formData.netAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Payment/Receipt Method */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 5: Payment/Receipt Method</h3>
        
        <div className="space-y-3">
          <FormRow>
            <FormLabel htmlFor="paymentMethod">Method *</FormLabel>
            <FormInput 
              component="select"
              name="paymentMethod" 
              id="paymentMethod" 
              value={formData.paymentMethod} 
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
            </FormInput>
          </FormRow>
          
          {(formData.paymentMethod === 'RTGS' || formData.paymentMethod === 'NEFT' || formData.paymentMethod === 'IMPS' || formData.paymentMethod === 'UPI') && (
            <FormRow>
              <FormLabel htmlFor="utrNumber">UTR/Transaction Number *</FormLabel>
              <FormInput 
                name="utrNumber" 
                id="utrNumber" 
                type="text" 
                value={formData.utrNumber} 
                onChange={handleChange} 
                isReadOnly={readOnly}
                placeholder="UTR123456789012"
                required
              />
            </FormRow>
          )}
          
          {formData.paymentMethod === 'Cheque' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormRow>
                <FormLabel htmlFor="chequeNo">Cheque Number *</FormLabel>
                <FormInput 
                  name="chequeNo" 
                  id="chequeNo" 
                  type="text" 
                  value={formData.chequeNo} 
                  onChange={handleChange} 
                  isReadOnly={readOnly}
                  required
                />
              </FormRow>
              
              <FormRow>
                <FormLabel htmlFor="chequeDate">Cheque Date *</FormLabel>
                <FormInput 
                  name="chequeDate" 
                  id="chequeDate" 
                  type="date" 
                  value={formData.chequeDate} 
                  onChange={handleChange} 
                  isReadOnly={readOnly}
                  required
                />
              </FormRow>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FormRow>
              <FormLabel htmlFor="bankName">Bank Name</FormLabel>
              <FormInput 
                name="bankName" 
                id="bankName" 
                type="text" 
                value={formData.bankName} 
                onChange={handleChange} 
                isReadOnly={readOnly}
              />
            </FormRow>
            
            <FormRow>
              <FormLabel htmlFor="accountNo">Account No.</FormLabel>
              <FormInput 
                name="accountNo" 
                id="accountNo" 
                type="text" 
                value={formData.accountNo} 
                onChange={handleChange} 
                isReadOnly={readOnly}
              />
            </FormRow>
            
            <FormRow>
              <FormLabel htmlFor="ifscCode">IFSC Code</FormLabel>
              <FormInput 
                name="ifscCode" 
                id="ifscCode" 
                type="text" 
                value={formData.ifscCode} 
                onChange={handleChange} 
                isReadOnly={readOnly}
              />
            </FormRow>
          </div>
        </div>
      </div>

      {/* Payment Terms & Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 6: Terms & Status</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FormRow>
            <FormLabel htmlFor="paymentTerms">Payment Terms</FormLabel>
            <FormInput 
              name="paymentTerms" 
              id="paymentTerms" 
              type="text" 
              value={formData.paymentTerms} 
              onChange={handleChange} 
              isReadOnly={readOnly}
            />
          </FormRow>
          
          <FormRow>
            <FormLabel htmlFor="dueDate">Due Date</FormLabel>
            <FormInput 
              name="dueDate" 
              id="dueDate" 
              type="date" 
              value={formData.dueDate} 
              onChange={handleChange} 
              isReadOnly={readOnly}
            />
          </FormRow>
          
          <FormRow>
            <FormLabel htmlFor="status">Status</FormLabel>
            <FormInput 
              component="select"
              name="status" 
              id="status" 
              value={formData.status} 
              onChange={handleChange} 
              isReadOnly={readOnly}
            >
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </FormInput>
          </FormRow>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <FormRow>
            <FormLabel htmlFor="narration">Narration</FormLabel>
            <textarea
              name="narration"
              id="narration"
              value={formData.narration}
              onChange={handleChange}
              readOnly={readOnly}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of transaction"
            />
          </FormRow>
          
          <FormRow>
            <FormLabel htmlFor="remarks">Remarks</FormLabel>
            <textarea
              name="remarks"
              id="remarks"
              value={formData.remarks}
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
            Auto-Notification
          </h3>
          
          <label className="flex items-center space-x-2 mb-3">
            <input
              type="checkbox"
              checked={autoNotify}
              onChange={(e) => setAutoNotify(e.target.checked)}
              className="rounded border-slate-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-sm text-slate-700 font-medium">
              Send notification email to party
            </span>
          </label>
          
          {autoNotify && (
            <FormRow>
              <FormLabel htmlFor="notifyEmail">Email Address *</FormLabel>
              <FormInput 
                name="notifyEmail" 
                id="notifyEmail" 
                type="email" 
                value={notifyEmail} 
                onChange={(e) => setNotifyEmail(e.target.value)} 
                isReadOnly={false}
                placeholder="party@example.com"
                required
              />
            </FormRow>
          )}
        </div>
      )}

      {/* Form Actions */}
      <FormActions>
        <Button type="button" variant="secondary" onClick={onCancel}>
          {readOnly ? 'Close' : 'Cancel'}
        </Button>
        {!readOnly && (
          <Button type="submit" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {autoNotify ? 'Save & Send Notification' : 'Save Entry'}
          </Button>
        )}
      </FormActions>
    </form>
  );
};

export default UnifiedPaymentReceiptForm;
