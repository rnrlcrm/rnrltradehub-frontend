import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Table from '../ui/Table';
import Modal from '../ui/Modal';
import CommodityForm from './CommodityForm';
import { Commodity, User, AuditLog } from '../../types';
import { Button } from '../ui/Form';
import { commoditiesApi } from '../../api/settingsApi';
import { useDialog } from '../dialogs/CustomDialogs';
import { Spinner } from '../Loading';
import { mockMasterData } from '../../data/mockData';
import { CommodityValidationService } from '../../services/commodityValidationService';
import Toast, { ToastProvider } from '../ui/Toast';
import { useToast } from '../../hooks/useToast';

interface CommodityManagementProps {
  currentUser: User;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
}

const CommodityManagement: React.FC<CommodityManagementProps> = ({ currentUser, addAuditLog }) => {
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [filteredCommodities, setFilteredCommodities] = useState<Commodity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCommodity, setEditingCommodity] = useState<Commodity | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterCCI, setFilterCCI] = useState<'all' | 'yes' | 'no'>('all');
  const { showAlert, showConfirm } = useDialog();
  const toast = useToast();

  // Filter commodities whenever search/filter changes
  useEffect(() => {
    let filtered = [...commodities];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.hsnCode.includes(searchTerm) ||
        c.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(c => c.isActive === (filterStatus === 'active'));
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(c => c.gstCategory === filterCategory);
    }

    // CCI filter
    if (filterCCI !== 'all') {
      filtered = filtered.filter(c => c.supportsCciTerms === (filterCCI === 'yes'));
    }

    setFilteredCommodities(filtered);
  }, [commodities, searchTerm, filterStatus, filterCategory, filterCCI]);

  // Load data from API on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const response = await commoditiesApi.getAll();
      setCommodities(response.data);
      toast.success('Data loaded successfully', 'Commodities refreshed from server');
    } catch (error: any) {
      toast.error('Failed to load commodities', error.message || 'Using cached data');
      // Fallback to mock data if API fails
      setCommodities(mockMasterData.commodities);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (commodity: Commodity | null = null) => {
    setEditingCommodity(commodity);
    setIsModalOpen(true);
    setHasUnsavedChanges(false);
  };

  const handleBulkStatusChange = async (status: boolean) => {
    const selectedCount = filteredCommodities.length;
    const confirmed = await showConfirm(
      `Bulk ${status ? 'Activate' : 'Deactivate'} Commodities`,
      `Are you sure you want to ${status ? 'activate' : 'deactivate'} ${selectedCount} commodities?`,
      { confirmText: 'Yes, Continue', cancelText: 'Cancel' }
    );

    if (!confirmed) return;

    try {
      // In a real implementation, this would be a bulk API call
      const updates = filteredCommodities.map(async (c) => {
        const response = await commoditiesApi.update(c.id, { ...c, isActive: status });
        return response.data;
      });

      const updated = await Promise.all(updates);
      setCommodities(commodities.map(c => {
        const updatedCommodity = updated.find(u => u.id === c.id);
        return updatedCommodity || c;
      }));

      toast.success('Bulk Update Complete', `${selectedCount} commodities ${status ? 'activated' : 'deactivated'}`);
    } catch (error: any) {
      toast.error('Bulk Update Failed', error.message || 'Failed to update commodities');
    }
  };

  const handleCloseModal = async () => {
    // Check for unsaved changes
    if (hasUnsavedChanges) {
      const confirmed = await showConfirm(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to close this form? All changes will be lost.',
        { variant: 'destructive', confirmText: 'Discard Changes', cancelText: 'Keep Editing' }
      );
      if (!confirmed) return;
    }
    setEditingCommodity(null);
    setIsModalOpen(false);
    setHasUnsavedChanges(false);
  };

  const handleSave = async (data: Omit<Commodity, 'id'>) => {
    try {
      setIsSaving(true);

      if (editingCommodity) {
        const response = await commoditiesApi.update(editingCommodity.id, data);
        setCommodities(commodities.map(c => (c.id === editingCommodity.id ? response.data : c)));
        addAuditLog({
          user: currentUser.name,
          role: currentUser.role,
          action: 'Update',
          module: 'Settings - Commodity Master',
          details: `Updated commodity: '${editingCommodity.name}' to '${data.name}' (${data.symbol})`,
          reason: 'Commodity master management',
        });
        toast.success('Commodity Updated', `Successfully updated ${data.name} (${data.symbol})`);
      } else {
        const response = await commoditiesApi.create(data);
        setCommodities([response.data, ...commodities]);
        addAuditLog({
          user: currentUser.name,
          role: currentUser.role,
          action: 'Create',
          module: 'Settings - Commodity Master',
          details: `Created new commodity: '${data.name}' (${data.symbol})`,
          reason: 'Commodity master management',
        });
        toast.success('Commodity Created', `Successfully created ${data.name} (${data.symbol})`);
      }

      handleCloseModal();
    } catch (error: any) {
      toast.error('Save Failed', error.message || 'Failed to save commodity. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (commodity: Commodity) => {
    // Comprehensive deletion safety check
    const safetyCheck = CommodityValidationService.checkDeletionSafety(
      commodity,
      commodities
    );

    if (!safetyCheck.canDelete) {
      await showAlert(
        'Cannot Delete Commodity',
        safetyCheck.blockReason || 'This commodity cannot be deleted at this time.',
        { variant: 'destructive' }
      );
      return;
    }

    // Additional check: Verify no active contracts exist
    // In a real system, this would query the database
    const warningMessage = `Are you sure you want to delete commodity '${commodity.name}' (${commodity.symbol})?\n\n` +
      `⚠️ WARNING: This action cannot be undone.\n\n` +
      `Before proceeding, ensure:\n` +
      `• No active sales contracts reference this commodity\n` +
      `• No pending invoices exist for this commodity\n` +
      `• No historical data will be affected\n\n` +
      `All associated trading parameters will be permanently removed:\n` +
      `• ${commodity.tradeTypes.length} Trade Types\n` +
      `• ${commodity.bargainTypes.length} Bargain Types\n` +
      `• ${commodity.varieties.length} Varieties\n` +
      `• ${commodity.weightmentTerms.length} Weightment Terms\n` +
      `• ${commodity.passingTerms.length} Passing Terms\n` +
      `• ${commodity.deliveryTerms.length} Delivery Terms\n` +
      `• ${commodity.paymentTerms.length} Payment Terms\n` +
      `• ${commodity.commissions.length} Commission Structures`;

    const confirmed = await showConfirm(
      'Confirm Deletion - This Cannot Be Undone',
      warningMessage,
      { variant: 'destructive', confirmText: 'Yes, Delete Permanently', cancelText: 'Cancel' }
    );

    if (!confirmed) return;

    // Double confirmation for extra safety
    const doubleConfirm = await showConfirm(
      'Final Confirmation Required',
      `Type "${commodity.symbol}" to confirm deletion of ${commodity.name}.\n\nThis is your last chance to cancel.`,
      { variant: 'destructive', confirmText: 'Confirm Delete', cancelText: 'Cancel' }
    );

    if (!doubleConfirm) return;

    try {
      await commoditiesApi.delete(commodity.id);
      setCommodities(commodities.filter(c => c.id !== commodity.id));
      addAuditLog({
        user: currentUser.name,
        role: currentUser.role,
        action: 'Delete',
        module: 'Settings - Commodity Master',
        details: `Deleted commodity: '${commodity.name}' (${commodity.symbol}) - HSN ${commodity.hsnCode}. ` +
          `Removed ${commodity.tradeTypes.length} trade types, ${commodity.bargainTypes.length} bargain types, ` +
          `${commodity.varieties.length} varieties, and other associated data.`,
        reason: 'Commodity master management - Permanent deletion',
      });
      toast.success('Commodity Deleted', `${commodity.name} (${commodity.symbol}) has been permanently deleted`);
    } catch (error: any) {
      toast.error('Delete Failed', error.message || 'Failed to delete commodity. Please try again.');
    }
  };

  const handleToggleActive = async (commodity: Commodity) => {
    const newStatus = !commodity.isActive;
    const action = newStatus ? 'activate' : 'deactivate';
    
    const confirmed = await showConfirm(
      `${newStatus ? 'Activate' : 'Deactivate'} Commodity`,
      `Are you sure you want to ${action} "${commodity.name}"?\n\n` +
      (newStatus 
        ? '✅ This commodity will be available for creating new sales contracts.'
        : '⚠️ This commodity will NOT appear in contract creation. Existing contracts will remain unaffected.'),
      { confirmText: `Yes, ${newStatus ? 'Activate' : 'Deactivate'}`, cancelText: 'Cancel' }
    );

    if (!confirmed) return;

    try {
      const response = await commoditiesApi.update(commodity.id, { ...commodity, isActive: newStatus });
      setCommodities(commodities.map(c => (c.id === commodity.id ? response.data : c)));
      addAuditLog({
        user: currentUser.name,
        role: currentUser.role,
        action: 'Update',
        module: 'Settings - Commodity Master',
        details: `${newStatus ? 'Activated' : 'Deactivated'} commodity: '${commodity.name}' (${commodity.symbol})`,
        reason: `Commodity status change - ${action}`,
      });
      toast.success(
        `Commodity ${newStatus ? 'Activated' : 'Deactivated'}`, 
        `${commodity.name} is now ${newStatus ? 'available' : 'unavailable'} for new contracts`
      );
    } catch (error: any) {
      toast.error('Status Change Failed', error.message || 'Failed to change commodity status');
    }
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Symbol', accessor: 'symbol' },
    { 
      header: 'HSN Code', 
      accessor: (commodity: Commodity) => (
        <span className="font-mono text-sm">{commodity.hsnCode}</span>
      )
    },
    {
      header: 'GST',
      accessor: (commodity: Commodity) => (
        <div className="flex items-center space-x-2">
          <span className={`font-semibold ${commodity.gstRate === 0 ? 'text-green-600' : 'text-blue-600'}`}>
            {commodity.gstRate}%
          </span>
          {commodity.gstExemptionAvailable && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
              Exempt
            </span>
          )}
        </div>
      ),
    },
    { header: 'Unit', accessor: 'unit' },
    {
      header: 'Category',
      accessor: (commodity: Commodity) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          commodity.gstCategory === 'Agricultural' ? 'bg-green-100 text-green-800' :
          commodity.gstCategory === 'Processed' ? 'bg-blue-100 text-blue-800' :
          commodity.gstCategory === 'Industrial' ? 'bg-purple-100 text-purple-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {commodity.gstCategory}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (commodity: Commodity) => (
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            commodity.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {commodity.isActive ? '✓ Active' : '✕ Inactive'}
          </span>
          <button
            onClick={() => handleToggleActive(commodity)}
            className={`text-xs font-medium underline ${
              commodity.isActive ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'
            }`}
            disabled={isSaving}
            title={commodity.isActive ? 'Click to deactivate' : 'Click to activate'}
          >
            {commodity.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      ),
    },
    {
      header: 'CCI Terms',
      accessor: (commodity: Commodity) => (
        <div className="flex flex-col">
          <span className={`px-2 py-1 rounded-full text-xs font-medium text-center ${
            commodity.supportsCciTerms ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
          }`}>
            {commodity.supportsCciTerms ? '✓ Yes' : '- No'}
          </span>
          {commodity.supportsCciTerms && (
            <span className="text-xs text-gray-500 mt-1 text-center">Cotton Only</span>
          )}
        </div>
      ),
    },
    {
      header: 'Trading Params',
      accessor: (commodity: Commodity) => {
        const totalParams = 
          commodity.tradeTypes.length +
          commodity.bargainTypes.length +
          commodity.varieties.length +
          commodity.weightmentTerms.length +
          commodity.passingTerms.length +
          commodity.deliveryTerms.length +
          commodity.paymentTerms.length +
          commodity.commissions.length;
        
        return (
          <div className="text-xs">
            <div className="font-semibold text-blue-600 mb-1">{totalParams} Total</div>
            <div className="text-gray-600 space-y-0.5">
              <div>{commodity.tradeTypes.length} Trade Type{commodity.tradeTypes.length !== 1 ? 's' : ''}</div>
              <div>{commodity.bargainTypes.length} Bargain Type{commodity.bargainTypes.length !== 1 ? 's' : ''}</div>
              <div>{commodity.varieties.length} Variet{commodity.varieties.length !== 1 ? 'ies' : 'y'}</div>
              <div>{commodity.weightmentTerms.length} Weightment</div>
              <div>{commodity.passingTerms.length} Passing</div>
              <div>{commodity.deliveryTerms.length} Delivery</div>
              <div>{commodity.paymentTerms.length} Payment</div>
              <div>{commodity.commissions.length} Commission{commodity.commissions.length !== 1 ? 's' : ''}</div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Actions',
      accessor: (commodity: Commodity) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleOpenModal(commodity)}
            className="text-blue-600 hover:underline text-sm font-medium"
            disabled={isSaving}
            title="Edit commodity"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(commodity)}
            className="text-red-600 hover:underline text-sm font-medium"
            disabled={isSaving}
            title="Delete commodity"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <Card title="Commodity Master">
        <div className="flex justify-center items-center h-40">
          <Spinner size="lg" />
        </div>
      </Card>
    );
  }

  return (
    <ToastProvider>
      <Card
        title="Commodity Master"
        subtitle={`Manage commodities with inline trading parameters. Showing ${filteredCommodities.length} of ${commodities.length} commodities.`}
        actions={
          <div className="flex gap-2">
            <Button onClick={() => handleOpenModal()} className="text-sm" disabled={isSaving}>
              + Add New
            </Button>
          </div>
        }
      >
        {/* Information Banner */}
        <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-6 h-6 mr-3 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h4 className="font-bold text-green-900 mb-2">✨ Enhanced Commodity Parameters Management</h4>
              <p className="text-sm text-green-800 mb-2">
                All trading parameters are now managed <strong>inline within each commodity</strong>. 
                When you click "Add New" or "Edit", you'll see a comprehensive form where you can:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-green-700">
                <div className="flex items-center">
                  <span className="text-green-600 mr-1">•</span>
                  <span>Add Trade Types</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-600 mr-1">•</span>
                  <span>Add Bargain Types</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-600 mr-1">•</span>
                  <span>Add Varieties</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-600 mr-1">•</span>
                  <span>Add Weightment Terms</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-600 mr-1">•</span>
                  <span>Add Passing Terms</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-600 mr-1">•</span>
                  <span>Add Delivery Terms</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-600 mr-1">•</span>
                  <span>Add Payment Terms</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-600 mr-1">•</span>
                  <span>Add Commission Structures</span>
                </div>
              </div>
              <p className="text-xs text-green-700 mt-2 font-semibold">
                💡 The "Trading Params" column below shows the count of parameters configured for each commodity.
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <input
                type="text"
                placeholder="Search by name, symbol, HSN, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Categories</option>
              <option value="Agricultural">Agricultural</option>
              <option value="Processed">Processed</option>
              <option value="Industrial">Industrial</option>
              <option value="Service">Service</option>
            </select>

            {/* CCI Filter */}
            <select
              value={filterCCI}
              onChange={(e) => setFilterCCI(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All CCI Support</option>
              <option value="yes">CCI Supported</option>
              <option value="no">No CCI Support</option>
            </select>

            {/* Clear Filters */}
            {(searchTerm || filterStatus !== 'all' || filterCategory !== 'all' || filterCCI !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setFilterCategory('all');
                  setFilterCCI('all');
                }}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 underline"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Bulk Actions */}
          {filteredCommodities.length > 0 && (
            <div className="flex gap-2 text-sm">
              <span className="text-gray-600">Bulk Actions:</span>
              <button
                onClick={() => handleBulkStatusChange(true)}
                className="text-green-600 hover:underline font-medium"
              >
                Activate All ({filteredCommodities.length})
              </button>
              <button
                onClick={() => handleBulkStatusChange(false)}
                className="text-orange-600 hover:underline font-medium"
              >
                Deactivate All ({filteredCommodities.length})
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <Table<Commodity> data={filteredCommodities} columns={columns} />
      </Card>
      
      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCommodity?.id ? 'Edit Commodity' : 'Add New Commodity'}
        size="large"
      >
        <CommodityForm
          commodity={editingCommodity}
          commodities={commodities}
          onSave={handleSave}
          onCancel={handleCloseModal}
          isSaving={isSaving}
          onFormChange={() => setHasUnsavedChanges(true)}
        />
      </Modal>

      {/* Toast Notifications */}
      {toast.toasts.map((t) => (
        <Toast
          key={t.id}
          open={true}
          onOpenChange={() => toast.removeToast(t.id)}
          title={t.title}
          description={t.description}
          variant={t.variant}
          duration={t.duration}
        />
      ))}
    </ToastProvider>
  );
};

export default CommodityManagement;
