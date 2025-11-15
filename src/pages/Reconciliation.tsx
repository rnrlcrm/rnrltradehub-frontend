import React, { useState } from 'react';
import { User, Reconciliation } from '../types';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { CheckCircle, AlertCircle, FileText, Download, Eye, Filter, Plus } from 'lucide-react';

interface ReconciliationProps {
  currentUser: User;
}

// Mock data for reconciliations
const mockReconciliations: Reconciliation[] = [
  {
    id: 'REC001',
    date: '2024-11-15T00:00:00Z',
    financialYear: 'FY 2024-25',
    type: 'Party',
    partyId: 'P001',
    partyName: 'ABC Mills Pvt Ltd',
    fromDate: '2024-11-01',
    toDate: '2024-11-15',
    systemBalance: 250000,
    statedBalance: 250000,
    difference: 0,
    items: [
      {
        id: 'ITEM001',
        date: '2024-11-01',
        description: 'Sale Invoice SC-2024-001',
        systemAmount: 500000,
        statedAmount: 500000,
        difference: 0,
        status: 'Matched',
      },
      {
        id: 'ITEM002',
        date: '2024-11-05',
        description: 'Payment PAY-2024-001',
        systemAmount: 250000,
        statedAmount: 250000,
        difference: 0,
        status: 'Matched',
      },
    ],
    status: 'Completed',
    completedBy: 'Accounts Manager',
    completedDate: '2024-11-15T10:00:00Z',
    remarks: 'All items matched successfully',
    createdBy: 'Accounts Manager',
    createdAt: '2024-11-15T09:00:00Z',
    updatedAt: '2024-11-15T10:00:00Z',
  },
  {
    id: 'REC002',
    date: '2024-11-15T00:00:00Z',
    financialYear: 'FY 2024-25',
    type: 'Party',
    partyId: 'P002',
    partyName: 'XYZ Traders',
    fromDate: '2024-11-01',
    toDate: '2024-11-15',
    systemBalance: -750000,
    statedBalance: -725000,
    difference: -25000,
    items: [
      {
        id: 'ITEM003',
        date: '2024-11-10',
        description: 'Purchase Invoice SC-2024-002',
        systemAmount: 750000,
        statedAmount: 725000,
        difference: 25000,
        status: 'Unmatched',
        remarks: 'Discount not recorded in system',
      },
    ],
    status: 'In Progress',
    createdBy: 'Accounts Manager',
    createdAt: '2024-11-15T09:30:00Z',
    updatedAt: '2024-11-15T09:30:00Z',
  },
  {
    id: 'REC003',
    date: '2024-11-10T00:00:00Z',
    financialYear: 'FY 2024-25',
    type: 'Contract',
    contractId: 'SC001',
    contractNo: 'SC-2024-001',
    fromDate: '2024-11-01',
    toDate: '2024-11-10',
    systemBalance: 250000,
    statedBalance: 250000,
    difference: 0,
    items: [
      {
        id: 'ITEM004',
        date: '2024-11-01',
        description: 'Contract Value',
        systemAmount: 500000,
        statedAmount: 500000,
        difference: 0,
        status: 'Matched',
      },
      {
        id: 'ITEM005',
        date: '2024-11-05',
        description: 'Payment Received',
        systemAmount: 250000,
        statedAmount: 250000,
        difference: 0,
        status: 'Matched',
      },
    ],
    status: 'Completed',
    completedBy: 'Accounts Manager',
    completedDate: '2024-11-10T15:00:00Z',
    createdBy: 'Accounts Staff',
    createdAt: '2024-11-10T10:00:00Z',
    updatedAt: '2024-11-10T15:00:00Z',
  },
];

const ReconciliationPage: React.FC<ReconciliationProps> = ({ currentUser }) => {
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>(mockReconciliations);
  const [selectedRec, setSelectedRec] = useState<Reconciliation | null>(null);
  const [filter, setFilter] = useState<{
    type?: string;
    status?: string;
    search?: string;
  }>({});

  const getFilteredReconciliations = () => {
    let filtered = reconciliations;

    if (filter.type) {
      filtered = filtered.filter(r => r.type === filter.type);
    }
    if (filter.status) {
      filtered = filtered.filter(r => r.status === filter.status);
    }
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(r =>
        r.id.toLowerCase().includes(searchLower) ||
        (r.partyName && r.partyName.toLowerCase().includes(searchLower)) ||
        (r.contractNo && r.contractNo.toLowerCase().includes(searchLower))
      );
    }

    return filtered;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
      'Pending': 'warning',
      'In Progress': 'info',
      'Completed': 'success',
      'Disputed': 'error',
    };
    return <Badge variant={variants[status] || 'info'}>{status}</Badge>;
  };

  const getItemStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'error'> = {
      'Matched': 'success',
      'Unmatched': 'warning',
      'Disputed': 'error',
    };
    return <Badge variant={variants[status] || 'warning'}>{status}</Badge>;
  };

  const handleCompleteReconciliation = (rec: Reconciliation) => {
    const updated = {
      ...rec,
      status: 'Completed' as const,
      completedBy: currentUser.name,
      completedDate: new Date().toISOString(),
    };
    setReconciliations(reconciliations.map(r => r.id === rec.id ? updated : r));
    setSelectedRec(updated);
  };

  const getPendingCount = () => {
    return reconciliations.filter(r => r.status === 'Pending' || r.status === 'In Progress').length;
  };

  const getUnmatchedCount = () => {
    return reconciliations.reduce((count, rec) => 
      count + rec.items.filter(item => item.status === 'Unmatched').length, 0
    );
  };

  const getTotalDifference = () => {
    return reconciliations.reduce((sum, rec) => sum + Math.abs(rec.difference), 0);
  };

  const filteredReconciliations = getFilteredReconciliations();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Reconciliation</h1>
          <p className="text-slate-600 mt-1">Reconcile accounts, contracts, and transactions</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2">
          <Plus size={16} />
          New Reconciliation
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Reconciliations</p>
              <p className="text-2xl font-semibold mt-1">{reconciliations.length}</p>
            </div>
            <FileText size={32} className="text-blue-600" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-semibold mt-1 text-orange-600">{getPendingCount()}</p>
            </div>
            <AlertCircle size={32} className="text-orange-600" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unmatched Items</p>
              <p className="text-2xl font-semibold mt-1 text-yellow-600">{getUnmatchedCount()}</p>
            </div>
            <AlertCircle size={32} className="text-yellow-600" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Difference</p>
              <p className="text-2xl font-semibold mt-1 text-red-600">
                ₹{getTotalDifference().toLocaleString()}
              </p>
            </div>
            <AlertCircle size={32} className="text-red-600" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Filter size={14} className="inline mr-1" />
              Search
            </label>
            <input
              type="text"
              placeholder="ID, Party, Contract..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={filter.search || ''}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={filter.type || ''}
              onChange={(e) => setFilter({ ...filter, type: e.target.value || undefined })}
            >
              <option value="">All Types</option>
              <option value="Party">Party</option>
              <option value="Contract">Contract</option>
              <option value="Period">Period</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={filter.status || ''}
              onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined })}
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Disputed">Disputed</option>
            </select>
          </div>
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

      {/* Reconciliation List */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Reconciliation Records</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Party/Contract</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">System</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stated</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Difference</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReconciliations.map((rec) => (
                <tr key={rec.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{rec.id}</td>
                  <td className="px-4 py-3 text-sm">
                    <Badge variant="info">{rec.type}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {rec.partyName || rec.contractNo || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {new Date(rec.fromDate).toLocaleDateString()} -<br />
                    {new Date(rec.toDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    ₹{Math.abs(rec.systemBalance).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    ₹{Math.abs(rec.statedBalance).toLocaleString()}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right font-semibold ${
                    rec.difference === 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {rec.difference === 0 ? (
                      <span className="flex items-center justify-end gap-1">
                        <CheckCircle size={14} />
                        Matched
                      </span>
                    ) : (
                      `₹${Math.abs(rec.difference).toLocaleString()}`
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">{getStatusBadge(rec.status)}</td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => setSelectedRec(rec)}
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

          {filteredReconciliations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No reconciliation records found
            </div>
          )}
        </div>
      </Card>

      {/* Detail Modal */}
      {selectedRec && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">{selectedRec.id} - Reconciliation</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedRec.type} - {selectedRec.partyName || selectedRec.contractNo}
                </p>
              </div>
              <button
                onClick={() => setSelectedRec(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status & Period */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Status:</span>
                  <p className="mt-1">{getStatusBadge(selectedRec.status)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Period:</span>
                  <p className="font-medium">
                    {new Date(selectedRec.fromDate).toLocaleDateString()} - {new Date(selectedRec.toDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded">
                <div>
                  <span className="text-sm text-gray-600">System Balance:</span>
                  <p className="text-lg font-semibold">₹{Math.abs(selectedRec.systemBalance).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Stated Balance:</span>
                  <p className="text-lg font-semibold">₹{Math.abs(selectedRec.statedBalance).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Difference:</span>
                  <p className={`text-lg font-semibold ${
                    selectedRec.difference === 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {selectedRec.difference === 0 ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle size={18} />
                        Matched
                      </span>
                    ) : (
                      `₹${Math.abs(selectedRec.difference).toLocaleString()}`
                    )}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Reconciliation Items</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">System</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stated</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Difference</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedRec.items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {new Date(item.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                          <td className="px-4 py-3 text-sm text-right">
                            ₹{item.systemAmount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            ₹{item.statedAmount.toLocaleString()}
                          </td>
                          <td className={`px-4 py-3 text-sm text-right font-semibold ${
                            item.difference === 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {item.difference === 0 ? (
                              <CheckCircle size={14} className="inline" />
                            ) : (
                              `₹${Math.abs(item.difference).toLocaleString()}`
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">{getItemStatusBadge(item.status)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.remarks || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Remarks */}
              {selectedRec.remarks && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Remarks</h3>
                  <p className="text-sm text-gray-700 p-3 bg-gray-50 rounded">{selectedRec.remarks}</p>
                </div>
              )}

              {/* Completion Info */}
              {selectedRec.completedBy && (
                <div className="p-4 bg-green-50 rounded">
                  <p className="text-sm text-green-800">
                    <CheckCircle size={16} className="inline mr-1" />
                    Completed by {selectedRec.completedBy} on {new Date(selectedRec.completedDate!).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Actions */}
              {selectedRec.status !== 'Completed' && (
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleCompleteReconciliation(selectedRec)}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                    disabled={selectedRec.difference !== 0}
                  >
                    <CheckCircle size={16} />
                    Mark as Completed
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2">
                    <Download size={16} />
                    Export Report
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReconciliationPage;
