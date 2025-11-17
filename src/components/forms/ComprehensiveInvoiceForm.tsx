import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Mail, Send } from 'lucide-react';
import { Invoice, SalesContract, BusinessPartner } from '../../types';
import { FormRow, FormLabel, FormInput, FormActions, Button } from '../ui/Form';
import { mockSalesContracts, mockBusinessPartners } from '../../data/mockData';
import { calculateGST, GST_RATES } from '../../utils/gstCalculations';
import { ocrService } from '../../services/ocrService';
import { validationService } from '../../services/validationService';
import { notificationService } from '../../services/notificationService';
import { autoPostingService } from '../../services/autoPostingService';

interface ComprehensiveInvoiceFormProps {
  invoice?: Invoice | null;
  readOnly: boolean;
  onSave: (data: Invoice) => void;
  onCancel: () => void;
}

const ComprehensiveInvoiceForm: React.FC<ComprehensiveInvoiceFormProps> = ({ 
  invoice, 
  readOnly, 
  onSave, 
  onCancel 
}) => {
  const [formData, setFormData] = useState<Invoice>(invoice || { 
    id: '', 
    invoiceNo: '', 
    salesContractId: '', 
    date: new Date().toISOString().split('T')[0], 
    amount: 0, 
    status: 'Unpaid',
    taxableAmount: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    gstRate: GST_RATES.COTTON,
    totalAmount: 0,
    sellerState: '',
    buyerState: '',
    isInterState: false,
  });
  
  const [selectedContract, setSelectedContract] = useState<SalesContract | null>(null);
  const [sellerPartner, setSellerPartner] = useState<BusinessPartner | null>(null);
  const [buyerPartner, setBuyerPartner] = useState<BusinessPartner | null>(null);
  
  // OCR and file upload states
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [ocrError, setOcrError] = useState<string>('');
  
  // Additional invoice fields for complete information
  const [additionalFields, setAdditionalFields] = useState({
    sellerGSTIN: '',
    buyerGSTIN: '',
    sellerPAN: '',
    buyerPAN: '',
    sellerAddress: '',
    buyerAddress: '',
    placeOfSupply: '',
    reverseCharge: false,
    transportMode: '',
    vehicleNo: '',
    supplyDate: '',
    lrNo: '',
    eWayBillNo: '',
    bankName: '',
    bankAccountNo: '',
    bankIFSC: '',
    paymentTerms: 'Net 30 days',
    dueDate: '',
    notes: '',
    termsAndConditions: '',
  });
  
  // Email automation
  const [autoForward, setAutoForward] = useState(true);
  const [sendCopy, setSendCopy] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailCC, setEmailCC] = useState('');
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const availableContracts = mockSalesContracts.filter(
    sc => sc.status === 'Active' || sc.status === 'Completed'
  );

  useEffect(() => {
    if (invoice) {
      setFormData(invoice);
      const contract = mockSalesContracts.find(sc => sc.scNo === invoice.salesContractId);
      setSelectedContract(contract || null);
    }
  }, [invoice]);

  useEffect(() => {
    if (selectedContract) {
      const seller = mockBusinessPartners.find(bp => 
        bp.id === selectedContract.vendorId || bp.name === selectedContract.vendorName
      );
      const buyer = mockBusinessPartners.find(bp => 
        bp.id === selectedContract.clientId || bp.name === selectedContract.clientName
      );
      
      setSellerPartner(seller || null);
      setBuyerPartner(buyer || null);
      
      // Auto-populate email
      if (buyer?.contactDetails?.email) {
        setEmailTo(buyer.contactDetails.email);
      }
      
      // Auto-populate additional fields
      setAdditionalFields(prev => ({
        ...prev,
        sellerGSTIN: seller?.gstNumber || '',
        buyerGSTIN: buyer?.gstNumber || '',
        sellerPAN: seller?.panNumber || '',
        buyerPAN: buyer?.panNumber || '',
        sellerAddress: `${seller?.address?.street || ''}, ${seller?.address?.city || ''}, ${seller?.address?.state || ''} - ${seller?.address?.pincode || ''}`,
        buyerAddress: `${buyer?.address?.street || ''}, ${buyer?.address?.city || ''}, ${buyer?.address?.state || ''} - ${buyer?.address?.pincode || ''}`,
        placeOfSupply: buyer?.state || '',
      }));
    }
  }, [selectedContract]);

  const handleContractChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const contractNo = e.target.value;
    const contract = availableContracts.find(sc => sc.scNo === contractNo);
    
    if (contract) {
      setSelectedContract(contract);
      
      const seller = mockBusinessPartners.find(bp => 
        bp.id === contract.vendorId || bp.name === contract.vendorName
      );
      const buyer = mockBusinessPartners.find(bp => 
        bp.id === contract.clientId || bp.name === contract.clientName
      );
      
      const baseAmount = contract.quantityBales * contract.rate;
      const gstRate = GST_RATES.COTTON;
      const sellerState = seller?.state || 'Maharashtra';
      const buyerState = buyer?.state || 'Gujarat';
      const gstCalc = calculateGST(baseAmount, sellerState, buyerState, gstRate);
      
      // Calculate due date (30 days from invoice date)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      
      setFormData(prev => ({
        ...prev,
        salesContractId: contract.scNo,
        amount: baseAmount,
        taxableAmount: gstCalc.taxableAmount,
        cgst: gstCalc.cgst,
        sgst: gstCalc.sgst,
        igst: gstCalc.igst,
        gstRate: gstCalc.gstRate,
        totalAmount: gstCalc.totalAmount,
        sellerState: sellerState,
        buyerState: buyerState,
        isInterState: gstCalc.isInterState,
      }));
      
      setAdditionalFields(prev => ({
        ...prev,
        dueDate: dueDate.toISOString().split('T')[0],
      }));
    } else {
      setSelectedContract(null);
      setSellerPartner(null);
      setBuyerPartner(null);
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
    
    setInvoiceFile(file);
    setOcrError('');
    
    // Process OCR
    setIsProcessingOCR(true);
    try {
      const extractedData = await ocrService.extractInvoiceData(file);
      setOcrResult(extractedData);
      
      // Validate extracted data
      const validation = await validationService.validateInvoice(extractedData);
      
      if (validation.isValid) {
        // Auto-populate form with OCR data
        setFormData(prev => ({
          ...prev,
          invoiceNo: extractedData.invoiceNumber || prev.invoiceNo,
          date: extractedData.date || prev.date,
          amount: extractedData.amount || prev.amount,
          taxableAmount: extractedData.taxableAmount || prev.taxableAmount,
          cgst: extractedData.cgst || prev.cgst,
          sgst: extractedData.sgst || prev.sgst,
          igst: extractedData.igst || prev.igst,
          totalAmount: extractedData.totalAmount || prev.totalAmount,
        }));
        
        setAdditionalFields(prev => ({
          ...prev,
          sellerGSTIN: extractedData.sellerGSTIN || prev.sellerGSTIN,
          buyerGSTIN: extractedData.buyerGSTIN || prev.buyerGSTIN,
        }));
        
        setValidationErrors([]);
      } else {
        setValidationErrors(validation.errors);
      }
    } catch (error) {
      setOcrError('Failed to extract data from invoice. Please enter manually.');
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
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value 
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'number' ? parseFloat(value) : value 
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const errors: string[] = [];
    
    if (!formData.salesContractId) errors.push('Sales Contract is required');
    if (!formData.invoiceNo) errors.push('Invoice Number is required');
    if (formData.amount <= 0) errors.push('Invoice amount must be greater than zero');
    if (!additionalFields.sellerGSTIN) errors.push('Seller GSTIN is required');
    if (!additionalFields.buyerGSTIN) errors.push('Buyer GSTIN is required');
    if (!additionalFields.dueDate) errors.push('Payment due date is required');
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setValidationErrors([]);
    
    // Create complete invoice data
    const completeInvoice = {
      ...formData,
      ...additionalFields,
    };
    
    // Auto-post to ledger if configured
    if (autoForward && selectedContract) {
      try {
        await autoPostingService.postInvoiceToLedger(completeInvoice as any);
        
        // Send email notification
        if (emailTo) {
          await notificationService.sendInvoiceEmail({
            to: emailTo,
            cc: emailCC,
            invoice: completeInvoice,
            contract: selectedContract,
            attachment: invoiceFile,
          } as any);
        }
      } catch (error) {
        console.error('Auto-posting error:', error);
      }
    }
    
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* OCR Upload Section */}
      {!readOnly && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Invoice for Auto-Fill (Optional)
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
              file:bg-blue-600 file:text-white
              hover:file:bg-blue-700
              cursor-pointer"
          />
          <p className="text-xs text-blue-600 mt-2">
            Upload invoice (PDF/Image) - System will extract data using OCR and auto-fill the form
          </p>
          
          {isProcessingOCR && (
            <div className="mt-3 flex items-center gap-2 text-blue-700">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
              <span>Processing invoice with OCR...</span>
            </div>
          )}
          
          {ocrResult && !isProcessingOCR && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-semibold">OCR Successful!</p>
                <p>Form has been auto-filled with extracted data. Please review and confirm.</p>
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

      {/* Basic Invoice Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Information</h3>
        
        <div className="space-y-3">
          <FormRow>
            <FormLabel htmlFor="invoiceNo">Invoice No. *</FormLabel>
            <FormInput 
              name="invoiceNo" 
              id="invoiceNo" 
              type="text" 
              value={formData.invoiceNo} 
              onChange={handleChange} 
              isReadOnly={readOnly}
              placeholder="INV-2024-001234"
              required 
            />
          </FormRow>
          
          <FormRow>
            <FormLabel htmlFor="salesContractId">Sales Contract *</FormLabel>
            <FormInput 
              component="select" 
              name="salesContractId" 
              id="salesContractId" 
              value={formData.salesContractId} 
              onChange={handleContractChange} 
              isReadOnly={readOnly}
              required
            >
              <option value="">-- Select Sales Contract --</option>
              {availableContracts.map(sc => (
                <option key={sc.id} value={sc.scNo}>
                  {sc.scNo} - {sc.clientName} - {sc.quantityBales} bales @ ₹{sc.rate.toLocaleString('en-IN')}
                </option>
              ))}
            </FormInput>
          </FormRow>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormRow>
              <FormLabel htmlFor="date">Invoice Date *</FormLabel>
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
              <FormLabel htmlFor="dueDate">Payment Due Date *</FormLabel>
              <FormInput 
                name="dueDate" 
                id="dueDate" 
                type="date" 
                value={additionalFields.dueDate} 
                onChange={handleChange} 
                isReadOnly={readOnly}
                required 
              />
            </FormRow>
          </div>
          
          <FormRow>
            <FormLabel htmlFor="paymentTerms">Payment Terms</FormLabel>
            <FormInput 
              name="paymentTerms" 
              id="paymentTerms" 
              type="text" 
              value={additionalFields.paymentTerms} 
              onChange={handleChange} 
              isReadOnly={readOnly}
              placeholder="Net 30 days"
            />
          </FormRow>
        </div>
      </div>

      {/* Party Details */}
      {selectedContract && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Party Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Seller Details */}
            <div className="space-y-3 border-r pr-4">
              <h4 className="font-semibold text-gray-700">Seller (From)</h4>
              
              <FormRow>
                <FormLabel htmlFor="sellerGSTIN">Seller GSTIN *</FormLabel>
                <FormInput 
                  name="sellerGSTIN" 
                  id="sellerGSTIN" 
                  type="text" 
                  value={additionalFields.sellerGSTIN} 
                  onChange={handleChange} 
                  isReadOnly={readOnly}
                  placeholder="22AAAAA0000A1Z5"
                  required 
                />
              </FormRow>
              
              <FormRow>
                <FormLabel htmlFor="sellerPAN">Seller PAN</FormLabel>
                <FormInput 
                  name="sellerPAN" 
                  id="sellerPAN" 
                  type="text" 
                  value={additionalFields.sellerPAN} 
                  onChange={handleChange} 
                  isReadOnly={readOnly}
                  placeholder="AAAAA0000A"
                />
              </FormRow>
              
              <FormRow>
                <FormLabel htmlFor="sellerAddress">Seller Address</FormLabel>
                <textarea
                  name="sellerAddress"
                  id="sellerAddress"
                  value={additionalFields.sellerAddress}
                  onChange={handleChange}
                  readOnly={readOnly}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Complete address with city, state, pincode"
                />
              </FormRow>
            </div>
            
            {/* Buyer Details */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700">Buyer (To)</h4>
              
              <FormRow>
                <FormLabel htmlFor="buyerGSTIN">Buyer GSTIN *</FormLabel>
                <FormInput 
                  name="buyerGSTIN" 
                  id="buyerGSTIN" 
                  type="text" 
                  value={additionalFields.buyerGSTIN} 
                  onChange={handleChange} 
                  isReadOnly={readOnly}
                  placeholder="24AAAAA0000A1Z5"
                  required 
                />
              </FormRow>
              
              <FormRow>
                <FormLabel htmlFor="buyerPAN">Buyer PAN</FormLabel>
                <FormInput 
                  name="buyerPAN" 
                  id="buyerPAN" 
                  type="text" 
                  value={additionalFields.buyerPAN} 
                  onChange={handleChange} 
                  isReadOnly={readOnly}
                  placeholder="BBBBB0000B"
                />
              </FormRow>
              
              <FormRow>
                <FormLabel htmlFor="buyerAddress">Buyer Address</FormLabel>
                <textarea
                  name="buyerAddress"
                  id="buyerAddress"
                  value={additionalFields.buyerAddress}
                  onChange={handleChange}
                  readOnly={readOnly}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Complete address with city, state, pincode"
                />
              </FormRow>
            </div>
          </div>
        </div>
      )}

      {/* Amount & GST Details */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Amount & GST Details</h3>
        
        <div className="space-y-3">
          <FormRow>
            <FormLabel htmlFor="amount">Taxable Amount (₹) *</FormLabel>
            <FormInput 
              name="amount" 
              id="amount" 
              type="number" 
              value={formData.amount} 
              onChange={handleChange} 
              isReadOnly={true}
              step="0.01"
              min="0"
              required 
            />
          </FormRow>
          
          {formData.amount > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <h4 className="font-semibold text-yellow-900 mb-3">GST Breakdown</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Seller State:</p>
                  <p className="font-semibold">{formData.sellerState}</p>
                </div>
                <div>
                  <p className="text-gray-600">Buyer State:</p>
                  <p className="font-semibold">{formData.buyerState}</p>
                </div>
                <div>
                  <p className="text-gray-600">Place of Supply:</p>
                  <p className="font-semibold">{additionalFields.placeOfSupply}</p>
                </div>
                <div>
                  <p className="text-gray-600">Transaction Type:</p>
                  <p className="font-semibold text-blue-600">
                    {formData.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 space-y-2 border-t border-yellow-300 pt-3">
                <div className="flex justify-between">
                  <span className="font-medium">Taxable Amount:</span>
                  <span className="font-semibold">₹{formData.taxableAmount?.toLocaleString('en-IN')}</span>
                </div>
                
                {formData.isInterState ? (
                  <div className="flex justify-between text-green-700">
                    <span className="font-medium">IGST @ {formData.gstRate}%:</span>
                    <span className="font-semibold">₹{formData.igst?.toLocaleString('en-IN')}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-green-700">
                      <span className="font-medium">CGST @ {(formData.gstRate || 0) / 2}%:</span>
                      <span className="font-semibold">₹{formData.cgst?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-green-700">
                      <span className="font-medium">SGST @ {(formData.gstRate || 0) / 2}%:</span>
                      <span className="font-semibold">₹{formData.sgst?.toLocaleString('en-IN')}</span>
                    </div>
                  </>
                )}
                
                <div className="flex justify-between font-bold text-lg text-blue-800 border-t border-yellow-300 pt-2">
                  <span>Total Amount:</span>
                  <span>₹{formData.totalAmount?.toLocaleString('en-IN')}</span>
                </div>
              </div>
              
              <div className="mt-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="reverseCharge"
                    checked={additionalFields.reverseCharge}
                    onChange={handleChange}
                    disabled={readOnly}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">Reverse Charge Applicable</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transport & Delivery Details */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Transport & Delivery Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormRow>
            <FormLabel htmlFor="transportMode">Transport Mode</FormLabel>
            <FormInput 
              component="select"
              name="transportMode" 
              id="transportMode" 
              value={additionalFields.transportMode} 
              onChange={handleChange} 
              isReadOnly={readOnly}
            >
              <option value="">-- Select --</option>
              <option value="Road">Road</option>
              <option value="Rail">Rail</option>
              <option value="Air">Air</option>
              <option value="Ship">Ship</option>
            </FormInput>
          </FormRow>
          
          <FormRow>
            <FormLabel htmlFor="vehicleNo">Vehicle No.</FormLabel>
            <FormInput 
              name="vehicleNo" 
              id="vehicleNo" 
              type="text" 
              value={additionalFields.vehicleNo} 
              onChange={handleChange} 
              isReadOnly={readOnly}
              placeholder="MH12AB1234"
            />
          </FormRow>
          
          <FormRow>
            <FormLabel htmlFor="lrNo">LR/GR No.</FormLabel>
            <FormInput 
              name="lrNo" 
              id="lrNo" 
              type="text" 
              value={additionalFields.lrNo} 
              onChange={handleChange} 
              isReadOnly={readOnly}
              placeholder="LR-2024-001234"
            />
          </FormRow>
          
          <FormRow>
            <FormLabel htmlFor="eWayBillNo">E-Way Bill No.</FormLabel>
            <FormInput 
              name="eWayBillNo" 
              id="eWayBillNo" 
              type="text" 
              value={additionalFields.eWayBillNo} 
              onChange={handleChange} 
              isReadOnly={readOnly}
              placeholder="123456789012"
            />
          </FormRow>
          
          <FormRow>
            <FormLabel htmlFor="supplyDate">Supply/Dispatch Date</FormLabel>
            <FormInput 
              name="supplyDate" 
              id="supplyDate" 
              type="date" 
              value={additionalFields.supplyDate} 
              onChange={handleChange} 
              isReadOnly={readOnly}
            />
          </FormRow>
        </div>
      </div>

      {/* Bank Details */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Details for Payment</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FormRow>
            <FormLabel htmlFor="bankName">Bank Name</FormLabel>
            <FormInput 
              name="bankName" 
              id="bankName" 
              type="text" 
              value={additionalFields.bankName} 
              onChange={handleChange} 
              isReadOnly={readOnly}
              placeholder="HDFC Bank"
            />
          </FormRow>
          
          <FormRow>
            <FormLabel htmlFor="bankAccountNo">Account No.</FormLabel>
            <FormInput 
              name="bankAccountNo" 
              id="bankAccountNo" 
              type="text" 
              value={additionalFields.bankAccountNo} 
              onChange={handleChange} 
              isReadOnly={readOnly}
              placeholder="1234567890"
            />
          </FormRow>
          
          <FormRow>
            <FormLabel htmlFor="bankIFSC">IFSC Code</FormLabel>
            <FormInput 
              name="bankIFSC" 
              id="bankIFSC" 
              type="text" 
              value={additionalFields.bankIFSC} 
              onChange={handleChange} 
              isReadOnly={readOnly}
              placeholder="HDFC0001234"
            />
          </FormRow>
        </div>
      </div>

      {/* Additional Notes */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
        
        <div className="space-y-3">
          <FormRow>
            <FormLabel htmlFor="notes">Notes/Remarks</FormLabel>
            <textarea
              name="notes"
              id="notes"
              value={additionalFields.notes}
              onChange={handleChange}
              readOnly={readOnly}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any additional notes or special instructions"
            />
          </FormRow>
          
          <FormRow>
            <FormLabel htmlFor="termsAndConditions">Terms & Conditions</FormLabel>
            <textarea
              name="termsAndConditions"
              id="termsAndConditions"
              value={additionalFields.termsAndConditions}
              onChange={handleChange}
              readOnly={readOnly}
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Standard terms and conditions"
            />
          </FormRow>
        </div>
      </div>

      {/* Email Automation */}
      {!readOnly && selectedContract && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Automation
          </h3>
          
          <div className="space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoForward}
                onChange={(e) => setAutoForward(e.target.checked)}
                className="rounded border-slate-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-slate-700 font-medium">
                Auto-forward invoice to buyer via email after saving
              </span>
            </label>
            
            {autoForward && (
              <>
                <FormRow>
                  <FormLabel htmlFor="emailTo">Email To *</FormLabel>
                  <FormInput 
                    name="emailTo" 
                    id="emailTo" 
                    type="email" 
                    value={emailTo} 
                    onChange={(e) => setEmailTo(e.target.value)} 
                    isReadOnly={false}
                    placeholder="buyer@example.com"
                    required
                  />
                </FormRow>
                
                <FormRow>
                  <FormLabel htmlFor="emailCC">CC (Optional)</FormLabel>
                  <FormInput 
                    name="emailCC" 
                    id="emailCC" 
                    type="email" 
                    value={emailCC} 
                    onChange={(e) => setEmailCC(e.target.value)} 
                    isReadOnly={false}
                    placeholder="manager@example.com (comma separated for multiple)"
                  />
                </FormRow>
                
                <div className="bg-white border border-green-300 rounded p-3 text-sm text-green-800">
                  <p className="font-semibold mb-1">Email will include:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Invoice PDF attachment</li>
                    <li>Contract reference details</li>
                    <li>Payment due date and terms</li>
                    <li>Bank details for payment</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Invoice Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <FormRow>
          <FormLabel htmlFor="status">Invoice Status</FormLabel>
          <FormInput 
            component="select" 
            name="status" 
            id="status" 
            value={formData.status} 
            onChange={handleChange} 
            isReadOnly={readOnly}
          >
            <option value="Unpaid">Unpaid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
            <option value="Cancelled">Cancelled</option>
          </FormInput>
        </FormRow>
      </div>

      {/* Form Actions */}
      <FormActions>
        <Button type="button" variant="secondary" onClick={onCancel}>
          {readOnly ? 'Close' : 'Cancel'}
        </Button>
        {!readOnly && (
          <Button type="submit" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            {autoForward ? 'Save & Send Email' : 'Save Invoice'}
          </Button>
        )}
      </FormActions>
    </form>
  );
};

export default ComprehensiveInvoiceForm;
