import React, { useState, useEffect } from 'react';
import { Organization } from '../../types';
import { FormActions, Button, Input } from '../ui/Form';

interface OrganizationFormProps {
  organization: Organization | null;
  onSave: (org: Omit<Organization, 'id'>) => void;
  onCancel: () => void;
}

const OrganizationForm: React.FC<OrganizationFormProps> = ({ organization, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Omit<Organization, 'id'>>({
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    phone: '',
    email: '',
    gstin: '',
    pan: '',
    tan: '',
    cin: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: '',
    isActive: true,
  });

  useEffect(() => {
    if (organization) {
      const { id, ...rest } = organization;
      setFormData(rest);
    }
  }, [organization]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Basic Information */}
        <div className="md:col-span-2">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 border-b pb-2">Basic Information</h3>
        </div>

        <Input
          label="Organization Name *"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <Input
          label="Organization Code *"
          type="text"
          name="code"
          value={formData.code}
          onChange={handleChange}
          required
          placeholder="e.g., RNRL, HO, BR01"
        />

        {/* Address Information */}
        <div className="md:col-span-2 mt-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 border-b pb-2">Address Information</h3>
        </div>

        <div className="md:col-span-2">
          <Input
            label="Address *"
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            placeholder="Street address, Building name, etc."
          />
        </div>

        <Input
          label="City *"
          type="text"
          name="city"
          value={formData.city}
          onChange={handleChange}
          required
        />

        <Input
          label="State *"
          type="text"
          name="state"
          value={formData.state}
          onChange={handleChange}
          required
        />

        <Input
          label="Pincode *"
          type="text"
          name="pincode"
          value={formData.pincode}
          onChange={handleChange}
          required
          placeholder="6-digit pincode"
        />

        <Input
          label="Country"
          type="text"
          name="country"
          value={formData.country}
          onChange={handleChange}
          required
        />

        {/* Contact Information */}
        <div className="md:col-span-2 mt-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 border-b pb-2">Contact Information</h3>
        </div>

        <Input
          label="Phone *"
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
          placeholder="10-digit mobile number"
        />

        <Input
          label="Email *"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder="organization@example.com"
        />

        {/* Tax Information */}
        <div className="md:col-span-2 mt-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 border-b pb-2">Tax Information</h3>
        </div>

        <Input
          label="GSTIN *"
          type="text"
          name="gstin"
          value={formData.gstin}
          onChange={handleChange}
          required
          placeholder="15-character GSTIN"
        />

        <Input
          label="PAN *"
          type="text"
          name="pan"
          value={formData.pan}
          onChange={handleChange}
          required
          placeholder="10-character PAN"
        />

        <Input
          label="TAN"
          type="text"
          name="tan"
          value={formData.tan}
          onChange={handleChange}
          placeholder="10-character TAN"
        />

        <Input
          label="CIN"
          type="text"
          name="cin"
          value={formData.cin}
          onChange={handleChange}
          placeholder="21-character CIN"
        />

        {/* Bank Information */}
        <div className="md:col-span-2 mt-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 border-b pb-2">Bank Information</h3>
        </div>

        <Input
          label="Bank Name *"
          type="text"
          name="bankName"
          value={formData.bankName}
          onChange={handleChange}
          required
        />

        <Input
          label="Account Number *"
          type="text"
          name="accountNumber"
          value={formData.accountNumber}
          onChange={handleChange}
          required
        />

        <Input
          label="IFSC Code *"
          type="text"
          name="ifscCode"
          value={formData.ifscCode}
          onChange={handleChange}
          required
          placeholder="11-character IFSC"
        />

        <Input
          label="Branch Name *"
          type="text"
          name="branchName"
          value={formData.branchName}
          onChange={handleChange}
          required
        />

        {/* Status */}
        <div className="md:col-span-2 mt-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700">Active Organization</span>
          </label>
        </div>
      </div>

      <FormActions>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{organization ? 'Update' : 'Create'} Organization</Button>
      </FormActions>
    </form>
  );
};

export default OrganizationForm;
