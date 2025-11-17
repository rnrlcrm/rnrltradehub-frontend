/**
 * Unified Finance Module
 * Combines Invoices, Payments, Ledger, and Reconciliation into one comprehensive view
 */

import React, { useState, useMemo, useRef } from 'react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import { Button, Input, Select } from '../components/ui/Form';
import { User } from '../types';
import { 
  Upload, Download, FileText, DollarSign, TrendingUp, TrendingDown, 
  CheckCircle, AlertCircle, Clock, Filter, Eye, RefreshCw, Loader,
  CreditCard, Receipt, BookOpen, Scale
} from 'lucide-react';
import OCRService from '../services/ocrService';
import ValidationService from '../services/validationService';
import NotificationService from '../services/notificationService';
import AutoPostingService from '../services/autoPostingService';
import AutoReconciliationService from '../services/autoReconciliationService';
import UnifiedPaymentReceiptForm from '../components/forms/UnifiedPaymentReceiptForm';
import ComprehensiveInvoiceForm from '../components/forms/ComprehensiveInvoiceForm';

interface FinanceModuleProps {
  currentUser: User;
}

type ViewMode = 'overview' | 'invoices' | 'payments' | 'ledger' | 'reconciliation';
type TimeFilter = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

/**
 * Unified Finance Module Component
 * ONE PLACE for all financial operations
 */
const FinanceModule: React.FC<FinanceModuleProps> = ({ currentUser }) => {
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Modal states
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  
  // Common filters (used across all views)
  const [filters, setFilters] = useState({
    search: '',
    partyType: 'all', // buyer/seller/all
    party: 'all',
    status: 'all',
    commodity: 'all',
    financialYear: 'all',
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: '',
    reconciled: 'all', // yes/no/all
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock data (in production, fetch from API)
  const mockData = {
    invoices: [
      { id: 'INV001', invoiceNo: 'INV-2024-001', party: 'ABC Mills', type: 'buyer', date: '2024-11-01', amount: 500000, status: 'Unpaid', reconciled: false },
      { id: 'INV002', invoiceNo: 'INV-2024-002', party: 'XYZ Traders', type: 'seller', date: '2024-11-05', amount: 250000, status: 'Paid', reconciled: true },
    ],
    payments: [
      { id: 'PAY001', paymentId: 'PAY-2024-001', party: 'ABC Mills', type: 'buyer', date: '2024-11-10', amount: 250000, method: 'RTGS', invoice: 'INV-2024-001', reconciled: true },
    ],
    ledgerEntries: [
      { id: 'LE001', date: '2024-11-01', party: 'ABC Mills', type: 'Debit', amount: 500000, balance: 500000, description: 'Invoice INV-2024-001', reconciled: true },
      { id: 'LE002', date: '2024-11-10', party: 'ABC Mills', type: 'Credit', amount: 250000, balance: 250000, description: 'Payment PAY-2024-001', reconciled: true },
    ],
  };

  // Calculate summary statistics
  const summary = useMemo(() => {
    return {
      totalInvoices: mockData.invoices.length,
      totalInvoiceAmount: mockData.invoices.reduce((sum, inv) => sum + inv.amount, 0),
      unpaidInvoices: mockData.invoices.filter(inv => inv.status === 'Unpaid').length,
      unpaidAmount: mockData.invoices.filter(inv => inv.status === 'Unpaid').reduce((sum, inv) => sum + inv.amount, 0),
      totalPayments: mockData.payments.length,
      totalPaymentAmount: mockData.payments.reduce((sum, pay) => sum + pay.amount, 0),
      pendingReconciliation: [...mockData.invoices, ...mockData.payments].filter(item => !item.reconciled).length,
      outstandingBalance: 250000, // Calculated from ledger
    };
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    // Determine type from filename or ask user
    const fileName = file.name.toLowerCase();
    const documentType = fileName.includes('payment') || fileName.includes('receipt')
      ? 'payment'
      : 'invoice';

    // Process with OCR
    const ocrResult = documentType === 'invoice'
      ? await OCRService.processInvoice(file)
      : await OCRService.processPaymentReceipt(file);

    setIsProcessing(false);

    if (ocrResult.success && ocrResult.data) {
      // Auto-validate and process
      if (documentType === 'invoice') {
        const validationResult = await ValidationService.validateInvoice(ocrResult.data);
        if (validationResult.isValid) {
          await AutoPostingService.postInvoiceToLedger(ocrResult.data);
          await NotificationService.notifyInvoiceUploaded(ocrResult.data, { email: 'buyer@example.com' });
          alert('✅ Invoice processed successfully!');
        } else {
          alert('❌ Validation failed: ' + validationResult.errors.map(e => e.message).join(', '));
        }
      } else {
        await AutoPostingService.postPaymentToLedger(ocrResult.data);
        await NotificationService.notifyPaymentReceived(ocrResult.data, { email: 'seller@example.com' });
        alert('✅ Payment processed successfully!');
      }
    } else {
      alert('❌ OCR failed: ' + (ocrResult.errors?.join(', ') || 'Unknown error'));
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const runAutoReconciliation = async () => {
    setIsProcessing(true);
    
    // Run reconciliation for all parties
    const result = await AutoReconciliationService.reconcilePartyLedger(
      'P001',
      '2024-11-01',
      '2024-11-30'
    );

    setIsProcessing(false);

    if (result.status === 'matched') {
      alert('✅ Auto-reconciliation completed: All matched!');
    } else {
      alert(`⚠️ Reconciliation completed: ${result.unmatchedItems} unmatched items found`);
    }
  };

  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      partyType: 'all',
      party: 'all',
      status: 'all',
      commodity: 'all',
      financialYear: 'all',
      dateFrom: '',
      dateTo: '',
      amountMin: '',
      amountMax: '',
      reconciled: 'all',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Finance & Accounting</h1>
          <p className="text-slate-600 mt-1">
            Unified view of invoices, payments, ledger, and reconciliation
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
            disabled={isProcessing}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </Button>
          <Button
            onClick={runAutoReconciliation}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
            disabled={isProcessing}
          >
            <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>Auto-Reconcile</span>
          </Button>
          <Button
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* View Mode Tabs */}
      <Card>
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setViewMode('overview')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 flex items-center space-x-2 ${
              viewMode === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setViewMode('invoices')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 flex items-center space-x-2 ${
              viewMode === 'invoices'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Invoices</span>
          </button>
          <button
            onClick={() => setViewMode('payments')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 flex items-center space-x-2 ${
              viewMode === 'payments'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Payments</span>
          </button>
          <button
            onClick={() => setViewMode('ledger')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 flex items-center space-x-2 ${
              viewMode === 'ledger'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Ledger</span>
          </button>
          <button
            onClick={() => setViewMode('reconciliation')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 flex items-center space-x-2 ${
              viewMode === 'reconciliation'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-800'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Reconciliation</span>
          </button>
        </div>
      </Card>

      {/* Summary Cards (Always visible) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-600">Total Invoices</p>
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-semibold text-slate-800">{summary.totalInvoices}</p>
            <p className="text-sm text-slate-500">₹{summary.totalInvoiceAmount.toLocaleString()}</p>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-600">Unpaid Amount</p>
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-2xl font-semibold text-red-600">{summary.unpaidInvoices}</p>
            <p className="text-sm text-slate-500">₹{summary.unpaidAmount.toLocaleString()}</p>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-600">Total Payments</p>
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-semibold text-green-600">{summary.totalPayments}</p>
            <p className="text-sm text-slate-500">₹{summary.totalPaymentAmount.toLocaleString()}</p>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-600">Outstanding Balance</p>
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-2xl font-semibold text-orange-600">
              ₹{summary.outstandingBalance.toLocaleString()}
            </p>
            <p className="text-sm text-slate-500">{summary.pendingReconciliation} pending</p>
          </div>
        </Card>
      </div>

      {/* Unified Filters (Used across all views) */}
      <Card title="Filters & Search">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Search</label>
            <Input
              type="text"
              placeholder="Invoice, Payment, Party..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Party Type</label>
            <Select value={filters.partyType} onChange={(e) => updateFilter('partyType', e.target.value)}>
              <option value="all">All</option>
              <option value="buyer">Buyers</option>
              <option value="seller">Sellers</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Party</label>
            <Select value={filters.party} onChange={(e) => updateFilter('party', e.target.value)}>
              <option value="all">All Parties</option>
              <option value="ABC Mills">ABC Mills</option>
              <option value="XYZ Traders">XYZ Traders</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <Select value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Partially Paid">Partially Paid</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Financial Year</label>
            <Select value={filters.financialYear} onChange={(e) => updateFilter('financialYear', e.target.value)}>
              <option value="all">All FY</option>
              <option value="FY 2024-25">FY 2024-25</option>
              <option value="FY 2023-24">FY 2023-24</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Commodity</label>
            <Select value={filters.commodity} onChange={(e) => updateFilter('commodity', e.target.value)}>
              <option value="all">All Commodities</option>
              <option value="Cotton">Cotton</option>
              <option value="Wheat">Wheat</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date From</label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => updateFilter('dateFrom', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date To</label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => updateFilter('dateTo', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reconciled</label>
            <Select value={filters.reconciled} onChange={(e) => updateFilter('reconciled', e.target.value)}>
              <option value="all">All</option>
              <option value="yes">Reconciled</option>
              <option value="no">Not Reconciled</option>
            </Select>
          </div>
        </div>

        <div className="px-4 pb-4 flex gap-2">
          <Button onClick={clearFilters} className="text-sm bg-slate-500 hover:bg-slate-600">
            <Filter className="w-4 h-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Content based on view mode */}
      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Recent Invoices">
            <div className="p-4">
              {mockData.invoices.slice(0, 5).map(invoice => (
                <div key={invoice.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{invoice.invoiceNo}</p>
                    <p className="text-sm text-slate-600">{invoice.party}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{invoice.amount.toLocaleString()}</p>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      invoice.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {invoice.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Recent Payments">
            <div className="p-4">
              {mockData.payments.slice(0, 5).map(payment => (
                <div key={payment.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{payment.paymentId}</p>
                    <p className="text-sm text-slate-600">{payment.party} • {payment.method}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">₹{payment.amount.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">{payment.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Ledger Summary" className="lg:col-span-2">
            <div className="p-4">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-sm text-slate-600">Total Debits</p>
                  <p className="text-xl font-semibold text-red-600">₹{(500000).toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-600">Total Credits</p>
                  <p className="text-xl font-semibold text-green-600">₹{(250000).toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-600">Net Balance</p>
                  <p className="text-xl font-semibold text-blue-600">₹{(250000).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {viewMode === 'invoices' && (
        <Card title="All Invoices" actions={
          <Button onClick={() => setIsInvoiceModalOpen(true)} className="text-sm bg-blue-600 hover:bg-blue-700">
            Raise Invoice
          </Button>
        }>
          <Table
            data={mockData.invoices}
            columns={[
              { header: 'Invoice No.', accessor: 'invoiceNo' },
              { header: 'Party', accessor: 'party' },
              { header: 'Date', accessor: 'date' },
              { header: 'Amount', accessor: (item) => `₹${item.amount.toLocaleString()}` },
              { 
                header: 'Status', 
                accessor: (item) => (
                  <span className={`px-2 py-1 text-xs rounded ${
                    item.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {item.status}
                  </span>
                )
              },
              { 
                header: 'Reconciled', 
                accessor: (item) => item.reconciled ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Clock className="w-4 h-4 text-orange-600" />
              },
              {
                header: 'Actions',
                accessor: (item) => (
                  <Button 
                    onClick={() => {
                      setSelectedInvoice(item);
                      setIsInvoiceModalOpen(true);
                    }}
                    className="text-xs"
                  >
                    View
                  </Button>
                )
              },
            ]}
          />
        </Card>
      )}

      {viewMode === 'payments' && (
        <Card title="All Payments" actions={
          <Button onClick={() => setIsPaymentModalOpen(true)} className="text-sm bg-green-600 hover:bg-green-700">
            Record Payment
          </Button>
        }>
          <Table
            data={mockData.payments}
            columns={[
              { header: 'Payment ID', accessor: 'paymentId' },
              { header: 'Party', accessor: 'party' },
              { header: 'Invoice', accessor: 'invoice' },
              { header: 'Date', accessor: 'date' },
              { header: 'Method', accessor: 'method' },
              { header: 'Amount', accessor: (item) => `₹${item.amount.toLocaleString()}` },
              { 
                header: 'Reconciled', 
                accessor: (item) => item.reconciled ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Clock className="w-4 h-4 text-orange-600" />
              },
            ]}
          />
        </Card>
      )}

      {viewMode === 'ledger' && (
        <Card title="Ledger Entries">
          <Table
            data={mockData.ledgerEntries}
            columns={[
              { header: 'Date', accessor: 'date' },
              { header: 'Party', accessor: 'party' },
              { header: 'Description', accessor: 'description' },
              { 
                header: 'Debit', 
                accessor: (item) => item.type === 'Debit' ? `₹${item.amount.toLocaleString()}` : '-'
              },
              { 
                header: 'Credit', 
                accessor: (item) => item.type === 'Credit' ? `₹${item.amount.toLocaleString()}` : '-'
              },
              { 
                header: 'Balance', 
                accessor: (item) => `₹${item.balance.toLocaleString()}`
              },
              { 
                header: 'Reconciled', 
                accessor: (item) => item.reconciled ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Clock className="w-4 h-4 text-orange-600" />
              },
            ]}
          />
        </Card>
      )}

      {viewMode === 'reconciliation' && (
        <div className="space-y-4">
          <Card title="Auto-Reconciliation">
            <div className="p-4">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                <p className="text-blue-800 font-medium mb-2">Auto-Reconciliation Status</p>
                <p className="text-sm text-blue-700">
                  Last run: Never • Next scheduled: Daily at 9:00 AM
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-semibold text-green-800">85%</p>
                  <p className="text-sm text-green-700">Matched</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded">
                  <AlertCircle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-2xl font-semibold text-orange-800">10%</p>
                  <p className="text-sm text-orange-700">Unmatched</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded">
                  <TrendingDown className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-semibold text-red-800">5%</p>
                  <p className="text-sm text-red-700">Difference</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card>
            <div className="p-8 flex flex-col items-center">
              <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <p className="text-lg font-medium text-slate-800">Processing...</p>
              <p className="text-sm text-slate-600 mt-2">Please wait</p>
            </div>
          </Card>
        </div>
      )}

      {/* Invoice Modal */}
      <Modal 
        isOpen={isInvoiceModalOpen} 
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setSelectedInvoice(null);
        }} 
        title={selectedInvoice ? `View Invoice: ${selectedInvoice.invoiceNo}` : 'Raise New Invoice'}
      >
        <ComprehensiveInvoiceForm
          invoice={selectedInvoice}
          readOnly={!!selectedInvoice}
          onSave={(data) => {
            console.log('Invoice saved:', data);
            setIsInvoiceModalOpen(false);
            setSelectedInvoice(null);
          }}
          onCancel={() => {
            setIsInvoiceModalOpen(false);
            setSelectedInvoice(null);
          }}
        />
      </Modal>

      {/* Payment Modal */}
      <Modal 
        isOpen={isPaymentModalOpen} 
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedPayment(null);
        }} 
        title={selectedPayment ? `View Payment: ${selectedPayment.paymentId}` : 'Record New Payment'}
      >
        <UnifiedPaymentReceiptForm
          entry={selectedPayment}
          readOnly={!!selectedPayment}
          onSave={(data) => {
            console.log('Payment saved:', data);
            setIsPaymentModalOpen(false);
            setSelectedPayment(null);
          }}
          onCancel={() => {
            setIsPaymentModalOpen(false);
            setSelectedPayment(null);
          }}
        />
      </Modal>
    </div>
  );
};

export default FinanceModule;
