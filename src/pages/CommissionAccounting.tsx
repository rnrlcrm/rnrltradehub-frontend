
import React, { useState, useMemo } from 'react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import { User, LedgerEntry, AccountStatement } from '../types';
import { hasPermission } from '../lib/permissions';
import { Button, Select, Input } from '../components/ui/Form';
import { mockCommissions, mockSalesContracts, mockBusinessPartners } from '../data/mockData';

interface CommissionAccountingProps {
  currentUser: User;
}

const CommissionAccounting: React.FC<CommissionAccountingProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [agentFilter, setAgentFilter] = useState<string>('all');

  if (!hasPermission(currentUser.role, 'Commissions', 'read')) {
    return (
      <Card title="Access Denied">
        <p className="text-red-600">You do not have permission to view this page.</p>
      </Card>
    );
  }

  // Generate commission ledger entries
  const commissionLedgerEntries = useMemo((): LedgerEntry[] => {
    const entries: LedgerEntry[] = [];
    let runningBalance = 0;

    mockCommissions.forEach(comm => {
      const contract = mockSalesContracts.find(sc => sc.scNo === comm.salesContractId);
      
      // Commission payable (Credit - we owe the agent)
      if (comm.status === 'Due') {
        runningBalance -= comm.amount; // Liability increases
        entries.push({
          id: `comm_ledger_${comm.id}`,
          date: contract?.date || new Date().toISOString().split('T')[0],
          transactionType: 'Commission',
          referenceNo: comm.commissionId,
          salesContractId: comm.salesContractId,
          partyId: contract?.agentId || 'unknown',
          partyName: comm.agent,
          partyType: 'SELLER', // Agent is like a seller of services
          debit: 0,
          credit: comm.amount, // Commission expense
          balance: runningBalance,
          description: `Commission payable to ${comm.agent} for ${comm.salesContractId}`,
        });
      } else {
        // Commission paid (Debit - reducing liability)
        runningBalance += comm.amount;
        entries.push({
          id: `comm_ledger_${comm.id}`,
          date: contract?.date || new Date().toISOString().split('T')[0],
          transactionType: 'Commission',
          referenceNo: comm.commissionId,
          salesContractId: comm.salesContractId,
          partyId: contract?.agentId || 'unknown',
          partyName: comm.agent,
          partyType: 'SELLER',
          debit: comm.amount, // Payment made
          credit: 0,
          balance: runningBalance,
          description: `Commission paid to ${comm.agent} for ${comm.salesContractId}`,
        });
      }
    });

    return entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, []);

  // Generate agent-wise statements
  const agentStatements = useMemo((): AccountStatement[] => {
    const statements: { [key: string]: AccountStatement } = {};

    commissionLedgerEntries.forEach(entry => {
      if (!statements[entry.partyName]) {
        statements[entry.partyName] = {
          partyId: entry.partyId,
          partyName: entry.partyName,
          partyType: 'SELLER',
          openingBalance: 0,
          totalDebit: 0,
          totalCredit: 0,
          closingBalance: 0,
          entries: [],
        };
      }

      statements[entry.partyName].totalDebit += entry.debit;
      statements[entry.partyName].totalCredit += entry.credit;
      statements[entry.partyName].entries.push(entry);
    });

    // Calculate closing balances (credit - debit = amount we owe)
    Object.values(statements).forEach(stmt => {
      stmt.closingBalance = stmt.totalCredit - stmt.totalDebit;
    });

    return Object.values(statements);
  }, [commissionLedgerEntries]);

  // Summary metrics
  const summary = useMemo(() => {
    const totalCommissionExpense = mockCommissions.reduce((sum, c) => sum + c.amount, 0);
    const totalDue = mockCommissions.filter(c => c.status === 'Due').reduce((sum, c) => sum + c.amount, 0);
    const totalPaid = mockCommissions.filter(c => c.status === 'Paid').reduce((sum, c) => sum + c.amount, 0);
    const agentCount = new Set(mockCommissions.map(c => c.agent)).size;
    
    return { totalCommissionExpense, totalDue, totalPaid, agentCount };
  }, []);

  // Unique agents for filter
  const agents = useMemo(() => {
    return [...new Set(mockCommissions.map(c => c.agent))].sort();
  }, []);

  // Filtered data
  const filteredLedger = useMemo(() => {
    return commissionLedgerEntries.filter(entry => {
      const matchesAgent = agentFilter === 'all' || entry.partyName === agentFilter;
      const matchesDateFrom = !dateFrom || new Date(entry.date) >= new Date(dateFrom);
      const matchesDateTo = !dateTo || new Date(entry.date) <= new Date(dateTo);
      
      return matchesAgent && matchesDateFrom && matchesDateTo;
    });
  }, [commissionLedgerEntries, agentFilter, dateFrom, dateTo]);

  const clearFilters = () => {
    setAgentFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const exportToCSV = (data: unknown[], filename: string) => {
    alert(`Exporting ${filename}...`);
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <div className="p-4">
          <p className="text-sm text-slate-600">Total Commission Expense</p>
          <p className="text-2xl font-semibold text-slate-800">
            ₹{summary.totalCommissionExpense.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-500 mt-1">{mockCommissions.length} commissions</p>
        </div>
      </Card>
      <Card>
        <div className="p-4">
          <p className="text-sm text-slate-600">Due to Agents</p>
          <p className="text-2xl font-semibold text-red-600">
            ₹{summary.totalDue.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-500 mt-1">Outstanding liability</p>
        </div>
      </Card>
      <Card>
        <div className="p-4">
          <p className="text-sm text-slate-600">Paid to Agents</p>
          <p className="text-2xl font-semibold text-green-600">
            ₹{summary.totalPaid.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-500 mt-1">Settled payments</p>
        </div>
      </Card>
      <Card>
        <div className="p-4">
          <p className="text-sm text-slate-600">Active Agents</p>
          <p className="text-2xl font-semibold text-blue-600">{summary.agentCount}</p>
          <p className="text-xs text-slate-500 mt-1">Unique commission agents</p>
        </div>
      </Card>
    </div>
  );

  const renderCommissionLedger = () => {
    const ledgerColumns = [
      { header: 'Date', accessor: 'date' },
      { header: 'Commission ID', accessor: 'referenceNo' },
      { header: 'Sales Contract', accessor: 'salesContractId' },
      { header: 'Agent', accessor: 'partyName' },
      { header: 'Description', accessor: 'description' },
      {
        header: 'Debit (₹)',
        accessor: (item: LedgerEntry) => item.debit > 0 ? item.debit.toLocaleString('en-IN') : '-',
      },
      {
        header: 'Credit (₹)',
        accessor: (item: LedgerEntry) => item.credit > 0 ? item.credit.toLocaleString('en-IN') : '-',
      },
      {
        header: 'Balance (₹)',
        accessor: (item: LedgerEntry) => (
          <span className={item.balance < 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
            {item.balance.toLocaleString('en-IN')}
          </span>
        ),
      },
    ];

    return (
      <Card 
        title="Commission Ledger"
        actions={
          <Button onClick={() => exportToCSV(filteredLedger, 'commission_ledger.csv')} className="text-sm">
            Export to CSV
          </Button>
        }
      >
        <Table<LedgerEntry> data={filteredLedger} columns={ledgerColumns} />
      </Card>
    );
  };

  const renderAgentStatements = () => {
    const statementColumns = [
      { header: 'Agent Name', accessor: 'partyName' },
      {
        header: 'Total Commission (₹)',
        accessor: (item: AccountStatement) => item.totalCredit.toLocaleString('en-IN'),
      },
      {
        header: 'Total Paid (₹)',
        accessor: (item: AccountStatement) => item.totalDebit.toLocaleString('en-IN'),
      },
      {
        header: 'Outstanding (₹)',
        accessor: (item: AccountStatement) => (
          <span className={item.closingBalance > 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
            {item.closingBalance.toLocaleString('en-IN')}
          </span>
        ),
      },
      {
        header: 'Transactions',
        accessor: (item: AccountStatement) => item.entries.length,
      },
    ];

    return (
      <Card 
        title="Agent-wise Statements"
        actions={
          <Button onClick={() => exportToCSV(agentStatements, 'agent_statements.csv')} className="text-sm">
            Export to CSV
          </Button>
        }
      >
        <Table<AccountStatement> data={agentStatements} columns={statementColumns} />
      </Card>
    );
  };

  const renderReconciliation = () => (
    <Card title="Commission Reconciliation">
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-slate-600 font-medium">Total Commission Booked</p>
            <p className="text-2xl font-bold text-blue-800 mt-1">
              ₹{summary.totalCommissionExpense.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-sm text-slate-600 font-medium">Total Commission Paid</p>
            <p className="text-2xl font-bold text-green-800 mt-1">
              ₹{summary.totalPaid.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-slate-600 font-medium">Pending Payment</p>
            <p className="text-2xl font-bold text-red-800 mt-1">
              ₹{summary.totalDue.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold text-slate-800 mb-3">Reconciliation Summary</h3>
          <div className="bg-slate-50 border border-slate-200 rounded-md p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between border-b border-slate-300 pb-2">
                <span className="text-slate-600">Total Commission Entries:</span>
                <span className="font-semibold">{mockCommissions.length}</span>
              </div>
              <div className="flex justify-between border-b border-slate-300 pb-2">
                <span className="text-slate-600">Active Agents:</span>
                <span className="font-semibold">{summary.agentCount}</span>
              </div>
              <div className="flex justify-between border-b border-slate-300 pb-2">
                <span className="text-slate-600">Ledger Entries:</span>
                <span className="font-semibold">{commissionLedgerEntries.length}</span>
              </div>
              <div className="flex justify-between border-b border-slate-300 pb-2">
                <span className="text-slate-600">Settlement Rate:</span>
                <span className="font-semibold">
                  {((summary.totalPaid / summary.totalCommissionExpense) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-300">
              <p className="text-sm text-slate-700">
                <strong>Status:</strong> {summary.totalDue === 0 ? (
                  <span className="text-green-600">✓ All commissions reconciled</span>
                ) : (
                  <span className="text-yellow-600">⚠ {mockCommissions.filter(c => c.status === 'Due').length} pending settlements</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Commission Accounting</h1>
        <p className="text-sm text-slate-600 mt-1">Dedicated accounting module for commission tracking, ledger, and reconciliation</p>
      </div>

      {/* Tab Selector */}
      <Card>
        <div className="p-4">
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={() => setActiveTab('overview')} 
              variant={activeTab === 'overview' ? 'primary' : 'secondary'}
              className="text-sm"
            >
              Overview
            </Button>
            <Button 
              onClick={() => setActiveTab('ledger')} 
              variant={activeTab === 'ledger' ? 'primary' : 'secondary'}
              className="text-sm"
            >
              Commission Ledger
            </Button>
            <Button 
              onClick={() => setActiveTab('statements')} 
              variant={activeTab === 'statements' ? 'primary' : 'secondary'}
              className="text-sm"
            >
              Agent Statements
            </Button>
            <Button 
              onClick={() => setActiveTab('reconciliation')} 
              variant={activeTab === 'reconciliation' ? 'primary' : 'secondary'}
              className="text-sm"
            >
              Reconciliation
            </Button>
          </div>
        </div>
      </Card>

      {/* Filters (for ledger and statements) */}
      {(activeTab === 'ledger' || activeTab === 'statements') && (
        <Card title="Filters">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Agent</label>
              <Select
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
              >
                <option value="all">All Agents</option>
                {agents.map(agent => (
                  <option key={agent} value={agent}>{agent}</option>
                ))}
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
          <div className="px-4 pb-4">
            <Button onClick={clearFilters} className="text-sm bg-slate-500 hover:bg-slate-600">
              Clear Filters
            </Button>
          </div>
        </Card>
      )}

      {/* Render selected tab */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'ledger' && renderCommissionLedger()}
      {activeTab === 'statements' && renderAgentStatements()}
      {activeTab === 'reconciliation' && renderReconciliation()}
    </div>
  );
};

export default CommissionAccounting;
