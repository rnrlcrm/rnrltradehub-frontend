
import React, { useState, useMemo } from 'react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import BusinessPartnerForm from '../components/forms/BusinessPartnerForm';
import SharePartnerForm from '../components/forms/SharePartnerForm';
import { mockBusinessPartners, mockLocations, mockSalesContracts, mockOrganizations } from '../data/mockData';
import { BusinessPartner, User, Location, AuditLog, SalesContract, MasterDataItem } from '../types';
import { hasPermission } from '../lib/permissions';
import { Button } from '../components/ui/Form';

interface VendorsAndClientsProps {
  currentUser: User;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
  currentOrganization: string;
}

const StatusBadge: React.FC<{ status: BusinessPartner['status'] }> = ({ status }) => {
  const baseClasses = 'px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-sm';
  const statusClasses = {
    DRAFT: 'bg-slate-200 text-slate-800',
    PENDING_COMPLIANCE: 'bg-yellow-100 text-yellow-800',
    ACTIVE: 'bg-green-100 text-green-800',
    INACTIVE: 'bg-gray-400 text-white',
    BLACKLISTED: 'bg-red-200 text-red-900',
  };
  return <span className={`${baseClasses} ${statusClasses[status]}`}>{status.replace('_', ' ')}</span>;
};

const KycStatusBadge: React.FC<{ dueDate: string }> = ({ dueDate }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  const isDue = due < today;
  
  if (isDue) {
    return <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-sm bg-red-200 text-red-900">Due</span>;
  }
  return <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-sm bg-green-100 text-green-800">OK</span>;
};

const VendorsAndClients: React.FC<VendorsAndClientsProps> = ({ currentUser, addAuditLog, currentOrganization }) => {
  const [partners, setPartners] = useState<BusinessPartner[]>(mockBusinessPartners);
  const [salesContracts] = useState<SalesContract[]>(mockSalesContracts);
  const [locations] = useState<Location[]>(mockLocations);
  const [organizations] = useState<MasterDataItem[]>(mockOrganizations);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view' | 'kyc'>('view');
  const [selectedItem, setSelectedItem] = useState<BusinessPartner | null>(null);

  const filteredPartners = useMemo(() => {
    return partners.filter(p => p.organization === currentOrganization);
  }, [partners, currentOrganization]);

  const canCreate = hasPermission(currentUser.role, 'Vendors & Clients', 'create');
  const canUpdate = hasPermission(currentUser.role, 'Vendors & Clients', 'update');
  const canDelete = hasPermission(currentUser.role, 'Vendors & Clients', 'delete');
  const canRead = hasPermission(currentUser.role, 'Vendors & Clients', 'read');

  if (!canRead) {
    return (
      <Card title="Access Denied">
        <p className="text-red-600">You do not have permission to view this module.</p>
      </Card>
    );
  }

  const handleOpenModal = (mode: 'add' | 'edit' | 'view' | 'kyc', item: BusinessPartner | null = null) => {
    let newItem = item;
    if (mode === 'add') {
        const initialState = {
            ...mockBusinessPartners[0], // a bit of a hack to get all fields
            id: '', bp_code: '', legal_name: '', organization: currentOrganization,
            status: 'DRAFT', shipping_addresses: [],
        } as BusinessPartner;
        newItem = initialState;
    }
    setModalMode(mode);
    setSelectedItem(newItem);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleOpenShareModal = () => setIsShareModalOpen(true);
  const handleCloseShareModal = () => setIsShareModalOpen(false);

  const handleSendShare = (shareDetails: { email: string; expiry: number }) => {
    addAuditLog({ user: currentUser.name, role: currentUser.role, action: 'Share', module: 'Business Partner', details: `Shared package for ${selectedItem?.legal_name} with ${shareDetails.email}`, reason: 'External party request' });
    alert(`Share package for ${selectedItem?.legal_name} sent to ${shareDetails.email}. Link expires in ${shareDetails.expiry} hours.`);
    handleCloseShareModal();
    handleCloseModal();
  };

  const handleSave = (data: BusinessPartner, reason: string) => {
    const originalPartner = partners.find(p => p.id === data.id);
    const isFirstApproval = originalPartner?.status === 'PENDING_COMPLIANCE' && data.status === 'ACTIVE';
    const isKycUpdate = modalMode === 'kyc';

    if (isFirstApproval || isKycUpdate) {
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      data.kyc_due_date = nextYear.toISOString().split('T')[0];
      if(isKycUpdate) alert(`KYC for ${data.legal_name} has been updated. Next due date is ${data.kyc_due_date}.`);
    }

    if (modalMode === 'add') {
      const newPartner = { ...data, id: `bp_${partners.length + 1}`, bp_code: `R${String(partners.length + 1).padStart(3, '0')}` };
      setPartners([newPartner, ...partners]);
      addAuditLog({ user: currentUser.name, role: currentUser.role, action: 'Create', module: 'Business Partner', details: `Created ${newPartner.legal_name}`, reason });
    } else {
      setPartners(partners.map(p => p.id === data.id ? data : p));
      const action = isFirstApproval ? 'Approve' : (data.status === 'DRAFT' ? 'Reject' : 'Update');
      addAuditLog({ user: currentUser.name, role: currentUser.role, action, module: 'Business Partner', details: `Updated ${data.legal_name}`, reason });
    }
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (salesContracts.some(c => (c.clientId === id || c.vendorId === id) && c.status !== 'Completed')) {
      alert('Cannot delete: This partner is linked to one or more active or disputed sales contracts.');
      return;
    }
    const partnerToDelete = partners.find(p => p.id === id);
    if (partnerToDelete && window.confirm('Are you sure you want to delete this business partner?')) {
      setPartners(partners.filter(p => p.id !== id));
      addAuditLog({ user: currentUser.name, role: currentUser.role, action: 'Delete', module: 'Business Partner', details: `Deleted ${partnerToDelete.legal_name}`, reason: 'User initiated deletion' });
    }
  };
  
  const handleViewSensitiveData = (fieldName: string) => addAuditLog({ user: currentUser.name, role: currentUser.role, action: 'View Sensitive Data', module: 'Business Partner', details: `Viewed ${fieldName} for ${selectedItem?.legal_name}`, reason: 'User action in form' });
  const handleAiAnalyze = () => addAuditLog({ user: currentUser.name, role: currentUser.role, action: 'AI Analysis', module: 'Business Partner', details: `AI analysis triggered for new partner`, reason: 'User action in form' });

  const columns = [
    { header: 'Partner ID', accessor: 'bp_code' },
    { header: 'Legal Name', accessor: 'legal_name' },
    { header: 'Type', accessor: 'business_type' },
    { header: 'Status', accessor: (item: BusinessPartner) => <StatusBadge status={item.status} /> },
    { header: 'KYC Status', accessor: (item: BusinessPartner) => item.status === 'ACTIVE' ? <KycStatusBadge dueDate={item.kyc_due_date} /> : <span className="text-slate-400">-</span> },
    {
      header: 'Actions',
      accessor: (item: BusinessPartner) => {
        const isPendingForReview = item.status === 'PENDING_COMPLIANCE' && canUpdate;
        const isKycDue = item.status === 'ACTIVE' && new Date(item.kyc_due_date) < new Date();
        return (
          <div className="space-x-4">
            {isPendingForReview ? (
              <button onClick={() => handleOpenModal('edit', item)} className="text-orange-600 hover:underline text-sm font-medium">Review</button>
            ) : (
              <>
                {canRead && <button onClick={() => handleOpenModal('view', item)} className="text-blue-600 hover:underline text-sm font-medium">View</button>}
                {canUpdate && item.status !== 'PENDING_COMPLIANCE' && !isKycDue && <button onClick={() => handleOpenModal('edit', item)} className="text-blue-600 hover:underline text-sm font-medium">Edit</button>}
              </>
            )}
            {isKycDue && canUpdate && <button onClick={() => handleOpenModal('kyc', item)} className="text-red-600 hover:underline text-sm font-medium">Update KYC</button>}
            {canDelete && <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:underline text-sm font-medium">Delete</button>}
          </div>
        )
      },
    },
  ];

  const cardActions = canCreate ? <Button onClick={() => handleOpenModal('add')} className="text-sm">Create Business Partner</Button> : null;

  const getModalTitle = () => {
    if (modalMode === 'add') return 'Create New Business Partner';
    if (modalMode === 'kyc') return `Update KYC: ${selectedItem?.legal_name}`;
    if (selectedItem?.status === 'PENDING_COMPLIANCE' && modalMode === 'edit') return `Compliance Review: ${selectedItem?.legal_name}`;
    if (modalMode === 'edit') return `Edit: ${selectedItem?.legal_name}`;
    return `View: ${selectedItem?.legal_name}`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Business Partner Management</h1>
      <Card title={`Partners for ${currentOrganization}`} actions={cardActions}>
        <Table<BusinessPartner> data={filteredPartners} columns={columns} />
      </Card>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={getModalTitle()}>
        <BusinessPartnerForm partner={selectedItem} locations={locations} organizations={organizations} readOnly={modalMode === 'view'} onSave={handleSave} onCancel={handleCloseModal} currentUser={currentUser} onShare={handleOpenShareModal} mode={modalMode} onViewSensitiveData={handleViewSensitiveData} onAiAnalyze={handleAiAnalyze} />
      </Modal>

      <Modal isOpen={isShareModalOpen} onClose={handleCloseShareModal} title={`Share: ${selectedItem?.legal_name}`}>
        <SharePartnerForm onSend={handleSendShare} onCancel={handleCloseShareModal} />
      </Modal>
    </div>
  );
};

export default VendorsAndClients;
