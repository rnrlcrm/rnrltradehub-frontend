
import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { FormRow, FormLabel, FormInput, FormActions, Button } from '../ui/Form';

interface UserFormProps {
  user?: User | null;
  readOnly: boolean;
  onSave: (data: User) => void;
  onCancel: () => void;
}

const getInitialState = (): Omit<User, 'id'> => ({
  name: '',
  email: '',
  role: 'Sales',
});

const UserForm: React.FC<UserFormProps> = ({ user, readOnly, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Omit<User, 'id'>>(getInitialState());

  useEffect(() => {
    if (user) {
      setFormData({ ...user });
    } else {
      setFormData(getInitialState());
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData as User);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-3">
        <FormRow>
          <FormLabel htmlFor="name">Full Name</FormLabel>
          <FormInput id="name" name="name" type="text" value={formData.name} onChange={handleChange} isReadOnly={readOnly} />
        </FormRow>
        <FormRow>
          <FormLabel htmlFor="email">Email Address</FormLabel>
          <FormInput id="email" name="email" type="email" value={formData.email} onChange={handleChange} isReadOnly={readOnly} />
        </FormRow>
        <FormRow>
          <FormLabel htmlFor="role">Role</FormLabel>
          <FormInput component="select" id="role" name="role" value={formData.role} onChange={handleChange} isReadOnly={readOnly}>
            <option>Admin</option>
            <option>Sales</option>
            <option>Accounts</option>
            <option>Dispute Manager</option>
            <option>Vendor/Client</option>
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

export default UserForm;
