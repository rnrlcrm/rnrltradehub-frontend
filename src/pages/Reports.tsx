
import React, { useState, useMemo } from 'react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import { User, LedgerEntry, AccountStatement, AgingReport } from '../types';
import { hasPermission } from '../lib/permissions';
import { Button, Select, Input } from '../components/ui/Form';
import { mockInvoices, mockPayments, mockCommissions, mockBusinessPartners } from '../data/mockData';

interface ReportsProps {
  currentUser: User;
}

const Reports: React.FC<ReportsProps> = ({ currentUser }) => {
  const [activeReport, setActiveReport] = useState<string>('overview');
  const [selectedParty, setSelectedParty] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  if (!hasPermission(currentUser.role, 'Reports', 'read')) {
    return (
      <Card title="Access Denied">
        <p className="text-red-600">You do not have permission to view this page.</p>
      </Card>
    );
  }

  // Generate ledger entries from invoices, payments, and commissions
  const generateLedgerEntries = (): LedgerEntry[] => {
    const entries: LedgerEntry[] = [];
    let runningBalance = 0;

    // Invoices create debit entries (money owed to us)
    mockInvoices.forEach(inv => {
      runningBalance += inv.amount;
      entries.push({
        id: `ledger_${inv.id}`,
        date: inv.date,
        transactionType: 'Invoice',
        referenceNo: inv.invoiceNo,
        salesContractId: inv.salesContractId,
        partyId: 'bp_001', // Would be from contract
        partyName: 'Global Textiles Inc.',
        partyType: 'BUYER',
        debit: inv.amount,
        credit: 0,
        balance: runningBalance,
        description: `Invoice ${inv.invoiceNo} for SC ${inv.salesContractId}`,
      });
    });

    // Payments create credit entries (money received)
    mockPayments.forEach(pay => {
      runningBalance -= pay.amount;
      entries.push({
        id: `ledger_${pay.id}`,
        date: pay.date,
        transactionType: 'Payment',
        referenceNo: pay.paymentId,
        salesContractId: 'SC-2024-001', // Would be from invoice
        partyId: 'bp_001',
        partyName: 'Global Textiles Inc.',
        partyType: 'BUYER',
        debit: 0,
        credit: pay.amount,
        balance: runningBalance,
        description: `Payment ${pay.paymentId} for Invoice ${pay.invoiceId}`,
      });
    });

    return entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const ledgerEntries = useMemo(() => generateLedgerEntries(), []);

  // Generate account statements
  const generateAccountStatements = (): AccountStatement[] => {
    const statements: { [key: string]: AccountStatement } = {};

    ledgerEntries.forEach(entry => {
      if (!statements[entry.partyId]) {
        statements[entry.partyId] = {
          partyId: entry.partyId,
          partyName: entry.partyName,
          partyType: entry.partyType,
          openingBalance: 0,
          totalDebit: 0,
          totalCredit: 0,
          closingBalance: 0,
          entries: [],
        };
      }

      statements[entry.partyId].totalDebit += entry.debit;
      statements[entry.partyId].totalCredit += entry.credit;
      statements[entry.partyId].entries.push(entry);
    });

    Object.values(statements).forEach(stmt => {
      stmt.closingBalance = stmt.totalDebit - stmt.totalCredit;
    });

    return Object.values(statements);
  };

  const accountStatements = useMemo(() => generateAccountStatements(), [ledgerEntries]);

  // Generate aging report
  const generateAgingReport = (): AgingReport[] => {
    const today = new Date();
    const aging: { [key: string]: AgingReport } = {};

    mockInvoices.filter(inv => inv.status !== 'Paid').forEach(inv => {
      const invoiceDate = new Date(inv.date);
      const daysDiff = Math.floor((today.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));

      const partyId = 'bp_001';
      if (!aging[partyId]) {
        aging[partyId] = {
          partyId,
          partyName: 'Global Textiles Inc.',
          current: 0,
          days30to60: 0,
          days60to90: 0,
          days90plus: 0,
          total: 0,
        };
      }

      if (daysDiff <= 30) {
        aging[partyId].current += inv.amount;
      } else if (daysDiff <= 60) {
        aging[partyId].days30to60 += inv.amount;
      } else if (daysDiff <= 90) {
        aging[partyId].days60to90 += inv.amount;
      } else {
        aging[partyId].days90plus += inv.amount;
      }

      aging[partyId].total += inv.amount;
    });

    return Object.values(aging);
  };

  const agingReport = useMemo(() => generateAgingReport(), []);

  const exportToCSV = (data: unknown[], filename: string) => {
    // Simple CSV export - would need proper implementation
    alert(`Exporting ${filename}...`);
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <div className="p-4">
          <p className="text-sm text-slate-600">Total Receivables</p>
          <p className="text-2xl font-semibold text-blue-600">
            ₹{accountStatements.reduce((sum, stmt) => sum + (stmt.closingBalance > 0 ? stmt.closingBalance : 0), 0).toLocaleString('en-IN')}
          </p>
        </div>
      </Card>
      <Card>
        <div className="p-4">
          <p className="text-sm text-slate-600">Total Payables</p>
          <p className="text-2xl font-semibold text-red-600">
            ₹{Math.abs(accountStatements.reduce((sum, stmt) => sum + (stmt.closingBalance < 0 ? stmt.closingBalance : 0), 0)).toLocaleString('en-IN')}
          </p>
        </div>
      </Card>
      <Card>
        <div className="p-4">
          <p className="text-sm text-slate-600">Overdue (90+ days)</p>
          <p className="text-2xl font-semibold text-orange-600">
            ₹{agingReport.reduce((sum, a) => sum + a.days90plus, 0).toLocaleString('en-IN')}
          </p>
        </div>
      </Card>
      <Card>
        <div className="p-4">
          <p className="text-sm text-slate-600">Total Transactions</p>
          <p className="text-2xl font-semibold text-slate-800">{ledgerEntries.length}</p>
        </div>
      </Card>
    </div>
  );

  const renderLedger = () => {
    const ledgerColumns = [
      { header: 'Date', accessor: 'date' },
      { header: 'Type', accessor: 'transactionType' },
      { header: 'Reference', accessor: 'referenceNo' },
      { header: 'Party', accessor: 'partyName' },
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
          <span className={item.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
            {item.balance.toLocaleString('en-IN')}
          </span>
        ),
      },
    ];

    return (
      <Card 
        title="General Ledger"
        actions={
          <Button onClick={() => exportToCSV(ledgerEntries, 'ledger.csv')} className="text-sm">
            Export to CSV
          </Button>
        }
      >
        <Table<LedgerEntry> data={ledgerEntries} columns={ledgerColumns} />
      </Card>
    );
  };

  const renderAccountStatements = () => {
    const statementColumns = [
      { header: 'Party Name', accessor: 'partyName' },
      { header: 'Type', accessor: 'partyType' },
      {
        header: 'Total Debit (₹)',
        accessor: (item: AccountStatement) => item.totalDebit.toLocaleString('en-IN'),
      },
      {
        header: 'Total Credit (₹)',
        accessor: (item: AccountStatement) => item.totalCredit.toLocaleString('en-IN'),
      },
      {
        header: 'Closing Balance (₹)',
        accessor: (item: AccountStatement) => (
          <span className={item.closingBalance >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
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
        title="Account Statements"
        actions={
          <Button onClick={() => exportToCSV(accountStatements, 'account_statements.csv')} className="text-sm">
            Export to CSV
          </Button>
        }
      >
        <Table<AccountStatement> data={accountStatements} columns={statementColumns} />
      </Card>
    );
  };

  const renderAgingReport = () => {
    const agingColumns = [
      { header: 'Party Name', accessor: 'partyName' },
      {
        header: '0-30 Days (₹)',
        accessor: (item: AgingReport) => item.current.toLocaleString('en-IN'),
      },
      {
        header: '31-60 Days (₹)',
        accessor: (item: AgingReport) => item.days30to60.toLocaleString('en-IN'),
      },
      {
        header: '61-90 Days (₹)',
        accessor: (item: AgingReport) => item.days60to90.toLocaleString('en-IN'),
      },
      {
        header: '90+ Days (₹)',
        accessor: (item: AgingReport) => (
          <span className="text-red-600 font-semibold">{item.days90plus.toLocaleString('en-IN')}</span>
        ),
      },
      {
        header: 'Total Outstanding (₹)',
        accessor: (item: AgingReport) => (
          <span className="font-semibold">{item.total.toLocaleString('en-IN')}</span>
        ),
      },
    ];

    return (
      <Card 
        title="Aging Report - Receivables"
        actions={
          <Button onClick={() => exportToCSV(agingReport, 'aging_report.csv')} className="text-sm">
            Export to CSV
          </Button>
        }
      >
        <Table<AgingReport> data={agingReport} columns={agingColumns} />
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Financial Reports & Analytics</h1>
      <p className="text-slate-600 -mt-4">Comprehensive accounting reports with debit/credit balances</p>

      {/* Report selector */}
      <Card>
        <div className="p-4">
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={() => setActiveReport('overview')} 
              variant={activeReport === 'overview' ? 'primary' : 'secondary'}
              className="text-sm"
            >
              Overview
            </Button>
            <Button 
              onClick={() => setActiveReport('ledger')} 
              variant={activeReport === 'ledger' ? 'primary' : 'secondary'}
              className="text-sm"
            >
              General Ledger
            </Button>
            <Button 
              onClick={() => setActiveReport('statements')} 
              variant={activeReport === 'statements' ? 'primary' : 'secondary'}
              className="text-sm"
            >
              Account Statements
            </Button>
            <Button 
              onClick={() => setActiveReport('aging')} 
              variant={activeReport === 'aging' ? 'primary' : 'secondary'}
              className="text-sm"
            >
              Aging Report
            </Button>
          </div>
        </div>
      </Card>

      {/* Render selected report */}
      {activeReport === 'overview' && renderOverview()}
      {activeReport === 'ledger' && renderLedger()}
      {activeReport === 'statements' && renderAccountStatements()}
      {activeReport === 'aging' && renderAgingReport()}
    </div>
  );
};

export default Reports;
