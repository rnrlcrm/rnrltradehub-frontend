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
    const confirmed = await showConfirm(
      'Confirm Delete',
      `Are you sure you want to delete commodity '${commodity.name}' (${commodity.symbol})? This action cannot be undone and may affect existing contracts.`,
      { variant: 'destructive', confirmText: 'Delete', cancelText: 'Cancel' }
    );

    if (!confirmed) return;

    try {
      await commoditiesApi.delete(commodity.id);
      setCommodities(commodities.filter(c => c.id !== commodity.id));
      addAuditLog({
        user: currentUser.name,
        role: currentUser.role,
        action: 'Delete',
        module: 'Settings - Commodity Master',
        details: `Deleted commodity: '${commodity.name}' (${commodity.symbol})`,
        reason: 'Commodity master management',
      });
      await showAlert('Success', 'Commodity deleted successfully');
    } catch (error: any) {
      await showAlert('Error', error.message || 'Failed to delete commodity. Please try again.');
    }
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Symbol', accessor: 'symbol' },
    { header: 'Unit', accessor: 'unit' },
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
        subtitle="Manage commodities and their trading parameters for multi-commodity support"
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
          masterData={{
            tradeTypes: mockMasterData.tradeTypes,
            bargainTypes: mockMasterData.bargainTypes,
            varieties: mockMasterData.varieties,
            weightmentTerms: mockMasterData.weightmentTerms,
            passingTerms: mockMasterData.passingTerms,
            deliveryTerms: mockMasterData.deliveryTerms,
            paymentTerms: mockMasterData.paymentTerms,
            commissions: mockMasterData.commissions,
            gstRates: mockMasterData.gstRates,
          }}
          onSave={handleSave}
          onCancel={handleCloseModal}
          isSaving={isSaving}
        />
      </Modal>
    </>
  );
};

export default CommodityManagement;
