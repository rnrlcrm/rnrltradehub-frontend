
import React, { useState } from 'react';
import { Location } from '../../types';
import { FormRow, FormLabel, FormInput, FormActions, Button } from '../ui/Form';

interface LocationFormProps {
  onSave: (data: Omit<Location, 'id'>) => void;
  onCancel: () => void;
}

const LocationForm: React.FC<LocationFormProps> = ({ onSave, onCancel }) => {
  const [country, setCountry] = useState('India');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (country && state && city) {
      onSave({ country, state, city });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-3">
        <FormRow>
          <FormLabel htmlFor="country">Country</FormLabel>
          <FormInput id="country" type="text" value={country} onChange={e => setCountry(e.target.value)} required />
        </FormRow>
        <FormRow>
          <FormLabel htmlFor="state">State</FormLabel>
          <FormInput id="state" type="text" value={state} onChange={e => setState(e.target.value)} required />
        </FormRow>
        <FormRow>
          <FormLabel htmlFor="city">City</FormLabel>
          <FormInput id="city" type="text" value={city} onChange={e => setCity(e.target.value)} required />
        </FormRow>
      </div>
      <FormActions>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save Location</Button>
      </FormActions>
    </form>
  );
};

export default LocationForm;
