import React, { useState } from 'react';
import Card from '../ui/Card';
import Table from '../ui/Table';
import Modal from '../ui/Modal';
import OrganizationForm from './OrganizationForm';
import { Organization, User, AuditLog } from '../../types';
import { Button } from '../ui/Form';

interface OrganizationManagementProps {
  initialData: Organization[];
  currentUser: User;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
}

const OrganizationManagement: React.FC<OrganizationManagementProps> = ({ initialData, currentUser, addAuditLog }) => {
  const [organizations, setOrganizations] = useState<Organization[]>(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null);

  const handleOpenModal = (org: Organization | null = null) => {
    setEditingOrganization(org);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingOrganization(null);
    setIsModalOpen(false);
  };

  const handleSave = (orgData: Omit<Organization, 'id'>) => {
    if (editingOrganization) {
      const updatedOrganizations = organizations.map(org => 
        org.id === editingOrganization.id ? { ...org, ...orgData } : org
      );
      setOrganizations(updatedOrganizations);
      addAuditLog({ 
        user: currentUser.name, 
        role: currentUser.role, 
        action: 'Update', 
        module: 'Settings', 
        details: `Updated Organization: '${editingOrganization.name}' to '${orgData.name}'`, 
        reason: 'Organization management' 
      });
    } else {
      const newOrganization: Organization = { 
        id: Date.now(), 
        ...orgData 
      };
      setOrganizations([newOrganization, ...organizations]);
      addAuditLog({ 
        user: currentUser.name, 
        role: currentUser.role, 
        action: 'Create', 
        module: 'Settings', 
        details: `Created new Organization: '${orgData.name}' (${orgData.code})`, 
        reason: 'Organization management' 
      });
    }
    handleCloseModal();
  };

  const handleDelete = (org: Organization) => {
    if (window.confirm(`Are you sure you want to delete organization '${org.name}'? This action cannot be undone.`)) {
      setOrganizations(organizations.filter(o => o.id !== org.id));
      addAuditLog({ 
        user: currentUser.name, 
        role: currentUser.role, 
        action: 'Delete', 
        module: 'Settings', 
        details: `Deleted Organization: '${org.name}' (${org.code})`, 
        reason: 'Organization management' 
      });
    }
  };

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'code', header: 'Code' },
    { key: 'city', header: 'City' },
    { key: 'state', header: 'State' },
    { key: 'gstin', header: 'GSTIN' },
    { key: 'phone', header: 'Phone' },
    { 
      key: 'isActive', 
      header: 'Status',
      render: (org: Organization) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          org.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {org.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (org: Organization) => (
        <div className="flex items-center space-x-2">
          <button onClick={() => handleOpenModal(org)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">
            Edit
          </button>
          <button onClick={() => handleDelete(org)} className="text-red-600 hover:text-red-800 font-medium text-sm">
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Card 
        title="Organizations" 
        actions={
          <Button onClick={() => handleOpenModal(null)}>
            Add Organization
          </Button>
        }
      >
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Organizations represent different legal entities or branches of your company. 
            Each organization has its own tax details, bank accounts, and can be selected for contracts.
          </p>
        </div>
        {organizations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 mb-4">No organizations found. Create your first organization to get started.</p>
            <Button onClick={() => handleOpenModal(null)}>Create Organization</Button>
          </div>
        ) : (
          <Table 
            data={organizations} 
            columns={columns}
          />
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingOrganization ? 'Edit Organization' : 'Add Organization'}
      >
        <OrganizationForm
          organization={editingOrganization}
          onSave={handleSave}
          onCancel={handleCloseModal}
          existingOrganizations={organizations}
        />
      </Modal>
    </>
  );
};

export default OrganizationManagement;
