import React, { useState } from 'react';
import { FinancialYear, FYPendingItems, FYSplitSummary } from '../../types';
import { Button } from '../ui/Form';
import { mockInvoices, mockCommissions, mockDisputes, mockSalesContracts } from '../../data/mockData';

const FYManagement: React.FC = () => {
  const [showSplitDialog, setShowSplitDialog] = useState(false);
  const [splitCompleted, setSplitCompleted] = useState(false);
  const [splitSummary, setSplitSummary] = useState<FYSplitSummary | null>(null);

  // Current FY (mock data)
  const currentFY: FinancialYear = {
    id: 1,
    fyCode: '2024-2025',
    startDate: '2024-04-01',
    endDate: '2025-03-31',
    status: 'ACTIVE',
    createdAt: '2024-04-01T00:00:00Z',
  };

  // Calculate days remaining
  const daysRemaining = Math.ceil(
    (new Date(currentFY.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  // Calculate pending items
  const pendingItems: FYPendingItems = {
    unpaidInvoices: {
      count: mockInvoices.filter(i => i.status !== 'Paid').length,
      totalAmount: mockInvoices
        .filter(i => i.status !== 'Paid')
        .reduce((sum, i) => sum + (i.totalAmount || i.amount), 0),
      items: mockInvoices.filter(i => i.status !== 'Paid'),
    },
    dueCommissions: {
      count: mockCommissions.filter(c => c.status === 'Due').length,
      totalAmount: mockCommissions
        .filter(c => c.status === 'Due')
        .reduce((sum, c) => sum + (c.totalAmount || c.amount), 0),
      items: mockCommissions.filter(c => c.status === 'Due'),
    },
    openDisputes: {
      count: mockDisputes.filter(d => d.status === 'Open').length,
      items: mockDisputes.filter(d => d.status === 'Open'),
    },
    activeContracts: {
      count: mockSalesContracts.filter(sc => sc.status === 'Active').length,
      items: mockSalesContracts.filter(sc => sc.status === 'Active'),
    },
  };

  const handleExecuteSplit = () => {
    // Simulate FY split
    const summary: FYSplitSummary = {
      fromFY: currentFY.fyCode,
      toFY: '2025-2026',
      executedBy: 'Admin',
      executedAt: new Date().toISOString(),
      invoicesMigrated: pendingItems.unpaidInvoices.count,
      commissionsMigrated: pendingItems.dueCommissions.count,
      contractsMigrated: pendingItems.activeContracts.count,
      disputesMigrated: pendingItems.openDisputes.count,
      notes: 'Automated FY split completed successfully',
    };

    setSplitSummary(summary);
    setSplitCompleted(true);
    setShowSplitDialog(false);

    // In real implementation, this would call backend API
    console.log('FY Split executed:', summary);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Financial Year Management</h2>

      {/* Current FY Info */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Current Financial Year</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">FY Code</p>
            <p className="text-xl font-bold">{currentFY.fyCode}</p>
          </div>
          <div>
            <p className="text-gray-600">Status</p>
            <p className="text-xl">
              <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                currentFY.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-500'
              }`}></span>
              {currentFY.status}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Period</p>
            <p className="font-medium">
              {new Date(currentFY.startDate).toLocaleDateString()} - {new Date(currentFY.endDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Days Remaining</p>
            <p className="text-xl font-bold text-blue-600">{daysRemaining} days</p>
          </div>
        </div>
      </div>

      {/* Pending Items Summary */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Pending Items for Next FY</h3>
        <div className="text-sm text-gray-600 mb-4">
          These items will be carried forward when you split the Financial Year
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
            <div className="flex items-center">
              <span className="text-2xl mr-3">📄</span>
              <div>
                <p className="font-medium">Unpaid Invoices</p>
                <p className="text-sm text-gray-600">{pendingItems.unpaidInvoices.count} invoices</p>
              </div>
            </div>
            <p className="text-lg font-bold">₹{pendingItems.unpaidInvoices.totalAmount.toLocaleString('en-IN')}</p>
          </div>

          <div className="flex items-center justify-between p-3 bg-green-50 rounded">
            <div className="flex items-center">
              <span className="text-2xl mr-3">💰</span>
              <div>
                <p className="font-medium">Due Commissions</p>
                <p className="text-sm text-gray-600">{pendingItems.dueCommissions.count} commissions</p>
              </div>
            </div>
            <p className="text-lg font-bold">₹{pendingItems.dueCommissions.totalAmount.toLocaleString('en-IN')}</p>
          </div>

          <div className="flex items-center justify-between p-3 bg-red-50 rounded">
            <div className="flex items-center">
              <span className="text-2xl mr-3">⚠️</span>
              <div>
                <p className="font-medium">Open Disputes</p>
                <p className="text-sm text-gray-600">{pendingItems.openDisputes.count} disputes</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
            <div className="flex items-center">
              <span className="text-2xl mr-3">📋</span>
              <div>
                <p className="font-medium">Active Contracts</p>
                <p className="text-sm text-gray-600">{pendingItems.activeContracts.count} contracts</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button onClick={() => setShowSplitDialog(true)} className="bg-red-600 hover:bg-red-700 text-white">
            Execute FY Split
          </Button>
          <Button onClick={() => alert('Review Details')}>
            Review Details
          </Button>
        </div>
      </div>

      {/* Split Confirmation Dialog */}
      {showSplitDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Confirm FY Split</h3>
            <p className="mb-4">
              This will close FY <strong>{currentFY.fyCode}</strong> and create new FY <strong>2025-2026</strong>.
            </p>
            <p className="mb-4">All pending items will be migrated to the new FY:</p>
            <ul className="list-disc pl-5 mb-4 text-sm">
              <li>{pendingItems.unpaidInvoices.count} Unpaid Invoices</li>
              <li>{pendingItems.dueCommissions.count} Due Commissions</li>
              <li>{pendingItems.openDisputes.count} Open Disputes</li>
              <li>{pendingItems.activeContracts.count} Active Contracts</li>
            </ul>
            <p className="text-red-600 font-medium mb-4">This action cannot be undone!</p>
            <div className="flex gap-3">
              <Button onClick={handleExecuteSplit} className="bg-red-600 hover:bg-red-700 text-white">
                Confirm Split
              </Button>
              <Button onClick={() => setShowSplitDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Split Success Message */}
      {splitCompleted && splitSummary && (
        <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded">
          <h3 className="text-lg font-semibold text-green-800 mb-2">✅ FY Split Completed Successfully!</h3>
          <div className="text-sm space-y-1">
            <p><strong>From FY:</strong> {splitSummary.fromFY} (CLOSED)</p>
            <p><strong>To FY:</strong> {splitSummary.toFY} (ACTIVE)</p>
            <p><strong>Executed By:</strong> {splitSummary.executedBy}</p>
            <p><strong>Executed At:</strong> {new Date(splitSummary.executedAt).toLocaleString()}</p>
            <p className="mt-3"><strong>Migrated Items:</strong></p>
            <ul className="list-disc pl-5">
              <li>{splitSummary.invoicesMigrated} Invoices</li>
              <li>{splitSummary.commissionsMigrated} Commissions</li>
              <li>{splitSummary.contractsMigrated} Contracts</li>
              <li>{splitSummary.disputesMigrated} Disputes</li>
            </ul>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> FY split should be performed at year-end after all transactions are finalized.
          All pending items will automatically carry forward to the new Financial Year with updated status.
        </p>
      </div>
    </div>
  );
};

export default FYManagement;
