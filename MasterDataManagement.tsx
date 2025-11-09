
import React, { useState } from 'react';
import Card from '../ui/Card';
import Table from '../ui/Table';
import Modal from '../ui/Modal';
import MasterDataForm from '../forms/MasterDataForm';
import { MasterDataItem, User, AuditLog } from '../../types';
import { Button } from '../ui/Form';

interface MasterDataManagementProps {
  title: string;
  initialData: MasterDataItem[];
  currentUser: User;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
}

const MasterDataManagement: React.FC<MasterDataManagementProps> = ({ title, initialData, currentUser, addAuditLog }) => {
  const [items, setItems] = useState<MasterDataItem[]>(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterDataItem | null>(null);

  const handleOpenModal = (item: MasterDataItem | null = null) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingItem(null);
    setIsModalOpen(false);
  };

  const handleSave = (name: string) => {
    const singularTitle = title.slice(0, -1);
    if (editingItem) {
      const updatedItems = items.map(item => item.id === editingItem.id ? { ...item, name } : item);
      setItems(updatedItems);
      addAuditLog({ user: currentUser.name, role: currentUser.role, action: 'Update', module: 'Settings', details: `Updated ${singularTitle}: '${editingItem.name}' to '${name}'`, reason: 'Master data management' });
    } else {
      const newItem: MasterDataItem = { id: Date.now(), name };
      setItems([newItem, ...items]);
      addAuditLog({ user: currentUser.name, role: currentUser.role, action: 'Create', module: 'Settings', details: `Created new ${singularTitle}: '${name}'`, reason: 'Master data management' });
    }
    handleCloseModal();
  };

  const handleDelete = (item: MasterDataItem) => {
    if (window.confirm(`Are you sure you want to delete '${item.name}'?`)) {
      setItems(items.filter(i => i.id !== item.id));
      addAuditLog({ user: currentUser.name, role: currentUser.role, action: 'Delete', module: 'Settings', details: `Deleted ${title.slice(0, -1)}: '${item.name}'`, reason: 'Master data management' });
    }
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    {
      header: 'Actions',
      accessor: (item: MasterDataItem) => (
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
          <Table<MasterDataItem> data={items} columns={columns} />
        </div>
      </Card>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingItem ? `Edit ${title.slice(0, -1)}` : `Add New ${title.slice(0, -1)}`}>
        <MasterDataForm
          item={editingItem}
          onSave={handleSave}
          onCancel={handleCloseModal}
        />
      </Modal>
    </>
  );
};

export default MasterDataManagement;
