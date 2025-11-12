/**
 * Enhanced Business Partner Form with Multi-Branch Support
 * Features:
 * - Extended business types (Buyer, Seller, Trader, Sub Broker, Transporter, Controller)
 * - Multi-branch management with GST, address, and bank details
 * - Automatic user creation on partner approval
 * - Approval workflow integration
 */

import React, { useState, useEffect } from 'react';
import { FormRow, FormLabel, FormInput, FormActions, Button } from '../components/ui/Form';
import Modal from '../components/ui/Modal';
import {
  EnhancedBusinessPartner,
  BusinessBranch,
  BusinessPartnerType,
} from '../types/businessPartner';

interface EnhancedBusinessPartnerFormProps {
  partner: EnhancedBusinessPartner | null;
  readOnly: boolean;
  onSave: (data: Partial<EnhancedBusinessPartner>) => void;
  onCancel: () => void;
  onApprove?: (partnerId: string, notes?: string) => void;
  onReject?: (partnerId: string, reason: string) => void;
  mode: 'add' | 'edit' | 'view' | 'approve';
  currentUserRole: string;
}

const BUSINESS_TYPES: { value: BusinessPartnerType; label: string; description: string }[] = [
  { value: 'BUYER', label: 'Buyer', description: 'Purchases cotton' },
  { value: 'SELLER', label: 'Seller', description: 'Sells cotton' },
  { value: 'TRADER', label: 'Trader', description: 'Both buying and selling' },
  { value: 'SUB_BROKER', label: 'Sub Broker', description: 'Commission sharing partner' },
  { value: 'TRANSPORTER', label: 'Transporter', description: 'Logistics and transportation' },
  { value: 'CONTROLLER', label: 'Controller', description: 'Quality control and dispute resolution' },
];

const EnhancedBusinessPartnerForm: React.FC<EnhancedBusinessPartnerFormProps> = ({
  partner,
  readOnly,
  onSave,
  onCancel,
  onApprove,
  onReject,
  mode,
  currentUserRole,
}) => {
  const [formData, setFormData] = useState<Partial<EnhancedBusinessPartner>>(
    partner || {
      legalName: '',
      tradeName: '',
      businessType: 'BUYER',
      status: 'DRAFT',
      primaryContactPerson: '',
      primaryContactEmail: '',
      primaryContactPhone: '',
      registeredAddress: {
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
      },
      pan: '',
      cin: '',
      branches: [],
      documents: {},
      primaryUserApprovalStatus: 'PENDING',
      approvalStatus: 'PENDING',
    }
  );

  const [branches, setBranches] = useState<BusinessBranch[]>(partner?.branches || []);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BusinessBranch | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showApprovalDialog, setShowApprovalDialog] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    if (partner) {
      setFormData(partner);
      setBranches(partner.branches || []);
    }
  }, [partner]);

  const handleChange = (field: string, value: any) => {
    if (field.startsWith('registeredAddress.')) {
      const addressField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        registeredAddress: {
          ...prev.registeredAddress!,
          [addressField]: value,
        },
      }));
    } else if (field.startsWith('primaryBank.')) {
      const bankField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        primaryBank: {
          ...prev.primaryBank!,
          [bankField]: value,
        },
      }));
    } else if (field.startsWith('documents.')) {
      const docField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        documents: {
          ...prev.documents!,
          [docField]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleAddBranch = () => {
    setEditingBranch({
      id: `temp_${Date.now()}`,
      partnerId: partner?.id || '',
      branchName: '',
      branchCode: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
      gstNumber: '',
      panNumber: '',
      contactPerson: '',
      contactEmail: '',
      contactPhone: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      branchName: '',
      isActive: true,
      isHeadOffice: branches.length === 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: '',
    });
    setIsBranchModalOpen(true);
  };

  const handleEditBranch = (branch: BusinessBranch) => {
    setEditingBranch({ ...branch });
    setIsBranchModalOpen(true);
  };

  const handleSaveBranch = (branch: BusinessBranch) => {
    const existingIndex = branches.findIndex(b => b.id === branch.id);
    let updatedBranches;
    
    if (existingIndex >= 0) {
      updatedBranches = [...branches];
      updatedBranches[existingIndex] = branch;
    } else {
      updatedBranches = [...branches, branch];
    }
    
    // Ensure only one head office
    if (branch.isHeadOffice) {
      updatedBranches = updatedBranches.map(b => ({
        ...b,
        isHeadOffice: b.id === branch.id,
      }));
    }
    
    setBranches(updatedBranches);
    setFormData(prev => ({ ...prev, branches: updatedBranches }));
    setIsBranchModalOpen(false);
    setEditingBranch(null);
  };

  const handleDeleteBranch = (branchId: string) => {
    if (window.confirm('Are you sure you want to delete this branch?')) {
      const updatedBranches = branches.filter(b => b.id !== branchId);
      setBranches(updatedBranches);
      setFormData(prev => ({ ...prev, branches: updatedBranches }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.legalName || !formData.primaryContactEmail) {
      alert('Please fill in all required fields');
      return;
    }
    
    onSave({ ...formData, branches });
  };

  const handleApprove = () => {
    if (onApprove && partner) {
      onApprove(partner.id, approvalNotes);
      setShowApprovalDialog(null);
      setApprovalNotes('');
    }
  };

  const handleReject = () => {
    if (onReject && partner && rejectionReason) {
      onReject(partner.id, rejectionReason);
      setShowApprovalDialog(null);
      setRejectionReason('');
    } else {
      alert('Please provide a reason for rejection');
    }
  };

  const canApprove = mode === 'approve' && currentUserRole === 'Admin' && partner?.approvalStatus === 'PENDING';

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Organization Auto-Assignment Banner */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-semibold text-blue-800 mb-1">Organization Assignment</h4>
                <p className="text-sm text-blue-700">
                  ✓ This partner will be <strong>automatically available to ALL organizations</strong> in the system<br />
                  ✓ No need to manually select organizations<br />
                  ✓ Future organizations will also have automatic access
                </p>
              </div>
            </div>
          </div>

          {/* Status Banner for Approval Mode */}
          {mode === 'approve' && partner && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">Approval Required</h4>
              <p className="text-sm text-yellow-700">
                This business partner is pending approval. Review all details carefully before approving or rejecting.
              </p>
              <div className="mt-2 text-sm">
                <p><strong>Status:</strong> {partner.approvalStatus}</p>
                <p><strong>Created:</strong> {new Date(partner.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div>
            <h4 className="font-semibold text-slate-700 border-b pb-2 mb-4">Basic Information</h4>
            <div className="space-y-3">
              <FormRow>
                <FormLabel htmlFor="legalName">Legal Name *</FormLabel>
                <FormInput
                  id="legalName"
                  name="legalName"
                  value={formData.legalName || ''}
                  onChange={(e) => handleChange('legalName', e.target.value)}
                  isReadOnly={readOnly}
                  required
                />
              </FormRow>

              <FormRow>
                <FormLabel htmlFor="tradeName">Trade Name</FormLabel>
                <FormInput
                  id="tradeName"
                  name="tradeName"
                  value={formData.tradeName || ''}
                  onChange={(e) => handleChange('tradeName', e.target.value)}
                  isReadOnly={readOnly}
                />
              </FormRow>

              <FormRow>
                <FormLabel htmlFor="businessType">Business Type *</FormLabel>
                <div className="md:col-span-2">
                  <FormInput
                    component="select"
                    id="businessType"
                    name="businessType"
                    value={formData.businessType || 'BUYER'}
                    onChange={(e) => handleChange('businessType', e.target.value)}
                    isReadOnly={readOnly}
                    required
                  >
                    {BUSINESS_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label} - {type.description}
                      </option>
                    ))}
                  </FormInput>
                  {formData.businessType && (
                    <p className="text-xs text-slate-500 mt-1">
                      {BUSINESS_TYPES.find(t => t.value === formData.businessType)?.description}
                    </p>
                  )}
                </div>
              </FormRow>
            </div>
          </div>

          {/* Primary Contact */}
          <div>
            <h4 className="font-semibold text-slate-700 border-b pb-2 mb-4">Primary Contact</h4>
            <div className="space-y-3">
              <FormRow>
                <FormLabel htmlFor="primaryContactPerson">Contact Person *</FormLabel>
                <FormInput
                  id="primaryContactPerson"
                  name="primaryContactPerson"
                  value={formData.primaryContactPerson || ''}
                  onChange={(e) => handleChange('primaryContactPerson', e.target.value)}
                  isReadOnly={readOnly}
                  required
                />
              </FormRow>

              <FormRow>
                <FormLabel htmlFor="primaryContactEmail">Email *</FormLabel>
                <div className="md:col-span-2">
                  <FormInput
                    id="primaryContactEmail"
                    name="primaryContactEmail"
                    type="email"
                    value={formData.primaryContactEmail || ''}
                    onChange={(e) => handleChange('primaryContactEmail', e.target.value)}
                    isReadOnly={readOnly}
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    This email will be used to create the primary user account
                  </p>
                </div>
              </FormRow>

              <FormRow>
                <FormLabel htmlFor="primaryContactPhone">Phone *</FormLabel>
                <FormInput
                  id="primaryContactPhone"
                  name="primaryContactPhone"
                  type="tel"
                  value={formData.primaryContactPhone || ''}
                  onChange={(e) => handleChange('primaryContactPhone', e.target.value)}
                  isReadOnly={readOnly}
                  required
                />
              </FormRow>
            </div>
          </div>

          {/* Registered Address */}
          <div>
            <h4 className="font-semibold text-slate-700 border-b pb-2 mb-4">Registered Address</h4>
            <div className="space-y-3">
              <FormRow>
                <FormLabel htmlFor="addressLine1">Address Line 1 *</FormLabel>
                <FormInput
                  id="addressLine1"
                  name="addressLine1"
                  value={formData.registeredAddress?.addressLine1 || ''}
                  onChange={(e) => handleChange('registeredAddress.addressLine1', e.target.value)}
                  isReadOnly={readOnly}
                  required
                />
              </FormRow>

              <FormRow>
                <FormLabel htmlFor="addressLine2">Address Line 2</FormLabel>
                <FormInput
                  id="addressLine2"
                  name="addressLine2"
                  value={formData.registeredAddress?.addressLine2 || ''}
                  onChange={(e) => handleChange('registeredAddress.addressLine2', e.target.value)}
                  isReadOnly={readOnly}
                />
              </FormRow>

              <FormRow>
                <FormLabel htmlFor="city">City *</FormLabel>
                <FormInput
                  id="city"
                  name="city"
                  value={formData.registeredAddress?.city || ''}
                  onChange={(e) => handleChange('registeredAddress.city', e.target.value)}
                  isReadOnly={readOnly}
                  required
                />
              </FormRow>

              <FormRow>
                <FormLabel htmlFor="state">State *</FormLabel>
                <FormInput
                  id="state"
                  name="state"
                  value={formData.registeredAddress?.state || ''}
                  onChange={(e) => handleChange('registeredAddress.state', e.target.value)}
                  isReadOnly={readOnly}
                  required
                />
              </FormRow>

              <FormRow>
                <FormLabel htmlFor="pincode">Pincode *</FormLabel>
                <FormInput
                  id="pincode"
                  name="pincode"
                  value={formData.registeredAddress?.pincode || ''}
                  onChange={(e) => handleChange('registeredAddress.pincode', e.target.value)}
                  isReadOnly={readOnly}
                  required
                />
              </FormRow>
            </div>
          </div>

          {/* Compliance */}
          <div>
            <h4 className="font-semibold text-slate-700 border-b pb-2 mb-4">Compliance Details</h4>
            <div className="space-y-3">
              <FormRow>
                <FormLabel htmlFor="pan">PAN *</FormLabel>
                <FormInput
                  id="pan"
                  name="pan"
                  value={formData.pan || ''}
                  onChange={(e) => handleChange('pan', e.target.value)}
                  isReadOnly={readOnly}
                  required
                />
              </FormRow>

              <FormRow>
                <FormLabel htmlFor="cin">CIN</FormLabel>
                <FormInput
                  id="cin"
                  name="cin"
                  value={formData.cin || ''}
                  onChange={(e) => handleChange('cin', e.target.value)}
                  isReadOnly={readOnly}
                />
              </FormRow>

              <FormRow>
                <FormLabel htmlFor="tan">TAN</FormLabel>
                <FormInput
                  id="tan"
                  name="tan"
                  value={formData.tan || ''}
                  onChange={(e) => handleChange('tan', e.target.value)}
                  isReadOnly={readOnly}
                />
              </FormRow>
            </div>
          </div>

          {/* Branches */}
          <div>
            <div className="flex justify-between items-center border-b pb-2 mb-4">
              <h4 className="font-semibold text-slate-700">Branches ({branches.length})</h4>
              {!readOnly && (
                <Button
                  type="button"
                  variant="secondary"
                  className="!text-xs !py-1 !px-3"
                  onClick={handleAddBranch}
                >
                  Add Branch
                </Button>
              )}
            </div>

            {branches.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded text-center">
                <p className="text-sm text-slate-500">
                  No branches added yet. Add at least one branch with GST details.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {branches.map(branch => (
                  <div key={branch.id} className="p-4 border border-slate-200 rounded-lg bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h5 className="font-semibold text-slate-800">
                          {branch.branchName}
                          {branch.isHeadOffice && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
                              Head Office
                            </span>
                          )}
                        </h5>
                        <p className="text-sm text-slate-600">{branch.branchCode}</p>
                      </div>
                      {!readOnly && (
                        <div className="space-x-2">
                          <button
                            type="button"
                            onClick={() => handleEditBranch(branch)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBranch(branch.id)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-slate-600 space-y-1">
                      <p><strong>Location:</strong> {branch.city}, {branch.state} - {branch.pincode}</p>
                      <p><strong>GST:</strong> {branch.gstNumber || 'Not provided'}</p>
                      <p><strong>Contact:</strong> {branch.contactPerson} ({branch.contactEmail})</p>
                      <p><strong>Bank:</strong> {branch.bankName} - {branch.accountNumber}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Compliance Notes (Admin only) */}
          {mode === 'approve' && (
            <div>
              <h4 className="font-semibold text-slate-700 border-b pb-2 mb-4">Compliance Notes</h4>
              <FormRow>
                <FormLabel htmlFor="complianceNotes">Internal Notes</FormLabel>
                <FormInput
                  component="textarea"
                  id="complianceNotes"
                  name="complianceNotes"
                  value={formData.complianceNotes || ''}
                  onChange={(e) => handleChange('complianceNotes', e.target.value)}
                  isReadOnly={false}
                  placeholder="Add any internal notes about compliance review..."
                />
              </FormRow>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <FormActions>
          <Button type="button" variant="secondary" onClick={onCancel}>
            {readOnly ? 'Close' : 'Cancel'}
          </Button>

          {mode === 'add' && !readOnly && (
            <Button type="submit">Submit for Approval</Button>
          )}

          {mode === 'edit' && !readOnly && (
            <Button type="submit">Save Changes</Button>
          )}

          {canApprove && (
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowApprovalDialog('reject')}
                className="!bg-red-600 !text-white hover:!bg-red-700"
              >
                Reject
              </Button>
              <Button
                type="button"
                onClick={() => setShowApprovalDialog('approve')}
                className="!bg-green-600 hover:!bg-green-700"
              >
                Approve Partner
              </Button>
            </>
          )}
        </FormActions>
      </form>

      {/* Branch Modal */}
      {isBranchModalOpen && editingBranch && (
        <BranchModal
          branch={editingBranch}
          onSave={handleSaveBranch}
          onClose={() => {
            setIsBranchModalOpen(false);
            setEditingBranch(null);
          }}
        />
      )}

      {/* Approval Dialog */}
      {showApprovalDialog && (
        <Modal
          isOpen={true}
          onClose={() => setShowApprovalDialog(null)}
          title={showApprovalDialog === 'approve' ? 'Approve Business Partner' : 'Reject Business Partner'}
        >
          <div className="space-y-4">
            {showApprovalDialog === 'approve' ? (
              <>
                <p className="text-sm text-slate-600">
                  Approving this business partner will:
                </p>
                <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                  <li>Activate the business partner in the system</li>
                  <li>Automatically create a user account for: <strong>{formData.primaryContactEmail}</strong></li>
                  <li>Generate a temporary password and send it via email</li>
                  <li>User will be required to change password on first login</li>
                </ul>
                <FormRow>
                  <FormLabel htmlFor="approvalNotes">Approval Notes (Optional)</FormLabel>
                  <FormInput
                    component="textarea"
                    id="approvalNotes"
                    name="approvalNotes"
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    placeholder="Add any notes about the approval..."
                  />
                </FormRow>
                <div className="flex gap-3 justify-end">
                  <Button variant="secondary" onClick={() => setShowApprovalDialog(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleApprove} className="!bg-green-600 hover:!bg-green-700">
                    Confirm Approval
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-600">
                  Provide a reason for rejecting this business partner:
                </p>
                <FormRow>
                  <FormLabel htmlFor="rejectionReason">Rejection Reason *</FormLabel>
                  <FormInput
                    component="textarea"
                    id="rejectionReason"
                    name="rejectionReason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g., Incomplete documentation, Invalid PAN, etc."
                    required
                  />
                </FormRow>
                <div className="flex gap-3 justify-end">
                  <Button variant="secondary" onClick={() => setShowApprovalDialog(null)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReject}
                    className="!bg-red-600 !text-white hover:!bg-red-700"
                    disabled={!rejectionReason}
                  >
                    Confirm Rejection
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </>
  );
};

// Branch Modal Component
interface BranchModalProps {
  branch: BusinessBranch;
  onSave: (branch: BusinessBranch) => void;
  onClose: () => void;
}

const BranchModal: React.FC<BranchModalProps> = ({ branch, onSave, onClose }) => {
  const [formData, setFormData] = useState<BusinessBranch>(branch);

  const handleChange = (field: keyof BusinessBranch, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.branchName || !formData.gstNumber || !formData.city || !formData.state) {
      alert('Please fill in all required fields');
      return;
    }
    
    onSave(formData);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={branch.id.startsWith('temp_') ? 'Add Branch' : 'Edit Branch'}>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <FormRow>
            <FormLabel htmlFor="branchName">Branch Name *</FormLabel>
            <FormInput
              id="branchName"
              name="branchName"
              value={formData.branchName}
              onChange={(e) => handleChange('branchName', e.target.value)}
              required
            />
          </FormRow>

          <FormRow>
            <FormLabel htmlFor="branchCode">Branch Code *</FormLabel>
            <FormInput
              id="branchCode"
              name="branchCode"
              value={formData.branchCode}
              onChange={(e) => handleChange('branchCode', e.target.value)}
              required
            />
          </FormRow>

          <FormRow>
            <FormLabel htmlFor="gstNumber">GST Number *</FormLabel>
            <FormInput
              id="gstNumber"
              name="gstNumber"
              value={formData.gstNumber}
              onChange={(e) => handleChange('gstNumber', e.target.value)}
              required
            />
          </FormRow>

          <FormRow>
            <FormLabel htmlFor="addressLine1">Address Line 1 *</FormLabel>
            <FormInput
              id="addressLine1"
              name="addressLine1"
              value={formData.addressLine1}
              onChange={(e) => handleChange('addressLine1', e.target.value)}
              required
            />
          </FormRow>

          <FormRow>
            <FormLabel htmlFor="city">City *</FormLabel>
            <FormInput
              id="city"
              name="city"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              required
            />
          </FormRow>

          <FormRow>
            <FormLabel htmlFor="state">State *</FormLabel>
            <FormInput
              id="state"
              name="state"
              value={formData.state}
              onChange={(e) => handleChange('state', e.target.value)}
              required
            />
          </FormRow>

          <FormRow>
            <FormLabel htmlFor="pincode">Pincode *</FormLabel>
            <FormInput
              id="pincode"
              name="pincode"
              value={formData.pincode}
              onChange={(e) => handleChange('pincode', e.target.value)}
              required
            />
          </FormRow>

          <FormRow>
            <FormLabel htmlFor="contactPerson">Contact Person *</FormLabel>
            <FormInput
              id="contactPerson"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={(e) => handleChange('contactPerson', e.target.value)}
              required
            />
          </FormRow>

          <FormRow>
            <FormLabel htmlFor="contactEmail">Contact Email *</FormLabel>
            <FormInput
              id="contactEmail"
              name="contactEmail"
              type="email"
              value={formData.contactEmail}
              onChange={(e) => handleChange('contactEmail', e.target.value)}
              required
            />
          </FormRow>

          <FormRow>
            <FormLabel htmlFor="contactPhone">Contact Phone *</FormLabel>
            <FormInput
              id="contactPhone"
              name="contactPhone"
              type="tel"
              value={formData.contactPhone}
              onChange={(e) => handleChange('contactPhone', e.target.value)}
              required
            />
          </FormRow>

          <FormRow>
            <FormLabel htmlFor="bankName">Bank Name *</FormLabel>
            <FormInput
              id="bankName"
              name="bankName"
              value={formData.bankName}
              onChange={(e) => handleChange('bankName', e.target.value)}
              required
            />
          </FormRow>

          <FormRow>
            <FormLabel htmlFor="accountNumber">Account Number *</FormLabel>
            <FormInput
              id="accountNumber"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={(e) => handleChange('accountNumber', e.target.value)}
              required
            />
          </FormRow>

          <FormRow>
            <FormLabel htmlFor="ifscCode">IFSC Code *</FormLabel>
            <FormInput
              id="ifscCode"
              name="ifscCode"
              value={formData.ifscCode}
              onChange={(e) => handleChange('ifscCode', e.target.value)}
              required
            />
          </FormRow>

          <FormRow>
            <FormLabel htmlFor="isHeadOffice">Head Office</FormLabel>
            <div className="md:col-span-2 flex items-center">
              <input
                id="isHeadOffice"
                name="isHeadOffice"
                type="checkbox"
                checked={formData.isHeadOffice}
                onChange={(e) => handleChange('isHeadOffice', e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-slate-600">Mark as head office</span>
            </div>
          </FormRow>
        </div>

        <FormActions>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save Branch</Button>
        </FormActions>
      </form>
    </Modal>
  );
};

export default EnhancedBusinessPartnerForm;
