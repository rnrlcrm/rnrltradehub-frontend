import React, { useState, useEffect } from 'react';
import { Truck, Upload, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { FormRow, FormLabel, FormInput, FormActions, Button } from '../ui/Form';
import OCRService from '../../services/ocrService';
import AutoPostingService from '../../services/autoPostingService';
import NotificationService from '../../services/notificationService';

interface TransporterBillFormProps {
  bill?: any;
  readOnly: boolean;
  onSave: (data: any) => void;
  onCancel: () => void;
}

const TransporterBillForm: React.FC<TransporterBillFormProps> = ({ 
  bill, 
  readOnly, 
  onSave, 
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    billNo: '',
    billDate: new Date().toISOString().split('T')[0],
    salesContractId: '',
    transporterName: '',
    transporterGSTIN: '',
    transporterPAN: '',
    transporterAddress: '',
    
    // Transport details
    vehicleNo: '',
    driverName: '',
    driverLicense: '',
    driverPhone: '',
    
    // Loading details
    fromLocation: '',
    toLocation: '',
    distance: 0,
    loadingDate: '',
    deliveryDate: '',
    lrNo: '',
    eWayBillNo: '',
    
    // Quantity details
    quantityBales: 0,
    weight: 0,
    
    // Charges
    freightCharges: 0,
    loadingCharges: 0,
    unloadingCharges: 0,
    detentionCharges: 0,
    otherCharges: 0,
    totalChargesBeforeGST: 0,
    
    // GST
    gstRate: 5, // 5% for transport services
    cgst: 0,
    sgst: 0,
    igst: 0,
    totalAmount: 0,
    isInterState: false,
    
    // Payment terms
    paymentTerms: 'Net 7 days',
    dueDate: '',
    
    // Bank details
    bankName: '',
    accountNo: '',
    ifscCode: '',
    
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
    // Calculate total charges
    const total = formData.freightCharges + formData.loadingCharges + 
                  formData.unloadingCharges + formData.detentionCharges + 
                  formData.otherCharges;
    
    // Calculate GST
    const gstAmount = (total * formData.gstRate) / 100;
    const cgst = formData.isInterState ? 0 : gstAmount / 2;
    const sgst = formData.isInterState ? 0 : gstAmount / 2;
    const igst = formData.isInterState ? gstAmount : 0;
    
    const totalWithGST = total + gstAmount;
    
    setFormData(prev => ({
      ...prev,
      totalChargesBeforeGST: total,
      cgst,
      sgst,
      igst,
      totalAmount: totalWithGST,
    }));
  }, [
    formData.freightCharges,
    formData.loadingCharges,
    formData.unloadingCharges,
    formData.detentionCharges,
    formData.otherCharges,
    formData.gstRate,
    formData.isInterState,
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
      const extractedData = await OCRService.extractTransportBillData(file);
      
      setFormData(prev => ({
        ...prev,
        billNo: extractedData.billNo || prev.billNo,
        billDate: extractedData.billDate || prev.billDate,
        vehicleNo: extractedData.vehicleNo || prev.vehicleNo,
        lrNo: extractedData.lrNo || prev.lrNo,
        freightCharges: extractedData.freightCharges || prev.freightCharges,
        transporterName: extractedData.transporterName || prev.transporterName,
        transporterGSTIN: extractedData.transporterGSTIN || prev.transporterGSTIN,
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
    if (!formData.transporterName) errors.push('Transporter name is required');
    if (!formData.vehicleNo) errors.push('Vehicle number is required');
    if (formData.freightCharges <= 0) errors.push('Freight charges must be greater than zero');
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setValidationErrors([]);
    
    try {
      await AutoPostingService.postTransporterBillToLedger(formData);
      
      if (autoEmail && emailTo) {
        await NotificationService.sendTransporterBillEmail({
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
      <div className="bg-orange-100 border-l-4 border-orange-600 p-4">
        <h2 className="text-xl font-bold text-orange-900 flex items-center gap-2">
          <Truck className="w-6 h-6" />
          Transporter/Logistics Bill
        </h2>
      </div>

      {/* OCR Upload */}
      {!readOnly && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-orange-900 mb-3 flex items-center gap-2">
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
              file:bg-orange-600 file:text-white
              hover:file:bg-orange-700
              cursor-pointer"
          />
          
          {isProcessingOCR && (
            <div className="mt-3 flex items-center gap-2 text-orange-700">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-700"></div>
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
            <FormLabel htmlFor="billNo">Bill/LR Number *</FormLabel>
            <FormInput 
              name="billNo" 
              id="billNo" 
              type="text" 
              value={formData.billNo} 
              onChange={handleChange} 
              isReadOnly={readOnly}
              placeholder="LR-2024-001234"
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
            <FormLabel htmlFor="lrNo">LR/GR Number</FormLabel>
            <FormInput 
              name="lrNo" 
              id="lrNo" 
              type="text" 
              value={formData.lrNo} 
              onChange={handleChange} 
              isReadOnly={readOnly}
              placeholder="LR123456"
            />
          </FormRow>
          
          <FormRow>
            <FormLabel htmlFor="eWayBillNo">E-Way Bill No.</FormLabel>
            <FormInput 
              name="eWayBillNo" 
              id="eWayBillNo" 
              type="text" 
              value={formData.eWayBillNo} 
              onChange={handleChange} 
              isReadOnly={readOnly}
              placeholder="123456789012"
            />
          </FormRow>
        </div>
      </div>

      {/* Transporter Details */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Transporter Details</h3>
        
        <div className="space-y-3">
          <FormRow>
            <FormLabel htmlFor="transporterName">Transporter Name *</FormLabel>
            <FormInput 
              name="transporterName" 
              id="transporterName" 
              type="text" 
              value={formData.transporterName} 
              onChange={handleChange} 
              isReadOnly={readOnly}
              placeholder="ABC Transport Services"
              required 
            />
          </FormRow>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormRow>
              <FormLabel htmlFor="transporterGSTIN">GSTIN</FormLabel>
              <FormInput 
                name="transporterGSTIN" 
                id="transporterGSTIN" 
                type="text" 
                value={formData.transporterGSTIN} 
                onChange={handleChange} 
                isReadOnly={readOnly}
                placeholder="27XXXXX0000X1ZX"
              />
            </FormRow>
            
            <FormRow>
              <FormLabel htmlFor="transporterPAN">PAN</FormLabel>
              <FormInput 
                name="transporterPAN" 
                id="transporterPAN" 
                type="text" 
                value={formData.transporterPAN} 
                onChange={handleChange} 
                isReadOnly={readOnly}
                placeholder="XXXXX0000X"
              />
            </FormRow>
          </div>
          
          <FormRow>
            <FormLabel htmlFor="transporterAddress">Address</FormLabel>
            <textarea
              name="transporterAddress"
              id="transporterAddress"
              value={formData.transporterAddress}
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

      {/* Vehicle & Driver Details */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle & Driver Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormRow>
            <FormLabel htmlFor="vehicleNo">Vehicle Number *</FormLabel>
            <FormInput 
              name="vehicleNo" 
              id="vehicleNo" 
              type="text" 
              value={formData.vehicleNo} 
              onChange={handleChange} 
              isReadOnly={readOnly}
              placeholder="MH12AB1234"
              required 
            />
          </FormRow>
          
          <FormRow>
            <FormLabel htmlFor="driverName">Driver Name</FormLabel>
            <FormInput 
              name="driverName" 
              id="driverName" 
              type="text" 
              value={formData.driverName} 
              onChange={handleChange} 
              isReadOnly={readOnly}
            />
          </FormRow>
          
          <FormRow>
            <FormLabel htmlFor="driverLicense">Driver License No.</FormLabel>
            <FormInput 
              name="driverLicense" 
              id="driverLicense" 
              type="text" 
              value={formData.driverLicense} 
              onChange={handleChange} 
              isReadOnly={readOnly}
            />
          </FormRow>
          
          <FormRow>
            <FormLabel htmlFor="driverPhone">Driver Phone</FormLabel>
            <FormInput 
              name="driverPhone" 
              id="driverPhone" 
              type="tel" 
              value={formData.driverPhone} 
              onChange={handleChange} 
              isReadOnly={readOnly}
              placeholder="+91 9876543210"
            />
          </FormRow>
        </div>
      </div>

      {/* Transport Details */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Transport Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormRow>
            <FormLabel htmlFor="fromLocation">From Location</FormLabel>
            <FormInput 
              name="fromLocation" 
              id="fromLocation" 
              type="text" 
              value={formData.fromLocation} 
              onChange={handleChange} 
              isReadOnly={readOnly}
              placeholder="Mumbai, Maharashtra"
            />
          </FormRow>
          
          <FormRow>
            <FormLabel htmlFor="toLocation">To Location</FormLabel>
            <FormInput 
              name="toLocation" 
              id="toLocation" 
              type="text" 
              value={formData.toLocation} 
              onChange={handleChange} 
              isReadOnly={readOnly}
              placeholder="Ahmedabad, Gujarat"
            />
          </FormRow>
          
          <FormRow>
            <FormLabel htmlFor="distance">Distance (KM)</FormLabel>
            <FormInput 
              name="distance" 
              id="distance" 
              type="number" 
              value={formData.distance} 
              onChange={handleChange} 
              isReadOnly={readOnly}
              step="0.01"
            />
          </FormRow>
          
          <FormRow>
            <FormLabel htmlFor="quantityBales">Quantity (Bales)</FormLabel>
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
            <FormLabel htmlFor="weight">Weight (Kg)</FormLabel>
            <FormInput 
              name="weight" 
              id="weight" 
              type="number" 
              value={formData.weight} 
              onChange={handleChange} 
              isReadOnly={readOnly}
              step="0.01"
            />
          </FormRow>
          
          <FormRow>
            <FormLabel htmlFor="loadingDate">Loading Date</FormLabel>
            <FormInput 
              name="loadingDate" 
              id="loadingDate" 
              type="date" 
              value={formData.loadingDate} 
              onChange={handleChange} 
              isReadOnly={readOnly}
            />
          </FormRow>
          
          <FormRow>
            <FormLabel htmlFor="deliveryDate">Delivery Date</FormLabel>
            <FormInput 
              name="deliveryDate" 
              id="deliveryDate" 
              type="date" 
              value={formData.deliveryDate} 
              onChange={handleChange} 
              isReadOnly={readOnly}
            />
          </FormRow>
        </div>
      </div>

      {/* Charges Breakdown */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Charges Breakdown</h3>
        
        <div className="space-y-3">
          <FormRow>
            <FormLabel htmlFor="freightCharges">Freight Charges (₹) *</FormLabel>
            <FormInput 
              name="freightCharges" 
              id="freightCharges" 
              type="number" 
              value={formData.freightCharges} 
              onChange={handleChange} 
              isReadOnly={readOnly}
              step="0.01"
              min="0"
              required 
            />
          </FormRow>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormRow>
              <FormLabel htmlFor="loadingCharges">Loading Charges (₹)</FormLabel>
              <FormInput 
                name="loadingCharges" 
                id="loadingCharges" 
                type="number" 
                value={formData.loadingCharges} 
                onChange={handleChange} 
                isReadOnly={readOnly}
                step="0.01"
                min="0"
              />
            </FormRow>
            
            <FormRow>
              <FormLabel htmlFor="unloadingCharges">Unloading Charges (₹)</FormLabel>
              <FormInput 
                name="unloadingCharges" 
                id="unloadingCharges" 
                type="number" 
                value={formData.unloadingCharges} 
                onChange={handleChange} 
                isReadOnly={readOnly}
                step="0.01"
                min="0"
              />
            </FormRow>
            
            <FormRow>
              <FormLabel htmlFor="detentionCharges">Detention Charges (₹)</FormLabel>
              <FormInput 
                name="detentionCharges" 
                id="detentionCharges" 
                type="number" 
                value={formData.detentionCharges} 
                onChange={handleChange} 
                isReadOnly={readOnly}
                step="0.01"
                min="0"
              />
            </FormRow>
            
            <FormRow>
              <FormLabel htmlFor="otherCharges">Other Charges (₹)</FormLabel>
              <FormInput 
                name="otherCharges" 
                id="otherCharges" 
                type="number" 
                value={formData.otherCharges} 
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
                <span>Freight Charges:</span>
                <span className="font-semibold">₹{formData.freightCharges.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Loading Charges:</span>
                <span className="font-semibold">₹{formData.loadingCharges.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Unloading Charges:</span>
                <span className="font-semibold">₹{formData.unloadingCharges.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Detention Charges:</span>
                <span className="font-semibold">₹{formData.detentionCharges.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Other Charges:</span>
                <span className="font-semibold">₹{formData.otherCharges.toLocaleString('en-IN')}</span>
              </div>
              
              <hr className="border-blue-300" />
              
              <div className="flex justify-between font-semibold">
                <span>Total Before GST:</span>
                <span>₹{formData.totalChargesBeforeGST.toLocaleString('en-IN')}</span>
              </div>
              
              <div className="mt-2">
                <label className="flex items-center space-x-2 mb-2">
                  <input
                    type="checkbox"
                    name="isInterState"
                    checked={formData.isInterState}
                    onChange={handleChange}
                    disabled={readOnly}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Inter-State (IGST)</span>
                </label>
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
              name="paymentTerms" 
              id="paymentTerms" 
              type="text" 
              value={formData.paymentTerms} 
              onChange={handleChange} 
              isReadOnly={readOnly}
              placeholder="Net 7 days"
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
              <option value="Partially Paid">Partially Paid</option>
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

export default TransporterBillForm;
