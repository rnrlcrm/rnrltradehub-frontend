/**
 * Admin: Profile Update Approvals & KYC Management
 * Back-office view to approve user profile updates and manage KYC
 */

import React, { useState, useEffect } from 'react';
import { userProfileApi } from '../api/userProfileApi';
import { DetailedProfileUpdate, KYCVerification } from '../types/userProfile';
import { Button } from '../components/ui/Form';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';

const ProfileUpdateApprovals: React.FC = () => {
  const [pendingUpdates, setPendingUpdates] = useState<DetailedProfileUpdate[]>([]);
  const [kycDueList, setKycDueList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUpdate, setSelectedUpdate] = useState<DetailedProfileUpdate | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<any | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isKYCModalOpen, setIsKYCModalOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [kycVerification, setKycVerification] = useState<any>({
    panCard: true,
    gstCertificate: true,
    addressProof: true,
    cancelledCheque: true,
  });
  const [kycNotes, setKycNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'updates' | 'kyc'>('updates');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [updates, kycList] = await Promise.all([
        userProfileApi.getAllPendingUpdates(),
        userProfileApi.getKYCDueList({ daysRange: 60 }),
      ]);
      setPendingUpdates(updates);
      setKycDueList(kycList);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedUpdate) return;
    
    try {
      await userProfileApi.approveProfileUpdate(
        selectedUpdate.request.id,
        approvalNotes
      );
      setIsApprovalModalOpen(false);
      await loadData();
      alert('Update approved successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to approve update');
    }
  };

  const handleReject = async () => {
    if (!selectedUpdate || !rejectionReason) {
      alert('Please provide a rejection reason');
      return;
    }
    
    try {
      await userProfileApi.rejectProfileUpdate(
        selectedUpdate.request.id,
        rejectionReason
      );
      setIsApprovalModalOpen(false);
      await loadData();
      alert('Update rejected');
    } catch (err: any) {
      alert(err.message || 'Failed to reject update');
    }
  };

  const handleVerifyKYC = async () => {
    if (!selectedPartner) return;
    
    const allVerified = Object.values(kycVerification).every(v => v === true);
    
    try {
      await userProfileApi.verifyKYC(selectedPartner.partnerId, {
        documentsVerified: kycVerification,
        status: allVerified ? 'VERIFIED' : 'ISSUES_FOUND',
        issues: !allVerified ? ['Some documents not verified'] : undefined,
        notes: kycNotes,
      });
      setIsKYCModalOpen(false);
      await loadData();
      alert('KYC verification completed!');
    } catch (err: any) {
      alert(err.message || 'Failed to verify KYC');
    }
  };

  const openApprovalModal = (update: DetailedProfileUpdate) => {
    setSelectedUpdate(update);
    setApprovalNotes('');
    setRejectionReason('');
    setIsApprovalModalOpen(true);
  };

  const openKYCModal = (partner: any) => {
    setSelectedPartner(partner);
    setKycVerification({
      panCard: true,
      gstCertificate: true,
      addressProof: true,
      cancelledCheque: true,
    });
    setKycNotes('');
    setIsKYCModalOpen(true);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">
          Profile Updates & KYC Management
        </h1>
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'updates' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('updates')}
            className="!px-4"
          >
            Pending Updates ({pendingUpdates.length})
          </Button>
          <Button
            variant={activeTab === 'kyc' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('kyc')}
            className="!px-4"
          >
            KYC Due ({kycDueList.length})
          </Button>
        </div>
      </div>

      {/* Pending Updates Tab */}
      {activeTab === 'updates' && (
        <div className="space-y-4">
          {pendingUpdates.length === 0 ? (
            <Card>
              <div className="text-center py-8 text-slate-600">
                <p>No pending profile update requests</p>
              </div>
            </Card>
          ) : (
            pendingUpdates.map(update => (
              <Card key={update.request.id}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-semibold text-lg text-slate-800">
                        {update.request.updateType} Update Request
                      </h3>
                      <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-800">
                        {update.request.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-slate-600">User</p>
                        <p className="font-medium text-slate-800">
                          {update.user.name} ({update.user.email})
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">Business Partner</p>
                        <p className="font-medium text-slate-800">
                          {update.partner.name} ({update.partner.code})
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">Requested</p>
                        <p className="font-medium text-slate-800">
                          {new Date(update.request.requestedAt).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">Reason</p>
                        <p className="font-medium text-slate-800">{update.request.reason}</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <h4 className="font-semibold text-slate-700 mb-3">Proposed Changes:</h4>
                      <div className="space-y-2">
                        {update.changes.map((change, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="font-medium text-slate-700">{change.label}:</span>
                            <div className="flex gap-3 items-center">
                              <span className="text-slate-500 line-through">
                                {String(change.oldValue)}
                              </span>
                              <span>→</span>
                              <span className="text-green-600 font-semibold">
                                {String(change.newValue)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="ml-4">
                    <Button
                      onClick={() => openApprovalModal(update)}
                      className="!bg-blue-600 hover:!bg-blue-700"
                    >
                      Review
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* KYC Due Tab */}
      {activeTab === 'kyc' && (
        <div className="space-y-4">
          {kycDueList.length === 0 ? (
            <Card>
              <div className="text-center py-8 text-slate-600">
                <p>No partners with KYC due in the next 60 days</p>
              </div>
            </Card>
          ) : (
            kycDueList.map(partner => (
              <Card key={partner.partnerId}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-semibold text-lg text-slate-800">
                        {partner.partnerName}
                      </h3>
                      <span className="text-sm text-slate-600">({partner.partnerCode})</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        partner.kycStatus === 'OVERDUE'
                          ? 'bg-red-100 text-red-800'
                          : partner.kycStatus === 'DUE_SOON'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {partner.kycStatus}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-slate-600">Last Verified</p>
                        <p className="font-medium text-slate-800">
                          {new Date(partner.kycLastVerified).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">Next Due</p>
                        <p className="font-medium text-slate-800">
                          {new Date(partner.kycNextDue).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">Days Remaining</p>
                        <p className={`font-medium ${
                          partner.daysRemaining < 0 ? 'text-red-600' : 'text-slate-800'
                        }`}>
                          {partner.daysRemaining} days
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4 flex gap-2">
                    <Button
                      onClick={() => openKYCModal(partner)}
                      className="!bg-green-600 hover:!bg-green-700"
                    >
                      Verify KYC
                    </Button>
                    <Button
                      onClick={async () => {
                        try {
                          await userProfileApi.sendKYCReminder(partner.partnerId);
                          alert('Reminder sent!');
                        } catch (err) {
                          alert('Failed to send reminder');
                        }
                      }}
                      variant="secondary"
                    >
                      Send Reminder
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Approval Modal */}
      <Modal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        title="Review Profile Update"
      >
        {selectedUpdate && (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h4 className="font-semibold text-slate-700 mb-3">Changes:</h4>
              <div className="space-y-2">
                {selectedUpdate.changes.map((change, idx) => (
                  <div key={idx} className="text-sm">
                    <p className="font-medium text-slate-700">{change.label}</p>
                    <div className="flex gap-3 items-center ml-4">
                      <span className="text-slate-500">{String(change.oldValue)}</span>
                      <span>→</span>
                      <span className="text-green-600 font-semibold">
                        {String(change.newValue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Approval Notes (Optional)
              </label>
              <textarea
                className="w-full border border-slate-300 rounded-lg px-4 py-2"
                rows={3}
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Add any notes about this approval..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Rejection Reason (if rejecting)
              </label>
              <textarea
                className="w-full border border-slate-300 rounded-lg px-4 py-2"
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Required if rejecting..."
              />
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                variant="secondary"
                onClick={() => setIsApprovalModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                className="!bg-red-600 hover:!bg-red-700"
                disabled={!rejectionReason}
              >
                Reject
              </Button>
              <Button
                onClick={handleApprove}
                className="!bg-green-600 hover:!bg-green-700"
              >
                Approve
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* KYC Verification Modal */}
      <Modal
        isOpen={isKYCModalOpen}
        onClose={() => setIsKYCModalOpen(false)}
        title="KYC Verification"
      >
        {selectedPartner && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Partner:</strong> {selectedPartner.partnerName} ({selectedPartner.partnerCode})
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-700 mb-3">Verify Documents:</h4>
              <div className="space-y-2">
                {Object.keys(kycVerification).map(doc => (
                  <label key={doc} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={kycVerification[doc]}
                      onChange={(e) =>
                        setKycVerification({ ...kycVerification, [doc]: e.target.checked })
                      }
                      className="mr-2"
                    />
                    <span className="text-sm text-slate-700">
                      {doc.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Verification Notes *
              </label>
              <textarea
                className="w-full border border-slate-300 rounded-lg px-4 py-2"
                rows={4}
                value={kycNotes}
                onChange={(e) => setKycNotes(e.target.value)}
                placeholder="Add notes about the verification..."
                required
              />
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                variant="secondary"
                onClick={() => setIsKYCModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleVerifyKYC}
                className="!bg-green-600 hover:!bg-green-700"
                disabled={!kycNotes}
              >
                Complete Verification
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProfileUpdateApprovals;
