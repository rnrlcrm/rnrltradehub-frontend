
import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import InvoiceForm from '../components/forms/InvoiceForm';
import { mockInvoices } from '../data/mockData';
import { Invoice, User } from '../types';
import { hasPermission } from '../lib/permissions';
import { Button } from '../components/ui/Form';

interface InvoicesProps {
  currentUser: User;
}

const StatusBadge: React.FC<{ status: Invoice['status'] }> = ({ status }) => {
  const baseClasses = 'px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-sm';
  const statusClasses = {
    'Paid': 'bg-green-100 text-green-800',
    'Unpaid': 'bg-red-100 text-red-800',
    'Partially Paid': 'bg-yellow-100 text-yellow-800',
  };
  return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>;
};

const Invoices: React.FC<InvoicesProps> = ({ currentUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('view');
  const [selectedItem, setSelectedItem] = useState<Invoice | null>(null);

  const canCreate = hasPermission(currentUser.role, 'Invoices', 'create');
  const canUpdate = hasPermission(currentUser.role, 'Invoices', 'update');
  const canRead = hasPermission(currentUser.role, 'Invoices', 'read');

  if (!canRead) {
    return (
      <Card title="Access Denied">
        <p className="text-red-600">You do not have permission to view this page.</p>
      </Card>
    );
  }

  const handleOpenModal = (mode: 'add' | 'edit' | 'view', item: Invoice | null = null) => {
    setModalMode(mode);
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleSave = (data: Invoice) => {
    console.log('Saving invoice:', data);
    handleCloseModal();
  };

  const columns = [
    { header: 'Invoice No.', accessor: 'invoiceNo' },
    { header: 'SC No.', accessor: 'salesContractId' },
    { header: 'Date', accessor: 'date' },
    {
      header: 'Amount',
      accessor: (item: Invoice) => `₹${item.amount.toLocaleString('en-IN')}`,
    },
    {
      header: 'Status',
      accessor: (item: Invoice) => <StatusBadge status={item.status} />,
    },
    {
      header: 'Actions',
      accessor: (item: Invoice) => (
        <div className="space-x-4">
          <button onClick={() => handleOpenModal('view', item)} className="text-blue-600 hover:underline text-sm font-medium">View</button>
          {canUpdate && <button onClick={() => handleOpenModal('edit', item)} className="text-blue-600 hover:underline text-sm font-medium">Edit</button>}
          <button className="text-blue-600 hover:underline text-sm font-medium">Email</button>
        </div>
      ),
    },
  ];

  const cardActions = canCreate ? (
    <Button onClick={() => handleOpenModal('add')} className="text-sm">Raise Invoice</Button>
  ) : null;
  
  const getModalTitle = () => {
    if (modalMode === 'add') return 'Raise New Invoice';
    if (modalMode === 'edit') return `Edit Invoice: ${selectedItem?.invoiceNo}`;
    return `View Invoice: ${selectedItem?.invoiceNo}`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Invoice Tracker</h1>
      <Card title="All Invoices" actions={cardActions}>
        <Table<Invoice> data={mockInvoices} columns={columns} />
      </Card>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={getModalTitle()}>
        <InvoiceForm
          invoice={selectedItem}
          readOnly={modalMode === 'view'}
          onSave={handleSave}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
};

export default Invoices;
