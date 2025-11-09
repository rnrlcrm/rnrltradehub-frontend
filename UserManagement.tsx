
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

  if (!canRead) {
    return (
      <Card title="Access Denied">
        <p className="text-red-600">You do not have permission to view this page. Please contact an administrator.</p>
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
    { header: 'Role', accessor: 'role' },
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
      <h1 className="text-2xl font-semibold text-slate-800">User Management</h1>
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
