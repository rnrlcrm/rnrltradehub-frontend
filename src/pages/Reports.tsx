import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import { User } from '../types';
import { hasPermission } from '../lib/permissions';
import { Button, Select, Input } from '../components/ui/Form';
import { mockSalesContracts, mockInvoices, mockPayments, mockCommissions, mockBusinessPartners, mockDisputes } from '../data/mockData';
import { formatCurrency, formatDateTime } from '../utils/formatters';

interface ReportsProps {
  currentUser: User;
}

type ReportType = 
  | 'sales_contracts'
  | 'invoices'
  | 'payments'
  | 'commissions'
  | 'disputes'
  | 'business_partners'
  | 'outstanding_receivables'
  | 'outstanding_payables'
  | 'commission_summary'
  | 'contract_wise_summary'
  | 'party_wise_ledger'
  | 'aging_analysis';

const Reports: React.FC<ReportsProps> = ({ currentUser }) => {
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('sales_contracts');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedParty, setSelectedParty] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [generatedReport, setGeneratedReport] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!hasPermission(currentUser.role, 'Reports', 'read')) {
    return (
      <Card title="Access Denied">
        <p className="text-red-600">You do not have permission to view this page.</p>
      </Card>
    );
  }

  const reportTypes = [
    { value: 'sales_contracts', label: 'Sales Contracts Report', category: 'Sales' },
    { value: 'invoices', label: 'Invoices Report', category: 'Financial' },
    { value: 'payments', label: 'Payments Report', category: 'Financial' },
    { value: 'commissions', label: 'Commissions Report', category: 'Financial' },
    { value: 'disputes', label: 'Disputes Report', category: 'Operations' },
    { value: 'business_partners', label: 'Business Partners Report', category: 'Master Data' },
    { value: 'outstanding_receivables', label: 'Outstanding Receivables', category: 'Financial' },
    { value: 'outstanding_payables', label: 'Outstanding Payables', category: 'Financial' },
    { value: 'commission_summary', label: 'Commission Summary by Agent', category: 'Financial' },
    { value: 'contract_wise_summary', label: 'Contract-wise Summary', category: 'Sales' },
    { value: 'party_wise_ledger', label: 'Party-wise Ledger', category: 'Accounts' },
    { value: 'aging_analysis', label: 'Aging Analysis (30/60/90 days)', category: 'Accounts' },
  ];

  const allParties = ['all', ...mockBusinessPartners.map(bp => bp.name)];
  const statusOptions: { [key in ReportType]?: string[] } = {
    sales_contracts: ['all', 'Draft', 'Active', 'Completed', 'Cancelled'],
    invoices: ['all', 'Paid', 'Unpaid', 'Partially Paid', 'Overdue'],
    payments: ['all', 'Received', 'Pending', 'Failed'],
    commissions: ['all', 'Due', 'Paid', 'Cancelled'],
    disputes: ['all', 'Open', 'Resolved', 'Closed'],
  };

  const generateReport = () => {
    setIsGenerating(true);
    
    // Simulate report generation
    setTimeout(() => {
      let reportData: any = null;
      
      switch (selectedReportType) {
        case 'sales_contracts':
          let contracts = [...mockSalesContracts];
          if (dateFrom) contracts = contracts.filter(c => c.date >= dateFrom);
          if (dateTo) contracts = contracts.filter(c => c.date <= dateTo);
          if (selectedStatus !== 'all') contracts = contracts.filter(c => c.status === selectedStatus);
          reportData = {
            title: 'Sales Contracts Report',
            columns: [
              { header: 'SC No.', accessor: 'scNo' },
              { header: 'Date', accessor: 'date' },
              { header: 'Client', accessor: 'clientName' },
              { header: 'Commodity', accessor: 'commodity' },
              { header: 'Quantity', accessor: (item: any) => `${item.quantity} ${item.unit}` },
              { header: 'Rate', accessor: (item: any) => formatCurrency(item.rate) },
              { header: 'Total Value', accessor: (item: any) => formatCurrency(item.quantity * item.rate) },
              { header: 'Status', accessor: 'status' },
            ],
            data: contracts,
            summary: {
              totalContracts: contracts.length,
              totalValue: contracts.reduce((sum, c) => sum + (c.quantity * c.rate), 0),
              byCCI: contracts.filter(c => c.contractType === 'CCI').length,
              byNormal: contracts.filter(c => c.contractType === 'Normal').length,
            }
          };
          break;

        case 'invoices':
          let invoices = [...mockInvoices];
          if (dateFrom) invoices = invoices.filter(i => i.date >= dateFrom);
          if (dateTo) invoices = invoices.filter(i => i.date <= dateTo);
          if (selectedStatus !== 'all') invoices = invoices.filter(i => i.status === selectedStatus);
          reportData = {
            title: 'Invoices Report',
            columns: [
              { header: 'Invoice No.', accessor: 'invoiceNo' },
              { header: 'Date', accessor: 'date' },
              { header: 'SC No.', accessor: 'salesContractId' },
              { header: 'Amount', accessor: (item: any) => formatCurrency(item.amount) },
              { header: 'Status', accessor: 'status' },
              { header: 'Due Date', accessor: 'dueDate' },
            ],
            data: invoices,
            summary: {
              totalInvoices: invoices.length,
              totalAmount: invoices.reduce((sum, i) => sum + i.amount, 0),
              paid: invoices.filter(i => i.status === 'Paid').length,
              unpaid: invoices.filter(i => i.status === 'Unpaid').length,
              partiallyPaid: invoices.filter(i => i.status === 'Partially Paid').length,
            }
          };
          break;

        case 'payments':
          let payments = [...mockPayments];
          if (dateFrom) payments = payments.filter(p => p.date >= dateFrom);
          if (dateTo) payments = payments.filter(p => p.date <= dateTo);
          reportData = {
            title: 'Payments Report',
            columns: [
              { header: 'Payment ID', accessor: 'paymentId' },
              { header: 'Date', accessor: 'date' },
              { header: 'Invoice ID', accessor: 'invoiceId' },
              { header: 'Amount', accessor: (item: any) => formatCurrency(item.amount) },
              { header: 'Method', accessor: 'method' },
              { header: 'Reference', accessor: 'referenceNo' },
            ],
            data: payments,
            summary: {
              totalPayments: payments.length,
              totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
              byMethod: payments.reduce((acc: any, p) => {
                acc[p.method] = (acc[p.method] || 0) + 1;
                return acc;
              }, {}),
            }
          };
          break;

        case 'commissions':
          let commissions = [...mockCommissions];
          if (dateFrom) commissions = commissions.filter(c => c.date >= dateFrom);
          if (dateTo) commissions = commissions.filter(c => c.date <= dateTo);
          if (selectedStatus !== 'all') commissions = commissions.filter(c => c.status === selectedStatus);
          reportData = {
            title: 'Commissions Report',
            columns: [
              { header: 'Commission ID', accessor: 'id' },
              { header: 'Date', accessor: 'date' },
              { header: 'SC No.', accessor: 'salesContractId' },
              { header: 'Agent', accessor: 'agentName' },
              { header: 'Amount', accessor: (item: any) => formatCurrency(item.amount) },
              { header: 'Status', accessor: 'status' },
            ],
            data: commissions,
            summary: {
              totalCommissions: commissions.length,
              totalAmount: commissions.reduce((sum, c) => sum + c.amount, 0),
              due: commissions.filter(c => c.status === 'Due').reduce((sum, c) => sum + c.amount, 0),
              paid: commissions.filter(c => c.status === 'Paid').reduce((sum, c) => sum + c.amount, 0),
            }
          };
          break;

        case 'disputes':
          let disputes = [...mockDisputes];
          if (dateFrom) disputes = disputes.filter(d => d.date >= dateFrom);
          if (dateTo) disputes = disputes.filter(d => d.date <= dateTo);
          if (selectedStatus !== 'all') disputes = disputes.filter(d => d.status === selectedStatus);
          reportData = {
            title: 'Disputes Report',
            columns: [
              { header: 'Dispute ID', accessor: 'id' },
              { header: 'Date', accessor: 'date' },
              { header: 'SC No.', accessor: 'salesContractId' },
              { header: 'Reason', accessor: 'reason' },
              { header: 'Amount', accessor: (item: any) => formatCurrency(item.amount) },
              { header: 'Status', accessor: 'status' },
            ],
            data: disputes,
            summary: {
              totalDisputes: disputes.length,
              totalAmount: disputes.reduce((sum, d) => sum + d.amount, 0),
              open: disputes.filter(d => d.status === 'Open').length,
              resolved: disputes.filter(d => d.status === 'Resolved').length,
            }
          };
          break;

        case 'business_partners':
          reportData = {
            title: 'Business Partners Report',
            columns: [
              { header: 'Name', accessor: 'name' },
              { header: 'Type', accessor: 'type' },
              { header: 'City', accessor: 'city' },
              { header: 'State', accessor: 'state' },
              { header: 'GSTIN', accessor: 'gstin' },
              { header: 'Email', accessor: 'email' },
              { header: 'KYC Status', accessor: 'kycStatus' },
            ],
            data: mockBusinessPartners,
            summary: {
              total: mockBusinessPartners.length,
              vendors: mockBusinessPartners.filter(bp => bp.type === 'Vendor').length,
              clients: mockBusinessPartners.filter(bp => bp.type === 'Client').length,
              both: mockBusinessPartners.filter(bp => bp.type === 'Both').length,
            }
          };
          break;

        case 'outstanding_receivables':
          const receivableInvoices = mockInvoices.filter(i => i.status !== 'Paid');
          reportData = {
            title: 'Outstanding Receivables',
            columns: [
              { header: 'Invoice No.', accessor: 'invoiceNo' },
              { header: 'Date', accessor: 'date' },
              { header: 'Due Date', accessor: 'dueDate' },
              { header: 'Amount', accessor: (item: any) => formatCurrency(item.amount) },
              { header: 'Days Overdue', accessor: (item: any) => {
                const days = Math.floor((new Date().getTime() - new Date(item.dueDate).getTime()) / (1000 * 60 * 60 * 24));
                return days > 0 ? days : 0;
              }},
              { header: 'Status', accessor: 'status' },
            ],
            data: receivableInvoices,
            summary: {
              total: receivableInvoices.length,
              totalAmount: receivableInvoices.reduce((sum, i) => sum + i.amount, 0),
            }
          };
          break;

        case 'commission_summary':
          const commissionsByAgent: any = {};
          mockCommissions.forEach(c => {
            if (!commissionsByAgent[c.agentName]) {
              commissionsByAgent[c.agentName] = { agent: c.agentName, total: 0, due: 0, paid: 0, count: 0 };
            }
            commissionsByAgent[c.agentName].count++;
            commissionsByAgent[c.agentName].total += c.amount;
            if (c.status === 'Due') commissionsByAgent[c.agentName].due += c.amount;
            if (c.status === 'Paid') commissionsByAgent[c.agentName].paid += c.amount;
          });
          reportData = {
            title: 'Commission Summary by Agent',
            columns: [
              { header: 'Agent Name', accessor: 'agent' },
              { header: 'Total Commissions', accessor: (item: any) => formatCurrency(item.total) },
              { header: 'Due', accessor: (item: any) => formatCurrency(item.due) },
              { header: 'Paid', accessor: (item: any) => formatCurrency(item.paid) },
              { header: 'Count', accessor: 'count' },
            ],
            data: Object.values(commissionsByAgent),
            summary: {
              totalAgents: Object.keys(commissionsByAgent).length,
              totalCommission: Object.values(commissionsByAgent).reduce((sum: number, a: any) => sum + a.total, 0),
            }
          };
          break;

        case 'aging_analysis':
          const today = new Date();
          const agingData: any = {};
          mockInvoices.filter(i => i.status !== 'Paid').forEach(inv => {
            const invoiceDate = new Date(inv.date);
            const daysDiff = Math.floor((today.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
            
            const partyId = 'Party-' + inv.invoiceNo.split('-')[2];
            if (!agingData[partyId]) {
              agingData[partyId] = {
                party: 'Party ' + inv.invoiceNo.split('-')[2],
                current: 0,
                days30to60: 0,
                days60to90: 0,
                days90plus: 0,
                total: 0,
              };
            }
            
            if (daysDiff <= 30) agingData[partyId].current += inv.amount;
            else if (daysDiff <= 60) agingData[partyId].days30to60 += inv.amount;
            else if (daysDiff <= 90) agingData[partyId].days60to90 += inv.amount;
            else agingData[partyId].days90plus += inv.amount;
            
            agingData[partyId].total += inv.amount;
          });
          reportData = {
            title: 'Aging Analysis (30/60/90 days)',
            columns: [
              { header: 'Party', accessor: 'party' },
              { header: '0-30 Days', accessor: (item: any) => formatCurrency(item.current) },
              { header: '31-60 Days', accessor: (item: any) => formatCurrency(item.days30to60) },
              { header: '61-90 Days', accessor: (item: any) => formatCurrency(item.days60to90) },
              { header: '90+ Days', accessor: (item: any) => formatCurrency(item.days90plus) },
              { header: 'Total', accessor: (item: any) => formatCurrency(item.total) },
            ],
            data: Object.values(agingData),
            summary: {
              totalOutstanding: Object.values(agingData).reduce((sum: number, a: any) => sum + a.total, 0),
            }
          };
          break;

        default:
          reportData = null;
      }

      setGeneratedReport(reportData);
      setIsGenerating(false);
    }, 500);
  };

  const exportToExcel = () => {
    if (!generatedReport) {
      alert('Please generate a report first');
      return;
    }
    alert(`Exporting ${generatedReport.title} to Excel... (Backend integration pending)`);
  };

  const exportToPDF = () => {
    if (!generatedReport) {
      alert('Please generate a report first');
      return;
    }
    alert(`Exporting ${generatedReport.title} to PDF... (Backend integration pending)`);
  };

  const printReport = () => {
    if (!generatedReport) {
      alert('Please generate a report first');
      return;
    }
    window.print();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Reports & Analytics</h1>
        <p className="text-slate-600 mt-1">Generate comprehensive reports from all system modules</p>
      </div>

      {/* Report Selection & Filters */}
      <Card title="Report Configuration">
        <div className="p-6 space-y-6">
          {/* Report Type Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Report Type <span className="text-red-500">*</span>
            </label>
            <Select
              value={selectedReportType}
              onChange={(e) => {
                setSelectedReportType(e.target.value as ReportType);
                setGeneratedReport(null);
              }}
              className="max-w-md"
            >
              {Object.entries(
                reportTypes.reduce((acc, rt) => {
                  if (!acc[rt.category]) acc[rt.category] = [];
                  acc[rt.category].push(rt);
                  return acc;
                }, {} as any)
              ).map(([category, reports]: [string, any]) => (
                <optgroup key={category} label={category}>
                  {reports.map((rt: any) => (
                    <option key={rt.value} value={rt.value}>{rt.label}</option>
                  ))}
                </optgroup>
              ))}
            </Select>
            <p className="text-xs text-slate-500 mt-1">
              Select the type of report you want to generate
            </p>
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
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
            {selectedReportType !== 'business_partners' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Party</label>
                <Select
                  value={selectedParty}
                  onChange={(e) => setSelectedParty(e.target.value)}
                >
                  {allParties.map(party => (
                    <option key={party} value={party}>
                      {party === 'all' ? 'All Parties' : party}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            {statusOptions[selectedReportType] && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <Select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  {statusOptions[selectedReportType]!.map(status => (
                    <option key={status} value={status}>
                      {status === 'all' ? 'All Status' : status}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={generateReport}
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? 'Generating...' : '📊 Generate Report'}
            </Button>
            <Button
              onClick={() => {
                setDateFrom('');
                setDateTo('');
                setSelectedParty('all');
                setSelectedStatus('all');
                setGeneratedReport(null);
              }}
              className="bg-slate-500 hover:bg-slate-600"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Generated Report Display */}
      {generatedReport && (
        <Card
          title={generatedReport.title}
          actions={
            <div className="flex gap-2">
              <Button onClick={exportToExcel} className="text-sm bg-green-600 hover:bg-green-700">
                📊 Export to Excel
              </Button>
              <Button onClick={exportToPDF} className="text-sm bg-red-600 hover:bg-red-700">
                📄 Export to PDF
              </Button>
              <Button onClick={printReport} className="text-sm bg-slate-600 hover:bg-slate-700">
                🖨️ Print
              </Button>
            </div>
          }
        >
          {/* Summary Section */}
          {generatedReport.summary && (
            <div className="p-4 bg-blue-50 border-b">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Report Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(generatedReport.summary).map(([key, value]: [string, any]) => (
                  <div key={key}>
                    <p className="text-xs text-slate-600 uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                    <p className="text-lg font-semibold text-slate-800">
                      {typeof value === 'number' && key.toLowerCase().includes('amount') || key.toLowerCase().includes('value') || key.toLowerCase().includes('commission') || key.toLowerCase().includes('outstanding')
                        ? formatCurrency(value)
                        : typeof value === 'object'
                        ? JSON.stringify(value)
                        : value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Table */}
          <Table data={generatedReport.data} columns={generatedReport.columns} />

          {/* Report Footer */}
          <div className="p-4 bg-slate-50 border-t text-sm text-slate-600">
            <div className="flex justify-between">
              <div>Generated on: {formatDateTime(new Date())}</div>
              <div>Generated by: {currentUser.name}</div>
              <div>Total Records: {generatedReport.data.length}</div>
            </div>
          </div>
        </Card>
      )}

      {/* Help Section */}
      {!generatedReport && (
        <Card>
          <div className="p-6 text-center text-slate-600">
            <p className="text-lg mb-2">👆 Select a report type and configure filters above</p>
            <p className="text-sm">Click "Generate Report" to view the data</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Reports;
