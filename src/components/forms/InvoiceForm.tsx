
import React, { useState, useEffect } from 'react';
import { Invoice, SalesContract, BusinessPartner } from '../../types';
import { FormRow, FormLabel, FormInput, FormActions, Button } from '../ui/Form';
import { mockSalesContracts, mockBusinessPartners } from '../../data/mockData';
import { calculateGST, formatGSTBreakdown, GST_RATES } from '../../utils/gstCalculations';

interface InvoiceFormProps {
  invoice?: Invoice | null;
  readOnly: boolean;
  onSave: (data: Invoice) => void;
  onCancel: () => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoice, readOnly, onSave, onCancel }) => {
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
    gstRate: GST_RATES.DEFAULT,
    totalAmount: 0,
    sellerState: '',
    buyerState: '',
    isInterState: false,
  });
  
  const [selectedContract, setSelectedContract] = useState<SalesContract | null>(null);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [autoForward, setAutoForward] = useState(true);
  const [sellerPartner, setSellerPartner] = useState<BusinessPartner | null>(null);
  const [buyerPartner, setBuyerPartner] = useState<BusinessPartner | null>(null);
  
  // Get only active and completed sales contracts for invoice generation
  const availableContracts = mockSalesContracts.filter(
    sc => sc.status === 'Active' || sc.status === 'Completed'
  );

  useEffect(() => {
    if (invoice) {
      setFormData(invoice);
      // Find the contract for this invoice
      const contract = mockSalesContracts.find(sc => sc.scNo === invoice.salesContractId);
      setSelectedContract(contract || null);
    }
  }, [invoice]);

  const handleContractChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const contractNo = e.target.value;
    const contract = availableContracts.find(sc => sc.scNo === contractNo);
    
    if (contract) {
      setSelectedContract(contract);
      
      // Get seller and buyer business partners to determine states
      const seller = mockBusinessPartners.find(bp => bp.id === contract.vendorId || bp.name === contract.vendorName);
      const buyer = mockBusinessPartners.find(bp => bp.id === contract.clientId || bp.name === contract.clientName);
      
      setSellerPartner(seller || null);
      setBuyerPartner(buyer || null);
      
      // Auto-calculate invoice amount (contract value = quantity * rate)
      const baseAmount = contract.quantityBales * contract.rate;
      
      // Determine GST rate (5% for cotton products by default)
      const gstRate = GST_RATES.COTTON; // Can be customized based on product type
      
      // Get states for GST calculation
      const sellerState = seller?.state || 'Maharashtra'; // Default if not found
      const buyerState = buyer?.state || 'Gujarat'; // Default if not found
      
      // Calculate GST
      const gstCalc = calculateGST(baseAmount, sellerState, buyerState, gstRate);
      
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
    } else {
      setSelectedContract(null);
      setSellerPartner(null);
      setBuyerPartner(null);
      setFormData(prev => ({
        ...prev,
        salesContractId: '',
        amount: 0,
        taxableAmount: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        totalAmount: 0,
      }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (PDF, images)
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload a PDF or image file (JPG, PNG)');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      
      setInvoiceFile(file);
      
      // In real implementation, this would extract data from the invoice
      // For now, we'll show a placeholder
      console.log('Invoice file uploaded:', file.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.salesContractId) {
      alert('Please select a Sales Contract');
      return;
    }
    
    if (!formData.invoiceNo) {
      alert('Please enter Invoice Number');
      return;
    }
    
    if (formData.amount <= 0) {
      alert('Invoice amount must be greater than zero');
      return;
    }
    
    // Simulate email forwarding
    if (autoForward && selectedContract) {
      console.log('Auto-forwarding invoice to buyer:', selectedContract.clientName);
      console.log('Buyer email would be:', selectedContract.clientId); // In real app, get from business partner
      // Backend would handle actual email sending
    }
    
    onSave(formData);
  };

  const handleEmailToBuyer = () => {
    if (selectedContract) {
      alert(`Invoice will be emailed to ${selectedContract.clientName}\n\nIn production, this will:\n1. Attach the invoice PDF\n2. Include contract details\n3. Send to buyer's registered email\n4. CC: relevant parties\n5. Log in audit trail`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-3">
        <FormRow>
          <FormLabel htmlFor="invoiceNo">Invoice No.</FormLabel>
          <FormInput 
            name="invoiceNo" 
            id="invoiceNo" 
            type="text" 
            value={formData.invoiceNo} 
            onChange={handleChange} 
            isReadOnly={readOnly || !!invoice}
            placeholder="INV-2024-001"
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
                {sc.scNo} - {sc.clientName} (₹{(sc.quantityBales * sc.rate).toLocaleString('en-IN')})
              </option>
            ))}
          </FormInput>
        </FormRow>
        
        {selectedContract && (
          <>
            <FormRow>
              <FormLabel htmlFor="contractDetails">Contract Details</FormLabel>
              <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
                <p><strong>Seller:</strong> {selectedContract.vendorName}</p>
                <p><strong>Buyer:</strong> {selectedContract.clientName}</p>
                <p><strong>Quantity:</strong> {selectedContract.quantityBales} bales</p>
                <p><strong>Rate:</strong> ₹{selectedContract.rate.toLocaleString('en-IN')}/bale</p>
                <p><strong>Total Value:</strong> ₹{(selectedContract.quantityBales * selectedContract.rate).toLocaleString('en-IN')}</p>
              </div>
            </FormRow>
          </>
        )}
        
        {!readOnly && (
          <FormRow>
            <FormLabel htmlFor="invoiceUpload">Upload Invoice (Optional)</FormLabel>
            <div className="md:col-span-2">
              <input
                type="file"
                id="invoiceUpload"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="block w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  cursor-pointer"
              />
              <p className="text-xs text-slate-500 mt-1">
                Upload invoice received from seller (PDF, JPG, PNG - Max 10MB)
              </p>
              {invoiceFile && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Uploaded: {invoiceFile.name}
                </p>
              )}
            </div>
          </FormRow>
        )}
        
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
        
        {selectedContract && formData.amount > 0 && (
          <>
            <FormRow>
              <FormLabel>GST Details</FormLabel>
              <div className="md:col-span-2 bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm space-y-2">
                <div className="flex justify-between">
                  <span><strong>Seller State:</strong></span>
                  <span>{formData.sellerState || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span><strong>Buyer State:</strong></span>
                  <span>{formData.buyerState || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span><strong>Transaction Type:</strong></span>
                  <span className="font-semibold text-blue-600">
                    {formData.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}
                  </span>
                </div>
                <hr className="border-yellow-300" />
                <div className="flex justify-between">
                  <span><strong>Taxable Amount:</strong></span>
                  <span>₹{formData.taxableAmount?.toLocaleString('en-IN') || '0'}</span>
                </div>
                {formData.isInterState ? (
                  <div className="flex justify-between text-green-700">
                    <span><strong>IGST @ {formData.gstRate}%:</strong></span>
                    <span>₹{formData.igst?.toLocaleString('en-IN') || '0'}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-green-700">
                      <span><strong>CGST @ {(formData.gstRate || 0) / 2}%:</strong></span>
                      <span>₹{formData.cgst?.toLocaleString('en-IN') || '0'}</span>
                    </div>
                    <div className="flex justify-between text-green-700">
                      <span><strong>SGST @ {(formData.gstRate || 0) / 2}%:</strong></span>
                      <span>₹{formData.sgst?.toLocaleString('en-IN') || '0'}</span>
                    </div>
                  </>
                )}
                <hr className="border-yellow-300" />
                <div className="flex justify-between font-bold text-lg text-blue-800">
                  <span>Total Amount (including GST):</span>
                  <span>₹{formData.totalAmount?.toLocaleString('en-IN') || '0'}</span>
                </div>
              </div>
            </FormRow>
          </>
        )}
        
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
            <option value="Unpaid">Unpaid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Paid">Paid</option>
          </FormInput>
        </FormRow>
        
        {!readOnly && selectedContract && (
          <FormRow>
            <FormLabel htmlFor="autoForward">Email Automation</FormLabel>
            <div className="md:col-span-2 space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={autoForward}
                  onChange={(e) => setAutoForward(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">
                  Auto-forward invoice to buyer via email after saving
                </span>
              </label>
              <p className="text-xs text-slate-500">
                System will automatically email invoice to {selectedContract.clientName}
              </p>
            </div>
          </FormRow>
        )}
      </div>
      
      <FormActions>
        <Button type="button" variant="secondary" onClick={onCancel}>
          {readOnly ? 'Close' : 'Cancel'}
        </Button>
        {readOnly && selectedContract && (
          <Button type="button" onClick={handleEmailToBuyer} className="bg-green-600 hover:bg-green-700">
            Email to Buyer
          </Button>
        )}
        {!readOnly && <Button type="submit">Save Invoice</Button>}
      </FormActions>
    </form>
  );
};

export default InvoiceForm;
