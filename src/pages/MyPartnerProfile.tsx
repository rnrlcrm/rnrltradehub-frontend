/**
 * My Partner Profile - Complete Profile Management
 * 
 * Features:
 * - View complete profile (all fields)
 * - Edit any field triggers change request → admin approval
 * - Sub-users: User can add/edit/delete (no admin interference)
 * - Branches: User can add/edit/delete
 * - Complete audit trail (who, when, what changed)
 * - Documents: Upload/replace documents
 * - KYC status display
 * - Pending change requests display
 */

import React, { useState, useEffect } from 'react';
import { 
  BusinessPartner, 
  ChangeRequest, 
  SubUser,
  DocumentRecord,
  KYCRecord,
} from '../types/businessPartner';
import { businessPartnerApi } from '../api/businessPartnerApi';
import BranchManagement from '../components/BranchManagement';

interface Props {
  userId: string;
  partnerId: string;
}

type Section = 'overview' | 'contact' | 'compliance' | 'address' | 'banking' | 'branches' | 'sub-users' | 'documents' | 'kyc' | 'audit-trail';

const MyPartnerProfile: React.FC<Props> = ({ userId, partnerId }) => {
  const [partner, setPartner] = useState<BusinessPartner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState<Section>('overview');
  
  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<BusinessPartner>>({});
  const [pendingChanges, setPendingChanges] = useState<any>({});
  
  // Change requests
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  
  // Sub-users
  const [showAddSubUser, setShowAddSubUser] = useState(false);
  const [newSubUser, setNewSubUser] = useState<Partial<SubUser>>({
    name: '',
    email: '',
    phone: '',
    designation: '',
    role: 'SUB_USER',
    permissions: [],
    branchAccess: [],
  });

  useEffect(() => {
    loadPartner();
    loadChangeRequests();
  }, [partnerId]);

  const loadPartner = async () => {
    setLoading(true);
    try {
      const data = await businessPartnerApi.getPartnerById(partnerId);
      setPartner(data);
      setEditData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadChangeRequests = async () => {
    try {
      const requests = await businessPartnerApi.getChangeRequests(partnerId);
      setChangeRequests(requests.filter(r => r.status === 'PENDING'));
    } catch (err: any) {
      console.error('Failed to load change requests:', err);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel edit
      setIsEditing(false);
      setEditData(partner || {});
      setPendingChanges({});
      setError('');
    } else {
      // Start edit
      setIsEditing(true);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setEditData(prev => {
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

    // Track changes
    setPendingChanges((prev: any) => ({
      ...prev,
      [field]: { oldValue: getFieldValue(partner, field), newValue: value },
    }));
  };

  const getFieldValue = (obj: any, path: string): any => {
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current?.[part] === undefined) return undefined;
      current = current[part];
    }
    return current;
  };

  const handleSaveChanges = async () => {
    if (Object.keys(pendingChanges).length === 0) {
      setError('No changes to save');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create change request
      const changes = Object.entries(pendingChanges).map(([field, change]: [string, any]) => ({
        field,
        oldValue: change.oldValue,
        newValue: change.newValue,
        section: getSectionForField(field),
      }));

      const changeRequest = await businessPartnerApi.createChangeRequest(
        partnerId,
        changes,
        'User requested profile update'
      );

      setChangeRequests(prev => [...prev, changeRequest]);
      setIsEditing(false);
      setPendingChanges({});
      
      alert('Change request submitted successfully! Admin will review your changes.');
    } catch (err: any) {
      setError(err.message || 'Failed to submit change request');
    } finally {
      setLoading(false);
    }
  };

  const getSectionForField = (field: string): string => {
    if (field.includes('contact')) return 'contact';
    if (field.includes('address')) return 'address';
    if (field.includes('bank')) return 'banking';
    if (field.includes('pan') || field.includes('gst') || field.includes('cin')) return 'compliance';
    return 'basic';
  };

  // Sub-user management
  const handleAddSubUser = async () => {
    if (!newSubUser.name || !newSubUser.email || !newSubUser.phone) {
      setError('Name, email, and phone are required for sub-user');
      return;
    }

    if (partner && partner.subUsers.length >= 2) {
      setError('Maximum 2 sub-users allowed');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await businessPartnerApi.addSubUser(partnerId, {
        ...newSubUser,
        partnerId,
        status: 'PENDING',
        approvalStatus: 'PENDING',
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Omit<SubUser, 'id'>);

      setShowAddSubUser(false);
      setNewSubUser({
        name: '',
        email: '',
        phone: '',
        designation: '',
        role: 'SUB_USER',
        permissions: [],
        branchAccess: [],
      });
      
      loadPartner(); // Reload to show new sub-user
      alert('Sub-user added! They will receive login credentials after admin approval.');
    } catch (err: any) {
      setError(err.message || 'Failed to add sub-user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubUser = async (subUserId: string) => {
    if (!confirm('Are you sure you want to remove this sub-user?')) {
      return;
    }

    setLoading(true);
    try {
      await businessPartnerApi.deleteSubUser(partnerId, subUserId);
      loadPartner();
      alert('Sub-user removed successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to remove sub-user');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = async (documentType: string, file: File) => {
    setLoading(true);
    setError('');

    try {
      await businessPartnerApi.uploadDocument(partnerId, documentType, file);
      loadPartner();
      alert('Document uploaded successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !partner) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error && !partner) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-700">{error}</p>
          <button onClick={loadPartner} className="mt-4 text-blue-600 hover:underline">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!partner) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">{partner.legalName}</h1>
              <p className="text-slate-600 mt-1">
                Partner Code: <span className="font-mono font-semibold">{partner.partnerCode}</span>
              </p>
              <div className="flex gap-2 mt-3">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  partner.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                  partner.status === 'INACTIVE' ? 'bg-slate-200 text-slate-700' :
                  partner.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {partner.status}
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                  {partner.businessType}
                </span>
                {partner.hasGST && (
                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
                    GST Registered
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <button
                onClick={handleEditToggle}
                disabled={loading || changeRequests.length > 0}
                className={`px-6 py-2 rounded-lg font-medium ${
                  isEditing
                    ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isEditing ? 'Cancel Edit' : 'Edit Profile'}
              </button>
              {changeRequests.length > 0 && (
                <p className="text-xs text-amber-600 mt-2">
                  ⚠️ {changeRequests.length} pending change request(s)
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {isEditing && Object.keys(pendingChanges).length > 0 && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
            <p className="text-amber-800 font-medium">
              You have {Object.keys(pendingChanges).length} unsaved change(s). 
              Click "Save Changes" to submit for approval.
            </p>
            <button
              onClick={handleSaveChanges}
              disabled={loading}
              className="mt-3 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Save Changes (Submit for Approval)'}
            </button>
          </div>
        )}

        {/* Pending Change Requests */}
        {changeRequests.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-blue-900 mb-3">Pending Change Requests</h3>
            {changeRequests.map(cr => (
              <div key={cr.id} className="bg-white rounded p-3 mb-2 border border-blue-200">
                <p className="text-sm text-slate-700">
                  <strong>Requested:</strong> {new Date(cr.requestedAt).toLocaleString()}
                </p>
                <p className="text-sm text-slate-700">
                  <strong>Changes:</strong> {cr.changes.length} field(s)
                </p>
                <p className="text-xs text-slate-500 mt-1">Status: Awaiting admin approval</p>
              </div>
            ))}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6 overflow-x-auto">
          <div className="flex border-b">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'contact', label: 'Contact', icon: '📧' },
              { id: 'compliance', label: 'Compliance', icon: '📋' },
              { id: 'address', label: 'Address', icon: '📍' },
              { id: 'banking', label: 'Banking', icon: '🏦' },
              { id: 'branches', label: 'Branches', icon: '🏢' },
              { id: 'sub-users', label: 'Sub-Users', icon: '👥' },
              { id: 'documents', label: 'Documents', icon: '📄' },
              { id: 'kyc', label: 'KYC Status', icon: '✅' },
              { id: 'audit-trail', label: 'Audit Trail', icon: '📜' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as Section)}
                className={`px-6 py-4 font-medium whitespace-nowrap ${
                  activeSection === tab.id
                    ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {activeSection === 'overview' && (
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Profile Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Legal Name</label>
                  <input
                    type="text"
                    value={isEditing ? editData.legalName : partner.legalName}
                    onChange={(e) => handleFieldChange('legalName', e.target.value)}
                    disabled={!isEditing}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Trade Name</label>
                  <input
                    type="text"
                    value={isEditing ? editData.tradeName : partner.tradeName}
                    onChange={(e) => handleFieldChange('tradeName', e.target.value)}
                    disabled={!isEditing}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Business Type</label>
                  <input
                    type="text"
                    value={partner.businessType}
                    disabled
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 bg-slate-100 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-500 mt-1">Business type cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Registration Type</label>
                  <input
                    type="text"
                    value={partner.registrationType}
                    disabled
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 bg-slate-100 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'contact' && (
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Contact Person</label>
                  <input
                    type="text"
                    value={isEditing ? editData.primaryContactPerson : partner.primaryContactPerson}
                    onChange={(e) => handleFieldChange('primaryContactPerson', e.target.value)}
                    disabled={!isEditing}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email (Login ID)</label>
                  <input
                    type="email"
                    value={isEditing ? editData.primaryContactEmail : partner.primaryContactEmail}
                    onChange={(e) => handleFieldChange('primaryContactEmail', e.target.value)}
                    disabled={!isEditing}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 disabled:bg-slate-100"
                  />
                  {partner.verification?.email.verified && (
                    <p className="text-xs text-green-600 mt-1">✓ Verified</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={isEditing ? editData.primaryContactPhone : partner.primaryContactPhone}
                    onChange={(e) => handleFieldChange('primaryContactPhone', e.target.value)}
                    disabled={!isEditing}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 disabled:bg-slate-100"
                  />
                  {partner.verification?.mobile.verified && (
                    <p className="text-xs text-green-600 mt-1">✓ Verified</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'compliance' && (
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Compliance Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">PAN Number</label>
                  <input
                    type="text"
                    value={partner.pan}
                    disabled
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 bg-slate-100 cursor-not-allowed font-mono"
                  />
                  <p className="text-xs text-slate-500 mt-1">PAN cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">GST Number</label>
                  <input
                    type="text"
                    value={isEditing ? editData.gstNumber : partner.gstNumber}
                    onChange={(e) => handleFieldChange('gstNumber', e.target.value.toUpperCase())}
                    disabled={!isEditing}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2 disabled:bg-slate-100 font-mono"
                  />
                </div>
                {partner.registrationType === 'COMPANY' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">CIN</label>
                      <input
                        type="text"
                        value={isEditing ? editData.cin : partner.cin}
                        onChange={(e) => handleFieldChange('cin', e.target.value.toUpperCase())}
                        disabled={!isEditing}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2 disabled:bg-slate-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">TAN</label>
                      <input
                        type="text"
                        value={isEditing ? editData.tan : partner.tan}
                        onChange={(e) => handleFieldChange('tan', e.target.value.toUpperCase())}
                        disabled={!isEditing}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2 disabled:bg-slate-100 font-mono"
                      />
                    </div>
                  </>
                )}
                {partner.registrationType === 'INDIVIDUAL' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Aadhar Number</label>
                    <input
                      type="text"
                      value={isEditing ? editData.aadharNumber : partner.aadharNumber}
                      onChange={(e) => handleFieldChange('aadharNumber', e.target.value)}
                      disabled={!isEditing}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2 disabled:bg-slate-100 font-mono"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'branches' && (
            <BranchManagement partnerId={partnerId} readOnly={false} />
          )}

          {activeSection === 'sub-users' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Sub-Users</h2>
                  <p className="text-sm text-slate-600">You can manage up to 2 additional users</p>
                </div>
                {partner.subUsers.length < 2 && (
                  <button
                    onClick={() => setShowAddSubUser(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    + Add Sub-User
                  </button>
                )}
              </div>

              {showAddSubUser && (
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-bold text-slate-800 mb-4">Add Sub-User</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Name *</label>
                      <input
                        type="text"
                        value={newSubUser.name}
                        onChange={(e) => setNewSubUser({...newSubUser, name: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                      <input
                        type="email"
                        value={newSubUser.email}
                        onChange={(e) => setNewSubUser({...newSubUser, email: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Phone *</label>
                      <input
                        type="tel"
                        value={newSubUser.phone}
                        onChange={(e) => setNewSubUser({...newSubUser, phone: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Designation</label>
                      <input
                        type="text"
                        value={newSubUser.designation}
                        onChange={(e) => setNewSubUser({...newSubUser, designation: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      onClick={() => setShowAddSubUser(false)}
                      className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddSubUser}
                      disabled={loading}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {loading ? 'Adding...' : 'Add Sub-User'}
                    </button>
                  </div>
                </div>
              )}

              {partner.subUsers.length === 0 && !showAddSubUser && (
                <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                  <p className="text-slate-600">No sub-users added yet</p>
                  <p className="text-sm text-slate-500 mt-2">Click "Add Sub-User" to invite team members</p>
                </div>
              )}

              {partner.subUsers.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {partner.subUsers.map(subUser => (
                    <div key={subUser.id} className="border-2 border-slate-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-slate-800">{subUser.name}</h3>
                          <p className="text-sm text-slate-600">{subUser.email}</p>
                          <p className="text-sm text-slate-600">{subUser.phone}</p>
                          {subUser.designation && (
                            <p className="text-xs text-slate-500 mt-1">{subUser.designation}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteSubUser(subUser.id)}
                          className="text-red-600 hover:text-red-700 p-1"
                          title="Remove"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          subUser.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                          subUser.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-slate-200 text-slate-700'
                        }`}>
                          {subUser.status}
                        </span>
                        {subUser.approvalStatus === 'PENDING' && (
                          <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-800">
                            Pending Admin Approval
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === 'audit-trail' && (
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Audit Trail</h2>
              <div className="space-y-3">
                {partner.auditTrail?.length > 0 ? (
                  partner.auditTrail.map((entry, index) => (
                    <div key={index} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-slate-800">{entry.action}</p>
                          <p className="text-sm text-slate-600 mt-1">{entry.details}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">{entry.user}</p>
                          <p className="text-xs text-slate-500">{new Date(entry.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    No audit trail entries yet
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Placeholder for other sections */}
          {!['overview', 'contact', 'compliance', 'branches', 'sub-users', 'audit-trail'].includes(activeSection) && (
            <div className="text-center py-12">
              <p className="text-slate-600">Content for {activeSection} section coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyPartnerProfile;
