
import React, { useState, useEffect } from 'react';
import { StructuredTerm } from '../../types';
import { FormRow, FormLabel, FormInput, FormActions, Button } from '../ui/Form';

interface StructuredTermFormProps {
  item: StructuredTerm | null;
  onSave: (data: Omit<StructuredTerm, 'id'>) => void;
  onCancel: () => void;
}

const StructuredTermForm: React.FC<StructuredTermFormProps> = ({ item, onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [days, setDays] = useState<number>(0);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setDays(item.days);
    } else {
      setName('');
      setDays(0);
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave({ name: name.trim(), days });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-3">
        <FormRow>
          <FormLabel htmlFor="name">Term Name</FormLabel>
          <FormInput id="name" type="text" value={name} onChange={e => setName(e.target.value)} required />
        </FormRow>
        <FormRow>
          <FormLabel htmlFor="days">Days</FormLabel>
          <FormInput id="days" type="number" value={days} onChange={e => setDays(parseInt(e.target.value, 10))} required />
        </FormRow>
      </div>
      <FormActions>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </FormActions>
    </form>
  );
};

export default StructuredTermForm;
