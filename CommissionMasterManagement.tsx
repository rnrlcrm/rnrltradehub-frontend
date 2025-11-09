
import React, { useState } from 'react';
import Card from '../ui/Card';
import Table from '../ui/Table';
import Modal from '../ui/Modal';
import CommissionMasterForm from '../forms/CommissionMasterForm';
import { CommissionStructure, User, AuditLog } from '../../types';
import { Button } from '../ui/Form';

interface CommissionMasterManagementProps {
  initialData: CommissionStructure[];
  currentUser: User;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
}

const CommissionMasterManagement: React.FC<CommissionMasterManagementProps> = ({ initialData, currentUser, addAuditLog }) => {
  const [items, setItems] = useState<CommissionStructure[]>(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CommissionStructure | null>(null);

  const handleOpenModal = (item: CommissionStructure | null = null) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingItem(null);
    setIsModalOpen(false);
  };

  const handleSave = (data: Omit<CommissionStructure, 'id'>) => {
    const details = `Commission: '${data.name}'`;
    if (editingItem) {
      const updatedItems = items.map(item => item.id === editingItem.id ? { ...editingItem, ...data } : item);
      setItems(updatedItems);
      addAuditLog({ user: currentUser.name, role: currentUser.role, action: 'Update', module: 'Settings', details: `Updated ${details}`, reason: 'Master data management' });
    } else {
      const newItem: CommissionStructure = { id: Date.now(), ...data };
      setItems([newItem, ...items]);
      addAuditLog({ user: currentUser.name, role: currentUser.role, action: 'Create', module: 'Settings', details: `Created new ${details}`, reason: 'Master data management' });
    }
    handleCloseModal();
  };

  const handleDelete = (item: CommissionStructure) => {
    if (window.confirm(`Are you sure you want to delete '${item.name}'?`)) {
      setItems(items.filter(i => i.id !== item.id));
      addAuditLog({ user: currentUser.name, role: currentUser.role, action: 'Delete', module: 'Settings', details: `Deleted Commission: '${item.name}'`, reason: 'Master data management' });
    }
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Type', accessor: 'type' },
    { header: 'Value', accessor: (item: CommissionStructure) => item.type === 'PERCENTAGE' ? `${item.value}%` : `₹${item.value}/Bale` },
    {
      header: 'Actions',
      accessor: (item: CommissionStructure) => (
        <div className="space-x-4">
          <button onClick={() => handleOpenModal(item)} className="text-blue-600 hover:underline text-sm font-medium">Edit</button>
          <button onClick={() => handleDelete(item)} className="text-red-600 hover:underline text-sm font-medium">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Card title="Commission Master" actions={
        <Button onClick={() => handleOpenModal()} className="text-sm">Add New</Button>
      }>
        <Table<CommissionStructure> data={items} columns={columns} />
      </Card>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingItem ? `Edit Commission` : `Add New Commission`}>
        <CommissionMasterForm
          item={editingItem}
          onSave={handleSave}
          onCancel={handleCloseModal}
        />
      </Modal>
    </>
  );
};

export default CommissionMasterManagement;
