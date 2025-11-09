
import React, { useState, useEffect } from 'react';
import { CommissionStructure } from '../../types';
import { FormRow, FormLabel, FormInput, FormActions, Button } from '../ui/Form';

interface CommissionMasterFormProps {
  item: CommissionStructure | null;
  onSave: (data: Omit<CommissionStructure, 'id'>) => void;
  onCancel: () => void;
}

const CommissionMasterForm: React.FC<CommissionMasterFormProps> = ({ item, onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'PERCENTAGE' | 'PER_BALE'>('PERCENTAGE');
  const [value, setValue] = useState<number>(0);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setType(item.type);
      setValue(item.value);
    } else {
      setName('');
      setType('PERCENTAGE');
      setValue(0);
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && value > 0) {
      onSave({ name: name.trim(), type, value });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-3">
        <FormRow>
          <FormLabel htmlFor="name">Commission Name</FormLabel>
          <FormInput id="name" type="text" value={name} onChange={e => setName(e.target.value)} required />
        </FormRow>
        <FormRow>
          <FormLabel htmlFor="type">Type</FormLabel>
          <FormInput component="select" id="type" value={type} onChange={e => setType(e.target.value as typeof type)}>
            <option value="PERCENTAGE">Percentage (%)</option>
            <option value="PER_BALE">Per Bale (₹)</option>
          </FormInput>
        </FormRow>
        <FormRow>
          <FormLabel htmlFor="value">Value</FormLabel>
          <FormInput id="value" type="number" step="0.01" value={value} onChange={e => setValue(parseFloat(e.target.value))} required />
        </FormRow>
      </div>
      <FormActions>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </FormActions>
    </form>
  );
};

export default CommissionMasterForm;
