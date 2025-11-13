
import React, { useState, useMemo } from 'react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import { AuditLog, User } from '../types';
import { hasPermission } from '../lib/permissions';
import { Button, Input, Select } from '../components/ui/Form';

interface AuditTrailProps {
  currentUser: User;
  auditLogs: AuditLog[];
}

const AuditTrail: React.FC<AuditTrailProps> = ({ currentUser, auditLogs }) => {
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  if (!hasPermission(currentUser.role, 'Audit Trail', 'read')) {
    return (
      <Card title="Access Denied">
        <p className="text-red-600">You do not have permission to view this page. This module is for administrators only.</p>
      </Card>
    );
  }

  // Get unique values for filters
  const modules = useMemo(() => {
    const uniqueModules = [...new Set(auditLogs.map(log => log.module))];
    return uniqueModules.sort();
  }, [auditLogs]);

  const actions = useMemo(() => {
    const uniqueActions = [...new Set(auditLogs.map(log => log.action))];
    return uniqueActions.sort();
  }, [auditLogs]);

  const users = useMemo(() => {
    const uniqueUsers = [...new Set(auditLogs.map(log => log.user))];
    return uniqueUsers.sort();
  }, [auditLogs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === '' || 
        log.details.toLowerCase().includes(searchLower) ||
        log.reason.toLowerCase().includes(searchLower);
      
      // Module filter
      const matchesModule = moduleFilter === 'all' || log.module === moduleFilter;
      
      // Action filter
      const matchesAction = actionFilter === 'all' || log.action === actionFilter;
      
      // User filter
      const matchesUser = userFilter === 'all' || log.user === userFilter;
      
      // Date filter (timestamp might be in different formats, handle carefully)
      if (dateFrom || dateTo) {
        try {
          const logDate = new Date(log.timestamp);
          if (dateFrom && logDate < new Date(dateFrom)) return false;
          if (dateTo && logDate > new Date(dateTo)) return false;
        } catch (e) {
          // If date parsing fails, include the log
          return true;
        }
      }
      
      return matchesSearch && matchesModule && matchesAction && matchesUser;
    });
  }, [auditLogs, searchTerm, moduleFilter, actionFilter, userFilter, dateFrom, dateTo]);

  const clearFilters = () => {
    setSearchTerm('');
    setModuleFilter('all');
    setActionFilter('all');
    setUserFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'User', 'Role', 'Module', 'Action', 'Details', 'Reason'];
    const rows = filteredLogs.map(log => [
      log.timestamp,
      log.user,
      log.role,
      log.module,
      log.action,
      log.details,
      log.reason
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_trail_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

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
      
      {/* Summary Card */}
      <Card>
        <div className="p-4">
          <p className="text-sm text-slate-600">Total Audit Entries</p>
          <p className="text-2xl font-semibold text-slate-800">{filteredLogs.length} of {auditLogs.length}</p>
        </div>
      </Card>

      {/* Filters */}
      <Card title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Search</label>
            <Input
              type="text"
              placeholder="Details or Reason"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Module</label>
            <Select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
            >
              <option value="all">All Modules</option>
              {modules.map(module => (
                <option key={module} value={module}>{module}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Action</label>
            <Select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="all">All Actions</option>
              {actions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">User</label>
            <Select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
            >
              <option value="all">All Users</option>
              {users.map(user => (
                <option key={user} value={user}>{user}</option>
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
        <div className="px-4 pb-4 flex gap-2">
          <Button onClick={clearFilters} className="text-sm bg-slate-500 hover:bg-slate-600">
            Clear Filters
          </Button>
          <Button onClick={exportToCSV} className="text-sm bg-green-600 hover:bg-green-700">
            Export to CSV
          </Button>
        </div>
      </Card>

      {/* Audit Logs Table */}
      <Card title={`System Activity Log (${filteredLogs.length} entries)`}>
        <Table<AuditLog> data={filteredLogs} columns={columns} />
      </Card>
    </div>
  );
};

export default AuditTrail;
