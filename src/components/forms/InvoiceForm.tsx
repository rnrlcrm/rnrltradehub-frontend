
import React, { useState, useEffect } from 'react';
import { Invoice } from '../../types';
import { FormRow, FormLabel, FormInput, FormActions, Button } from '../ui/Form';

interface InvoiceFormProps {
  invoice?: Invoice | null;
  readOnly: boolean;
  onSave: (data: Invoice) => void;
  onCancel: () => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoice, readOnly, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Invoice>(invoice || { id: '', invoiceNo: '', salesContractId: '', date: new Date().toISOString().split('T')[0], amount: 0, status: 'Unpaid' });

  useEffect(() => {
    if (invoice) {
      setFormData(invoice);
    }
  }, [invoice]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-3">
        <FormRow>
          <FormLabel htmlFor="invoiceNo">Invoice No.</FormLabel>
          <FormInput name="invoiceNo" id="invoiceNo" type="text" value={formData.invoiceNo} onChange={handleChange} isReadOnly={readOnly || !!invoice} />
        </FormRow>
        <FormRow>
          <FormLabel htmlFor="salesContractId">Sales Contract No.</FormLabel>
          <FormInput name="salesContractId" id="salesContractId" type="text" value={formData.salesContractId} onChange={handleChange} isReadOnly={readOnly} />
        </FormRow>
        <FormRow>
          <FormLabel htmlFor="date">Invoice Date</FormLabel>
          <FormInput name="date" id="date" type="date" value={formData.date} onChange={handleChange} isReadOnly={readOnly} />
        </FormRow>
        <FormRow>
          <FormLabel htmlFor="amount">Amount</FormLabel>
          <FormInput name="amount" id="amount" type="number" value={formData.amount} onChange={handleChange} isReadOnly={readOnly} />
        </FormRow>
        <FormRow>
          <FormLabel htmlFor="status">Status</FormLabel>
          <FormInput component="select" name="status" id="status" value={formData.status} onChange={handleChange} isReadOnly={readOnly}>
            <option>Unpaid</option>
            <option>Partially Paid</option>
            <option>Paid</option>
          </FormInput>
        </FormRow>
      </div>
      <FormActions>
        <Button type="button" variant="secondary" onClick={onCancel}>{readOnly ? 'Close' : 'Cancel'}</Button>
        {!readOnly && <Button type="submit">Save</Button>}
      </FormActions>
    </form>
  );
};

export default InvoiceForm;
