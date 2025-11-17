
import React, { useState, useMemo, useRef } from 'react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import InvoiceForm from '../components/forms/InvoiceForm';
import { mockInvoices } from '../data/mockData';
import { Invoice, User } from '../types';
import { hasPermission } from '../lib/permissions';
import { Button, Input, Select } from '../components/ui/Form';
import { Upload, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import OCRService, { OCRResult } from '../services/ocrService';
import ValidationService from '../services/validationService';
import NotificationService from '../services/notificationService';
import AutoPostingService from '../services/autoPostingService';

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
  const [isOCRModalOpen, setIsOCRModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [buyerFilter, setBuyerFilter] = useState<string>('all');
  const [sellerFilter, setSellerFilter] = useState<string>('all');
  const [fyFilter, setFyFilter] = useState<string>('all');
  const [commodityFilter, setCommodityFilter] = useState<string>('all');


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
      
      // Buyer filter (mock data doesn't have buyer, so just pass through)
      const matchesBuyer = buyerFilter === 'all';
      
      // Seller filter (mock data doesn't have seller, so just pass through)
      const matchesSeller = sellerFilter === 'all';
      
      // FY filter
      const matchesFY = fyFilter === 'all' || (invoice.financialYear && invoice.financialYear === fyFilter);
      
      // Commodity filter (mock data doesn't have commodity, so just pass through)
      const matchesCommodity = commodityFilter === 'all';
      
      return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo && 
             matchesAmountMin && matchesAmountMax && matchesBuyer && matchesSeller && 
             matchesFY && matchesCommodity;
    });
  }, [mockInvoices, searchTerm, statusFilter, dateFrom, dateTo, amountMin, amountMax, 
      buyerFilter, sellerFilter, fyFilter, commodityFilter]);

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
    setBuyerFilter('all');
    setSellerFilter('all');
    setFyFilter('all');
    setCommodityFilter('all');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setIsOCRModalOpen(true);

    // Process with OCR
    const result = await OCRService.processInvoice(file);
    setOcrResult(result);
    setIsProcessing(false);

    if (result.success && result.data) {
      const invoiceData = result.data as any;
      
      // Validate invoice
      const validationResult = await ValidationService.validateInvoice(invoiceData);
      
      if (validationResult.isValid) {
        // Auto-post to ledger
        await AutoPostingService.postInvoiceToLedger(invoiceData);
        
        // Send notification to buyer
        await NotificationService.notifyInvoiceUploaded(invoiceData, { email: invoiceData.buyerName });
      } else {
        // Send error notification to seller
        await NotificationService.notifyInvoiceError(
          invoiceData,
          { email: invoiceData.sellerName },
          validationResult.errors.map(e => e.message)
        );
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
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
      <Card title="Advanced Filters & Upload">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Buyer</label>
            <Select
              value={buyerFilter}
              onChange={(e) => setBuyerFilter(e.target.value)}
            >
              <option value="all">All Buyers</option>
              <option value="ABC Mills">ABC Mills</option>
              <option value="XYZ Traders">XYZ Traders</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Seller</label>
            <Select
              value={sellerFilter}
              onChange={(e) => setSellerFilter(e.target.value)}
            >
              <option value="all">All Sellers</option>
              <option value="Seller A">Seller A</option>
              <option value="Seller B">Seller B</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Financial Year</label>
            <Select
              value={fyFilter}
              onChange={(e) => setFyFilter(e.target.value)}
            >
              <option value="all">All FY</option>
              <option value="FY 2024-25">FY 2024-25</option>
              <option value="FY 2023-24">FY 2023-24</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Commodity</label>
            <Select
              value={commodityFilter}
              onChange={(e) => setCommodityFilter(e.target.value)}
            >
              <option value="all">All Commodities</option>
              <option value="Cotton">Cotton</option>
              <option value="Wheat">Wheat</option>
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
        <div className="px-4 pb-4 flex gap-2 flex-wrap">
          <Button onClick={clearFilters} className="text-sm bg-slate-500 hover:bg-slate-600">
            Clear Filters
          </Button>
          <Button onClick={exportToCSV} className="text-sm bg-green-600 hover:bg-green-700">
            Export to CSV
          </Button>
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            className="text-sm bg-blue-600 hover:bg-blue-700 flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Invoice (OCR)</span>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
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

      {/* OCR Processing Modal */}
      <Modal 
        isOpen={isOCRModalOpen} 
        onClose={() => setIsOCRModalOpen(false)} 
        title="Invoice OCR Processing"
      >
        <div className="p-4">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <p className="text-slate-600">Processing invoice with OCR...</p>
              <p className="text-sm text-slate-500 mt-2">This may take a few seconds</p>
            </div>
          ) : ocrResult ? (
            <div className="space-y-4">
              {ocrResult.success ? (
                <>
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="w-6 h-6" />
                    <span className="font-semibold">Invoice processed successfully!</span>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-md p-4 space-y-2 text-sm">
                    <p><strong>Confidence:</strong> {OCRService.getConfidenceLevel(ocrResult.confidence)} ({(ocrResult.confidence * 100).toFixed(1)}%)</p>
                    {ocrResult.data && (
                      <>
                        <p><strong>Invoice #:</strong> {(ocrResult.data as any).invoiceNumber}</p>
                        <p><strong>Amount:</strong> ₹{((ocrResult.data as any).totalAmount || 0).toLocaleString()}</p>
                        <p className="text-green-700 mt-3">✓ Data extracted and validated</p>
                        <p className="text-green-700">✓ Posted to ledger</p>
                        <p className="text-green-700">✓ Buyer notified</p>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-2 text-red-600">
                    <AlertCircle className="w-6 h-6" />
                    <span className="font-semibold">Processing failed</span>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                      {ocrResult.errors?.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
              <div className="flex justify-end">
                <Button onClick={() => setIsOCRModalOpen(false)}>Close</Button>
              </div>
            </div>
          ) : null}
        </div>
      </Modal>
    </div>
  );
};

export default Invoices;
