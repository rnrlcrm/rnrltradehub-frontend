
import React from 'react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import { mockCommissions } from '../data/mockData';
import { Commission, User } from '../types';
import { hasPermission } from '../lib/permissions';
import { Button } from '../components/ui/Form';

interface CommissionsProps {
  currentUser: User;
}

const StatusBadge: React.FC<{ status: Commission['status'] }> = ({ status }) => {
  const baseClasses = 'px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-sm';
  const statusClasses = {
    'Due': 'bg-yellow-100 text-yellow-800',
    'Paid': 'bg-green-100 text-green-800',
  };
  return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>;
};

const Commissions: React.FC<CommissionsProps> = ({ currentUser }) => {
  const canRead = hasPermission(currentUser.role, 'Commissions', 'read');
  const canUpdate = hasPermission(currentUser.role, 'Commissions', 'update');

  if (!canRead) {
    return (
      <Card title="Access Denied">
        <p className="text-red-600">You do not have permission to view this page.</p>
      </Card>
    );
  }

  const columns = [
    { header: 'Commission ID', accessor: 'commissionId' },
    { header: 'SC No.', accessor: 'salesContractId' },
    { header: 'Agent', accessor: 'agent' },
    {
      header: 'Amount',
      accessor: (item: Commission) => `₹${item.amount.toLocaleString('en-IN')}`,
    },
    {
      header: 'Status',
      accessor: (item: Commission) => <StatusBadge status={item.status} />,
    },
    {
      header: 'Actions',
      accessor: (item: Commission) => (
        <div className="space-x-4">
          {item.status === 'Due' && canUpdate && <button className="text-blue-600 hover:underline text-sm font-medium">Mark as Paid</button>}
          <button className="text-blue-600 hover:underline text-sm font-medium">View Details</button>
        </div>
      ),
    },
  ];

  const cardActions = (
    <Button className="text-sm">Generate Report</Button>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Commission Management</h1>
      <Card title="All Commissions" actions={cardActions}>
        <Table<Commission> data={mockCommissions} columns={columns} />
      </Card>
    </div>
  );
};

export default Commissions;
