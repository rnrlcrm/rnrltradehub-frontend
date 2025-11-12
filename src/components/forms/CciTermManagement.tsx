
import React, { useState } from 'react';
import Card from '../ui/Card';
import Table from '../ui/Table';
import Modal from '../ui/Modal';
import CciTermForm from '../forms/CciTermForm';
import { CciTerm, User, AuditLog } from '../../types';
import { Button } from '../ui/Form';
import { isDuplicateName } from '../../utils/validation';

interface CciTermManagementProps {
  initialData: CciTerm[];
  currentUser: User;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
}

const CciTermManagement: React.FC<CciTermManagementProps> = ({ initialData, currentUser, addAuditLog }) => {
  const [items, setItems] = useState<CciTerm[]>(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CciTerm | null>(null);

  const handleOpenModal = (item: CciTerm | null = null) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingItem(null);
    setIsModalOpen(false);
  };

  const handleSave = (data: Omit<CciTerm, 'id'>) => {
    // Check for duplicate name
    if (isDuplicateName(items, data.name, editingItem?.id)) {
      alert(`A CCI term with the name "${data.name}" already exists. Please use a different name.`);
      return;
    }

    const details = `CCI Term: ${data.name}`;
    if (editingItem) {
      const updatedItems = items.map(item => item.id === editingItem.id ? { ...editingItem, ...data } : item);
      setItems(updatedItems);
      addAuditLog({ user: currentUser.name, role: currentUser.role, action: 'Update', module: 'Settings', details: `Updated ${details}`, reason: 'Master data management' });
    } else {
      const newItem: CciTerm = { id: Date.now(), ...data };
      setItems([newItem, ...items]);
      addAuditLog({ user: currentUser.name, role: currentUser.role, action: 'Create', module: 'Settings', details: `Created new ${details}`, reason: 'Master data management' });
    }
    handleCloseModal();
  };

  const handleDelete = (item: CciTerm) => {
    const details = `CCI Term: ${item.name}`;
    if (window.confirm(`Are you sure you want to delete the CCI term '${item.name}'?`)) {
      setItems(items.filter(i => i.id !== item.id));
      addAuditLog({ user: currentUser.name, role: currentUser.role, action: 'Delete', module: 'Settings', details: `Deleted ${details}`, reason: 'Master data management' });
    }
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { 
      header: 'Effective Period', 
      accessor: (item: CciTerm) => {
        const from = new Date(item.effectiveFrom).toLocaleDateString();
        const to = item.effectiveTo ? new Date(item.effectiveTo).toLocaleDateString() : 'Current';
        return `${from} - ${to}`;
      }
    },
    { 
      header: 'Status', 
      accessor: (item: CciTerm) => (
        <span className={`px-2 py-1 text-xs rounded ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {item.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    { header: 'Version', accessor: (item: CciTerm) => `v${item.version}` },
    { header: 'Candy Factor', accessor: (item: CciTerm) => item.candy_factor },
    { header: 'GST Rate', accessor: (item: CciTerm) => `${item.gst_rate}%` },
    {
      header: 'Actions',
      accessor: (item: CciTerm) => (
        <div className="space-x-4">
          <button onClick={() => handleOpenModal(item)} className="text-blue-600 hover:underline text-sm font-medium">Edit</button>
          <button onClick={() => handleDelete(item)} className="text-red-600 hover:underline text-sm font-medium">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Card title="CCI Trade Terms Master" actions={
        <Button onClick={() => handleOpenModal()} className="text-sm">
          Add CCI Term
        </Button>
      }>
        <Table<CciTerm> data={items} columns={columns} />
      </Card>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingItem ? `Edit CCI Term` : `Add New CCI Term`}>
        <CciTermForm
          item={editingItem}
          onSave={handleSave}
          onCancel={handleCloseModal}
        />
      </Modal>
    </>
  );
};

export default CciTermManagement;
