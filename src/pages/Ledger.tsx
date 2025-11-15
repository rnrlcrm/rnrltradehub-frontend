import React, { useState } from 'react';
import { User, LedgerEntry, AccountBalance } from '../types';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { DollarSign, TrendingUp, TrendingDown, FileText, Download, Eye, Filter } from 'lucide-react';

interface LedgerProps {
  currentUser: User;
}

// Mock data for ledger entries
const mockLedgerEntries: LedgerEntry[] = [
  {
    id: 'LE001',
    date: '2024-11-01T00:00:00Z',
    financialYear: 'FY 2024-25',
    partyId: 'P001',
    partyName: 'ABC Mills Pvt Ltd',
    partyOrg: 'ABC Mills',
    partyType: 'Buyer',
    transactionType: 'Sale',
    entryType: 'Debit',
    amount: 500000,
    referenceType: 'Contract',
    referenceId: 'SC001',
    referenceNumber: 'SC-2024-001',
    description: 'Sale of 100 Bales Cotton MCU-5',
    balance: 500000,
    isReconciled: true,
    reconciledDate: '2024-11-05T00:00:00Z',
    reconciledBy: 'Accounts Manager',
    createdBy: 'System',
    createdAt: '2024-11-01T10:00:00Z',
  },
  {
    id: 'LE002',
    date: '2024-11-05T00:00:00Z',
    financialYear: 'FY 2024-25',
    partyId: 'P001',
    partyName: 'ABC Mills Pvt Ltd',
    partyOrg: 'ABC Mills',
    partyType: 'Buyer',
    transactionType: 'Payment',
    entryType: 'Credit',
    amount: 250000,
    referenceType: 'Payment',
    referenceId: 'PAY001',
    referenceNumber: 'PAY-2024-001',
    description: 'Partial payment against SC-2024-001',
    balance: 250000,
    isReconciled: true,
    reconciledDate: '2024-11-05T00:00:00Z',
    reconciledBy: 'Accounts Manager',
    createdBy: 'Accounts Staff',
    createdAt: '2024-11-05T14:00:00Z',
  },
  {
    id: 'LE003',
    date: '2024-11-10T00:00:00Z',
    financialYear: 'FY 2024-25',
    partyId: 'P002',
    partyName: 'XYZ Traders',
    partyOrg: 'XYZ Trading Co',
    partyType: 'Seller',
    transactionType: 'Purchase',
    entryType: 'Credit',
    amount: 750000,
    referenceType: 'Contract',
    referenceId: 'SC002',
    referenceNumber: 'SC-2024-002',
    description: 'Purchase of 150 Bales Cotton Shankar-6',
    balance: -750000,
    isReconciled: false,
    createdBy: 'System',
    createdAt: '2024-11-10T09:00:00Z',
  },
];

const mockAccountBalances: AccountBalance[] = [
  {
    partyId: 'P001',
    partyName: 'ABC Mills Pvt Ltd',
    partyOrg: 'ABC Mills',
    partyType: 'Buyer',
    openingBalance: 0,
    totalDebit: 500000,
    totalCredit: 250000,
    closingBalance: 250000,
    outstandingAmount: 250000,
    overdueAmount: 0,
    totalContracts: 1,
    totalInvoices: 1,
    totalPayments: 1,
    fromDate: '2024-04-01',
    toDate: '2024-11-15',
    financialYear: 'FY 2024-25',
    status: 'Active',
    lastTransactionDate: '2024-11-05T14:00:00Z',
  },
  {
    partyId: 'P002',
    partyName: 'XYZ Traders',
    partyOrg: 'XYZ Trading Co',
    partyType: 'Seller',
    openingBalance: 0,
    totalDebit: 0,
    totalCredit: 750000,
    closingBalance: -750000,
    outstandingAmount: 750000,
    overdueAmount: 100000,
    totalContracts: 1,
    totalInvoices: 1,
    totalPayments: 0,
    fromDate: '2024-04-01',
    toDate: '2024-11-15',
    financialYear: 'FY 2024-25',
    status: 'Active',
    lastTransactionDate: '2024-11-10T09:00:00Z',
  },
];

const LedgerPage: React.FC<LedgerProps> = ({ currentUser }) => {
  const [ledgerEntries] = useState<LedgerEntry[]>(mockLedgerEntries);
  const [accountBalances] = useState<AccountBalance[]>(mockAccountBalances);
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const [view, setView] = useState<'summary' | 'detailed'>('summary');
  const [filter, setFilter] = useState<{
    partyType?: string;
    transactionType?: string;
    reconciled?: boolean;
    search?: string;
    fromDate?: string;
    toDate?: string;
  }>({});

  const getFilteredBalances = () => {
    let filtered = accountBalances;

    if (filter.partyType) {
      filtered = filtered.filter(b => b.partyType === filter.partyType);
    }
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(b =>
        b.partyName.toLowerCase().includes(searchLower) ||
        b.partyOrg.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  };

  const getFilteredEntries = () => {
    let filtered = ledgerEntries;

    if (selectedParty) {
      filtered = filtered.filter(e => e.partyId === selectedParty);
    }
    if (filter.transactionType) {
      filtered = filtered.filter(e => e.transactionType === filter.transactionType);
    }
    if (filter.reconciled !== undefined) {
      filtered = filtered.filter(e => e.isReconciled === filter.reconciled);
    }
    if (filter.fromDate) {
      filtered = filtered.filter(e => new Date(e.date) >= new Date(filter.fromDate!));
    }
    if (filter.toDate) {
      filtered = filtered.filter(e => new Date(e.date) <= new Date(filter.toDate!));
    }

    return filtered;
  };

  const getTotalBalance = () => {
    return accountBalances.reduce((sum, b) => sum + b.closingBalance, 0);
  };

  const getTotalOutstanding = () => {
    return accountBalances.reduce((sum, b) => sum + b.outstandingAmount, 0);
  };

  const getTotalOverdue = () => {
    return accountBalances.reduce((sum, b) => sum + b.overdueAmount, 0);
  };

  const exportToExcel = () => {
    alert('Export to Excel functionality will be implemented');
  };

  const exportToPDF = () => {
    alert('Export to PDF functionality will be implemented');
  };

  const filteredBalances = getFilteredBalances();
  const filteredEntries = getFilteredEntries();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Ledger & Accounts</h1>
          <p className="text-slate-600 mt-1">View and manage account ledgers and balances</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToExcel}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
          >
            <Download size={16} />
            Export Excel
          </button>
          <button
            onClick={exportToPDF}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
          >
            <Download size={16} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Balance</p>
              <p className={`text-2xl font-semibold mt-1 ${getTotalBalance() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{Math.abs(getTotalBalance()).toLocaleString()}
              </p>
            </div>
            <DollarSign size={32} className="text-blue-600" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Outstanding</p>
              <p className="text-2xl font-semibold mt-1 text-orange-600">
                ₹{getTotalOutstanding().toLocaleString()}
              </p>
            </div>
            <TrendingUp size={32} className="text-orange-600" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue Amount</p>
              <p className="text-2xl font-semibold mt-1 text-red-600">
                ₹{getTotalOverdue().toLocaleString()}
              </p>
            </div>
            <TrendingDown size={32} className="text-red-600" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Parties</p>
              <p className="text-2xl font-semibold mt-1">{accountBalances.length}</p>
            </div>
            <FileText size={32} className="text-purple-600" />
          </div>
        </Card>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setView('summary')}
          className={`px-4 py-2 rounded ${
            view === 'summary'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Account Summary
        </button>
        <button
          onClick={() => setView('detailed')}
          className={`px-4 py-2 rounded ${
            view === 'detailed'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Detailed Ledger
        </button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Filter size={14} className="inline mr-1" />
              Search
            </label>
            <input
              type="text"
              placeholder="Party name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={filter.search || ''}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Party Type</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={filter.partyType || ''}
              onChange={(e) => setFilter({ ...filter, partyType: e.target.value || undefined })}
            >
              <option value="">All Types</option>
              <option value="Buyer">Buyer</option>
              <option value="Seller">Seller</option>
              <option value="Broker">Broker</option>
              <option value="Vendor">Vendor</option>
            </select>
          </div>
          {view === 'detailed' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={filter.transactionType || ''}
                  onChange={(e) => setFilter({ ...filter, transactionType: e.target.value || undefined })}
                >
                  <option value="">All Types</option>
                  <option value="Sale">Sale</option>
                  <option value="Purchase">Purchase</option>
                  <option value="Payment">Payment</option>
                  <option value="Receipt">Receipt</option>
                  <option value="Commission">Commission</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reconciled</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={filter.reconciled === undefined ? '' : filter.reconciled.toString()}
                  onChange={(e) => setFilter({ 
                    ...filter, 
                    reconciled: e.target.value === '' ? undefined : e.target.value === 'true' 
                  })}
                >
                  <option value="">All</option>
                  <option value="true">Reconciled</option>
                  <option value="false">Not Reconciled</option>
                </select>
              </div>
            </>
          )}
          <div className="flex items-end">
            <button
              onClick={() => setFilter({})}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </Card>

      {/* Account Summary View */}
      {view === 'summary' && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">Account Balances</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Party Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Opening</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Closing</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Outstanding</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBalances.map((balance) => (
                  <tr key={balance.partyId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {balance.partyName}
                      <div className="text-xs text-gray-500">{balance.partyOrg}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant="info">{balance.partyType}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">₹{balance.openingBalance.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-right text-green-600">
                      ₹{balance.totalDebit.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-red-600">
                      ₹{balance.totalCredit.toLocaleString()}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-semibold ${
                      balance.closingBalance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ₹{Math.abs(balance.closingBalance).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-orange-600">
                      ₹{balance.outstandingAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={balance.status === 'Active' ? 'success' : 'error'}>
                        {balance.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => {
                          setSelectedParty(balance.partyId);
                          setView('detailed');
                        }}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredBalances.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No account balances found
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Detailed Ledger View */}
      {view === 'detailed' && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Ledger Entries</h3>
            {selectedParty && (
              <button
                onClick={() => setSelectedParty(null)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Show All Parties
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Party</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {new Date(entry.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {entry.partyName}
                      <div className="text-xs text-gray-500">
                        <Badge variant="info" className="text-xs">{entry.partyType}</Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {entry.description}
                      <div className="text-xs text-gray-500">{entry.transactionType}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span className="text-xs text-gray-500">{entry.referenceType}</span>
                      <div className="font-medium">{entry.referenceNumber}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {entry.entryType === 'Debit' && (
                        <span className="text-green-600 font-medium">
                          ₹{entry.amount.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {entry.entryType === 'Credit' && (
                        <span className="text-red-600 font-medium">
                          ₹{entry.amount.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-semibold ${
                      entry.balance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ₹{Math.abs(entry.balance).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={entry.isReconciled ? 'success' : 'warning'}>
                        {entry.isReconciled ? 'Reconciled' : 'Pending'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredEntries.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No ledger entries found
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default LedgerPage;
