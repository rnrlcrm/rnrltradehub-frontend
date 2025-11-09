
import React, { useState } from 'react';
import Card from '../ui/Card';
import Table from '../ui/Table';
import Modal from '../ui/Modal';
import StructuredTermForm from '../forms/StructuredTermForm';
import { StructuredTerm, User, AuditLog } from '../../types';
import { Button } from '../ui/Form';

interface StructuredTermManagementProps {
  title: string;
  initialData: StructuredTerm[];
  currentUser: User;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
}

const StructuredTermManagement: React.FC<StructuredTermManagementProps> = ({ title, initialData, currentUser, addAuditLog }) => {
  const [items, setItems] = useState<StructuredTerm[]>(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StructuredTerm | null>(null);

  const handleOpenModal = (item: StructuredTerm | null = null) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingItem(null);
    setIsModalOpen(false);
  };

  const handleSave = (data: Omit<StructuredTerm, 'id'>) => {
    const singularTitle = title.slice(0, -1);
    if (editingItem) {
      const updatedItems = items.map(item => item.id === editingItem.id ? { ...editingItem, ...data } : item);
      setItems(updatedItems);
      addAuditLog({ user: currentUser.name, role: currentUser.role, action: 'Update', module: 'Settings', details: `Updated ${singularTitle}: '${data.name}'`, reason: 'Master data management' });
    } else {
      const newItem: StructuredTerm = { id: Date.now(), ...data };
      setItems([newItem, ...items]);
      addAuditLog({ user: currentUser.name, role: currentUser.role, action: 'Create', module: 'Settings', details: `Created new ${singularTitle}: '${data.name}'`, reason: 'Master data management' });
    }
    handleCloseModal();
  };

  const handleDelete = (item: StructuredTerm) => {
    if (window.confirm(`Are you sure you want to delete '${item.name}'?`)) {
      setItems(items.filter(i => i.id !== item.id));
      addAuditLog({ user: currentUser.name, role: currentUser.role, action: 'Delete', module: 'Settings', details: `Deleted ${title.slice(0, -1)}: '${item.name}'`, reason: 'Master data management' });
    }
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Days', accessor: 'days' },
    {
      header: 'Actions',
      accessor: (item: StructuredTerm) => (
        <div className="space-x-4">
          <button onClick={() => handleOpenModal(item)} className="text-blue-600 hover:underline text-sm font-medium">Edit</button>
          <button onClick={() => handleDelete(item)} className="text-red-600 hover:underline text-sm font-medium">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Card title={title} actions={
        <Button onClick={() => handleOpenModal()} className="text-sm">Add New</Button>
      }>
        <div className="max-h-60 overflow-y-auto -m-5">
          <Table<StructuredTerm> data={items} columns={columns} />
        </div>
      </Card>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingItem ? `Edit ${title.slice(0, -1)}` : `Add New ${title.slice(0, -1)}`}>
        <StructuredTermForm
          item={editingItem}
          onSave={handleSave}
          onCancel={handleCloseModal}
        />
      </Modal>
    </>
  );
};

export default StructuredTermManagement;
