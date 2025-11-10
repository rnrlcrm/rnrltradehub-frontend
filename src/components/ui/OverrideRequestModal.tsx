import React, { useState } from 'react';
import Modal from './Modal';
import { Button, FormLabel, FormInput } from './Form';
import { OverrideRequest } from '../../lib/smartContract';

interface OverrideRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  ruleId: string;
  ruleName: string;
  contractId: string;
  contractNo: string;
  currentUser: string;
  onSubmit: (reason: string) => void;
}

const OverrideRequestModal: React.FC<OverrideRequestModalProps> = ({
  isOpen,
  onClose,
  ruleId,
  ruleName,
  contractNo,
  currentUser,
  onSubmit,
}) => {
  const [reason, setReason] = useState('');
  const [businessJustification, setBusinessJustification] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim() && businessJustification.trim()) {
      const fullReason = `${reason}\n\nBusiness Justification: ${businessJustification}`;
      onSubmit(fullReason);
      setReason('');
      setBusinessJustification('');
      onClose();
    }
  };

  const handleCancel = () => {
    setReason('');
    setBusinessJustification('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title="Request Manual Override">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-orange-50 border border-orange-200 rounded-md p-4 mb-4">
          <h4 className="text-sm font-semibold text-orange-800 mb-2">⚠️ Override Request</h4>
          <p className="text-sm text-orange-700 mb-2">
            You are requesting to override the following business rule:
          </p>
          <div className="bg-white border border-orange-300 rounded-md p-3 mt-2">
            <p className="text-sm font-semibold text-slate-800">Contract: {contractNo}</p>
            <p className="text-sm text-slate-700 mt-1">Rule: {ruleName}</p>
            <p className="text-xs text-slate-600 mt-1">Rule ID: {ruleId}</p>
          </div>
        </div>

        <div>
          <FormLabel htmlFor="reason">Reason for Override *</FormLabel>
          <FormInput
            component="textarea"
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            placeholder="Explain why this rule should be overridden for this specific contract..."
            className="h-24"
          />
          <p className="text-xs text-slate-500 mt-1">
            Be specific about the circumstances that necessitate this override.
          </p>
        </div>

        <div>
          <FormLabel htmlFor="businessJustification">Business Justification *</FormLabel>
          <FormInput
            component="textarea"
            id="businessJustification"
            value={businessJustification}
            onChange={(e) => setBusinessJustification(e.target.value)}
            required
            placeholder="Provide business justification (e.g., customer relationship, special circumstances, market conditions)..."
            className="h-24"
          />
          <p className="text-xs text-slate-500 mt-1">
            Describe the business impact and why this override is in the company&apos;s best interest.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <h4 className="text-xs font-semibold text-blue-800 mb-1">Override Process</h4>
          <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
            <li>Your request will be sent to the appropriate supervisor for approval</li>
            <li>The contract will be held pending approval</li>
            <li>You will be notified of the approval decision</li>
            <li>All overrides are logged in the audit trail for compliance</li>
          </ul>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={!reason.trim() || !businessJustification.trim()}
          >
            Submit Override Request
          </Button>
        </div>
      </form>
    </Modal>
  );
};

interface OverrideApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  override: OverrideRequest;
  onApprove: (overrideId: string) => void;
  onReject: (overrideId: string, reason: string) => void;
}

export const OverrideApprovalModal: React.FC<OverrideApprovalModalProps> = ({
  isOpen,
  onClose,
  override,
  onApprove,
  onReject,
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleApprove = () => {
    onApprove(override.id);
    onClose();
  };

  const handleReject = () => {
    if (rejectionReason.trim()) {
      onReject(override.id, rejectionReason);
      setRejectionReason('');
      setShowRejectForm(false);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Review Override Request">
      <div className="space-y-4">
        <div className="bg-slate-50 border border-slate-200 rounded-md p-4">
          <h4 className="text-sm font-semibold text-slate-800 mb-3">Request Details</h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-slate-700">Contract:</span>
              <span className="ml-2 text-slate-600">{override.contractId}</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Rule:</span>
              <span className="ml-2 text-slate-600">{override.ruleName}</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Requested By:</span>
              <span className="ml-2 text-slate-600">{override.requestedBy}</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Requested At:</span>
              <span className="ml-2 text-slate-600">
                {new Date(override.requestedAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-800 mb-2">Justification</h4>
          <div className="bg-white border border-slate-200 rounded-md p-3">
            <p className="text-sm text-slate-700 whitespace-pre-line">{override.reason}</p>
          </div>
        </div>

        {!showRejectForm ? (
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button variant="danger" onClick={() => setShowRejectForm(true)}>
              Reject
            </Button>
            <Button onClick={handleApprove}>
              Approve Override
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <FormLabel htmlFor="rejectionReason">Rejection Reason *</FormLabel>
              <FormInput
                component="textarea"
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
                placeholder="Explain why this override request is being rejected..."
                className="h-24"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="secondary" onClick={() => setShowRejectForm(false)}>
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={handleReject}
                disabled={!rejectionReason.trim()}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default OverrideRequestModal;
