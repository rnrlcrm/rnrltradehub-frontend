
import React, { useState, useMemo } from 'react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import SalesContractForm from '../components/forms/SalesContractForm';
import { mockBusinessPartners, mockOrganizations, mockMasterData } from '../data/mockData';
import { SalesContract, User, BusinessPartner, MasterDataItem, CciTerm, StructuredTerm, GstRate, CommissionStructure } from '../types';
import { hasPermission } from '../lib/permissions';
import { Button, FormLabel, FormInput } from '../components/ui/Form';
import SalesContractPDF from '../components/forms/SalesContractPDF';

interface SalesContractsProps {
  currentUser: User;
  currentOrganization: string;
  currentFinancialYear: string;
  contracts: SalesContract[];
  setContracts: React.Dispatch<React.SetStateAction<SalesContract[]>>;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
}

const StatusBadge: React.FC<{ status: SalesContract['status'] }> = ({ status }) => {
  const baseClasses = 'px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full';
  const statusClasses = {
    Active: 'bg-green-100 text-green-800',
    Completed: 'bg-blue-100 text-blue-800',
    Disputed: 'bg-yellow-100 text-yellow-800',
    'Carried Forward': 'bg-purple-100 text-purple-800',
    Amended: 'bg-gray-400 text-white',
    'Pending Approval': 'bg-orange-100 text-orange-800',
    Rejected: 'bg-red-100 text-red-800',
  };
  return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>;
};

const SalesContracts: React.FC<SalesContractsProps> = ({ currentUser, currentOrganization, currentFinancialYear, contracts, setContracts, addAuditLog }) => {
  const [businessPartners] = useState<BusinessPartner[]>(mockBusinessPartners);
  const [organizations] = useState<MasterDataItem[]>(mockOrganizations);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'amend' | 'view'>('view');
  const [selectedContract, setSelectedContract] = useState<SalesContract | null>(null);
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [pdfData, setPdfData] = useState<{ contract: SalesContract; buyer: BusinessPartner; seller: BusinessPartner; cciTerm: CciTerm | null; deliveryTerm: StructuredTerm | undefined; masterData: any } | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
        const contractDate = new Date(c.date);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        if(start && contractDate < start) return false;
        if(end && contractDate > end) return false;
        return c.organization === currentOrganization && c.financialYear === currentFinancialYear;
    });
  }, [contracts, currentOrganization, currentFinancialYear, startDate, endDate]);

  const canCreate = hasPermission(currentUser.role, 'Sales Contracts', 'create');
  const canUpdate = hasPermission(currentUser.role, 'Sales Contracts', 'update');
  const canRead = hasPermission(currentUser.role, 'Sales Contracts', 'read');

  const handleOpenModal = (mode: 'add' | 'amend' | 'view', contract: SalesContract | null = null) => {
    setModalMode(mode);
    setSelectedContract(contract);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedContract(null);
  };

  const handleSaveContract = (contractData: SalesContract, amendmentReason?: string) => {
    if (modalMode === 'add') {
      const newContract = {
        ...contractData,
        id: `sc_${contracts.length + 1}`,
        scNo: `SC-${currentFinancialYear.slice(-2)}-${String(contracts.length + 1).padStart(3, '0')}`,
        organization: currentOrganization,
        financialYear: currentFinancialYear,
        version: 1,
        status: 'Active' as 'Active',
      };
      setContracts(prev => [newContract, ...prev]);
      addAuditLog({ user: currentUser.name, role: currentUser.role, action: 'Create', module: 'Sales Contracts', details: `Created contract ${newContract.scNo}`, reason: 'New contract entry' });
    } else if (modalMode === 'amend' && selectedContract) {
        const newVersion = selectedContract.version + 1;
        const amendedContract: SalesContract = {
            ...contractData,
            id: `${selectedContract.id}-v${newVersion}`,
            scNo: `${selectedContract.scNo}-A${selectedContract.version}`,
            version: newVersion,
            amendmentReason: amendmentReason,
            status: 'Active',
        };
        const updatedContracts = contracts.map(c => 
            c.id === selectedContract.id ? { ...c, status: 'Amended' } : c
        );
        setContracts([...updatedContracts, amendedContract]);
        addAuditLog({ user: currentUser.name, role: currentUser.role, action: 'Amend', module: 'Sales Contracts', details: `Amended contract ${selectedContract.scNo} to ${amendedContract.scNo}`, reason: amendmentReason || 'Contract amendment' });
    }
    handleCloseModal();
  };

  const handlePreviewPdf = (contract: SalesContract) => {
    const buyer = businessPartners.find(p => p.id === contract.clientId);
    const seller = businessPartners.find(p => p.id === contract.vendorId);
    const cciTerm = contract.cciTermId ? mockMasterData.cciTerms.find(t => t.id === contract.cciTermId) : null;
    const deliveryTerm = mockMasterData.deliveryTerms.find(t => t.name === contract.deliveryTerms);

    if (!buyer || !seller) {
        alert("Could not find buyer or seller information for this contract.");
        return;
    }

    setPdfData({ contract, buyer, seller, cciTerm: cciTerm || null, deliveryTerm, masterData: mockMasterData });
    setIsPdfPreviewOpen(true);
  };

  const handleExport = (format: 'PDF' | 'Excel') => {
    alert(`Simulating export of ${filteredContracts.length} contracts to ${format}.`);
  };

  const handleSendForApproval = (contract: SalesContract, channel: 'Email' | 'WhatsApp') => {
      setContracts(contracts.map(c => c.id === contract.id ? { ...c, status: 'Pending Approval' } : c));
      addAuditLog({ user: currentUser.name, role: currentUser.role, action: 'Send for Approval', module: 'Sales Contracts', details: `Contract ${contract.scNo} sent to Buyer & Seller via ${channel}`, reason: 'Awaiting party confirmation' });
      alert(`Approval request for ${contract.scNo} sent via ${channel}. Approval link is valid for 48 hours.`);
      setIsApprovalModalOpen(false);
  };

  const handleApprove = (contract: SalesContract) => {
      setContracts(contracts.map(c => c.id === contract.id ? { ...c, status: 'Active' } : c));
      addAuditLog({ user: 'System (External)', role: 'Vendor/Client', action: 'Approve', module: 'Sales Contracts', details: `Contract ${contract.scNo} approved by external party.`, reason: 'External approval received' });
  };

  const handleReject = (contract: SalesContract) => {
      setSelectedContract(contract);
      setIsRejectionModalOpen(true);
  };

  const submitRejection = () => {
      if (!rejectionReason.trim()) {
          alert('Rejection reason is mandatory.');
          return;
      }
      if (selectedContract) {
          setContracts(contracts.map(c => c.id === selectedContract.id ? { ...c, status: 'Rejected' } : c));
          addAuditLog({ user: 'System (External)', role: 'Vendor/Client', action: 'Reject', module: 'Sales Contracts', details: `Contract ${selectedContract.scNo} rejected by external party.`, reason: rejectionReason });
      }
      setIsRejectionModalOpen(false);
      setRejectionReason('');
  };

  const columns = [
    { header: 'SC No.', accessor: 'scNo' },
    { header: 'Date', accessor: 'date' },
    { header: 'Client', accessor: 'clientName' },
    { header: 'Vendor', accessor: 'vendorName' },
    { header: 'Qty (Bales)', accessor: 'quantityBales' },
    { header: 'Status', accessor: (item: SalesContract) => <StatusBadge status={item.status} /> },
    {
      header: 'Actions',
      accessor: (item: SalesContract) => {
        const isAmendable = item.status === 'Active' || item.status === 'Disputed';
        return (
            <div className="space-x-2">
              {canRead && <Button variant="secondary" className="!px-2 !py-1 !text-xs" onClick={() => handleOpenModal('view', item)}>View</Button>}
              {canUpdate && isAmendable && <Button variant="secondary" className="!px-2 !py-1 !text-xs" onClick={() => handleOpenModal('amend', item)}>Amend</Button>}
              {item.status === 'Active' && <Button variant="secondary" className="!px-2 !py-1 !text-xs" onClick={() => { setSelectedContract(item); setIsApprovalModalOpen(true); }}>Send for Approval</Button>}
              {item.status === 'Pending Approval' && (
                  <>
                    <Button variant="primary" className="!px-2 !py-1 !text-xs !bg-green-600 hover:!bg-green-700" onClick={() => handleApprove(item)}>Approve</Button>
                    <Button variant="danger" className="!px-2 !py-1 !text-xs" onClick={() => handleReject(item)}>Reject</Button>
                  </>
              )}
              <Button variant="secondary" className="!px-2 !py-1 !text-xs" onClick={() => handlePreviewPdf(item)}>PDF</Button>
            </div>
        );
      },
    },
  ];

  const cardActions = (
    <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2">
            <label htmlFor="startDate" className="text-sm font-medium text-slate-600">From:</label>
            <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="block w-full border-slate-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:border-blue-500 focus:ring-0 sm:text-sm" />
        </div>
        <div className="flex items-center space-x-2">
            <label htmlFor="endDate" className="text-sm font-medium text-slate-600">To:</label>
            <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="block w-full border-slate-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:border-blue-500 focus:ring-0 sm:text-sm" />
        </div>
        <Button variant="secondary" onClick={() => handleExport('Excel')}>Export Excel</Button>
        <Button variant="secondary" onClick={() => handleExport('PDF')}>Export PDF</Button>
        {canCreate && <Button onClick={() => handleOpenModal('add')}>Add Contract</Button>}
    </div>
  );

  const getModalTitle = () => {
    if (modalMode === 'add') return 'Add New Sales Contract';
    if (modalMode === 'amend') return `Amend Sales Contract: ${selectedContract?.scNo}`;
    return `View Sales Contract: ${selectedContract?.scNo}`;
  };

  if (!canRead) {
    return <Card title="Access Denied"><p className="text-red-600">You do not have permission to view this module.</p></Card>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-slate-800">Sales Contracts</h1>
      <Card title={`Contracts for ${currentOrganization} (FY: ${currentFinancialYear})`} actions={cardActions}>
        <Table<SalesContract> data={filteredContracts} columns={columns} />
      </Card>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={getModalTitle()}>
        <SalesContractForm
          contract={selectedContract}
          mode={modalMode}
          vendorsClients={businessPartners}
          organizations={organizations}
          masterData={mockMasterData}
          readOnly={modalMode === 'view'}
          onSave={handleSaveContract}
          onCancel={handleCloseModal}
          currentFinancialYear={currentFinancialYear}
        />
      </Modal>

      {pdfData && (
        <Modal isOpen={isPdfPreviewOpen} onClose={() => setIsPdfPreviewOpen(false)} title={`PDF Preview: ${pdfData.contract.scNo}`}>
            <SalesContractPDF 
                contract={pdfData.contract}
                buyer={pdfData.buyer}
                seller={pdfData.seller}
                cciTerm={pdfData.cciTerm}
                deliveryTerm={pdfData.deliveryTerm}
                masterData={mockMasterData}
            />
        </Modal>
      )}
      
      <Modal isOpen={isApprovalModalOpen} onClose={() => setIsApprovalModalOpen(false)} title={`Send ${selectedContract?.scNo} for Approval`}>
        <div className="space-y-4">
            <p>Select a channel to send the approval request to the Buyer and Seller. They will receive a secure link to view and approve/reject the contract.</p>
            <div className="flex justify-end space-x-4 pt-4">
                <Button variant="secondary" onClick={() => handleSendForApproval(selectedContract!, 'WhatsApp')}>Send via WhatsApp</Button>
                <Button onClick={() => handleSendForApproval(selectedContract!, 'Email')}>Send via Email</Button>
            </div>
        </div>
      </Modal>

      <Modal isOpen={isRejectionModalOpen} onClose={() => setIsRejectionModalOpen(false)} title={`Reject Contract ${selectedContract?.scNo}`}>
        <div className="space-y-4">
            <FormLabel htmlFor="rejectionReason">Please provide a reason for rejection:</FormLabel>
            <FormInput component="textarea" id="rejectionReason" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className="md:col-span-3" />
            <div className="flex justify-end space-x-4 pt-4">
                <Button variant="secondary" onClick={() => setIsRejectionModalOpen(false)}>Cancel</Button>
                <Button variant="danger" onClick={submitRejection}>Submit Rejection</Button>
            </div>
        </div>
      </Modal>
    </div>
  );
};

export default SalesContracts;
