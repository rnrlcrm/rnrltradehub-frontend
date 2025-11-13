
import React, { useState, useMemo } from 'react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import { mockCommissions } from '../data/mockData';
import { Commission, User } from '../types';
import { hasPermission } from '../lib/permissions';
import { Button, Input, Select } from '../components/ui/Form';
import CommissionForm from '../components/forms/CommissionForm';
import CommissionPaymentForm from '../components/forms/CommissionPaymentForm';

interface CommissionsProps {
  currentUser: User;
}

const StatusBadge: React.FC<{ status: Commission['status'] }> = ({ status }) => {
  const baseClasses = 'px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-sm';
  const statusClasses = {
    'Due': 'bg-yellow-100 text-yellow-800',
    'Paid': 'bg-green-100 text-green-800',
  };
  return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>;
};

const Commissions: React.FC<CommissionsProps> = ({ currentUser }) => {
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  
  // Modal states
  const [commissions, setCommissions] = useState<Commission[]>(mockCommissions);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view' | 'payment'>('view');
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);

  const canRead = hasPermission(currentUser.role, 'Commissions', 'read');
  const canCreate = hasPermission(currentUser.role, 'Commissions', 'create');
  const canUpdate = hasPermission(currentUser.role, 'Commissions', 'update');
  const canDelete = hasPermission(currentUser.role, 'Commissions', 'delete');

  // Filtered and searched data
  const filteredCommissions = useMemo(() => {
    return commissions.filter(commission => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === '' || 
        commission.commissionId.toLowerCase().includes(searchLower) ||
        commission.salesContractId.toLowerCase().includes(searchLower) ||
        commission.agent.toLowerCase().includes(searchLower);
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || commission.status === statusFilter;
      
      // Amount filter
      const matchesAmountMin = !amountMin || commission.amount >= parseFloat(amountMin);
      const matchesAmountMax = !amountMax || commission.amount <= parseFloat(amountMax);
      
      return matchesSearch && matchesStatus && matchesAmountMin && matchesAmountMax;
    });
  }, [commissions, searchTerm, statusFilter, amountMin, amountMax]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const total = filteredCommissions.length;
    const totalAmount = filteredCommissions.reduce((sum, comm) => sum + comm.amount, 0);
    const due = filteredCommissions.filter(c => c.status === 'Due').length;
    const dueAmount = filteredCommissions.filter(c => c.status === 'Due').reduce((sum, c) => sum + c.amount, 0);
    const paid = filteredCommissions.filter(c => c.status === 'Paid').length;
    const paidAmount = filteredCommissions.filter(c => c.status === 'Paid').reduce((sum, c) => sum + c.amount, 0);
    
    return { total, totalAmount, due, dueAmount, paid, paidAmount };
  }, [filteredCommissions]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setAmountMin('');
    setAmountMax('');
  };

  const exportToCSV = () => {
    const headers = ['Commission ID', 'SC No.', 'Agent', 'Amount', 'Status'];
    const rows = filteredCommissions.map(comm => [
      comm.commissionId,
      comm.salesContractId,
      comm.agent,
      comm.amount.toString(),
      comm.status
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commissions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleOpenModal = (mode: 'add' | 'edit' | 'view' | 'payment', commission: Commission | null = null) => {
    setModalMode(mode);
    setSelectedCommission(commission);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCommission(null);
  };

  const handleSaveCommission = (data: Omit<Commission, 'id'>) => {
    if (modalMode === 'add') {
      const newCommission = { ...data, id: Math.max(...commissions.map(c => c.id)) + 1 };
      setCommissions([newCommission, ...commissions]);
    } else if (modalMode === 'edit' && selectedCommission) {
      setCommissions(commissions.map(c => c.id === selectedCommission.id ? { ...data, id: selectedCommission.id } : c));
    }
    handleCloseModal();
  };

  const handleSavePayment = (paymentData: any) => {
    // Update commission status to Paid
    setCommissions(commissions.map(c => 
      c.commissionId === paymentData.commissionId 
        ? { ...c, status: 'Paid' as const, paidDate: paymentData.paymentDate }
        : c
    ));
    alert(`Payment recorded successfully!\n\nPayment ID: ${paymentData.paymentId}\nAmount: ₹${paymentData.amount.toLocaleString('en-IN')}\nMethod: ${paymentData.paymentMethod}`);
    handleCloseModal();
  };

  const handleMarkAsPaid = (commission: Commission) => {
    if (window.confirm(`Mark commission ${commission.commissionId} as paid?`)) {
      setCommissions(commissions.map(c => 
        c.id === commission.id 
          ? { ...c, status: 'Paid' as const, paidDate: new Date().toISOString().split('T')[0] }
          : c
      ));
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this commission?')) {
      setCommissions(commissions.filter(c => c.id !== id));
    }
  };

  const getModalTitle = () => {
    if (modalMode === 'add') return 'Create New Commission';
    if (modalMode === 'edit') return `Edit Commission: ${selectedCommission?.commissionId}`;
    if (modalMode === 'payment') return 'Record Commission Payment';
    return `View Commission: ${selectedCommission?.commissionId}`;
  };

  if (!canRead) {
    return (
      <Card title="Access Denied">
        <p className="text-red-600">You do not have permission to view this page.</p>
      </Card>
    );
  }

  const columns = [
    { header: 'Commission ID', accessor: 'commissionId' },
    { header: 'SC No.', accessor: 'salesContractId' },
    { header: 'Agent', accessor: 'agent' },
    {
      header: 'Amount',
      accessor: (item: Commission) => `₹${item.amount.toLocaleString('en-IN')}`,
    },
    {
      header: 'Status',
      accessor: (item: Commission) => <StatusBadge status={item.status} />,
    },
    {
      header: 'Actions',
      accessor: (item: Commission) => (
        <div className="space-x-2">
          {canRead && <button onClick={() => handleOpenModal('view', item)} className="text-blue-600 hover:underline text-sm font-medium">View</button>}
          {item.status === 'Due' && canUpdate && <button onClick={() => handleMarkAsPaid(item)} className="text-green-600 hover:underline text-sm font-medium">Mark Paid</button>}
          {item.status === 'Due' && canUpdate && <button onClick={() => handleOpenModal('payment', item)} className="text-purple-600 hover:underline text-sm font-medium">Record Payment</button>}
          {canUpdate && <button onClick={() => handleOpenModal('edit', item)} className="text-blue-600 hover:underline text-sm font-medium">Edit</button>}
          {canDelete && <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:underline text-sm font-medium">Delete</button>}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Commission Management</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <div className="p-4">
            <p className="text-sm text-slate-600">Total Commissions</p>
            <p className="text-2xl font-semibold text-slate-800">{summary.total}</p>
            <p className="text-sm text-slate-500">₹{summary.totalAmount.toLocaleString('en-IN')}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-slate-600">Due</p>
            <p className="text-2xl font-semibold text-yellow-600">{summary.due}</p>
            <p className="text-sm text-slate-500">₹{summary.dueAmount.toLocaleString('en-IN')}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-slate-600">Paid</p>
            <p className="text-2xl font-semibold text-green-600">{summary.paid}</p>
            <p className="text-sm text-slate-500">₹{summary.paidAmount.toLocaleString('en-IN')}</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Search</label>
            <Input
              type="text"
              placeholder="Commission ID, SC No., or Agent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="Due">Due</option>
              <option value="Paid">Paid</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Min Amount (₹)</label>
            <Input
              type="number"
              placeholder="Minimum amount"
              value={amountMin}
              onChange={(e) => setAmountMin(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Max Amount (₹)</label>
            <Input
              type="number"
              placeholder="Maximum amount"
              value={amountMax}
              onChange={(e) => setAmountMax(e.target.value)}
            />
          </div>
        </div>
        <div className="px-4 pb-4 flex gap-2">
          <Button onClick={clearFilters} className="text-sm bg-slate-500 hover:bg-slate-600">
            Clear Filters
          </Button>
          <Button onClick={exportToCSV} className="text-sm bg-green-600 hover:bg-green-700">
            Export to CSV
          </Button>
        </div>
      </Card>

      {/* Commissions Table */}
      <Card 
        title={`All Commissions (${filteredCommissions.length})`}
        actions={
          <div className="flex gap-2">
            {canCreate && <Button onClick={() => handleOpenModal('add')} className="text-sm">Create Commission</Button>}
            {canCreate && <Button onClick={() => handleOpenModal('payment')} className="text-sm bg-purple-600 hover:bg-purple-700">Record Payment</Button>}
            <Button onClick={exportToCSV} className="text-sm bg-green-600 hover:bg-green-700">Generate Report</Button>
          </div>
        }
      >
        <Table<Commission> data={filteredCommissions} columns={columns} />
      </Card>

      {/* Modal for Commission CRUD and Payment */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={getModalTitle()}>
        {modalMode === 'payment' ? (
          <CommissionPaymentForm
            commissions={commissions}
            payment={null}
            readOnly={false}
            onSave={handleSavePayment}
            onCancel={handleCloseModal}
          />
        ) : (
          <CommissionForm
            commission={selectedCommission}
            readOnly={modalMode === 'view'}
            onSave={handleSaveCommission}
            onCancel={handleCloseModal}
          />
        )}
      </Modal>
    </div>
  );
};

export default Commissions;
