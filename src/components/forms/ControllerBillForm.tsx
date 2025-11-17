import React, { useState, useEffect } from 'react';
import { UserCheck, Upload, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { FormRow, FormLabel, FormInput, FormActions, Button } from '../ui/Form';
import OCRService from '../../services/ocrService';
import AutoPostingService from '../../services/autoPostingService';
import NotificationService from '../../services/notificationService';
import { calculateGST, GST_RATES } from '../../utils/gstCalculations';

interface ControllerBillFormProps {
  bill?: any;
  readOnly: boolean;
  onSave: (data: any) => void;
  onCancel: () => void;
}

const ControllerBillForm: React.FC<ControllerBillFormProps> = ({ 
  bill, 
  readOnly, 
  onSave, 
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    billNo: '',
    billDate: new Date().toISOString().split('T')[0],
    salesContractId: '',
    
    // Controller details
    controllerName: '',
    controllerGSTIN: '',
    controllerPAN: '',
    controllerAddress: '',
    controllerType: 'Quality', // Quality, Logistics, Survey
    
    // Service details
    serviceDescription: '',
    quantityBales: 0,
    ratePerBale: 0,
    flatFee: 0,
    
    // Charges
    serviceCharges: 0,
    travelExpenses: 0,
    otherExpenses: 0,
    totalChargesBeforeGST: 0,
    
    // GST
    gstRate: GST_RATES.STANDARD_SERVICES, // 18% for professional services
    cgst: 0,
    sgst: 0,
    igst: 0,
    totalAmount: 0,
    isInterState: false,
    controllerState: '',
    companyState: 'Maharashtra',
    
    // Payment terms
    paymentTerms: 'Immediate',
    dueDate: '',
    
    // Bank details
    bankName: '',
    accountNo: '',
    ifscCode: '',
    
    // Service dates
    appointmentDate: '',
    serviceCompletionDate: '',
    reportSubmissionDate: '',
    
    remarks: '',
    status: 'Unpaid',
  });
  
  const [billFile, setBillFile] = useState<File | null>(null);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrError, setOcrError] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const [autoEmail, setAutoEmail] = useState(true);
  const [emailTo, setEmailTo] = useState('');

  useEffect(() => {
    if (bill) {
      setFormData(bill);
    }
  }, [bill]);

  useEffect(() => {
    // Calculate charges based on rate per bale or flat fee
    let serviceCharges = 0;
    if (formData.ratePerBale > 0 && formData.quantityBales > 0) {
      serviceCharges = formData.ratePerBale * formData.quantityBales;
    } else if (formData.flatFee > 0) {
      serviceCharges = formData.flatFee;
    }
    
    const total = serviceCharges + formData.travelExpenses + formData.otherExpenses;
    
    // Calculate GST
    const gstCalc = calculateGST(
      total,
      formData.controllerState,
      formData.companyState,
      formData.gstRate
    );
    
    setFormData(prev => ({
      ...prev,
      serviceCharges,
      totalChargesBeforeGST: total,
      cgst: gstCalc.cgst,
      sgst: gstCalc.sgst,
      igst: gstCalc.igst,
      totalAmount: gstCalc.totalAmount,
      isInterState: gstCalc.isInterState,
    }));
  }, [
    formData.ratePerBale,
    formData.quantityBales,
    formData.flatFee,
    formData.travelExpenses,
    formData.otherExpenses,
    formData.gstRate,
    formData.controllerState,
    formData.companyState,
  ]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setOcrError('Please upload a PDF or image file');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setOcrError('File size must be less than 10MB');
      return;
    }
    
    setBillFile(file);
    setOcrError('');
    
    setIsProcessingOCR(true);
    try {
      const extractedData = await OCRService.extractControllerBillData(file);
      
      setFormData(prev => ({
        ...prev,
        billNo: extractedData.billNo || prev.billNo,
        billDate: extractedData.billDate || prev.billDate,
        controllerName: extractedData.controllerName || prev.controllerName,
        controllerGSTIN: extractedData.controllerGSTIN || prev.controllerGSTIN,
        serviceCharges: extractedData.serviceCharges || prev.serviceCharges,
      }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: string[] = [];
    if (!formData.billNo) errors.push('Bill number is required');
    if (!formData.controllerName) errors.push('Controller name is required');
    if (!formData.controllerType) errors.push('Controller type is required');
    if (formData.serviceCharges <= 0) errors.push('Service charges must be greater than zero');
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setValidationErrors([]);
    
    try {
      await AutoPostingService.postControllerBillToLedger(formData);
      
      if (autoEmail && emailTo) {
        await NotificationService.sendControllerBillEmail({
          to: emailTo,
          bill: formData,
          attachment: billFile,
        } as any);
      }
    } catch (error) {
      console.error('Error saving bill:', error);
    }
    
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="bg-indigo-100 border-l-4 border-indigo-600 p-4">
        <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
          <UserCheck className="w-6 h-6" />
          Controller Service Bill
        </h2>
      </div>

      {/* OCR Upload */}
      {!readOnly && (
        <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-indigo-900 mb-3 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Bill for Auto-Fill
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
              file:bg-indigo-600 file:text-white
              hover:file:bg-indigo-700
              cursor-pointer"
          />
          
          {isProcessingOCR && (
            <div className="mt-3 flex items-center gap-2 text-indigo-700">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-700"></div>
              <span>Processing bill...</span>
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

      {/* Bill Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bill Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormRow>
            <FormLabel htmlFor="billNo">Bill Number *</FormLabel>
            <FormInput 
              name="billNo" 
              id="billNo" 
              type="text" 
              value={formData.billNo} 
              onChange={handleChange} 
              isReadOnly={readOnly}
              placeholder="CTRL-2024-001234"
              required 
            />
          </FormRow>
          
          <FormRow>
            <FormLabel htmlFor="billDate">Bill Date *</FormLabel>
            <FormInput 
              name="billDate" 
              id="billDate" 
              type="date" 
              value={formData.billDate} 
              onChange={handleChange} 
              isReadOnly={readOnly}
              required 
            />
          </FormRow>
          
          <FormRow>
            <FormLabel htmlFor="salesContractId">Contract Reference</FormLabel>
            <FormInput 
              name="salesContractId" 
              id="salesContractId" 
              type="text" 
              value={formData.salesContractId} 
              onChange={handleChange} 
              isReadOnly={readOnly}
              placeholder="SC-2024-001"
            />
          </FormRow>
          
          <FormRow>
            <FormLabel htmlFor="controllerType">Controller Type *</FormLabel>
            <FormInput 
              component="select"
              name="controllerType" 
              id="controllerType" 
              value={formData.controllerType} 
              onChange={handleChange} 
              isReadOnly={readOnly}
              required
            >
              <option value="Quality">Quality Controller</option>
              <option value="Logistics">Logistics Controller</option>
              <option value="Survey">Survey Controller</option>
              <option value="Inspector">Inspector</option>
              <option value="Other">Other</option>
            </FormInput>
          </FormRow>
        </div>
      </div>

      {/* Controller Details */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Controller Details</h3>
        
        <div className="space-y-3">
          <FormRow>
            <FormLabel htmlFor="controllerName">Controller Name *</FormLabel>
            <FormInput 
              name="controllerName" 
              id="controllerName" 
              type="text" 
              value={formData.controllerName} 
              onChange={handleChange} 
              isReadOnly={readOnly}
              placeholder="Mr. John Doe"
              required 
            />
          </FormRow>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormRow>
              <FormLabel htmlFor="controllerGSTIN">GSTIN</FormLabel>
              <FormInput 
                name="controllerGSTIN" 
                id="controllerGSTIN" 
                type="text" 
                value={formData.controllerGSTIN} 
                onChange={handleChange} 
                isReadOnly={readOnly}
                placeholder="27XXXXX0000X1ZX"
              />
            </FormRow>
            
            <FormRow>
              <FormLabel htmlFor="controllerPAN">PAN</FormLabel>
              <FormInput 
                name="controllerPAN" 
                id="controllerPAN" 
                type="text" 
                value={formData.controllerPAN} 
                onChange={handleChange} 
                isReadOnly={readOnly}
                placeholder="XXXXX0000X"
              />
            </FormRow>
            
            <FormRow>
              <FormLabel htmlFor="controllerState">Controller State</FormLabel>
              <FormInput 
                name="controllerState" 
                id="controllerState" 
                type="text" 
                value={formData.controllerState} 
                onChange={handleChange} 
                isReadOnly={readOnly}
                placeholder="Maharashtra"
              />
            </FormRow>
          </div>
          
          <FormRow>
            <FormLabel htmlFor="controllerAddress">Address</FormLabel>
            <textarea
              name="controllerAddress"
              id="controllerAddress"
              value={formData.controllerAddress}
              onChange={handleChange}
              readOnly={readOnly}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Complete address"
            />
          </FormRow>
          
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

      {/* Service Details */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Details</h3>
        
        <div className="space-y-3">
          <FormRow>
            <FormLabel htmlFor="serviceDescription">Service Description</FormLabel>
            <textarea
              name="serviceDescription"
              id="serviceDescription"
              value={formData.serviceDescription}
              onChange={handleChange}
              readOnly={readOnly}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Quality inspection of 100 bales of cotton"
            />
          </FormRow>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FormRow>
              <FormLabel htmlFor="appointmentDate">Appointment Date</FormLabel>
              <FormInput 
                name="appointmentDate" 
                id="appointmentDate" 
                type="date" 
                value={formData.appointmentDate} 
                onChange={handleChange} 
                isReadOnly={readOnly}
              />
            </FormRow>
            
            <FormRow>
              <FormLabel htmlFor="serviceCompletionDate">Service Completion</FormLabel>
              <FormInput 
                name="serviceCompletionDate" 
                id="serviceCompletionDate" 
                type="date" 
                value={formData.serviceCompletionDate} 
                onChange={handleChange} 
                isReadOnly={readOnly}
              />
            </FormRow>
            
            <FormRow>
              <FormLabel htmlFor="reportSubmissionDate">Report Submitted</FormLabel>
              <FormInput 
                name="reportSubmissionDate" 
                id="reportSubmissionDate" 
                type="date" 
                value={formData.reportSubmissionDate} 
                onChange={handleChange} 
                isReadOnly={readOnly}
              />
            </FormRow>
          </div>
        </div>
      </div>

      {/* Charges Calculation */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Charges Calculation</h3>
        
        <div className="space-y-3">
          <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-3">
            <p className="text-sm text-gray-700 mb-2">Choose calculation method:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="border border-blue-200 rounded p-2 bg-blue-50">
                <p className="text-xs font-semibold text-blue-900 mb-2">Rate Per Bale</p>
                <div className="grid grid-cols-2 gap-2">
                  <FormRow>
                    <FormLabel htmlFor="quantityBales">Bales</FormLabel>
                    <FormInput 
                      name="quantityBales" 
                      id="quantityBales" 
                      type="number" 
                      value={formData.quantityBales} 
                      onChange={handleChange} 
                      isReadOnly={readOnly}
                    />
                  </FormRow>
                  
                  <FormRow>
                    <FormLabel htmlFor="ratePerBale">Rate/Bale (₹)</FormLabel>
                    <FormInput 
                      name="ratePerBale" 
                      id="ratePerBale" 
                      type="number" 
                      value={formData.ratePerBale} 
                      onChange={handleChange} 
                      isReadOnly={readOnly}
                      step="0.01"
                    />
                  </FormRow>
                </div>
              </div>
              
              <div className="border border-green-200 rounded p-2 bg-green-50">
                <p className="text-xs font-semibold text-green-900 mb-2">OR Flat Fee</p>
                <FormRow>
                  <FormLabel htmlFor="flatFee">Flat Fee (₹)</FormLabel>
                  <FormInput 
                    name="flatFee" 
                    id="flatFee" 
                    type="number" 
                    value={formData.flatFee} 
                    onChange={handleChange} 
                    isReadOnly={readOnly}
                    step="0.01"
                  />
                </FormRow>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormRow>
              <FormLabel htmlFor="travelExpenses">Travel Expenses (₹)</FormLabel>
              <FormInput 
                name="travelExpenses" 
                id="travelExpenses" 
                type="number" 
                value={formData.travelExpenses} 
                onChange={handleChange} 
                isReadOnly={readOnly}
                step="0.01"
                min="0"
              />
            </FormRow>
            
            <FormRow>
              <FormLabel htmlFor="otherExpenses">Other Expenses (₹)</FormLabel>
              <FormInput 
                name="otherExpenses" 
                id="otherExpenses" 
                type="number" 
                value={formData.otherExpenses} 
                onChange={handleChange} 
                isReadOnly={readOnly}
                step="0.01"
                min="0"
              />
            </FormRow>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="font-semibold text-blue-900 mb-3">Bill Summary</h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Service Charges:</span>
                <span className="font-semibold">₹{formData.serviceCharges.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Travel Expenses:</span>
                <span className="font-semibold">₹{formData.travelExpenses.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Other Expenses:</span>
                <span className="font-semibold">₹{formData.otherExpenses.toLocaleString('en-IN')}</span>
              </div>
              
              <hr className="border-blue-300" />
              
              <div className="flex justify-between font-semibold">
                <span>Total Before GST:</span>
                <span>₹{formData.totalChargesBeforeGST.toLocaleString('en-IN')}</span>
              </div>
              
              <div className="flex justify-between text-sm text-gray-600">
                <span>Transaction Type:</span>
                <span className="font-semibold">
                  {formData.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}
                </span>
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
              
              <hr className="border-blue-300" />
              
              <div className="flex justify-between font-bold text-lg text-blue-800">
                <span>Total Amount:</span>
                <span>₹{formData.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Terms */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Terms</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormRow>
            <FormLabel htmlFor="paymentTerms">Payment Terms</FormLabel>
            <FormInput 
              component="select"
              name="paymentTerms" 
              id="paymentTerms" 
              value={formData.paymentTerms} 
              onChange={handleChange} 
              isReadOnly={readOnly}
            >
              <option value="Immediate">Immediate</option>
              <option value="Net 7 days">Net 7 days</option>
              <option value="Net 15 days">Net 15 days</option>
              <option value="Net 30 days">Net 30 days</option>
            </FormInput>
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
            <FormLabel htmlFor="status">Payment Status</FormLabel>
            <FormInput 
              component="select"
              name="status" 
              id="status" 
              value={formData.status} 
              onChange={handleChange} 
              isReadOnly={readOnly}
            >
              <option value="Unpaid">Unpaid</option>
              <option value="Paid">Paid</option>
            </FormInput>
          </FormRow>
        </div>
      </div>

      {/* Remarks */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <FormRow>
          <FormLabel htmlFor="remarks">Remarks</FormLabel>
          <textarea
            name="remarks"
            id="remarks"
            value={formData.remarks}
            onChange={handleChange}
            readOnly={readOnly}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Any additional notes"
          />
        </FormRow>
      </div>

      {/* Email Automation */}
      {!readOnly && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-900 mb-3">Email Notification</h3>
          
          <label className="flex items-center space-x-2 mb-3">
            <input
              type="checkbox"
              checked={autoEmail}
              onChange={(e) => setAutoEmail(e.target.checked)}
              className="rounded border-slate-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-sm text-slate-700 font-medium">
              Send bill to buyer via email
            </span>
          </label>
          
          {autoEmail && (
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
            {autoEmail ? 'Save & Send Email' : 'Save Bill'}
          </Button>
        )}
      </FormActions>
    </form>
  );
};

export default ControllerBillForm;
