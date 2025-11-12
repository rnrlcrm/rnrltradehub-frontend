
import React, { useState } from 'react';
import Card from '../ui/Card';
import Table from '../ui/Table';
import Modal from '../ui/Modal';
import GstRateForm from '../forms/GstRateForm';
import { GstRate, User, AuditLog } from '../../types';
import { Button } from '../ui/Form';
import { isDuplicateHsnCode } from '../../utils/validation';

interface GstRateManagementProps {
  initialData: GstRate[];
  currentUser: User;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
}

const GstRateManagement: React.FC<GstRateManagementProps> = ({ initialData, currentUser, addAuditLog }) => {
  const [items, setItems] = useState<GstRate[]>(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GstRate | null>(null);

  const handleOpenModal = (item: GstRate | null = null) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingItem(null);
    setIsModalOpen(false);
  };

  const handleSave = (data: Omit<GstRate, 'id'>) => {
    // Check for duplicate HSN code
    if (isDuplicateHsnCode(items, data.hsnCode, editingItem?.id)) {
      alert(`A GST rate with the HSN code "${data.hsnCode}" already exists. Please use a different HSN code.`);
      return;
    }

    const details = `GST Rate: ${data.rate}% for ${data.description}`;
    if (editingItem) {
      const updatedItems = items.map(item => item.id === editingItem.id ? { ...editingItem, ...data } : item);
      setItems(updatedItems);
      addAuditLog({ user: currentUser.name, role: currentUser.role, action: 'Update', module: 'Settings', details: `Updated ${details}`, reason: 'Master data management' });
    } else {
      const newItem: GstRate = { id: Date.now(), ...data };
      setItems([newItem, ...items]);
      addAuditLog({ user: currentUser.name, role: currentUser.role, action: 'Create', module: 'Settings', details: `Created new ${details}`, reason: 'Master data management' });
    }
    handleCloseModal();
  };

  const handleDelete = (item: GstRate) => {
    if (window.confirm(`Are you sure you want to delete the GST rate '${item.rate}% - ${item.description}'?`)) {
      setItems(items.filter(i => i.id !== item.id));
      addAuditLog({ user: currentUser.name, role: currentUser.role, action: 'Delete', module: 'Settings', details: `Deleted GST Rate: ${item.rate}%`, reason: 'Master data management' });
    }
  };

  const columns = [
    { header: 'Description', accessor: 'description' },
    { header: 'HSN Code', accessor: 'hsnCode' },
    { header: 'Rate', accessor: (item: GstRate) => `${item.rate}%` },
    {
      header: 'Actions',
      accessor: (item: GstRate) => (
        <div className="space-x-4">
          <button onClick={() => handleOpenModal(item)} className="text-blue-600 hover:underline text-sm font-medium">Edit</button>
          <button onClick={() => handleDelete(item)} className="text-red-600 hover:underline text-sm font-medium">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Card title="GST Master" actions={
        <Button onClick={() => handleOpenModal()} className="text-sm">Add GST Rate</Button>
      }>
        <Table<GstRate> data={items} columns={columns} />
      </Card>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingItem ? 'Edit GST Rate' : 'Add New GST Rate'}>
        <GstRateForm
          item={editingItem}
          onSave={handleSave}
          onCancel={handleCloseModal}
        />
      </Modal>
    </>
  );
};

export default GstRateManagement;
