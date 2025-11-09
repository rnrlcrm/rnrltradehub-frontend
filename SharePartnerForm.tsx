
import React, { useState } from 'react';
import { FormRow, FormLabel, FormInput, FormActions, Button } from '../ui/Form';

interface SharePartnerFormProps {
  onSend: (details: { email: string; expiry: number }) => void;
  onCancel: () => void;
}

const SharePartnerForm: React.FC<SharePartnerFormProps> = ({ onSend, onCancel }) => {
  const [email, setEmail] = useState('');
  const [expiry, setExpiry] = useState(48);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      onSend({ email, expiry });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600">Share a secure PDF package of this partner's KYC documents and details with an external party.</p>
        <FormRow>
          <FormLabel htmlFor="email">Recipient Email</FormLabel>
          <FormInput id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </FormRow>
        <FormRow>
          <FormLabel htmlFor="expiry">Expiry (hours)</FormLabel>
          <FormInput id="expiry" type="number" value={expiry} onChange={e => setExpiry(Number(e.target.value))} required />
        </FormRow>
      </div>
      <FormActions>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Send</Button>
      </FormActions>
    </form>
  );
};

export default SharePartnerForm;
