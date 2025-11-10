
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
  const [formData, setFormData] = useState<Invoice>(invoice || { 
    id: '', 
    invoiceNo: '', 
    salesContractId: '', 
    date: new Date().toISOString().split('T')[0], 
    amount: 0, 
    status: 'Unpaid',
    averageMoisturePercent: undefined,
    moistureAdjustmentAmount: undefined,
    moistureAdjustmentType: undefined,
    netInvoiceExclGst: undefined,
    cciIndentNo: undefined,
    deliveryLotId: undefined,
  });

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

        {formData.cciIndentNo && (
          <FormRow>
            <FormLabel htmlFor="cciIndentNo">CCI Indent No.</FormLabel>
            <FormInput name="cciIndentNo" id="cciIndentNo" type="text" value={formData.cciIndentNo || ''} onChange={handleChange} isReadOnly={readOnly} />
          </FormRow>
        )}

        {formData.averageMoisturePercent !== undefined && (
          <>
            <div className="border-t pt-3 mt-3">
              <h4 className="font-semibold text-slate-700 mb-2">Moisture Adjustment Details</h4>
            </div>
            <FormRow>
              <FormLabel htmlFor="averageMoisturePercent">Average Moisture %</FormLabel>
              <FormInput name="averageMoisturePercent" id="averageMoisturePercent" type="number" step="0.01" value={formData.averageMoisturePercent} onChange={handleChange} isReadOnly={readOnly} />
            </FormRow>
            {formData.moistureAdjustmentType && formData.moistureAdjustmentType !== 'none' && (
              <>
                <FormRow>
                  <FormLabel htmlFor="moistureAdjustmentType">Adjustment Type</FormLabel>
                  <FormInput name="moistureAdjustmentType" id="moistureAdjustmentType" type="text" value={formData.moistureAdjustmentType.charAt(0).toUpperCase() + formData.moistureAdjustmentType.slice(1)} onChange={handleChange} isReadOnly={true} />
                </FormRow>
                <FormRow>
                  <FormLabel htmlFor="moistureAdjustmentAmount">Adjustment Amount</FormLabel>
                  <FormInput name="moistureAdjustmentAmount" id="moistureAdjustmentAmount" type="number" value={formData.moistureAdjustmentAmount || 0} onChange={handleChange} isReadOnly={readOnly} />
                </FormRow>
              </>
            )}
            {formData.netInvoiceExclGst !== undefined && (
              <FormRow>
                <FormLabel htmlFor="netInvoiceExclGst">Net Invoice (Excl. GST)</FormLabel>
                <FormInput name="netInvoiceExclGst" id="netInvoiceExclGst" type="number" value={formData.netInvoiceExclGst} onChange={handleChange} isReadOnly={readOnly} />
              </FormRow>
            )}
          </>
        )}
      </div>
      <FormActions>
        <Button type="button" variant="secondary" onClick={onCancel}>{readOnly ? 'Close' : 'Cancel'}</Button>
        {!readOnly && <Button type="submit">Save</Button>}
      </FormActions>
    </form>
  );
};

export default InvoiceForm;
