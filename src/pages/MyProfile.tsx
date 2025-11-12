/**
 * User Profile Management Component
 * Allows users to view and update their profile
 * All changes go through approval workflow
 */

import React, { useState, useEffect } from 'react';
import { userProfileApi } from '../api/userProfileApi';
import { UserProfile, ProfileUpdateRequest } from '../types/userProfile';
import { Button } from '../components/ui/Form';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';

const MyProfile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [pendingUpdates, setPendingUpdates] = useState<ProfileUpdateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editType, setEditType] = useState<'CONTACT' | 'ADDRESS' | 'DOCUMENTS'>('CONTACT');
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [updateReason, setUpdateReason] = useState('');

  useEffect(() => {
    loadProfile();
    loadPendingUpdates();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await userProfileApi.getMyProfile();
      setProfile(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingUpdates = async () => {
    try {
      const updates = await userProfileApi.getMyPendingUpdates();
      setPendingUpdates(updates);
    } catch (err) {
      console.error('Failed to load pending updates:', err);
    }
  };

  const handleEdit = (type: 'CONTACT' | 'ADDRESS' | 'DOCUMENTS') => {
    setEditType(type);
    setEditData({});
    setUpdateReason('');
    setIsEditModalOpen(true);
  };

  const handleSubmitUpdate = async () => {
    if (!updateReason) {
      setError('Please provide a reason for this update');
      return;
    }

    try {
      await userProfileApi.requestProfileUpdate({
        updateType: editType,
        proposedValues: editData,
        reason: updateReason,
      });
      
      setIsEditModalOpen(false);
      await loadPendingUpdates();
      
      alert('Update request submitted successfully! It will be reviewed by our team.');
    } catch (err: any) {
      setError(err.message || 'Failed to submit update request');
    }
  };

  const handleCancelUpdate = async (requestId: string) => {
    if (window.confirm('Are you sure you want to cancel this update request?')) {
      try {
        await userProfileApi.cancelUpdateRequest(requestId);
        await loadPendingUpdates();
      } catch (err: any) {
        setError(err.message || 'Failed to cancel request');
      }
    }
  };

  const getKYCStatusColor = (status: string) => {
    switch (status) {
      case 'CURRENT': return 'bg-green-100 text-green-800';
      case 'DUE_SOON': return 'bg-yellow-100 text-yellow-800';
      case 'OVERDUE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <Card title="Error">
        <p className="text-red-600">Failed to load profile</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{profile.name}</h2>
            <p className="text-slate-600">{profile.businessPartnerName} ({profile.businessPartnerCode})</p>
          </div>
          <div className={`px-4 py-2 rounded-lg font-semibold ${getKYCStatusColor(profile.kycStatus)}`}>
            KYC: {profile.kycStatus}
          </div>
        </div>

        {/* KYC Alert */}
        {(profile.kycStatus === 'DUE_SOON' || profile.kycStatus === 'OVERDUE') && (
          <div className={`p-4 rounded-lg mb-6 ${
            profile.kycStatus === 'OVERDUE' 
              ? 'bg-red-50 border border-red-200' 
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <h4 className={`font-semibold mb-2 ${
              profile.kycStatus === 'OVERDUE' ? 'text-red-800' : 'text-yellow-800'
            }`}>
              {profile.kycStatus === 'OVERDUE' ? '⚠️ KYC Verification Overdue!' : '⏰ KYC Verification Due Soon'}
            </h4>
            <p className={`text-sm ${
              profile.kycStatus === 'OVERDUE' ? 'text-red-700' : 'text-yellow-700'
            }`}>
              Your KYC verification is {profile.kycStatus === 'OVERDUE' ? 'overdue' : `due in ${profile.kycDaysRemaining} days`}.
              Please update your documents and information.
              Next verification due: {new Date(profile.kycNextDue).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Profile Completeness */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Profile Completeness</span>
            <span className="text-sm font-semibold text-blue-600">{profile.profileCompleteness}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                profile.profileCompleteness === 100 ? 'bg-green-500' : 'bg-blue-600'
              }`}
              style={{ width: `${profile.profileCompleteness}%` }}
            />
          </div>
          {profile.missingFields.length > 0 && (
            <p className="text-xs text-slate-500 mt-1">
              Missing: {profile.missingFields.join(', ')}
            </p>
          )}
        </div>
      </Card>

      {/* Pending Updates Alert */}
      {pendingUpdates.length > 0 && (
        <Card>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">
              📋 You have {pendingUpdates.length} pending update request{pendingUpdates.length > 1 ? 's' : ''}
            </h4>
            <div className="space-y-2">
              {pendingUpdates.map(update => (
                <div key={update.id} className="bg-white rounded p-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-slate-800">{update.updateType} Update</p>
                    <p className="text-xs text-slate-600">
                      Requested: {new Date(update.requestedAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-slate-600">Reason: {update.reason}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-800">
                      {update.status}
                    </span>
                    <button
                      onClick={() => handleCancelUpdate(update.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Contact Information */}
      <Card
        title="Contact Information"
        actions={
          <Button
            onClick={() => handleEdit('CONTACT')}
            variant="secondary"
            className="!text-sm"
          >
            Request Update
          </Button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-600">Email</p>
            <p className="font-semibold text-slate-800">{profile.email}</p>
          </div>
          <div>
            <p className="text-xs text-slate-600">Phone</p>
            <p className="font-semibold text-slate-800">{profile.phone}</p>
          </div>
        </div>
      </Card>

      {/* Documents */}
      <Card
        title="Documents"
        actions={
          <Button
            onClick={() => handleEdit('DOCUMENTS')}
            variant="secondary"
            className="!text-sm"
          >
            Upload Documents
          </Button>
        }
      >
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> All document uploads require back-office approval.
            Your current documents are valid until: {new Date(profile.kycNextDue).toLocaleDateString()}
          </p>
        </div>
        
        <div className="mt-4 text-sm text-slate-600">
          <p>Last KYC Verification: {new Date(profile.kycLastVerified).toLocaleDateString()}</p>
          <p>Next Verification Due: {new Date(profile.kycNextDue).toLocaleDateString()}</p>
        </div>
      </Card>

      {/* Account Information */}
      <Card title="Account Information">
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-xs text-slate-600">Member Since</p>
            <p className="font-semibold text-slate-800">
              {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-600">Last Login</p>
            <p className="font-semibold text-slate-800">
              {new Date(profile.lastLoginAt).toLocaleDateString()} at{' '}
              {new Date(profile.lastLoginAt).toLocaleTimeString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-600">Last Profile Update</p>
            <p className="font-semibold text-slate-800">
              {new Date(profile.lastUpdatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </Card>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Request ${editType} Update`}
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> All profile updates require approval from back-office.
              You will be notified once your request is reviewed.
            </p>
          </div>

          {editType === 'CONTACT' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  New Email
                </label>
                <input
                  type="email"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  placeholder={profile.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  New Phone
                </label>
                <input
                  type="tel"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  placeholder={profile.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                />
              </div>
            </div>
          )}

          {editType === 'DOCUMENTS' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  PAN Card
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  onChange={(e) => setEditData({ ...editData, panCard: e.target.files?.[0] })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  GST Certificate
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  onChange={(e) => setEditData({ ...editData, gstCertificate: e.target.files?.[0] })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Address Proof
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2"
                  onChange={(e) => setEditData({ ...editData, addressProof: e.target.files?.[0] })}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Reason for Update *
            </label>
            <textarea
              className="w-full border border-slate-300 rounded-lg px-4 py-2"
              rows={3}
              placeholder="Please explain why you are requesting this update..."
              value={updateReason}
              onChange={(e) => setUpdateReason(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              variant="secondary"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitUpdate} disabled={!updateReason}>
              Submit Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MyProfile;
