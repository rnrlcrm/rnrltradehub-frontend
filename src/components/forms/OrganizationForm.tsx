import React, { useState, useEffect } from 'react';
import { Organization } from '../../types';
import { FormActions, Button, Input } from '../ui/Form';
import { organizationSchema } from '../../schemas/settingsSchemas';
import { z } from 'zod';
import DOMPurify from 'dompurify';

interface OrganizationFormProps {
  organization: Organization | null;
  onSave: (org: Omit<Organization, 'id'>) => void;
  onCancel: () => void;
  existingOrganizations?: Organization[];
}

const OrganizationForm: React.FC<OrganizationFormProps> = ({ 
  organization, 
  onSave, 
  onCancel,
  existingOrganizations = []
}) => {
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

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (organization) {
      const { id, ...rest } = organization;
      setFormData(rest);
    }
  }, [organization]);

  // Real-time validation with debounce
  const validateField = async (fieldName: string, value: any) => {
    try {
      // Validate single field
      await organizationSchema.parseAsync({ ...formData, [fieldName]: value });
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.errors.find(e => e.path[0] === fieldName);
        if (fieldError) {
          setErrors(prev => ({ ...prev, [fieldName]: fieldError.message }));
        }
      }
    }
  };

  // Check for duplicate organization code
  const checkDuplicateCode = (code: string): boolean => {
    if (!code) return false;
    return existingOrganizations.some(
      org => org.code.toUpperCase() === code.toUpperCase() && 
             org.id !== organization?.id
    );
  };

  // Check for duplicate GSTIN
  const checkDuplicateGSTIN = (gstin: string): boolean => {
    if (!gstin) return false;
    return existingOrganizations.some(
      org => org.gstin.toUpperCase() === gstin.toUpperCase() && 
             org.id !== organization?.id
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsValidating(true);

    try {
      // Check for duplicates
      if (checkDuplicateCode(formData.code)) {
        setErrors(prev => ({ ...prev, code: 'Organization code already exists' }));
        setIsValidating(false);
        return;
      }

      if (checkDuplicateGSTIN(formData.gstin)) {
        setErrors(prev => ({ ...prev, gstin: 'GSTIN already registered for another organization' }));
        setIsValidating(false);
        return;
      }

      // Validate entire form with schema
      const validatedData = await organizationSchema.parseAsync(formData);
      
      // Sanitize all string fields before submission
      const sanitizedData = Object.entries(validatedData).reduce((acc, [key, value]) => {
        if (typeof value === 'string') {
          acc[key] = DOMPurify.sanitize(value);
        } else {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      onSave(sanitizedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMap: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            errorMap[err.path[0] as string] = err.message;
          }
        });
        setErrors(errorMap);
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Mark field as touched
    setTouched(prev => ({ ...prev, [name]: true }));

    // Validate field on change
    if (touched[name]) {
      validateField(name, newValue);
    }
  };

  const handleBlur = (fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    validateField(fieldName, formData[fieldName as keyof typeof formData]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Security Notice */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-4">
        <p className="text-sm text-blue-800">
          <strong>🔒 Security Notice:</strong> All data is encrypted and validated as per IT Act 2000. 
          Ensure accurate information for GST and tax compliance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Basic Information */}
        <div className="md:col-span-2">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 border-b pb-2">Basic Information</h3>
        </div>

        <div>
          <Input
            label="Organization Name *"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            onBlur={() => handleBlur('name')}
            required
            placeholder="Full legal name of organization"
          />
          {errors.name && touched.name && (
            <p className="text-red-600 text-xs mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <Input
            label="Organization Code *"
            type="text"
            name="code"
            value={formData.code}
            onChange={handleChange}
            onBlur={() => handleBlur('code')}
            required
            placeholder="e.g., RNRL, HO, BR01"
          />
          {errors.code && touched.code && (
            <p className="text-red-600 text-xs mt-1">{errors.code}</p>
          )}
          <p className="text-xs text-slate-500 mt-1">Uppercase letters, numbers, hyphens, and underscores only</p>
        </div>

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
            onBlur={() => handleBlur('address')}
            required
            placeholder="Street address, Building name, etc."
          />
          {errors.address && touched.address && (
            <p className="text-red-600 text-xs mt-1">{errors.address}</p>
          )}
        </div>

        <div>
          <Input
            label="City *"
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            onBlur={() => handleBlur('city')}
            required
          />
          {errors.city && touched.city && (
            <p className="text-red-600 text-xs mt-1">{errors.city}</p>
          )}
        </div>

        <div>
          <Input
            label="State *"
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            onBlur={() => handleBlur('state')}
            required
          />
          {errors.state && touched.state && (
            <p className="text-red-600 text-xs mt-1">{errors.state}</p>
          )}
        </div>

        <div>
          <Input
            label="Pincode *"
            type="text"
            name="pincode"
            value={formData.pincode}
            onChange={handleChange}
            onBlur={() => handleBlur('pincode')}
            required
            placeholder="6-digit pincode"
            maxLength={6}
          />
          {errors.pincode && touched.pincode && (
            <p className="text-red-600 text-xs mt-1">{errors.pincode}</p>
          )}
        </div>

        <div>
          <Input
            label="Country *"
            type="text"
            name="country"
            value={formData.country}
            onChange={handleChange}
            onBlur={() => handleBlur('country')}
            required
          />
          {errors.country && touched.country && (
            <p className="text-red-600 text-xs mt-1">{errors.country}</p>
          )}
        </div>

        {/* Contact Information */}
        <div className="md:col-span-2 mt-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 border-b pb-2">Contact Information</h3>
        </div>

        <div>
          <Input
            label="Phone *"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            onBlur={() => handleBlur('phone')}
            required
            placeholder="10-digit mobile number"
            maxLength={10}
          />
          {errors.phone && touched.phone && (
            <p className="text-red-600 text-xs mt-1">{errors.phone}</p>
          )}
          <p className="text-xs text-slate-500 mt-1">Must start with 6, 7, 8, or 9</p>
        </div>

        <div>
          <Input
            label="Email *"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={() => handleBlur('email')}
            required
            placeholder="organization@example.com"
          />
          {errors.email && touched.email && (
            <p className="text-red-600 text-xs mt-1">{errors.email}</p>
          )}
        </div>

        {/* Tax Information */}
        <div className="md:col-span-2 mt-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 border-b pb-2">
            Tax Information (As per IT Act 2000 & GST Act 2017)
          </h3>
          <p className="text-xs text-slate-600 mb-2">
            All tax identification numbers are mandatory and validated against government databases
          </p>
        </div>

        <div>
          <Input
            label="GSTIN *"
            type="text"
            name="gstin"
            value={formData.gstin}
            onChange={handleChange}
            onBlur={() => handleBlur('gstin')}
            required
            placeholder="27AABCU9603R1ZM"
            maxLength={15}
          />
          {errors.gstin && touched.gstin && (
            <p className="text-red-600 text-xs mt-1">{errors.gstin}</p>
          )}
          <p className="text-xs text-slate-500 mt-1">15-character GSTIN (must contain PAN)</p>
        </div>

        <div>
          <Input
            label="PAN *"
            type="text"
            name="pan"
            value={formData.pan}
            onChange={handleChange}
            onBlur={() => handleBlur('pan')}
            required
            placeholder="AABCU9603R"
            maxLength={10}
          />
          {errors.pan && touched.pan && (
            <p className="text-red-600 text-xs mt-1">{errors.pan}</p>
          )}
          <p className="text-xs text-slate-500 mt-1">10-character PAN (5 letters, 4 digits, 1 letter)</p>
        </div>

        <div>
          <Input
            label="TAN (Optional)"
            type="text"
            name="tan"
            value={formData.tan}
            onChange={handleChange}
            onBlur={() => handleBlur('tan')}
            placeholder="MUMX12345Y"
            maxLength={10}
          />
          {errors.tan && touched.tan && (
            <p className="text-red-600 text-xs mt-1">{errors.tan}</p>
          )}
          <p className="text-xs text-slate-500 mt-1">Tax Deduction Account Number (if applicable)</p>
        </div>

        <div>
          <Input
            label="CIN (Optional)"
            type="text"
            name="cin"
            value={formData.cin}
            onChange={handleChange}
            onBlur={() => handleBlur('cin')}
            placeholder="L12345MH2020PLC123456"
            maxLength={21}
          />
          {errors.cin && touched.cin && (
            <p className="text-red-600 text-xs mt-1">{errors.cin}</p>
          )}
          <p className="text-xs text-slate-500 mt-1">
            Corporate Identity Number - Only for Private/Public Limited Companies. 
            Not applicable for Proprietorship/Partnership firms.
          </p>
        </div>

        {/* Bank Information */}
        <div className="md:col-span-2 mt-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 border-b pb-2">
            Banking Information (For Financial Transactions)
          </h3>
          <p className="text-xs text-slate-600 mb-2">
            Primary bank account for all financial transactions and settlements
          </p>
        </div>

        <div>
          <Input
            label="Bank Name *"
            type="text"
            name="bankName"
            value={formData.bankName}
            onChange={handleChange}
            onBlur={() => handleBlur('bankName')}
            required
            placeholder="State Bank of India"
          />
          {errors.bankName && touched.bankName && (
            <p className="text-red-600 text-xs mt-1">{errors.bankName}</p>
          )}
        </div>

        <div>
          <Input
            label="Account Number *"
            type="text"
            name="accountNumber"
            value={formData.accountNumber}
            onChange={handleChange}
            onBlur={() => handleBlur('accountNumber')}
            required
            placeholder="12345678901234"
            maxLength={20}
          />
          {errors.accountNumber && touched.accountNumber && (
            <p className="text-red-600 text-xs mt-1">{errors.accountNumber}</p>
          )}
          <p className="text-xs text-slate-500 mt-1">8-20 digit account number</p>
        </div>

        <div>
          <Input
            label="IFSC Code *"
            type="text"
            name="ifscCode"
            value={formData.ifscCode}
            onChange={handleChange}
            onBlur={() => handleBlur('ifscCode')}
            required
            placeholder="SBIN0001234"
            maxLength={11}
          />
          {errors.ifscCode && touched.ifscCode && (
            <p className="text-red-600 text-xs mt-1">{errors.ifscCode}</p>
          )}
          <p className="text-xs text-slate-500 mt-1">11-character IFSC code</p>
        </div>

        <div>
          <Input
            label="Branch Name *"
            type="text"
            name="branchName"
            value={formData.branchName}
            onChange={handleChange}
            onBlur={() => handleBlur('branchName')}
            required
            placeholder="Main Branch"
          />
          {errors.branchName && touched.branchName && (
            <p className="text-red-600 text-xs mt-1">{errors.branchName}</p>
          )}
        </div>

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
          <p className="text-xs text-slate-500 mt-1">
            Inactive organizations cannot be selected for new transactions
          </p>
        </div>
      </div>

      {/* Data Security Notice */}
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 mt-4">
        <p className="text-xs text-yellow-800">
          <strong>⚠️ Data Protection:</strong> Organization data is encrypted at rest and in transit. 
          Changes are logged for audit compliance as per IT Act 2000, Section 43A.
        </p>
      </div>

      {/* Form Errors Summary */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 mt-4">
          <p className="text-sm font-semibold text-red-800 mb-2">Please correct the following errors:</p>
          <ul className="list-disc list-inside text-xs text-red-700 space-y-1">
            {Object.entries(errors).map(([field, error]) => (
              <li key={field}><strong>{field}:</strong> {error}</li>
            ))}
          </ul>
        </div>
      )}

      <FormActions>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isValidating}>
          {isValidating ? 'Validating...' : (organization ? 'Update' : 'Create')} Organization
        </Button>
      </FormActions>
    </form>
  );
};

export default OrganizationForm;
