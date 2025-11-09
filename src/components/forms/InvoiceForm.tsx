
import React, { useState, useEffect } from 'react';
import { Invoice, SalesContract } from '../../types';
import { FormRow, FormLabel, FormInput, FormActions, Button } from '../ui/Form';
import { mockSalesContracts } from '../../data/mockData';

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
    status: 'Unpaid' 
  });
  
  const [selectedContract, setSelectedContract] = useState<SalesContract | null>(null);
  
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
      // Auto-calculate invoice amount (contract value = quantity * rate)
      const totalAmount = contract.quantityBales * contract.rate;
      
      setFormData(prev => ({
        ...prev,
        salesContractId: contract.scNo,
        amount: totalAmount,
      }));
    } else {
      setSelectedContract(null);
      setFormData(prev => ({
        ...prev,
        salesContractId: '',
        amount: 0,
      }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
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
    
    onSave(formData);
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
          <FormLabel htmlFor="amount">Amount (₹) *</FormLabel>
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
      </div>
      
      <FormActions>
        <Button type="button" variant="secondary" onClick={onCancel}>
          {readOnly ? 'Close' : 'Cancel'}
        </Button>
        {!readOnly && <Button type="submit">Save Invoice</Button>}
      </FormActions>
    </form>
  );
};

export default InvoiceForm;
