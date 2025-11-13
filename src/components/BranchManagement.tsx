/**
 * Branch Management Component
 * Allows partners to manage multiple branches with separate GST, address, and banking
 * 
 * Features:
 * - Add/Edit/Delete branches
 * - Mark one branch as Head Office
 * - Each branch has own GST, address, contact, banking
 * - Validation for all fields
 * - Used in transactions for branch selection
 */

import React, { useState, useEffect } from 'react';
import { BusinessBranch } from '../types/businessPartner';
import { businessPartnerApi } from '../api/businessPartnerApi';

interface Props {
  partnerId: string;
  readOnly?: boolean;
  onBranchesChange?: (branches: BusinessBranch[]) => void;
}

const BranchManagement: React.FC<Props> = ({ partnerId, readOnly = false, onBranchesChange }) => {
  const [branches, setBranches] = useState<BusinessBranch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BusinessBranch | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Partial<BusinessBranch>>({
    branchName: '',
    branchCode: '',
    address: {
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
    },
    gstNumber: '',
    panNumber: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    bankDetails: {
      bankName: '',
      accountNumber: '',
      accountHolderName: '',
      ifscCode: '',
      branchName: '',
      accountType: 'CURRENT',
      isVerified: false,
    },
    isActive: true,
    isHeadOffice: false,
  });

  useEffect(() => {
    loadBranches();
  }, [partnerId]);

  const loadBranches = async () => {
    setLoading(true);
    try {
      const data = await businessPartnerApi.getBranches(partnerId);
      setBranches(data);
      if (onBranchesChange) {
        onBranchesChange(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      branchName: '',
      branchCode: '',
      address: {
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
      },
      gstNumber: '',
      panNumber: '',
      contactPerson: '',
      contactEmail: '',
      contactPhone: '',
      bankDetails: {
        bankName: '',
        accountNumber: '',
        accountHolderName: '',
        ifscCode: '',
        branchName: '',
        accountType: 'CURRENT',
        isVerified: false,
      },
      isActive: true,
      isHeadOffice: false,
    });
    setEditingBranch(null);
    setShowAddForm(false);
    setError('');
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev };
      const parts = field.split('.');
      let current: any = newData;
      
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = {};
        }
        current = current[parts[i]];
      }
      
      current[parts[parts.length - 1]] = value;
      return newData;
    });
    setError('');
  };

  const validateForm = (): boolean => {
    if (!formData.branchName) {
      setError('Branch name is required');
      return false;
    }
    if (!formData.branchCode) {
      setError('Branch code is required');
      return false;
    }
    if (!formData.gstNumber || formData.gstNumber.length !== 15) {
      setError('Valid GST number is required (15 characters)');
      return false;
    }
    if (!formData.address?.addressLine1) {
      setError('Address is required');
      return false;
    }
    if (!formData.address?.city) {
      setError('City is required');
      return false;
    }
    if (!formData.address?.state) {
      setError('State is required');
      return false;
    }
    if (!formData.address?.pincode || formData.address.pincode.length !== 6) {
      setError('Valid 6-digit pincode is required');
      return false;
    }
    if (!formData.contactPerson) {
      setError('Contact person is required');
      return false;
    }
    if (!formData.contactEmail) {
      setError('Contact email is required');
      return false;
    }
    if (!formData.contactPhone) {
      setError('Contact phone is required');
      return false;
    }
    if (!formData.bankDetails?.bankName) {
      setError('Bank name is required');
      return false;
    }
    if (!formData.bankDetails?.accountNumber) {
      setError('Account number is required');
      return false;
    }
    if (!formData.bankDetails?.ifscCode || formData.bankDetails.ifscCode.length !== 11) {
      setError('Valid IFSC code is required (11 characters)');
      return false;
    }
    
    return true;
  };

  const handleAdd = () => {
    setShowAddForm(true);
    setEditingBranch(null);
    resetForm();
  };

  const handleEdit = (branch: BusinessBranch) => {
    setEditingBranch(branch);
    setFormData(branch);
    setShowAddForm(true);
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (editingBranch) {
        // Update existing branch
        const updated = await businessPartnerApi.updateBranch(
          partnerId,
          editingBranch.id,
          formData as Partial<BusinessBranch>
        );
        setBranches(prev => prev.map(b => b.id === updated.id ? updated : b));
      } else {
        // Add new branch
        const newBranch = await businessPartnerApi.addBranch(partnerId, formData as Omit<BusinessBranch, 'id'>);
        setBranches(prev => [...prev, newBranch]);
      }
      
      resetForm();
      loadBranches(); // Reload to get fresh data
    } catch (err: any) {
      setError(err.message || 'Failed to save branch');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (branchId: string) => {
    if (!confirm('Are you sure you want to delete this branch?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await businessPartnerApi.deleteBranch(partnerId, branchId);
      setBranches(prev => prev.filter(b => b.id !== branchId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete branch');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsHeadOffice = async (branchId: string) => {
    setLoading(true);
    setError('');

    try {
      // Mark selected branch as HO and unmark others
      const updates = branches.map(async (b) => {
        if (b.id === branchId && !b.isHeadOffice) {
          return businessPartnerApi.updateBranch(partnerId, b.id, { isHeadOffice: true });
        } else if (b.id !== branchId && b.isHeadOffice) {
          return businessPartnerApi.updateBranch(partnerId, b.id, { isHeadOffice: false });
        }
        return b;
      });

      await Promise.all(updates);
      loadBranches();
    } catch (err: any) {
      setError(err.message || 'Failed to update head office');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (branchId: string, isActive: boolean) => {
    setLoading(true);
    setError('');

    try {
      await businessPartnerApi.updateBranch(partnerId, branchId, { isActive: !isActive });
      loadBranches();
    } catch (err: any) {
      setError(err.message || 'Failed to update branch status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Branch Management</h2>
          <p className="text-sm text-slate-600">Manage multiple branches with separate GST, address, and banking</p>
        </div>
        {!readOnly && (
          <button
            onClick={handleAdd}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
          >
            + Add Branch
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && !showAddForm && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-slate-600 mt-2">Loading branches...</p>
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white border-2 border-blue-300 rounded-lg p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-4">
            {editingBranch ? 'Edit Branch' : 'Add New Branch'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Branch Info */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Branch Name *
              </label>
              <input
                type="text"
                value={formData.branchName}
                onChange={(e) => handleChange('branchName', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2"
                placeholder="Mumbai Branch"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Branch Code *
              </label>
              <input
                type="text"
                value={formData.branchCode}
                onChange={(e) => handleChange('branchCode', e.target.value.toUpperCase())}
                className="w-full border border-slate-300 rounded-lg px-4 py-2"
                placeholder="MUM-001"
              />
            </div>

            {/* GST & PAN */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                GST Number * <span className="text-xs text-slate-500">(15 chars)</span>
              </label>
              <input
                type="text"
                value={formData.gstNumber}
                onChange={(e) => handleChange('gstNumber', e.target.value.toUpperCase())}
                className="w-full border border-slate-300 rounded-lg px-4 py-2 font-mono"
                placeholder="27AAAAA0000A1Z5"
                maxLength={15}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                PAN Number <span className="text-xs text-slate-500">(optional)</span>
              </label>
              <input
                type="text"
                value={formData.panNumber}
                onChange={(e) => handleChange('panNumber', e.target.value.toUpperCase())}
                className="w-full border border-slate-300 rounded-lg px-4 py-2 font-mono"
                placeholder="AAAAA0000A"
                maxLength={10}
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Address Line 1 *
              </label>
              <input
                type="text"
                value={formData.address?.addressLine1}
                onChange={(e) => handleChange('address.addressLine1', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Address Line 2
              </label>
              <input
                type="text"
                value={formData.address?.addressLine2}
                onChange={(e) => handleChange('address.addressLine2', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">City *</label>
              <input
                type="text"
                value={formData.address?.city}
                onChange={(e) => handleChange('address.city', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">State *</label>
              <input
                type="text"
                value={formData.address?.state}
                onChange={(e) => handleChange('address.state', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Pincode * <span className="text-xs text-slate-500">(6 digits)</span>
              </label>
              <input
                type="text"
                value={formData.address?.pincode}
                onChange={(e) => handleChange('address.pincode', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2"
                maxLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Country</label>
              <input
                type="text"
                value={formData.address?.country}
                onChange={(e) => handleChange('address.country', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2"
              />
            </div>

            {/* Contact */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Contact Person *
              </label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => handleChange('contactPerson', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Contact Email *
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleChange('contactEmail', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Contact Phone *
              </label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => handleChange('contactPhone', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2"
              />
            </div>

            {/* Banking */}
            <div className="md:col-span-2">
              <h4 className="font-semibold text-slate-700 mb-3 mt-4">Banking Details</h4>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Bank Name *
              </label>
              <input
                type="text"
                value={formData.bankDetails?.bankName}
                onChange={(e) => handleChange('bankDetails.bankName', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Account Number *
              </label>
              <input
                type="text"
                value={formData.bankDetails?.accountNumber}
                onChange={(e) => handleChange('bankDetails.accountNumber', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Account Holder Name *
              </label>
              <input
                type="text"
                value={formData.bankDetails?.accountHolderName}
                onChange={(e) => handleChange('bankDetails.accountHolderName', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                IFSC Code * <span className="text-xs text-slate-500">(11 chars)</span>
              </label>
              <input
                type="text"
                value={formData.bankDetails?.ifscCode}
                onChange={(e) => handleChange('bankDetails.ifscCode', e.target.value.toUpperCase())}
                className="w-full border border-slate-300 rounded-lg px-4 py-2 font-mono"
                maxLength={11}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Bank Branch Name *
              </label>
              <input
                type="text"
                value={formData.bankDetails?.branchName}
                onChange={(e) => handleChange('bankDetails.branchName', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Account Type *
              </label>
              <select
                value={formData.bankDetails?.accountType}
                onChange={(e) => handleChange('bankDetails.accountType', e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2"
              >
                <option value="CURRENT">Current Account</option>
                <option value="SAVINGS">Savings Account</option>
              </select>
            </div>

            {/* Flags */}
            <div className="md:col-span-2 flex gap-4 mt-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isHeadOffice}
                  onChange={(e) => handleChange('isHeadOffice', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-slate-700">Mark as Head Office</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleChange('isActive', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-slate-700">Active</span>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button
              onClick={resetForm}
              disabled={loading}
              className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {loading ? 'Saving...' : editingBranch ? 'Update Branch' : 'Add Branch'}
            </button>
          </div>
        </div>
      )}

      {/* Branches List */}
      {!showAddForm && branches.length === 0 && !loading && (
        <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
          <svg className="w-16 h-16 mx-auto text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-slate-600 font-medium">No branches added yet</p>
          <p className="text-sm text-slate-500 mt-1">Click "Add Branch" to create your first branch</p>
        </div>
      )}

      {!showAddForm && branches.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className={`bg-white border-2 rounded-lg p-4 ${
                branch.isHeadOffice ? 'border-blue-500' : 'border-slate-200'
              } ${!branch.isActive ? 'opacity-60' : ''}`}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    {branch.branchName}
                    {branch.isHeadOffice && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-semibold">
                        HEAD OFFICE
                      </span>
                    )}
                    {!branch.isActive && (
                      <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded font-semibold">
                        INACTIVE
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-slate-600 font-mono">{branch.branchCode}</p>
                </div>
                {!readOnly && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(branch)}
                      className="text-blue-600 hover:text-blue-700 p-1"
                      title="Edit"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(branch.id)}
                      className="text-red-600 hover:text-red-700 p-1"
                      title="Delete"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-slate-600">GST:</span>
                  <span className="font-mono font-medium text-slate-800 ml-2">{branch.gstNumber}</span>
                </div>
                <div>
                  <span className="text-slate-600">Address:</span>
                  <span className="text-slate-800 ml-2">
                    {branch.address.addressLine1}, {branch.address.city}, {branch.address.state} - {branch.address.pincode}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">Contact:</span>
                  <span className="text-slate-800 ml-2">{branch.contactPerson} ({branch.contactPhone})</span>
                </div>
                <div>
                  <span className="text-slate-600">Bank:</span>
                  <span className="text-slate-800 ml-2">{branch.bankDetails.bankName} - {branch.bankDetails.accountNumber}</span>
                </div>
              </div>

              {/* Actions */}
              {!readOnly && (
                <div className="mt-4 pt-3 border-t flex gap-2">
                  {!branch.isHeadOffice && (
                    <button
                      onClick={() => handleMarkAsHeadOffice(branch.id)}
                      className="text-xs px-3 py-1 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 font-medium"
                    >
                      Set as Head Office
                    </button>
                  )}
                  <button
                    onClick={() => toggleActive(branch.id, branch.isActive)}
                    className={`text-xs px-3 py-1 border rounded font-medium ${
                      branch.isActive
                        ? 'border-slate-300 text-slate-600 hover:bg-slate-50'
                        : 'border-green-600 text-green-600 hover:bg-green-50'
                    }`}
                  >
                    {branch.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BranchManagement;
