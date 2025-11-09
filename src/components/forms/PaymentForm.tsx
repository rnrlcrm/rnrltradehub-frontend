
import React, { useState, useEffect } from 'react';
import { Payment, Invoice } from '../../types';
import { FormRow, FormLabel, FormInput, FormActions, Button } from '../ui/Form';
import { mockInvoices } from '../../data/mockData';

interface PaymentFormProps {
  payment?: Payment | null;
  readOnly: boolean;
  onSave: (data: Payment) => void;
  onCancel: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ payment, readOnly, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Payment>(payment || { 
    id: '', 
    paymentId: '', 
    invoiceId: '', 
    date: new Date().toISOString().split('T')[0], 
    amount: 0, 
    method: 'Bank Transfer' 
  });
  
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  // Get only unpaid and partially paid invoices
  const availableInvoices = mockInvoices.filter(
    inv => inv.status === 'Unpaid' || inv.status === 'Partially Paid'
  );

  useEffect(() => {
    if (payment) {
      setFormData(payment);
      // Find the invoice for this payment
      const invoice = mockInvoices.find(inv => inv.invoiceNo === payment.invoiceId);
      setSelectedInvoice(invoice || null);
    }
  }, [payment]);

  const handleInvoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const invoiceNo = e.target.value;
    const invoice = availableInvoices.find(inv => inv.invoiceNo === invoiceNo);
    
    if (invoice) {
      setSelectedInvoice(invoice);
      // Auto-populate amount (full invoice amount by default)
      setFormData(prev => ({
        ...prev,
        invoiceId: invoice.invoiceNo,
        amount: invoice.amount,
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.invoiceId) {
      alert('Please select an Invoice');
      return;
    }
    
    if (!formData.paymentId) {
      alert('Please enter Payment ID');
      return;
    }
    
    if (formData.amount <= 0) {
      alert('Payment amount must be greater than zero');
      return;
    }
    
    if (selectedInvoice && formData.amount > selectedInvoice.amount) {
      alert('Payment amount cannot exceed invoice amount');
      return;
    }
    
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-3">
        <FormRow>
          <FormLabel htmlFor="paymentId">Payment ID</FormLabel>
          <FormInput 
            name="paymentId" 
            id="paymentId" 
            type="text" 
            value={formData.paymentId} 
            onChange={handleChange} 
            isReadOnly={readOnly || !!payment}
            placeholder="PAY-2024-001"
            required 
          />
        </FormRow>
        
        <FormRow>
          <FormLabel htmlFor="invoiceId">Invoice *</FormLabel>
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
        
        {selectedInvoice && (
          <>
            <FormRow>
              <FormLabel htmlFor="invoiceDetails">Invoice Details</FormLabel>
              <div className="md:col-span-2 bg-green-50 border border-green-200 rounded-md p-3 text-sm">
                <p><strong>Invoice No:</strong> {selectedInvoice.invoiceNo}</p>
                <p><strong>Sales Contract:</strong> {selectedInvoice.salesContractId}</p>
                <p><strong>Invoice Date:</strong> {selectedInvoice.date}</p>
                <p><strong>Total Amount:</strong> ₹{selectedInvoice.amount.toLocaleString('en-IN')}</p>
                <p><strong>Status:</strong> <span className={selectedInvoice.status === 'Unpaid' ? 'text-red-600' : 'text-yellow-600'}>{selectedInvoice.status}</span></p>
              </div>
            </FormRow>
          </>
        )}
        
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
            max={selectedInvoice?.amount}
            required 
          />
        </FormRow>
        
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
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cheque">Cheque</option>
            <option value="Cash">Cash</option>
          </FormInput>
        </FormRow>
      </div>
      
      <FormActions>
        <Button type="button" variant="secondary" onClick={onCancel}>
          {readOnly ? 'Close' : 'Cancel'}
        </Button>
        {!readOnly && <Button type="submit">Record Payment</Button>}
      </FormActions>
    </form>
  );
};

export default PaymentForm;
