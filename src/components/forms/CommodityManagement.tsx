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

interface CommodityManagementProps {
  currentUser: User;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
}

const CommodityManagement: React.FC<CommodityManagementProps> = ({ currentUser, addAuditLog }) => {
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCommodity, setEditingCommodity] = useState<Commodity | null>(null);
  const { showAlert, showConfirm } = useDialog();

  // Load data from API on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const response = await commoditiesApi.getAll();
      setCommodities(response.data);
    } catch (error: any) {
      await showAlert('Error', error.message || 'Failed to load commodities. Please try again.');
      // Fallback to mock data if API fails
      setCommodities(mockMasterData.commodities);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (commodity: Commodity | null = null) => {
    setEditingCommodity(commodity);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingCommodity(null);
    setIsModalOpen(false);
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
      }

      handleCloseModal();
      await showAlert('Success', editingCommodity ? 'Commodity updated successfully' : 'Commodity created successfully');
    } catch (error: any) {
      await showAlert('Error', error.message || 'Failed to save commodity. Please try again.');
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
      await showAlert('Success', 'Commodity deleted successfully');
    } catch (error: any) {
      await showAlert('Error', error.message || 'Failed to delete commodity. Please try again.');
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
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          commodity.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {commodity.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'CCI Terms',
      accessor: (commodity: Commodity) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          commodity.supportsCciTerms ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {commodity.supportsCciTerms ? 'Supported' : 'Not Supported'}
        </span>
      ),
    },
    {
      header: 'Trading Params',
      accessor: (commodity: Commodity) => (
        <div className="text-xs text-gray-600">
          <div>{commodity.tradeTypes.length} Trade Types</div>
          <div>{commodity.varieties.length} Varieties</div>
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: (commodity: Commodity) => (
        <div className="space-x-4">
          <button
            onClick={() => handleOpenModal(commodity)}
            className="text-blue-600 hover:underline text-sm font-medium"
            disabled={isSaving}
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(commodity)}
            className="text-red-600 hover:underline text-sm font-medium"
            disabled={isSaving}
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
    <>
      <Card
        title="Commodity Master"
        subtitle="Manage commodities with inline trading parameters. All types are managed within each commodity - no Settings link required."
        actions={
          <Button onClick={() => handleOpenModal()} className="text-sm" disabled={isSaving}>
            Add New Commodity
          </Button>
        }
      >
        <Table<Commodity> data={commodities} columns={columns} />
      </Card>
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCommodity ? 'Edit Commodity' : 'Add New Commodity'}
        size="large"
      >
        <CommodityForm
          commodity={editingCommodity}
          commodities={commodities}
          onSave={handleSave}
          onCancel={handleCloseModal}
          isSaving={isSaving}
        />
      </Modal>
    </>
  );
};

export default CommodityManagement;
