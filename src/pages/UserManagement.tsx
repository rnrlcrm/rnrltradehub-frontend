
import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import UserForm from '../components/forms/UserForm';
import { User as MultiTenantUser } from '../types/multiTenant';
import { User as OldUser } from '../types';
import { multiTenantApi } from '../api/multiTenantApi';
import { hasPermission } from '../lib/permissions';
import { Button } from '../components/ui/Form';

interface UserManagementProps {
  currentUser: OldUser | MultiTenantUser; // Accept both old and new User types for compatibility
}

// Extended user type with custom permissions (not in the base type)
interface UserWithCustomPermissions extends MultiTenantUser {
  customPermissions?: Record<string, string[]>;
}

const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<MultiTenantUser[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('view');
  const [selectedUser, setSelectedUser] = useState<MultiTenantUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterUserType, setFilterUserType] = useState<string>('');
  const [filterActive, setFilterActive] = useState<string>('');

  const canCreate = hasPermission(currentUser.role, 'User Management', 'create');
  const canUpdate = hasPermission(currentUser.role, 'User Management', 'update');
  const canDelete = hasPermission(currentUser.role, 'User Management', 'delete');
  const canRead = hasPermission(currentUser.role, 'User Management', 'read');

  // Check if this is a standalone page (via direct URL) or embedded in Settings
  const isStandalone = window.location.hash === '#user-management';

  // Fetch users from backend API
  useEffect(() => {
    fetchUsers();
  }, [filterUserType, filterActive]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: { userType?: string; isActive?: boolean } = {};
      if (filterUserType) filters.userType = filterUserType;
      if (filterActive) filters.isActive = filterActive === 'true';
      
      const fetchedUsers = await multiTenantApi.getAllUsers(filters);
      setUsers(fetchedUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!canRead) {
    return (
      <Card title="Access Denied">
        <p className="text-red-600">You do not have permission to view this section. Please contact an administrator.</p>
      </Card>
    );
  }

  const handleOpenModal = (mode: 'add' | 'edit' | 'view', user: MultiTenantUser | null = null) => {
    setModalMode(mode);
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleSave = async (data: MultiTenantUser) => {
    setError(null);
    try {
      if (modalMode === 'add') {
        await multiTenantApi.createUser(data);
      } else if (selectedUser) {
        await multiTenantApi.updateUser(selectedUser.id, data);
      }
      await fetchUsers(); // Refresh the list
      handleCloseModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user');
      console.error('Failed to save user:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setError(null);
      try {
        await multiTenantApi.deleteUser(id);
        await fetchUsers(); // Refresh the list
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete user');
        console.error('Failed to delete user:', err);
      }
    }
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { 
      header: 'User Type', 
      accessor: (user: MultiTenantUser) => (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          {user.userType === 'back_office' ? 'Back Office' : user.userType === 'client' ? 'Client' : 'Vendor'}
        </span>
      )
    },
    { 
      header: 'Role', 
      accessor: (user: MultiTenantUser) => {
        const userWithPerms = user as UserWithCustomPermissions;
        const hasCustomPerms = !!userWithPerms.customPermissions && Object.keys(userWithPerms.customPermissions).length > 0;
        return (
          <div className="flex items-center gap-2">
            <span>{user.role || 'N/A'}</span>
            {hasCustomPerms && (
              <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full font-medium" title="Has custom permissions">
                Custom
              </span>
            )}
            {user.isSubUser && (
              <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full font-medium" title="Sub-user">
                Sub
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Status',
      accessor: (user: MultiTenantUser) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          user.status === 'active' ? 'bg-green-100 text-green-800' : 
          user.status === 'inactive' ? 'bg-gray-100 text-gray-800' : 
          'bg-red-100 text-red-800'
        }`}>
          {user.status}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: (user: MultiTenantUser) => (
        <div className="space-x-4">
          {canRead && <button onClick={() => handleOpenModal('view', user)} className="text-blue-600 hover:underline text-sm font-medium">View</button>}
          {canUpdate && <button onClick={() => handleOpenModal('edit', user)} className="text-blue-600 hover:underline text-sm font-medium">Edit</button>}
          {canDelete && user.id !== currentUser.id && <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:underline text-sm font-medium">Delete</button>}
        </div>
      ),
    },
  ];

  const cardActions = canCreate ? (
    <Button onClick={() => handleOpenModal('add')} className="text-sm">Add User</Button>
  ) : null;

  const getModalTitle = () => {
    if (modalMode === 'add') return 'Add New User';
    if (modalMode === 'edit') return `Edit User: ${selectedUser?.name}`;
    return `View User: ${selectedUser?.name}`;
  };

  return (
    <div className="space-y-6">
      {isStandalone && (
        <Card className="bg-blue-50 border-blue-200">
          <div className="p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> User Management is now part of the Settings module under the Access Control tab. 
              Please navigate to <a href="#settings" className="underline font-semibold">Settings → Access Control → User Management</a> for the updated interface.
            </p>
          </div>
        </Card>
      )}
      
      <Card title="Permission Modes" className="bg-blue-50 border-blue-200">
        <div className="p-4 space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="px-2 py-0.5 text-xs bg-slate-200 text-slate-700 rounded font-medium mt-0.5">Role-Based</span>
            <p className="text-slate-700">Users inherit permissions from their assigned role (configured in Roles & Rights)</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded font-medium mt-0.5">Custom</span>
            <p className="text-slate-700">Users with custom permissions have module-specific access that overrides role defaults</p>
          </div>
        </div>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <Card title="System Users" actions={cardActions}>
        {/* Filters */}
        <div className="mb-4 flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by User Type</label>
            <select
              value={filterUserType}
              onChange={(e) => setFilterUserType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="back_office">Back Office</option>
              <option value="client">Client</option>
              <option value="vendor">Vendor</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading users...</p>
          </div>
        ) : (
          <Table<MultiTenantUser> data={users} columns={columns} />
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={getModalTitle()}>
        <UserForm
          user={selectedUser}
          readOnly={modalMode === 'view'}
          onSave={handleSave}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
};

export default UserManagement;
