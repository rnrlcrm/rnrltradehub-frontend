
import React from 'react';
import Card from '../components/ui/Card';
import { User } from '../types';
import { hasPermission } from '../lib/permissions';
import { Button } from '../components/ui/Form';

interface ReportsProps {
  currentUser: User;
}

const ReportCard: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <Card>
    <h3 className="text-base font-semibold text-slate-800">{title}</h3>
    <p className="mt-2 text-sm text-slate-600 h-12">{description}</p>
    <div className="mt-4 pt-4 border-t border-slate-200 flex items-center space-x-2">
      <Button className="text-sm">Generate</Button>
      <Button variant="secondary" className="text-sm">Export Excel</Button>
      <Button variant="secondary" className="text-sm">Export PDF</Button>
    </div>
  </Card>
);

const Reports: React.FC<ReportsProps> = ({ currentUser }) => {
  if (!hasPermission(currentUser.role, 'Reports', 'read')) {
    return (
      <Card title="Access Denied">
        <p className="text-red-600">You do not have permission to view this page.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Reports & Analytics</h1>
      <p className="text-slate-600 -mt-4">Generate and export critical business reports.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ReportCard 
          title="Buyer/Seller Statements" 
          description="Generate detailed statements for any client or vendor for a selected period." 
        />
        <ReportCard 
          title="Ledger Reports" 
          description="View and export complete ledger reports for financial reconciliation and auditing." 
        />
        <ReportCard 
          title="Sales Contract Summary" 
          description="A summary of all sales contracts, including total value, quantity, and status." 
        />
        <ReportCard 
          title="Pending Payments Report" 
          description="List of all outstanding payments from clients with aging details." 
        />
      </div>
    </div>
  );
};

export default Reports;
