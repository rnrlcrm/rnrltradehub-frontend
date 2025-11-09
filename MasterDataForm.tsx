
import React, { useState, useEffect } from 'react';
import { MasterDataItem } from '../../types';
import { FormActions, Button } from '../ui/Form';

interface MasterDataFormProps {
  item: MasterDataItem | null;
  onSave: (name: string) => void;
  onCancel: () => void;
}

const MasterDataForm: React.FC<MasterDataFormProps> = ({ item, onSave, onCancel }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    setName(item ? item.name : '');
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="p-2">
        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Name</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="block w-full border border-slate-300 rounded-none shadow-sm py-2 px-3 focus:outline-none focus:border-blue-500 focus:ring-0 sm:text-sm"
          required
          autoFocus
        />
      </div>
      <FormActions>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </FormActions>
    </form>
  );
};

export default MasterDataForm;
