
import React from 'react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import { AuditLog, User } from '../types';
import { hasPermission } from '../lib/permissions';

interface AuditTrailProps {
  currentUser: User;
  auditLogs: AuditLog[];
}

const AuditTrail: React.FC<AuditTrailProps> = ({ currentUser, auditLogs }) => {
  if (!hasPermission(currentUser.role, 'Audit Trail', 'read')) {
    return (
      <Card title="Access Denied">
        <p className="text-red-600">You do not have permission to view this page. This module is for administrators only.</p>
      </Card>
    );
  }

  const columns = [
    { header: 'Timestamp', accessor: 'timestamp' },
    { header: 'User', accessor: 'user' },
    { header: 'Role', accessor: 'role' },
    { header: 'Module', accessor: 'module' },
    { header: 'Action', accessor: 'action' },
    { header: 'Details', accessor: 'details' },
    { header: 'Reason', accessor: 'reason' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Audit Trail</h1>
      <p className="text-slate-600 -mt-4">Immutable log of all system activities for compliance and security.</p>
      <Card title="System Activity Log">
        <Table<AuditLog> data={auditLogs} columns={columns} />
      </Card>
    </div>
  );
};

export default AuditTrail;
