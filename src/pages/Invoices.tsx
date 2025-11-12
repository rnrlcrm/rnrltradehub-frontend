
import React, { useState, useMemo } from 'react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import InvoiceForm from '../components/forms/InvoiceForm';
import { mockInvoices } from '../data/mockData';
import { Invoice, User } from '../types';
import { hasPermission } from '../lib/permissions';
import { Button, Input, Select } from '../components/ui/Form';

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
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');


  const canCreate = hasPermission(currentUser.role, 'Invoices', 'create');
  const canUpdate = hasPermission(currentUser.role, 'Invoices', 'update');
  const canRead = hasPermission(currentUser.role, 'Invoices', 'read');

  // Filtered and searched data
  const filteredInvoices = useMemo(() => {
    return mockInvoices.filter(invoice => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === '' || 
        invoice.invoiceNo.toLowerCase().includes(searchLower) ||
        invoice.salesContractId.toLowerCase().includes(searchLower);
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
      
      // Date filter
      const invoiceDate = new Date(invoice.date);
      const matchesDateFrom = !dateFrom || invoiceDate >= new Date(dateFrom);
      const matchesDateTo = !dateTo || invoiceDate <= new Date(dateTo);
      
      // Amount filter
      const matchesAmountMin = !amountMin || invoice.amount >= parseFloat(amountMin);
      const matchesAmountMax = !amountMax || invoice.amount <= parseFloat(amountMax);
      
      return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo && matchesAmountMin && matchesAmountMax;
    });
  }, [mockInvoices, searchTerm, statusFilter, dateFrom, dateTo, amountMin, amountMax]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const total = filteredInvoices.length;
    const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const paid = filteredInvoices.filter(inv => inv.status === 'Paid').length;
    const paidAmount = filteredInvoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.amount, 0);
    const unpaid = filteredInvoices.filter(inv => inv.status === 'Unpaid').length;
    const unpaidAmount = filteredInvoices.filter(inv => inv.status === 'Unpaid').reduce((sum, inv) => sum + inv.amount, 0);
    const partiallyPaid = filteredInvoices.filter(inv => inv.status === 'Partially Paid').length;
    
    return { total, totalAmount, paid, paidAmount, unpaid, unpaidAmount, partiallyPaid };
  }, [filteredInvoices]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setAmountMin('');
    setAmountMax('');
  };

  const exportToCSV = () => {
    const headers = ['Invoice No.', 'SC No.', 'Date', 'Amount', 'Status'];
    const rows = filteredInvoices.map(inv => [
      inv.invoiceNo,
      inv.salesContractId,
      inv.date,
      inv.amount.toString(),
      inv.status
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `invoices_${new Date().toISOString().split('T')[0]}.csv`;
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
  
  const getModalTitle = () => {
    if (modalMode === 'add') return 'Raise New Invoice';
    if (modalMode === 'edit') return `Edit Invoice: ${selectedItem?.invoiceNo}`;
    return `View Invoice: ${selectedItem?.invoiceNo}`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Invoice Tracker</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <p className="text-sm text-slate-600">Total Invoices</p>
            <p className="text-2xl font-semibold text-slate-800">{summary.total}</p>
            <p className="text-sm text-slate-500">₹{summary.totalAmount.toLocaleString('en-IN')}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-slate-600">Paid</p>
            <p className="text-2xl font-semibold text-green-600">{summary.paid}</p>
            <p className="text-sm text-slate-500">₹{summary.paidAmount.toLocaleString('en-IN')}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-slate-600">Unpaid</p>
            <p className="text-2xl font-semibold text-red-600">{summary.unpaid}</p>
            <p className="text-sm text-slate-500">₹{summary.unpaidAmount.toLocaleString('en-IN')}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-slate-600">Partially Paid</p>
            <p className="text-2xl font-semibold text-yellow-600">{summary.partiallyPaid}</p>
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
              placeholder="Invoice No. or SC No."
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
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Partially Paid">Partially Paid</option>
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

      {/* Invoices Table */}
      <Card 
        title={`All Invoices (${filteredInvoices.length})`}
        actions={canCreate ? (
          <Button onClick={() => handleOpenModal('add')} className="text-sm">Raise Invoice</Button>
        ) : undefined}
      >
        <Table<Invoice> data={filteredInvoices} columns={columns} />
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
