import React, { useState, useEffect } from 'react';
import { FinancialYear, FYPendingItems, FYSplitSummary } from '../../types';
import { Button } from '../ui/Form';
import financialYearApi from '../../api/financialYearApi';
import { financialYearSchema, fySplitValidationSchema } from '../../schemas/settingsSchemas';
import { z } from 'zod';

const FYManagementEnhanced: React.FC = () => {
  const [currentFY, setCurrentFY] = useState<FinancialYear | null>(null);
  const [allFYs, setAllFYs] = useState<FinancialYear[]>([]);
  const [pendingItems, setPendingItems] = useState<FYPendingItems | null>(null);
  const [splitValidation, setSplitValidation] = useState<any>(null);
  const [splitHistory, setSplitHistory] = useState<FYSplitSummary[]>([]);
  
  const [showSplitDialog, setShowSplitDialog] = useState(false);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [splitCompleted, setSplitCompleted] = useState(false);
  const [splitSummary, setSplitSummary] = useState<FYSplitSummary | null>(null);
  
  const [adminPassword, setAdminPassword] = useState('');
  const [acknowledgeIrreversible, setAcknowledgeIrreversible] = useState(false);
  const [acknowledgeDataMigration, setAcknowledgeDataMigration] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load active FY
      const fyResponse = await financialYearApi.getActive();
      if (fyResponse.success && fyResponse.data) {
        setCurrentFY(fyResponse.data);
        
        // Load pending items for current FY
        const pendingResponse = await financialYearApi.getPendingItems(fyResponse.data.id);
        if (pendingResponse.success) {
          setPendingItems(pendingResponse.data);
        }
      }

      // Load all FYs
      const allFYsResponse = await financialYearApi.getAll();
      if (allFYsResponse.success) {
        setAllFYs(allFYsResponse.data);
      }

      // Load split history
      const historyResponse = await financialYearApi.getSplitHistory();
      if (historyResponse.success) {
        setSplitHistory(historyResponse.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load financial year data');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate days remaining
  const daysRemaining = currentFY 
    ? Math.ceil((new Date(currentFY.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const handleValidateSplit = async () => {
    if (!currentFY) return;
    
    setIsLoading(true);
    try {
      const response = await financialYearApi.validateSplit(currentFY.id);
      if (response.success) {
        setSplitValidation(response.data);
        setShowValidationDialog(true);
      }
    } catch (err: any) {
      setError(err.message || 'Validation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteSplit = async () => {
    if (!currentFY || !acknowledgeIrreversible || !acknowledgeDataMigration || !adminPassword) {
      setError('Please complete all confirmations and enter admin password');
      return;
    }

    setIsLoading(true);
    try {
      // Generate next FY code
      const [startYear] = currentFY.fyCode.split('-').map(Number);
      const nextFYCode = `${startYear + 1}-${startYear + 2}`;

      const response = await financialYearApi.executeSplit(currentFY.id, {
        newFyCode: nextFYCode,
        adminPassword,
        acknowledgeIrreversible,
      });

      if (response.success) {
        setSplitSummary(response.data);
        setSplitCompleted(true);
        setShowSplitDialog(false);
        
        // Reload data
        await loadData();
        
        // Reset form
        setAdminPassword('');
        setAcknowledgeIrreversible(false);
        setAcknowledgeDataMigration(false);
      }
    } catch (err: any) {
      setError(err.message || 'FY split failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !currentFY) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading Financial Year data...</p>
        </div>
      </div>
    );
  }

  if (!currentFY) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
          <p className="text-yellow-800 font-medium">No Active Financial Year</p>
          <p className="text-sm text-yellow-700 mt-1">
            Please contact system administrator to set up a Financial Year.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Financial Year Management</h2>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500">As per Income Tax Act 1961</span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
          <div className="flex items-center justify-between">
            <p className="text-red-800">{error}</p>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Current FY Info */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-l-4 border-blue-500">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Current Financial Year</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            currentFY.status === 'ACTIVE' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {currentFY.status}
          </span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-slate-600 mb-1">FY Code</p>
            <p className="text-xl font-bold text-slate-800">{currentFY.fyCode}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-1">Start Date</p>
            <p className="font-medium text-slate-700">
              {new Date(currentFY.startDate).toLocaleDateString('en-IN')}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-1">End Date</p>
            <p className="font-medium text-slate-700">
              {new Date(currentFY.endDate).toLocaleDateString('en-IN')}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-1">Days Remaining</p>
            <p className={`text-xl font-bold ${
              daysRemaining <= 30 ? 'text-red-600' : 
              daysRemaining <= 90 ? 'text-yellow-600' : 
              'text-blue-600'
            }`}>
              {daysRemaining} days
            </p>
          </div>
        </div>

        {daysRemaining <= 30 && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded p-3">
            <p className="text-sm text-red-800">
              <strong>⚠️ Urgent:</strong> Financial Year ending soon. Please prepare for FY split.
            </p>
          </div>
        )}
      </div>

      {/* Compliance Notice */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
        <p className="text-sm text-blue-800">
          <strong>📋 Compliance:</strong> Financial Year follows Indian Income Tax Act 1961 
          (April 1st to March 31st). All transactions are recorded with FY reference for 
          GST and Income Tax reporting.
        </p>
      </div>

      {/* Pending Items Summary */}
      {pendingItems && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Pending Items for Next FY
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            These items will be carried forward when you execute FY split
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center">
                <span className="text-3xl mr-3">📄</span>
                <div>
                  <p className="font-semibold text-slate-800">Unpaid Invoices</p>
                  <p className="text-sm text-slate-600">{pendingItems.unpaidInvoices.count} invoices</p>
                </div>
              </div>
              <p className="text-lg font-bold text-yellow-800">
                ₹{pendingItems.unpaidInvoices.totalAmount.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center">
                <span className="text-3xl mr-3">💰</span>
                <div>
                  <p className="font-semibold text-slate-800">Due Commissions</p>
                  <p className="text-sm text-slate-600">{pendingItems.dueCommissions.count} commissions</p>
                </div>
              </div>
              <p className="text-lg font-bold text-green-800">
                ₹{pendingItems.dueCommissions.totalAmount.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center">
                <span className="text-3xl mr-3">⚠️</span>
                <div>
                  <p className="font-semibold text-slate-800">Open Disputes</p>
                  <p className="text-sm text-slate-600">{pendingItems.openDisputes.count} disputes</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <span className="text-3xl mr-3">📋</span>
                <div>
                  <p className="font-semibold text-slate-800">Active Contracts</p>
                  <p className="text-sm text-slate-600">{pendingItems.activeContracts.count} contracts</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button 
              onClick={handleValidateSplit}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? 'Validating...' : 'Validate FY Split'}
            </Button>
            <Button 
              onClick={() => setShowSplitDialog(true)} 
              disabled={isLoading || daysRemaining > 30}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Execute FY Split
            </Button>
          </div>

          {daysRemaining > 30 && (
            <p className="text-xs text-slate-500 mt-2">
              FY split can only be executed within 30 days of FY end date
            </p>
          )}
        </div>
      )}

      {/* Split Confirmation Dialog */}
      {showSplitDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-800 mb-4">
              ⚠️ Confirm Financial Year Split
            </h3>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4 rounded">
              <p className="text-sm text-yellow-800 font-medium">
                This is a critical operation that will:
              </p>
              <ul className="list-disc pl-5 mt-2 text-sm text-yellow-700 space-y-1">
                <li>Close current FY: <strong>{currentFY.fyCode}</strong></li>
                <li>Create new FY: <strong>{currentFY.fyCode.split('-')[0] + 1}-{currentFY.fyCode.split('-')[1] + 1}</strong></li>
                <li>Migrate all pending items to new FY</li>
                <li>Update all transaction references</li>
                <li>Generate audit logs for compliance</li>
              </ul>
            </div>

            {pendingItems && (
              <div className="mb-4">
                <p className="font-medium text-slate-700 mb-2">Items to be migrated:</p>
                <div className="bg-slate-50 p-3 rounded space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Unpaid Invoices:</span>
                    <span className="font-medium">{pendingItems.unpaidInvoices.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Due Commissions:</span>
                    <span className="font-medium">{pendingItems.dueCommissions.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Open Disputes:</span>
                    <span className="font-medium">{pendingItems.openDisputes.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Contracts:</span>
                    <span className="font-medium">{pendingItems.activeContracts.count}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3 mb-4">
              <label className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  checked={acknowledgeDataMigration}
                  onChange={(e) => setAcknowledgeDataMigration(e.target.checked)}
                  className="mt-1 rounded border-slate-300 text-blue-600"
                />
                <span className="text-sm text-slate-700">
                  I understand that all pending items will be migrated to the new Financial Year
                </span>
              </label>

              <label className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  checked={acknowledgeIrreversible}
                  onChange={(e) => setAcknowledgeIrreversible(e.target.checked)}
                  className="mt-1 rounded border-slate-300 text-blue-600"
                />
                <span className="text-sm text-slate-700 font-medium">
                  I acknowledge this action is <strong className="text-red-600">IRREVERSIBLE</strong>
                </span>
              </label>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Admin Password *
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter admin password to proceed"
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Admin password required for security verification
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
              <p className="text-sm text-red-800 font-medium">
                ⚠️ WARNING: This action cannot be undone. Ensure all data is backed up.
              </p>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleExecuteSplit}
                disabled={!acknowledgeDataMigration || !acknowledgeIrreversible || !adminPassword || isLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isLoading ? 'Executing...' : 'Confirm FY Split'}
              </Button>
              <Button 
                onClick={() => {
                  setShowSplitDialog(false);
                  setAdminPassword('');
                  setAcknowledgeIrreversible(false);
                  setAcknowledgeDataMigration(false);
                }}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Split Success Message */}
      {splitCompleted && splitSummary && (
        <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg mb-6 shadow-md">
          <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
            <span className="text-2xl mr-2">✅</span>
            FY Split Completed Successfully!
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-slate-600">From FY:</p>
              <p className="font-semibold text-slate-800">{splitSummary.fromFY} (CLOSED)</p>
            </div>
            <div>
              <p className="text-slate-600">To FY:</p>
              <p className="font-semibold text-slate-800">{splitSummary.toFY} (ACTIVE)</p>
            </div>
            <div>
              <p className="text-slate-600">Executed By:</p>
              <p className="font-semibold text-slate-800">{splitSummary.executedBy}</p>
            </div>
            <div>
              <p className="text-slate-600">Executed At:</p>
              <p className="font-semibold text-slate-800">
                {new Date(splitSummary.executedAt).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-green-200">
            <p className="text-sm text-slate-700 font-medium mb-2">Migrated Items:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div className="bg-white p-2 rounded">
                <p className="text-slate-600">Invoices</p>
                <p className="font-bold text-slate-800">{splitSummary.invoicesMigrated}</p>
              </div>
              <div className="bg-white p-2 rounded">
                <p className="text-slate-600">Commissions</p>
                <p className="font-bold text-slate-800">{splitSummary.commissionsMigrated}</p>
              </div>
              <div className="bg-white p-2 rounded">
                <p className="text-slate-600">Contracts</p>
                <p className="font-bold text-slate-800">{splitSummary.contractsMigrated}</p>
              </div>
              <div className="bg-white p-2 rounded">
                <p className="text-slate-600">Disputes</p>
                <p className="font-bold text-slate-800">{splitSummary.disputesMigrated}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FY History */}
      {allFYs.length > 1 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Financial Year History</h3>
          <div className="space-y-2">
            {allFYs.map((fy) => (
              <div 
                key={fy.id} 
                className={`flex items-center justify-between p-3 rounded ${
                  fy.status === 'ACTIVE' 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-slate-50 border border-slate-200'
                }`}
              >
                <div>
                  <p className="font-medium text-slate-800">{fy.fyCode}</p>
                  <p className="text-xs text-slate-600">
                    {new Date(fy.startDate).toLocaleDateString('en-IN')} - {' '}
                    {new Date(fy.endDate).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  fy.status === 'ACTIVE' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-slate-100 text-slate-800'
                }`}>
                  {fy.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 bg-slate-50 border-l-4 border-slate-400 p-4 rounded">
        <p className="text-sm text-slate-700">
          <strong>💡 Best Practices:</strong> FY split should be performed after March 31st 
          once all transactions for the year are finalized and reconciled. All pending items 
          will automatically carry forward to the new Financial Year with proper audit trails.
        </p>
      </div>
    </div>
  );
};

export default FYManagementEnhanced;
