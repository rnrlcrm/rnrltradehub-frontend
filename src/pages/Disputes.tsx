
import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import DisputeForm from '../components/forms/DisputeForm';
import { mockDisputes } from '../data/mockData';
import { Dispute, User } from '../types';
import { hasPermission } from '../lib/permissions';
import { Button } from '../components/ui/Form';

interface DisputesProps {
  currentUser: User;
}

const StatusBadge: React.FC<{ status: Dispute['status'] }> = ({ status }) => {
  const baseClasses = 'px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-sm';
  const statusClasses = {
    'Open': 'bg-red-100 text-red-800',
    'Resolved': 'bg-blue-100 text-blue-800',
    'Closed': 'bg-gray-200 text-gray-800',
  };
  return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>;
};

const Disputes: React.FC<DisputesProps> = ({ currentUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('view');
  const [selectedItem, setSelectedItem] = useState<Dispute | null>(null);

  const canCreate = hasPermission(currentUser.role, 'Disputes', 'create');
  const canUpdate = hasPermission(currentUser.role, 'Disputes', 'update');
  const canRead = hasPermission(currentUser.role, 'Disputes', 'read');

  if (!canRead) {
    return (
      <Card title="Access Denied">
        <p className="text-red-600">You do not have permission to view this page.</p>
      </Card>
    );
  }

  const handleOpenModal = (mode: 'add' | 'edit' | 'view', item: Dispute | null = null) => {
    setModalMode(mode);
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleSave = (data: Dispute) => {
    console.log('Saving dispute:', data);
    handleCloseModal();
  };

  const columns = [
    { header: 'Dispute ID', accessor: 'disputeId' },
    { header: 'SC No.', accessor: 'salesContractId' },
    { header: 'Date Raised', accessor: 'dateRaised' },
    { header: 'Reason', accessor: 'reason' },
    {
      header: 'Status',
      accessor: (item: Dispute) => <StatusBadge status={item.status} />,
    },
    {
      header: 'Actions',
      accessor: (item: Dispute) => (
        canUpdate ? <button onClick={() => handleOpenModal('edit', item)} className="text-blue-600 hover:underline text-sm font-medium">Manage</button> : null
      ),
    },
  ];

  const cardActions = canCreate ? (
    <Button onClick={() => handleOpenModal('add')} className="text-sm">Raise Dispute</Button>
  ) : null;

  const getModalTitle = () => {
    if (modalMode === 'add') return 'Raise New Dispute';
    if (modalMode === 'edit') return `Manage Dispute: ${selectedItem?.disputeId}`;
    return `View Dispute: ${selectedItem?.disputeId}`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Dispute Resolution Module</h1>
      <Card title="All Disputes" actions={cardActions}>
        <Table<Dispute> data={mockDisputes} columns={columns} />
      </Card>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={getModalTitle()}>
        <DisputeForm
          dispute={selectedItem}
          readOnly={modalMode === 'view' || (modalMode === 'edit' && !canUpdate)}
          onSave={handleSave}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
};

export default Disputes;
