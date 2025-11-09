
import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import PaymentForm from '../components/forms/PaymentForm';
import { mockPayments } from '../data/mockData';
import { Payment, User } from '../types';
import { hasPermission } from '../lib/permissions';
import { Button } from '../components/ui/Form';

interface PaymentsProps {
  currentUser: User;
}

const Payments: React.FC<PaymentsProps> = ({ currentUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'view'>('view');
  const [selectedItem, setSelectedItem] = useState<Payment | null>(null);

  const canCreate = hasPermission(currentUser.role, 'Payments', 'create');
  const canRead = hasPermission(currentUser.role, 'Payments', 'read');

  if (!canRead) {
    return (
      <Card title="Access Denied">
        <p className="text-red-600">You do not have permission to view this page.</p>
      </Card>
    );
  }

  const handleOpenModal = (mode: 'add' | 'view', item: Payment | null = null) => {
    setModalMode(mode);
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleSave = (data: Payment) => {
    console.log('Saving payment:', data);
    handleCloseModal();
  };

  const columns = [
    { header: 'Payment ID', accessor: 'paymentId' },
    { header: 'Invoice No.', accessor: 'invoiceId' },
    { header: 'Date', accessor: 'date' },
    {
      header: 'Amount',
      accessor: (item: Payment) => `₹${item.amount.toLocaleString('en-IN')}`,
    },
    { header: 'Method', accessor: 'method' },
    {
      header: 'Actions',
      accessor: (item: Payment) => (
        <button onClick={() => handleOpenModal('view', item)} className="text-blue-600 hover:underline text-sm font-medium">View Receipt</button>
      ),
    },
  ];

  const cardActions = canCreate ? (
    <Button onClick={() => handleOpenModal('add')} className="text-sm">Record Payment</Button>
  ) : null;

  const getModalTitle = () => {
    if (modalMode === 'add') return 'Record New Payment';
    return `View Payment: ${selectedItem?.paymentId}`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Payment Module</h1>
      <Card title="All Payments" actions={cardActions}>
        <Table<Payment> data={mockPayments} columns={columns} />
      </Card>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={getModalTitle()}>
        <PaymentForm
          payment={selectedItem}
          readOnly={modalMode === 'view'}
          onSave={handleSave}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
};

export default Payments;
