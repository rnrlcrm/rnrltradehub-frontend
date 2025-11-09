
import React, { useState, useEffect } from 'react';
import { Dispute } from '../../types';
import { FormRow, FormLabel, FormInput, FormActions, Button } from '../ui/Form';

interface DisputeFormProps {
  dispute?: Dispute | null;
  readOnly: boolean;
  onSave: (data: Dispute) => void;
  onCancel: () => void;
}

const DisputeForm: React.FC<DisputeFormProps> = ({ dispute, readOnly, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Dispute>(dispute || { id: '', disputeId: '', salesContractId: '', reason: '', status: 'Open', resolution: '', dateRaised: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    if (dispute) {
      setFormData(dispute);
    }
  }, [dispute]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-3">
        <FormRow>
          <FormLabel htmlFor="disputeId">Dispute ID</FormLabel>
          <FormInput name="disputeId" id="disputeId" type="text" value={formData.disputeId} onChange={handleChange} isReadOnly={readOnly || !!dispute} />
        </FormRow>
        <FormRow>
          <FormLabel htmlFor="salesContractId">Sales Contract No.</FormLabel>
          <FormInput name="salesContractId" id="salesContractId" type="text" value={formData.salesContractId} onChange={handleChange} isReadOnly={readOnly} />
        </FormRow>
        <FormRow>
          <FormLabel htmlFor="dateRaised">Date Raised</FormLabel>
          <FormInput name="dateRaised" id="dateRaised" type="date" value={formData.dateRaised} onChange={handleChange} isReadOnly={readOnly} />
        </FormRow>
        <FormRow>
          <FormLabel htmlFor="reason">Reason</FormLabel>
          <FormInput name="reason" id="reason" type="text" value={formData.reason} onChange={handleChange} isReadOnly={readOnly} />
        </FormRow>
        <FormRow>
          <FormLabel htmlFor="status">Status</FormLabel>
          <FormInput component="select" name="status" id="status" value={formData.status} onChange={handleChange} isReadOnly={readOnly}>
            <option>Open</option>
            <option>Resolved</option>
            <option>Closed</option>
          </FormInput>
        </FormRow>
        <FormRow>
          <FormLabel htmlFor="resolution">Resolution</FormLabel>
          <FormInput component="textarea" name="resolution" id="resolution" value={formData.resolution} onChange={handleChange} isReadOnly={readOnly} />
        </FormRow>
      </div>
      <FormActions>
        <Button type="button" variant="secondary" onClick={onCancel}>{readOnly ? 'Close' : 'Cancel'}</Button>
        {!readOnly && <Button type="submit">Save</Button>}
      </FormActions>
    </form>
  );
};

export default DisputeForm;
