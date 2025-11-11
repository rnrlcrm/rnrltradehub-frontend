
import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import UserForm from '../components/forms/UserForm';
import { mockUsers } from '../data/mockData';
import { User } from '../types';
import { hasPermission } from '../lib/permissions';
import { Button } from '../components/ui/Form';

interface UserManagementProps {
  currentUser: User;
}

const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('view');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const canCreate = hasPermission(currentUser.role, 'User Management', 'create');
  const canUpdate = hasPermission(currentUser.role, 'User Management', 'update');
  const canDelete = hasPermission(currentUser.role, 'User Management', 'delete');
  const canRead = hasPermission(currentUser.role, 'User Management', 'read');

  // Check if this is a standalone page (via direct URL) or embedded in Settings
  const isStandalone = window.location.hash === '#user-management';

  if (!canRead) {
    return (
      <Card title="Access Denied">
        <p className="text-red-600">You do not have permission to view this section. Please contact an administrator.</p>
      </Card>
    );
  }

  const handleOpenModal = (mode: 'add' | 'edit' | 'view', user: User | null = null) => {
    setModalMode(mode);
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleSave = (data: User) => {
    if (modalMode === 'add') {
      const newUser = { ...data, id: Math.max(...users.map(u => u.id)) + 1 };
      setUsers([newUser, ...users]);
    } else {
      setUsers(users.map(u => u.id === data.id ? data : u));
    }
    handleCloseModal();
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { 
      header: 'Role', 
      accessor: (user: User) => {
        const hasCustomPerms = !!(user as any).customPermissions && Object.keys((user as any).customPermissions).length > 0;
        return (
          <div className="flex items-center gap-2">
            <span>{user.role}</span>
            {hasCustomPerms && (
              <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full font-medium" title="Has custom permissions">
                Custom
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Actions',
      accessor: (user: User) => (
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

      <Card title="System Users" actions={cardActions}>
        <Table<User> data={users} columns={columns} />
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
