/**
 * MyTeamManagement Component
 * Allows primary users to manage their sub-users (max 2)
 */

import React, { useState } from 'react';
import { useSubUsers } from '../../hooks/useSubUsers';
import { SubUser } from '../../types/multiTenant';
import { Button } from '../ui/Form';

interface AddSubUserModalProps {
  onClose: () => void;
  onAdd: (data: { name: string; email: string; permissions: Record<string, boolean> }) => Promise<{ success: boolean; error?: string }>;
}

const AddSubUserModal: React.FC<AddSubUserModalProps> = ({ onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [permissions, setPermissions] = useState<Record<string, boolean>>({
    canViewContracts: true,
    canDownloadReports: true,
    canApproveInvoices: false,
    canUpdateDeliveries: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await onAdd({ name, email, permissions });
    
    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'Failed to add sub-user');
    }
    
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Add Sub-User</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="john.doe@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Permissions
            </label>
            <div className="space-y-2">
              {Object.entries(permissions).map(([key, value]) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setPermissions({ ...permissions, [key]: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Adding...' : 'Send Invitation'}
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface SubUserCardProps {
  subUser: SubUser;
  onUpdate: (subUserId: string, updates: { permissions?: Record<string, boolean>; isActive?: boolean }) => Promise<{ success: boolean; error?: string }>;
  onRemove: (subUserId: string) => Promise<{ success: boolean; error?: string }>;
}

const SubUserCard: React.FC<SubUserCardProps> = ({ subUser, onUpdate, onRemove }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [permissions, setPermissions] = useState(subUser.permissions);

  const handleToggleStatus = async () => {
    await onUpdate(subUser.id, { isActive: !subUser.isActive });
  };

  const handleSavePermissions = async () => {
    const result = await onUpdate(subUser.id, { permissions });
    if (result.success) {
      setIsEditing(false);
    }
  };

  const handleRemove = async () => {
    if (window.confirm(`Are you sure you want to remove ${subUser.name}?`)) {
      await onRemove(subUser.id);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900">{subUser.name}</h4>
          <p className="text-sm text-gray-600">{subUser.email}</p>
          <p className="text-xs text-gray-500 mt-1">
            Last login: {subUser.lastLoginAt ? new Date(subUser.lastLoginAt).toLocaleDateString() : 'Never'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs rounded-full ${
            subUser.isActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {subUser.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-2 mb-3">
          <label className="block text-sm font-medium text-gray-700">Permissions</label>
          <div className="space-y-1">
            {Object.entries(permissions).map(([key, value]) => (
              <label key={key} className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setPermissions({ ...permissions, [key]: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-700">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </span>
              </label>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-3">
          <p className="text-sm text-gray-600">
            Permissions: {Object.entries(subUser.permissions).filter(([, v]) => v).length} granted
          </p>
        </div>
      )}

      <div className="flex gap-2">
        {isEditing ? (
          <>
            <button
              onClick={handleSavePermissions}
              className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="text-sm px-3 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm px-3 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              Edit Permissions
            </button>
            <button
              onClick={handleToggleStatus}
              className="text-sm px-3 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              {subUser.isActive ? 'Deactivate' : 'Activate'}
            </button>
            <button
              onClick={handleRemove}
              className="text-sm px-3 py-1 border border-red-300 text-red-700 rounded hover:bg-red-50"
            >
              Remove
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export const MyTeamManagement: React.FC = () => {
  const {
    subUsers,
    limits,
    loading,
    error,
    hasReachedLimit,
    addSubUser,
    updateSubUser,
    removeSubUser,
  } = useSubUsers();

  const [showAddModal, setShowAddModal] = useState(false);

  if (loading && subUsers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Loading team members...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">My Team</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage your team members ({limits.current}/{limits.max} sub-users added)
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          disabled={hasReachedLimit}
          className="disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Sub-User
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {hasReachedLimit && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
          You have reached the maximum limit of {limits.max} sub-users.
        </div>
      )}

      {subUsers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No sub-users added yet.</p>
          <p className="text-sm mt-2">Click &quot;Add Sub-User&quot; to invite team members.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {subUsers.map((subUser) => (
            <SubUserCard
              key={subUser.id}
              subUser={subUser}
              onUpdate={updateSubUser}
              onRemove={removeSubUser}
            />
          ))}
        </div>
      )}

      {showAddModal && (
        <AddSubUserModal
          onClose={() => setShowAddModal(false)}
          onAdd={addSubUser}
        />
      )}
    </div>
  );
};
