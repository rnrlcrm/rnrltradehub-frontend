
import React, { useState, useEffect } from 'react';
import { GstRate } from '../../types';
import { FormRow, FormLabel, FormInput, FormActions, Button } from '../ui/Form';

interface GstRateFormProps {
  item: GstRate | null;
  onSave: (data: Omit<GstRate, 'id'>) => void;
  onCancel: () => void;
}

const GstRateForm: React.FC<GstRateFormProps> = ({ item, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Omit<GstRate, 'id'>>({
    description: '',
    hsnCode: '',
    rate: 0,
  });

  useEffect(() => {
    if (item) {
      setFormData(item);
    }
  }, [item]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          <FormLabel htmlFor="description">Description</FormLabel>
          <FormInput id="description" name="description" type="text" value={formData.description} onChange={handleChange} required />
        </FormRow>
        <FormRow>
          <FormLabel htmlFor="hsnCode">HSN Code</FormLabel>
          <FormInput id="hsnCode" name="hsnCode" type="text" value={formData.hsnCode} onChange={handleChange} required />
        </FormRow>
        <FormRow>
          <FormLabel htmlFor="rate">Rate (%)</FormLabel>
          <FormInput id="rate" name="rate" type="number" step="0.01" value={formData.rate} onChange={handleChange} required />
        </FormRow>
      </div>
      <FormActions>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </FormActions>
    </form>
  );
};

export default GstRateForm;
