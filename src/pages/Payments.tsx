
import React, { useState, useMemo } from 'react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import PaymentForm from '../components/forms/PaymentForm';
import { mockPayments } from '../data/mockData';
import { Payment, User } from '../types';
import { hasPermission } from '../lib/permissions';
import { Button, Input, Select } from '../components/ui/Form';

interface PaymentsProps {
  currentUser: User;
}

const Payments: React.FC<PaymentsProps> = ({ currentUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'view'>('view');
  const [selectedItem, setSelectedItem] = useState<Payment | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');

  const canCreate = hasPermission(currentUser.role, 'Payments', 'create');
  const canRead = hasPermission(currentUser.role, 'Payments', 'read');

  // Filtered and searched data
  const filteredPayments = useMemo(() => {
    return mockPayments.filter(payment => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === '' || 
        payment.paymentId.toLowerCase().includes(searchLower) ||
        payment.invoiceId.toLowerCase().includes(searchLower);
      
      // Method filter
      const matchesMethod = methodFilter === 'all' || payment.method === methodFilter;
      
      // Date filter
      const paymentDate = new Date(payment.date);
      const matchesDateFrom = !dateFrom || paymentDate >= new Date(dateFrom);
      const matchesDateTo = !dateTo || paymentDate <= new Date(dateTo);
      
      // Amount filter
      const matchesAmountMin = !amountMin || payment.amount >= parseFloat(amountMin);
      const matchesAmountMax = !amountMax || payment.amount <= parseFloat(amountMax);
      
      return matchesSearch && matchesMethod && matchesDateFrom && matchesDateTo && matchesAmountMin && matchesAmountMax;
    });
  }, [mockPayments, searchTerm, methodFilter, dateFrom, dateTo, amountMin, amountMax]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const total = filteredPayments.length;
    const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const bankTransfer = filteredPayments.filter(p => p.method === 'Bank Transfer').length;
    const bankTransferAmount = filteredPayments.filter(p => p.method === 'Bank Transfer').reduce((sum, p) => sum + p.amount, 0);
    const cheque = filteredPayments.filter(p => p.method === 'Cheque').length;
    const chequeAmount = filteredPayments.filter(p => p.method === 'Cheque').reduce((sum, p) => sum + p.amount, 0);
    const cash = filteredPayments.filter(p => p.method === 'Cash').length;
    const cashAmount = filteredPayments.filter(p => p.method === 'Cash').reduce((sum, p) => sum + p.amount, 0);
    
    return { total, totalAmount, bankTransfer, bankTransferAmount, cheque, chequeAmount, cash, cashAmount };
  }, [filteredPayments]);

  const clearFilters = () => {
    setSearchTerm('');
    setMethodFilter('all');
    setDateFrom('');
    setDateTo('');
    setAmountMin('');
    setAmountMax('');
  };

  const exportToCSV = () => {
    const headers = ['Payment ID', 'Invoice No.', 'Date', 'Amount', 'Method'];
    const rows = filteredPayments.map(payment => [
      payment.paymentId,
      payment.invoiceId,
      payment.date,
      payment.amount.toString(),
      payment.method
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `payments_${new Date().toISOString().split('T')[0]}.csv`;
    downloadLink.click();
    window.URL.revokeObjectURL(url);
  };

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

  const getModalTitle = () => {
    if (modalMode === 'add') return 'Record New Payment';
    return `View Payment: ${selectedItem?.paymentId}`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Payment Module</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <p className="text-sm text-slate-600">Total Payments</p>
            <p className="text-2xl font-semibold text-slate-800">{summary.total}</p>
            <p className="text-sm text-slate-500">₹{summary.totalAmount.toLocaleString('en-IN')}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-slate-600">Bank Transfer</p>
            <p className="text-2xl font-semibold text-blue-600">{summary.bankTransfer}</p>
            <p className="text-sm text-slate-500">₹{summary.bankTransferAmount.toLocaleString('en-IN')}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-slate-600">Cheque</p>
            <p className="text-2xl font-semibold text-purple-600">{summary.cheque}</p>
            <p className="text-sm text-slate-500">₹{summary.chequeAmount.toLocaleString('en-IN')}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-slate-600">Cash</p>
            <p className="text-2xl font-semibold text-green-600">{summary.cash}</p>
            <p className="text-sm text-slate-500">₹{summary.cashAmount.toLocaleString('en-IN')}</p>
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
              placeholder="Payment ID or Invoice No."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
            <Select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
            >
              <option value="all">All Methods</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
              <option value="Cash">Cash</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date From</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date To</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
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

      {/* Payments Table */}
      <Card 
        title={`All Payments (${filteredPayments.length})`}
        actions={canCreate ? (
          <Button onClick={() => handleOpenModal('add')} className="text-sm">Record Payment</Button>
        ) : undefined}
      >
        <Table<Payment> data={filteredPayments} columns={columns} />
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
