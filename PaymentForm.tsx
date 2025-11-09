
import React, { useState, useEffect } from 'react';
import { Payment } from '../../types';
import { FormRow, FormLabel, FormInput, FormActions, Button } from '../ui/Form';

interface PaymentFormProps {
  payment?: Payment | null;
  readOnly: boolean;
  onSave: (data: Payment) => void;
  onCancel: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ payment, readOnly, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Payment>(payment || { id: '', paymentId: '', invoiceId: '', date: new Date().toISOString().split('T')[0], amount: 0, method: 'Bank Transfer' });

  useEffect(() => {
    if (payment) {
      setFormData(payment);
    }
  }, [payment]);

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
          <FormLabel htmlFor="paymentId">Payment ID</FormLabel>
          <FormInput name="paymentId" id="paymentId" type="text" value={formData.paymentId} onChange={handleChange} isReadOnly={readOnly || !!payment} />
        </FormRow>
        <FormRow>
          <FormLabel htmlFor="invoiceId">Invoice No.</FormLabel>
          <FormInput name="invoiceId" id="invoiceId" type="text" value={formData.invoiceId} onChange={handleChange} isReadOnly={readOnly} />
        </FormRow>
        <FormRow>
          <FormLabel htmlFor="date">Payment Date</FormLabel>
          <FormInput name="date" id="date" type="date" value={formData.date} onChange={handleChange} isReadOnly={readOnly} />
        </FormRow>
        <FormRow>
          <FormLabel htmlFor="amount">Amount</FormLabel>
          <FormInput name="amount" id="amount" type="number" value={formData.amount} onChange={handleChange} isReadOnly={readOnly} />
        </FormRow>
        <FormRow>
          <FormLabel htmlFor="method">Payment Method</FormLabel>
          <FormInput component="select" name="method" id="method" value={formData.method} onChange={handleChange} isReadOnly={readOnly}>
            <option>Bank Transfer</option>
            <option>Cheque</option>
            <option>Cash</option>
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

export default PaymentForm;
