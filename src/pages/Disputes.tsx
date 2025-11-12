
import React, { useState, useMemo } from 'react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import DisputeForm from '../components/forms/DisputeForm';
import { mockDisputes } from '../data/mockData';
import { Dispute, User } from '../types';
import { hasPermission } from '../lib/permissions';
import { Button, Input, Select } from '../components/ui/Form';

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
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const canCreate = hasPermission(currentUser.role, 'Disputes', 'create');
  const canUpdate = hasPermission(currentUser.role, 'Disputes', 'update');
  const canRead = hasPermission(currentUser.role, 'Disputes', 'read');

  // Filtered disputes
  const filteredDisputes = useMemo(() => {
    return mockDisputes.filter(dispute => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === '' || 
        dispute.disputeId.toLowerCase().includes(searchLower) ||
        dispute.salesContractId.toLowerCase().includes(searchLower) ||
        dispute.reason.toLowerCase().includes(searchLower);
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || dispute.status === statusFilter;
      
      // Date filter
      const disputeDate = new Date(dispute.dateRaised);
      const matchesDateFrom = !dateFrom || disputeDate >= new Date(dateFrom);
      const matchesDateTo = !dateTo || disputeDate <= new Date(dateTo);
      
      return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
    });
  }, [mockDisputes, searchTerm, statusFilter, dateFrom, dateTo]);

  // Summary statistics
  const summary = useMemo(() => {
    const total = filteredDisputes.length;
    const open = filteredDisputes.filter(d => d.status === 'Open').length;
    const resolved = filteredDisputes.filter(d => d.status === 'Resolved').length;
    const closed = filteredDisputes.filter(d => d.status === 'Closed').length;
    
    return { total, open, resolved, closed };
  }, [filteredDisputes]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const exportToCSV = () => {
    const headers = ['Dispute ID', 'SC No.', 'Date Raised', 'Reason', 'Status', 'Resolution'];
    const rows = filteredDisputes.map(d => [
      d.disputeId,
      d.salesContractId,
      d.dateRaised,
      d.reason,
      d.status,
      d.resolution
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `disputes_${new Date().toISOString().split('T')[0]}.csv`;
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
        <div className="space-x-4">
          <button onClick={() => handleOpenModal('view', item)} className="text-blue-600 hover:underline text-sm font-medium">View</button>
          {canUpdate && <button onClick={() => handleOpenModal('edit', item)} className="text-blue-600 hover:underline text-sm font-medium">Manage</button>}
        </div>
      ),
    },
  ];

  const getModalTitle = () => {
    if (modalMode === 'add') return 'Raise New Dispute';
    if (modalMode === 'edit') return `Manage Dispute: ${selectedItem?.disputeId}`;
    return `View Dispute: ${selectedItem?.disputeId}`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Dispute Resolution Module</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <p className="text-sm text-slate-600">Total Disputes</p>
            <p className="text-2xl font-semibold text-slate-800">{summary.total}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-slate-600">Open</p>
            <p className="text-2xl font-semibold text-red-600">{summary.open}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-slate-600">Resolved</p>
            <p className="text-2xl font-semibold text-blue-600">{summary.resolved}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-slate-600">Closed</p>
            <p className="text-2xl font-semibold text-gray-600">{summary.closed}</p>
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
              placeholder="Dispute ID, SC No., or Reason"
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
              <option value="Open">Open</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
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

      {/* Disputes Table */}
      <Card 
        title={`All Disputes (${filteredDisputes.length})`}
        actions={canCreate ? (
          <Button onClick={() => handleOpenModal('add')} className="text-sm">Raise Dispute</Button>
        ) : undefined}
      >
        <Table<Dispute> data={filteredDisputes} columns={columns} />
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
