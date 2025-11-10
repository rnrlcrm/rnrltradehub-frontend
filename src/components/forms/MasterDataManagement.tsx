
import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Table from '../ui/Table';
import Modal from '../ui/Modal';
import MasterDataForm from '../forms/MasterDataForm';
import { MasterDataItem, User, AuditLog } from '../../types';
import { Button } from '../ui/Form';
import { masterDataApi, MasterDataType } from '../../api/settingsApi';
import { useDialog } from '../dialogs/CustomDialogs';
import { Spinner } from '../Loading';

interface MasterDataManagementProps {
  title: string;
  initialData: MasterDataItem[];
  currentUser: User;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
}

// Map display titles to API types
// Note: Financial Years removed from here - managed only in FY Management tab
const getTitleToApiType = (title: string): MasterDataType => {
  const typeMap: Record<string, MasterDataType> = {
    'Trade Types': 'trade-types',
    'Bargain Types': 'bargain-types',
    'Varieties': 'varieties',
    'Dispute Reasons': 'dispute-reasons',
    'Weightment Terms': 'weightment-terms',
    'Passing Terms': 'passing-terms',
  };
  return typeMap[title] || 'trade-types';
};

const MasterDataManagement: React.FC<MasterDataManagementProps> = ({ title, initialData, currentUser, addAuditLog }) => {
  const [items, setItems] = useState<MasterDataItem[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterDataItem | null>(null);
  const { showAlert, showConfirm } = useDialog();
  const dataType = getTitleToApiType(title);

  // Load data from API on mount
  useEffect(() => {
    loadData();
  }, [dataType]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const response = await masterDataApi.getAll(dataType);
      setItems(response.data);
    } catch (error: any) {
      await showAlert('Error', error.message || `Failed to load ${title}. Please try again.`);
      // Fallback to initial data if API fails
      setItems(initialData);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (item: MasterDataItem | null = null) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingItem(null);
    setIsModalOpen(false);
  };

  const handleSave = async (name: string) => {
    const singularTitle = title.slice(0, -1);
    
    try {
      setIsSaving(true);
      
      if (editingItem) {
        const response = await masterDataApi.update(dataType, editingItem.id, { name });
        setItems(items.map(item => item.id === editingItem.id ? response.data : item));
        addAuditLog({ 
          user: currentUser.name, 
          role: currentUser.role, 
          action: 'Update', 
          module: 'Settings', 
          details: `Updated ${singularTitle}: '${editingItem.name}' to '${name}'`, 
          reason: 'Master data management' 
        });
      } else {
        const response = await masterDataApi.create(dataType, { name });
        setItems([response.data, ...items]);
        addAuditLog({ 
          user: currentUser.name, 
          role: currentUser.role, 
          action: 'Create', 
          module: 'Settings', 
          details: `Created new ${singularTitle}: '${name}'`, 
          reason: 'Master data management' 
        });
      }
      
      handleCloseModal();
      if (response.message) {
        await showAlert('Success', response.message);
      }
    } catch (error: any) {
      await showAlert('Error', error.message || 'Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item: MasterDataItem) => {
    const confirmed = await showConfirm(
      'Confirm Delete',
      `Are you sure you want to delete '${item.name}'? This action cannot be undone.`,
      { variant: 'destructive', confirmText: 'Delete', cancelText: 'Cancel' }
    );

    if (!confirmed) return;

    try {
      await masterDataApi.delete(dataType, item.id);
      setItems(items.filter(i => i.id !== item.id));
      addAuditLog({ 
        user: currentUser.name, 
        role: currentUser.role, 
        action: 'Delete', 
        module: 'Settings', 
        details: `Deleted ${title.slice(0, -1)}: '${item.name}'`, 
        reason: 'Master data management' 
      });
      await showAlert('Success', 'Item deleted successfully');
    } catch (error: any) {
      await showAlert('Error', error.message || 'Failed to delete. Please try again.');
    }
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    {
      header: 'Actions',
      accessor: (item: MasterDataItem) => (
        <div className="space-x-4">
          <button 
            onClick={() => handleOpenModal(item)} 
            className="text-blue-600 hover:underline text-sm font-medium"
            disabled={isSaving}
          >
            Edit
          </button>
          <button 
            onClick={() => handleDelete(item)} 
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
      <Card title={title}>
        <div className="flex justify-center items-center h-40">
          <Spinner size="lg" />
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card title={title} actions={
        <Button onClick={() => handleOpenModal()} className="text-sm" disabled={isSaving}>
          Add New
        </Button>
      }>
        <div className="max-h-60 overflow-y-auto -m-5">
          <Table<MasterDataItem> data={items} columns={columns} />
        </div>
      </Card>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingItem ? `Edit ${title.slice(0, -1)}` : `Add New ${title.slice(0, -1)}`}>
        <MasterDataForm
          item={editingItem}
          items={items}
          onSave={handleSave}
          onCancel={handleCloseModal}
          isSaving={isSaving}
        />
      </Modal>
    </>
  );
};

export default MasterDataManagement;
