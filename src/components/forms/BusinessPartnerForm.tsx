
import React, { useState, useEffect } from 'react';
import { BusinessPartner, Location, User, MasterDataItem, Address } from '../../types';
import { FormRow, FormLabel, FormInput, FormActions, Button } from '../ui/Form';
import { AIIcon, LoadingSpinner } from '../ui/icons';
import { hasPermission } from '../../lib/permissions';
import Modal from '../ui/Modal';

interface BusinessPartnerFormProps {
  partner: BusinessPartner | null;
  locations: Location[];
  organizations: MasterDataItem[];
  readOnly: boolean;
  onSave: (data: BusinessPartner, reason: string) => void;
  onCancel: () => void;
  currentUser: User;
  onShare: () => void;
  mode: 'add' | 'edit' | 'view' | 'kyc';
  onViewSensitiveData: (fieldName: string) => void;
  onAiAnalyze: () => void;
}

const getInitialState = (): Omit<BusinessPartner, 'id' | 'bp_code' | 'kyc_due_date'> => ({
  legal_name: '',
  organization: 'RNRL Trade Hub Pvt. Ltd.',
  business_type: 'BUYER',
  status: 'DRAFT',
  contact_person: '',
  contact_email: '',
  contact_phone: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
  shipping_addresses: [],
  pan: '',
  gstin: '',
  bank_name: '',
  bank_account_no: '',
  bank_ifsc: '',
  pan_doc_url: '',
  gst_doc_url: '',
  cheque_doc_url: '',
  compliance_notes: '',
});

const FileInput: React.FC<{
  label: string;
  docUrl: string;
  isReadOnly: boolean;
  onFileChange: (file: File | null) => void;
}> = ({ label, docUrl, isReadOnly, onFileChange }) => {
  const [fileName, setFileName] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFileName(docUrl);
  }, [docUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      onFileChange(file);
    }
  };

  return (
    <div className="text-sm flex items-center justify-between py-2 border-b border-slate-200">
      <span className="font-medium text-slate-700">{label}:</span>
      <div className="flex items-center">
        {fileName ? (
          <a href="#" onClick={(e) => e.preventDefault()} className="text-blue-600 hover:underline" title={fileName}>
            {fileName.length > 25 ? `${fileName.substring(0,25)}...` : fileName}
          </a>
        ) : (
          <span className="text-slate-400">Not uploaded</span>
        )}
        {!isReadOnly && (
          <>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="ml-4 text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              {fileName ? 'REPLACE' : 'UPLOAD'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};


const BusinessPartnerForm: React.FC<BusinessPartnerFormProps> = ({
  partner, locations, organizations, readOnly, onSave, onCancel, currentUser, onShare, mode, onViewSensitiveData, onAiAnalyze
}) => {
  const [formData, setFormData] = useState<BusinessPartner>(partner || { ...getInitialState(), id: '', bp_code: '', kyc_due_date: '' });
  const [reason, setReason] = useState('');
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  useEffect(() => {
    setFormData(partner ? JSON.parse(JSON.stringify(partner)) : { ...getInitialState(), id: '', bp_code: '', kyc_due_date: '' });
    setShowSensitive({});
  }, [partner]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = (status: BusinessPartner['status'], saveReason: string) => {
    if (!saveReason && (status === 'ACTIVE' || status === 'DRAFT')) {
        alert('A reason is required for this action.');
        return;
    }
    onSave({ ...formData, status }, saveReason);
  };
  
  const handleViewSensitive = (fieldName: keyof BusinessPartner) => {
      onViewSensitiveData(fieldName);
      setShowSensitive(prev => ({...prev, [fieldName]: true}));
  }

  const handleAiClick = () => {
    setAiAnalyzing(true);
    onAiAnalyze();
    setTimeout(() => setAiAnalyzing(false), 2000); // Simulate AI analysis
  };

  const handleFileChange = (docType: 'pan_doc_url' | 'gst_doc_url' | 'cheque_doc_url', file: File | null) => {
      if(file) {
          setFormData(prev => ({...prev, [docType]: file.name}));
      }
  };

  const handleAddNewAddress = () => {
    setEditingAddress({ id: `new_${Date.now()}`, address_line1: '', address_line2: '', city: '', state: '', pincode: '', country: 'India', is_default: formData.shipping_addresses.length === 0 });
    setIsAddressModalOpen(true);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(JSON.parse(JSON.stringify(address)));
    setIsAddressModalOpen(true);
  };

  const handleDeleteAddress = (addressId: string) => {
    if (readOnly) return;
    setFormData(prev => ({
        ...prev,
        shipping_addresses: prev.shipping_addresses.filter(a => a.id !== addressId)
    }));
  };

  const handleSaveAddress = (address: Address) => {
    if (readOnly) return;
    const exists = formData.shipping_addresses.some(a => a.id === address.id);
    let newAddresses = [];
    if (exists) {
        newAddresses = formData.shipping_addresses.map(a => a.id === address.id ? address : a);
    } else {
        newAddresses = [...formData.shipping_addresses, address];
    }
    
    if (address.is_default) {
        newAddresses = newAddresses.map(a => ({...a, is_default: a.id === address.id}));
    }

    setFormData(prev => ({ ...prev, shipping_addresses: newAddresses }));
    setIsAddressModalOpen(false);
    setEditingAddress(null);
  };

  const isComplianceReview = mode === 'edit' && partner?.status === 'PENDING_COMPLIANCE';
  const isKycUpdate = mode === 'kyc';
  const isAddMode = mode === 'add';
  const canApprove = hasPermission(currentUser.role, 'Business Partner', 'approve');
  const canShare = hasPermission(currentUser.role, 'Business Partner', 'share');

  const renderSensitiveInput = (fieldName: keyof BusinessPartner, label: string) => (
    <FormRow>
      <FormLabel htmlFor={fieldName}>{label}</FormLabel>
      <div className="md:col-span-2 flex items-center space-x-2">
        {showSensitive[fieldName] || !readOnly ? (
          <FormInput id={fieldName} name={fieldName} type="text" value={formData[fieldName] as string} onChange={handleChange} isReadOnly={readOnly} className="!md:col-span-1" />
        ) : (
          <div className="w-full">
            <Button variant="secondary" type="button" onClick={() => handleViewSensitive(fieldName)} className="!w-full !sm:w-auto !mt-0">View {label}</Button>
          </div>
        )}
      </div>
    </FormRow>
  );

  return (
    <>
    <form onSubmit={(e) => e.preventDefault()}>
      <div className="space-y-6">
        {/* General & Contact */}
        <div>
          <h4 className="font-semibold text-slate-700 border-b pb-1 mb-3">General & Contact</h4>
          <div className="space-y-3">
            <FormRow>
              <FormLabel htmlFor="organization">Organization</FormLabel>
              <FormInput component="select" id="organization" name="organization" value={formData.organization} onChange={handleChange} isReadOnly={readOnly}>
                {organizations.map(org => <option key={org.id} value={org.name}>{org.name}</option>)}
              </FormInput>
            </FormRow>
            <FormRow>
              <FormLabel htmlFor="legal_name">Legal Name</FormLabel>
              <FormInput id="legal_name" name="legal_name" type="text" value={formData.legal_name} onChange={handleChange} isReadOnly={readOnly} required />
            </FormRow>
            <FormRow>
              <FormLabel htmlFor="business_type">Business Type</FormLabel>
              <FormInput component="select" id="business_type" name="business_type" value={formData.business_type} onChange={handleChange} isReadOnly={readOnly}>
                <option value="BUYER">Buyer</option>
                <option value="SELLER">Seller</option>
                <option value="BOTH">Both</option>
              </FormInput>
            </FormRow>
            <FormRow>
              <FormLabel htmlFor="contact_person">Contact Person</FormLabel>
              <FormInput id="contact_person" name="contact_person" type="text" value={formData.contact_person} onChange={handleChange} isReadOnly={readOnly} />
            </FormRow>
            <FormRow>
              <FormLabel htmlFor="contact_email">Contact Email</FormLabel>
              <FormInput id="contact_email" name="contact_email" type="email" value={formData.contact_email} onChange={handleChange} isReadOnly={readOnly} />
            </FormRow>
            <FormRow>
              <FormLabel htmlFor="contact_phone">Contact Phone</FormLabel>
              <FormInput id="contact_phone" name="contact_phone" type="tel" value={formData.contact_phone} onChange={handleChange} isReadOnly={readOnly} />
            </FormRow>
          </div>
        </div>

        {/* Registered Address */}
        <div>
          <h4 className="font-semibold text-slate-700 border-b pb-1 mb-3">Registered Address</h4>
          <div className="space-y-3">
            <FormRow><FormLabel htmlFor="address_line1">Address Line 1</FormLabel><FormInput id="address_line1" name="address_line1" type="text" value={formData.address_line1} onChange={handleChange} isReadOnly={readOnly} /></FormRow>
            <FormRow><FormLabel htmlFor="city">City</FormLabel><FormInput id="city" name="city" type="text" value={formData.city} onChange={handleChange} isReadOnly={readOnly} /></FormRow>
            <FormRow><FormLabel htmlFor="state">State</FormLabel><FormInput id="state" name="state" type="text" value={formData.state} onChange={handleChange} isReadOnly={readOnly} /></FormRow>
            <FormRow><FormLabel htmlFor="pincode">Pincode</FormLabel><FormInput id="pincode" name="pincode" type="text" value={formData.pincode} onChange={handleChange} isReadOnly={readOnly} /></FormRow>
          </div>
        </div>

        {/* Shipping Addresses */}
        <div>
            <div className="flex justify-between items-center border-b pb-1 mb-3">
                <h4 className="font-semibold text-slate-700">Ship-To Addresses</h4>
                {!readOnly && <Button type="button" variant="secondary" className="!text-xs !py-1 !px-2 !m-0" onClick={handleAddNewAddress}>Add Address</Button>}
            </div>
            <div className="space-y-2">
                {formData.shipping_addresses.length > 0 ? formData.shipping_addresses.map(addr => (
                    <div key={addr.id} className="p-2 border border-dashed rounded-none flex justify-between items-center">
                        <div>
                            <p className="text-sm font-medium">{addr.address_line1}, {addr.city}, {addr.state} - {addr.pincode} {addr.is_default && <span className="text-xs font-bold text-green-700">(DEFAULT)</span>}</p>
                        </div>
                        {!readOnly && (
                            <div className="space-x-2">
                                <button type="button" className="text-xs text-blue-600 hover:underline" onClick={() => handleEditAddress(addr)}>Edit</button>
                                <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => handleDeleteAddress(addr.id)}>Delete</button>
                            </div>
                        )}
                    </div>
                )) : <p className="text-sm text-slate-500 text-center py-2">No shipping addresses defined.</p>}
            </div>
        </div>

        {/* Compliance */}
        <div>
          <h4 className="font-semibold text-slate-700 border-b pb-1 mb-3">Compliance & Bank Details</h4>
          <div className="space-y-3">
            {renderSensitiveInput('pan', 'PAN')}
            {renderSensitiveInput('gstin', 'GSTIN')}
            {renderSensitiveInput('bank_name', 'Bank Name')}
            {renderSensitiveInput('bank_account_no', 'Account No.')}
            {renderSensitiveInput('bank_ifsc', 'IFSC Code')}
          </div>
        </div>
        
        {/* Documents */}
        <div>
            <h4 className="font-semibold text-slate-700 border-b pb-1 mb-3">Documents</h4>
            <div className="bg-slate-50 p-3 border rounded-none">
                <FileInput label="PAN Card" docUrl={formData.pan_doc_url} isReadOnly={readOnly} onFileChange={(file) => handleFileChange('pan_doc_url', file)} />
                <FileInput label="GST Certificate" docUrl={formData.gst_doc_url} isReadOnly={readOnly} onFileChange={(file) => handleFileChange('gst_doc_url', file)} />
                <FileInput label="Cancelled Cheque" docUrl={formData.cheque_doc_url} isReadOnly={readOnly} onFileChange={(file) => handleFileChange('cheque_doc_url', file)} />
            </div>
        </div>

        {/* Notes */}
        <div>
            <h4 className="font-semibold text-slate-700 border-b pb-1 mb-3">Internal Notes</h4>
            <FormRow>
                <FormLabel htmlFor="compliance_notes">Compliance Notes</FormLabel>
                <FormInput component="textarea" id="compliance_notes" name="compliance_notes" value={formData.compliance_notes} onChange={handleChange} isReadOnly={readOnly || !canApprove} />
            </FormRow>
        </div>

        {(isComplianceReview || isKycUpdate || isAddMode) && !readOnly && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-none">
                <h4 className="font-semibold text-blue-800">Action Required</h4>
                <p className="text-sm text-blue-700 mt-1">
                    {isComplianceReview && "Please review the partner's details and documents, then approve or reject."}
                    {isKycUpdate && "Please update the KYC documents and details, then save."}
                    {isAddMode && "Fill in all details and submit for compliance review."}
                </p>
                <FormRow className="!items-start mt-3">
                    <FormLabel htmlFor="reason" className="!pt-2">Reason for Action</FormLabel>
                    <FormInput component="textarea" id="reason" name="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g., 'All documents verified' or 'PAN mismatch'" required />
                </FormRow>
            </div>
        )}
      </div>

      <FormActions>
        {mode === 'view' && canShare && <Button type="button" onClick={onShare}>Share Package</Button>}
        <Button type="button" variant="secondary" onClick={onCancel}>{readOnly ? 'Close' : 'Cancel'}</Button>
        
        {isAddMode && !readOnly && (
            <>
                <Button type="button" onClick={() => handleSave('PENDING_COMPLIANCE', reason || 'Submitted for review')}>Submit for Review</Button>
                <Button type="button" variant="secondary" onClick={() => handleSave('DRAFT', 'Saved as draft')}>Save as Draft</Button>
                <Button type="button" variant="secondary" onClick={handleAiClick} className="!sm:ml-auto !mr-auto" disabled={aiAnalyzing}>
                    {aiAnalyzing ? <LoadingSpinner className="w-5 h-5" /> : <AIIcon className="w-5 h-5 mr-2" />}
                    {aiAnalyzing ? 'Analyzing...' : 'AI Pre-Check'}
                </Button>
            </>
        )}
        {mode === 'edit' && !readOnly && !isComplianceReview && (
            <Button type="button" onClick={() => handleSave(formData.status, reason || 'Updated partner details')}>Save Changes</Button>
        )}
        {isComplianceReview && canApprove && (
            <>
                <Button type="button" onClick={() => handleSave('ACTIVE', reason)}>Approve Partner</Button>
                <Button type="button" variant="secondary" onClick={() => handleSave('DRAFT', reason)}>Reject (Back to Draft)</Button>
            </>
        )}
        {isKycUpdate && canApprove && (
            <Button type="button" onClick={() => handleSave('ACTIVE', reason || 'KYC documents updated')}>Save KYC Update</Button>
        )}
      </FormActions>
    </form>

    {isAddressModalOpen && editingAddress && (
        <AddressModal 
            address={editingAddress}
            onClose={() => setIsAddressModalOpen(false)}
            onSave={handleSaveAddress}
        />
    )}
    </>
  );
};

const AddressModal: React.FC<{
    address: Address;
    onClose: () => void;
    onSave: (address: Address) => void;
}> = ({ address, onClose, onSave }) => {
    const [formData, setFormData] = useState<Address>(address);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={address.id.startsWith('new_') ? 'Add Shipping Address' : 'Edit Shipping Address'}>
            <form onSubmit={handleSubmit}>
                <div className="space-y-3">
                    <FormRow><FormLabel htmlFor="address_line1">Address Line 1</FormLabel><FormInput id="address_line1" name="address_line1" value={formData.address_line1} onChange={handleChange} required /></FormRow>
                    <FormRow><FormLabel htmlFor="city">City</FormLabel><FormInput id="city" name="city" value={formData.city} onChange={handleChange} required /></FormRow>
                    <FormRow><FormLabel htmlFor="state">State</FormLabel><FormInput id="state" name="state" value={formData.state} onChange={handleChange} required /></FormRow>
                    <FormRow><FormLabel htmlFor="pincode">Pincode</FormLabel><FormInput id="pincode" name="pincode" value={formData.pincode} onChange={handleChange} required /></FormRow>
                    <FormRow>
                        <FormLabel htmlFor="is_default">Default Address</FormLabel>
                        <div className="md:col-span-2 flex items-center">
                            <input id="is_default" name="is_default" type="checkbox" checked={formData.is_default} onChange={handleChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                        </div>
                    </FormRow>
                </div>
                <FormActions>
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Save Address</Button>
                </FormActions>
            </form>
        </Modal>
    );
}

export default BusinessPartnerForm;
