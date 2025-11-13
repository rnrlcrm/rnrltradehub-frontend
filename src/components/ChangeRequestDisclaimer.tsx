/**
 * Change Request Disclaimer Component
 * 
 * CRITICAL LEGAL REQUIREMENT:
 * - Shows disclaimer before submitting change request
 * - User must explicitly acknowledge that ongoing trades won't be affected
 * - Captures acceptance for audit trail
 * - Sends email confirmation after submission
 */

import React, { useState } from 'react';

interface Props {
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
    section: string;
  }[];
  onConfirm: (disclaimerAccepted: boolean) => Promise<void>;
  onCancel: () => void;
}

const ChangeRequestDisclaimer: React.FC<Props> = ({ changes, onConfirm, onCancel }) => {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!agreed) {
      alert('Please read and accept the disclaimer to proceed');
      return;
    }

    setLoading(true);
    try {
      await onConfirm(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                Profile Change Request - Important Disclaimer
              </h2>
              <p className="text-sm text-slate-600">
                Please review the following information carefully before submitting your change request.
              </p>
            </div>
          </div>

          {/* Changes Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-blue-900 mb-3">📝 Proposed Changes ({changes.length})</h3>
            <div className="space-y-3">
              {changes.map((change, index) => (
                <div key={index} className="bg-white rounded p-3 text-sm">
                  <p className="font-semibold text-slate-700 mb-1">{change.field}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-slate-500">Current Value:</p>
                      <p className="text-slate-800 font-medium">
                        {change.oldValue || <span className="text-slate-400 italic">Not set</span>}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">New Value:</p>
                      <p className="text-blue-700 font-medium">{change.newValue}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CRITICAL DISCLAIMER */}
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 mb-6">
            <h3 className="font-bold text-red-900 mb-4 text-lg flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              CRITICAL DISCLAIMER - READ CAREFULLY
            </h3>
            
            <div className="space-y-4 text-sm text-red-900">
              <div className="bg-white rounded-lg p-4 border border-red-200">
                <p className="font-bold mb-2">🔒 Ongoing Trades Protection:</p>
                <p className="leading-relaxed">
                  <strong>THIS CHANGE WILL NOT AFFECT ANY ONGOING TRADES OR CONTRACTS.</strong> All existing trades, contracts, 
                  orders, and transactions that were initiated before this change request will continue to use your 
                  <strong> ORIGINAL PROFILE INFORMATION</strong> as recorded at the time of trade creation.
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-red-200">
                <p className="font-bold mb-2">⏱️ Approval Required:</p>
                <p className="leading-relaxed">
                  This change request requires <strong>administrative approval</strong>. Your profile will continue to show 
                  the current information until the change is approved. The approval process typically takes 
                  <strong> 1-2 business days</strong>.
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-red-200">
                <p className="font-bold mb-2">📧 Email Confirmation:</p>
                <p className="leading-relaxed">
                  Upon submission, you will receive an <strong>email confirmation</strong> of this change request at 
                  your registered email address. This email serves as an <strong>audit trail</strong> and legal record 
                  of your request.
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-red-200">
                <p className="font-bold mb-2">🔐 Security & Compliance:</p>
                <p className="leading-relaxed">
                  All change requests are logged with: <strong>(1)</strong> Timestamp, 
                  <strong> (2)</strong> Your IP address, <strong> (3)</strong> Old and new values, 
                  <strong> (4)</strong> Your acceptance of this disclaimer. This information is maintained for 
                  <strong> legal and regulatory compliance</strong> purposes.
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-red-200">
                <p className="font-bold mb-2">⚖️ Legal Implications:</p>
                <p className="leading-relaxed">
                  By submitting this change request, you confirm that: 
                  <strong> (1)</strong> The new information is accurate and true, 
                  <strong> (2)</strong> You have the authority to make this change, 
                  <strong> (3)</strong> You understand that providing false information may result in 
                  <strong> account suspension or legal action</strong>, 
                  <strong> (4)</strong> You agree to the terms of the amendment policy.
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-red-200">
                <p className="font-bold mb-2">�� Trade Settlement:</p>
                <p className="leading-relaxed">
                  For ongoing trades: <strong>(1)</strong> Delivery addresses will remain as per original contract, 
                  <strong> (2)</strong> Banking details for settlement will be as per original contract, 
                  <strong> (3)</strong> GST/tax details will be as per original contract, 
                  <strong> (4)</strong> Contact information for coordination will be as per original contract.
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-red-200">
                <p className="font-bold mb-2">🔄 Future Trades:</p>
                <p className="leading-relaxed">
                  Once this change is <strong>approved</strong>, all <strong>NEW trades</strong> initiated 
                  <strong> after the approval date</strong> will use the updated information. You will be notified 
                  via email when your change request is approved or rejected.
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-red-200">
                <p className="font-bold mb-2">❌ Cancellation Policy:</p>
                <p className="leading-relaxed">
                  You may <strong>cancel this change request</strong> at any time before it is approved. However, 
                  once approved, the changes <strong>cannot be reverted</strong> without submitting a new change request.
                </p>
              </div>
            </div>
          </div>

          {/* Acknowledgment Checkbox */}
          <div className="bg-slate-50 border-2 border-slate-300 rounded-lg p-4 mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-800 leading-relaxed">
                <strong className="text-red-700">I HAVE READ AND UNDERSTOOD THE ABOVE DISCLAIMER.</strong> I acknowledge that:
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li>This change will NOT affect any ongoing trades or contracts</li>
                  <li>I will receive an email confirmation of this request</li>
                  <li>The information provided is accurate and true</li>
                  <li>False information may result in account suspension</li>
                  <li>Admin approval is required before changes take effect</li>
                  <li>This action is being recorded for audit and compliance purposes</li>
                </ul>
              </span>
            </label>
          </div>

          {/* What Happens Next */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-green-900 mb-3">✅ What Happens After Submission?</h3>
            <ol className="space-y-2 text-sm text-green-800">
              <li className="flex items-start gap-2">
                <span className="font-bold">1.</span>
                <span><strong>Immediate:</strong> Email confirmation sent to your registered email</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">2.</span>
                <span><strong>Within 1-2 days:</strong> Admin reviews your change request</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">3.</span>
                <span><strong>Upon approval:</strong> Changes applied to your profile</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">4.</span>
                <span><strong>Email notification:</strong> You'll be notified of approval/rejection</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">5.</span>
                <span><strong>Audit trail:</strong> All actions logged for compliance</span>
              </li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!agreed || loading}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </span>
              ) : (
                'I Agree - Submit Change Request'
              )}
            </button>
          </div>

          {/* Footer Note */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-slate-500 text-center">
              By clicking "I Agree - Submit Change Request", you accept this disclaimer and confirm that 
              you have read and understood all the terms mentioned above. This action is recorded for audit purposes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangeRequestDisclaimer;
