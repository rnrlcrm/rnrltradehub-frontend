/**
 * Access Control Dashboard
 * Comprehensive view of users, roles, permissions, and approval workflows
 */

import React, { useState, useEffect } from 'react';
import { accessControlApi } from '../api/accessControlApi';
import type { EnhancedUser, UserRole, ApprovalWorkflow } from '../types/accessControl';
import type { User } from '../types';
import Card from '../components/ui/Card';
import { Button } from '../components/ui/Form';
import Modal from '../components/ui/Modal';
import { hasPermission } from '../lib/permissions';

interface AccessControlDashboardProps {
  currentUser: User;
}

const AccessControlDashboard: React.FC<AccessControlDashboardProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'approvals' | 'branches'>('users');
  const [users, setUsers] = useState<EnhancedUser[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [approvals, setApprovals] = useState<ApprovalWorkflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [userTypeFilter, setUserTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Permissions
  const canManageUsers = hasPermission(currentUser.role, 'User Management', 'create');
  const canManageRoles = currentUser.role === 'Admin';
  const canApprove = hasPermission(currentUser.role, 'User Management', 'approve');

  useEffect(() => {
    loadData();
  }, [activeTab, userTypeFilter, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      switch (activeTab) {
        case 'users':
          await loadUsers();
          break;
        case 'roles':
          await loadRoles();
          break;
        case 'approvals':
          await loadApprovals();
          break;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    const filters: any = {};
    if (userTypeFilter) filters.userType = userTypeFilter;
    if (statusFilter) filters.status = statusFilter;
    if (searchQuery) filters.search = searchQuery;
    
    const fetchedUsers = await accessControlApi.getAllUsers(filters);
    setUsers(fetchedUsers);
  };

  const loadRoles = async () => {
    const fetchedRoles = await accessControlApi.getAllRoles();
    setRoles(fetchedRoles);
  };

  const loadApprovals = async () => {
    const fetchedApprovals = await accessControlApi.getPendingApprovals();
    setApprovals(fetchedApprovals);
  };

  const handleApproveUser = async (approvalId: string) => {
    try {
      await accessControlApi.approveRequest(approvalId, 'Approved by admin');
      await loadApprovals();
      alert('User approved successfully');
    } catch (err: any) {
      alert(err.message || 'Failed to approve user');
    }
  };

  const handleRejectUser = async (approvalId: string) => {
    const reason = prompt('Please provide a rejection reason:');
    if (!reason) return;

    try {
      await accessControlApi.rejectRequest(approvalId, reason);
      await loadApprovals();
      alert('User rejected');
    } catch (err: any) {
      alert(err.message || 'Failed to reject user');
    }
  };

  const handleSuspendUser = async (userId: string) => {
    const reason = prompt('Please provide a suspension reason:');
    if (!reason) return;

    try {
      await accessControlApi.suspendUser(userId, reason);
      await loadUsers();
      alert('User suspended');
    } catch (err: any) {
      alert(err.message || 'Failed to suspend user');
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      await accessControlApi.activateUser(userId);
      await loadUsers();
      alert('User activated');
    } catch (err: any) {
      alert(err.message || 'Failed to activate user');
    }
  };

  if (!canManageUsers && !canManageRoles && !canApprove) {
    return (
      <Card title="Access Control Dashboard">
        <div className="p-6 text-center">
          <p className="text-red-600">You do not have permission to access this page.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="border-b border-slate-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-slate-800">Access Control Dashboard</h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage users, roles, permissions, and approval workflows
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          {canManageUsers && (
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'users'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Users ({users.length})
            </button>
          )}
          {canManageRoles && (
            <button
              onClick={() => setActiveTab('roles')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'roles'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Roles & Permissions ({roles.length})
            </button>
          )}
          {canApprove && (
            <button
              onClick={() => setActiveTab('approvals')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'approvals'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Pending Approvals
              {approvals.length > 0 && (
                <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                  {approvals.length}
                </span>
              )}
            </button>
          )}
          <button
            onClick={() => setActiveTab('branches')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'branches'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Branch Access
          </button>
        </div>

        <div className="p-6">
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-slate-600">Loading...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              {activeTab === 'users' && (
                <UsersTab
                  users={users}
                  userTypeFilter={userTypeFilter}
                  statusFilter={statusFilter}
                  searchQuery={searchQuery}
                  onUserTypeFilterChange={setUserTypeFilter}
                  onStatusFilterChange={setStatusFilter}
                  onSearchChange={setSearchQuery}
                  onSuspend={handleSuspendUser}
                  onActivate={handleActivateUser}
                  onRefresh={loadUsers}
                />
              )}

              {activeTab === 'roles' && (
                <RolesTab roles={roles} onRefresh={loadRoles} />
              )}

              {activeTab === 'approvals' && (
                <ApprovalsTab
                  approvals={approvals}
                  onApprove={handleApproveUser}
                  onReject={handleRejectUser}
                />
              )}

              {activeTab === 'branches' && (
                <BranchAccessTab users={users} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Users Tab Component
const UsersTab: React.FC<{
  users: EnhancedUser[];
  userTypeFilter: string;
  statusFilter: string;
  searchQuery: string;
  onUserTypeFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onSuspend: (userId: string) => void;
  onActivate: (userId: string) => void;
  onRefresh: () => void;
}> = ({
  users,
  userTypeFilter,
  statusFilter,
  searchQuery,
  onUserTypeFilterChange,
  onStatusFilterChange,
  onSearchChange,
  onSuspend,
  onActivate,
  onRefresh,
}) => {
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={userTypeFilter}
          onChange={(e) => onUserTypeFilterChange(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All User Types</option>
          <option value="back_office">Back Office</option>
          <option value="business_partner">Business Partner</option>
          <option value="sub_user">Sub User</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
          <option value="pending_approval">Pending Approval</option>
        </select>
        <Button onClick={onRefresh}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Branches
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-slate-900">{user.name}</div>
                    <div className="text-sm text-slate-500">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {user.userType.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {user.roleName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : user.status === 'suspended'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {user.branchIds.length === 0 ? 'All Branches' : `${user.branchIds.length} branches`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  {user.status === 'active' && (
                    <button
                      onClick={() => onSuspend(user.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Suspend
                    </button>
                  )}
                  {user.status === 'suspended' && (
                    <button
                      onClick={() => onActivate(user.id)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Activate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No users found matching the selected filters
          </div>
        )}
      </div>
    </div>
  );
};

// Roles Tab Component
const RolesTab: React.FC<{
  roles: UserRole[];
  onRefresh: () => void;
}> = ({ roles, onRefresh }) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-800">Roles & Permissions</h3>
        <Button onClick={onRefresh}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => (
          <div key={role.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-slate-900">{role.name}</h4>
              {role.isSystemRole && (
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">System</span>
              )}
            </div>
            <p className="text-sm text-slate-600 mb-3">{role.description}</p>
            <div className="text-xs text-slate-500">
              <span className="font-medium">Type:</span> {role.userType.replace('_', ' ')}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              <span className="font-medium">Permissions:</span> {role.permissions.length} modules
            </div>
          </div>
        ))}
      </div>

      {roles.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          No roles configured
        </div>
      )}
    </div>
  );
};

// Approvals Tab Component
const ApprovalsTab: React.FC<{
  approvals: ApprovalWorkflow[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}> = ({ approvals, onApprove, onReject }) => {
  return (
    <div className="space-y-4">
      {approvals.map((approval) => (
        <div key={approval.id} className="border border-slate-200 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="text-lg font-semibold text-slate-900">
                  {approval.requestType.replace('_', ' ').toUpperCase()}
                </h4>
                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                  Pending
                </span>
              </div>
              <div className="space-y-1 text-sm text-slate-600">
                <p><span className="font-medium">Requester:</span> {approval.requesterName}</p>
                <p><span className="font-medium">User Email:</span> {approval.targetUserEmail}</p>
                <p><span className="font-medium">Requested:</span> {new Date(approval.createdAt).toLocaleString()}</p>
              </div>
              {approval.details && (
                <div className="mt-3 p-3 bg-slate-50 rounded text-sm">
                  <pre className="whitespace-pre-wrap text-slate-700">
                    {JSON.stringify(approval.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <div className="flex gap-2 ml-4">
              <Button
                onClick={() => onApprove(approval.id)}
                className="bg-green-600 hover:bg-green-700"
              >
                Approve
              </Button>
              <Button
                onClick={() => onReject(approval.id)}
                variant="secondary"
                className="border-red-600 text-red-600 hover:bg-red-50"
              >
                Reject
              </Button>
            </div>
          </div>
        </div>
      ))}

      {approvals.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-2 text-sm text-slate-500">No pending approvals</p>
        </div>
      )}
    </div>
  );
};

// Branch Access Tab Component
const BranchAccessTab: React.FC<{
  users: EnhancedUser[];
}> = ({ users }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-800">Branch-Level Access Control</h3>
      <p className="text-sm text-slate-600">
        Users with restricted branch access can only view and modify data from their assigned branches.
      </p>

      <div className="space-y-3">
        {users
          .filter((user) => user.branchIds.length > 0)
          .map((user) => (
            <div key={user.id} className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-slate-900">{user.name}</h4>
                  <p className="text-sm text-slate-500">{user.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">
                    {user.branchIds.length} {user.branchIds.length === 1 ? 'Branch' : 'Branches'}
                  </p>
                  <p className="text-xs text-slate-500">Access Level: Limited</p>
                </div>
              </div>
            </div>
          ))}

        {users.filter((user) => user.branchIds.length > 0).length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No users with branch-level restrictions
          </div>
        )}
      </div>
    </div>
  );
};

export default AccessControlDashboard;
