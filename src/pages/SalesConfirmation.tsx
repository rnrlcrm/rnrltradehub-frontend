import React, { useState, useMemo, useEffect } from 'react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import SalesConfirmationForm from '../components/forms/SalesConfirmationForm';
import { SalesConfirmation, User, BusinessPartner, AuditLog, Commodity, ConfirmationAuditEntry } from '../types';
import { hasPermission } from '../lib/permissions';
import { Button, FormLabel, FormInput } from '../components/ui/Form';
import { mockBusinessPartners, mockMasterData } from '../data/mockData';
import { 
  createSalesConfirmationNotification,
  createSalesConfirmationAmendmentNotification,
  createSalesConfirmationApprovalNotification,
  createSalesConfirmationPendingNotification,
  addNotification
} from '../utils/notifications';
import {
  generateSalesConfirmationEmail,
  generateSalesConfirmationAmendmentEmail,
  SalesConfirmationEmailData
} from '../utils/emailTemplates';
import { FileText, Edit, Eye, CheckCircle, XCircle, Send, AlertTriangle } from 'lucide-react';

interface SalesConfirmationProps {
  currentUser: User;
  currentOrganization: string;
  currentFinancialYear: string;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
}

const StatusBadge: React.FC<{ status: SalesConfirmation['status'] }> = ({ status }) => {
  const baseClasses = 'px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full';
  const statusClasses = {
    Draft: 'bg-gray-100 text-gray-800',
    Pending: 'bg-yellow-100 text-yellow-800',
    Confirmed: 'bg-green-100 text-green-800',
    Amended: 'bg-blue-100 text-blue-800',
    Cancelled: 'bg-red-100 text-red-800',
    Rejected: 'bg-red-200 text-red-900',
  };
  return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>;
};

const SalesConfirmationPage: React.FC<SalesConfirmationProps> = ({ 
  currentUser, 
  currentOrganization, 
  currentFinancialYear, 
  addAuditLog 
}) => {
  const [confirmations, setConfirmations] = useState<SalesConfirmation[]>([]);
  const [businessPartners] = useState<BusinessPartner[]>(mockBusinessPartners);
  const [commodities] = useState<Commodity[]>(mockMasterData.commodities || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'amend' | 'view'>('view');
  const [selectedConfirmation, setSelectedConfirmation] = useState<SalesConfirmation | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Permissions
  const canCreate = hasPermission(currentUser.role, 'Sales Confirmation', 'create');
  const canUpdate = hasPermission(currentUser.role, 'Sales Confirmation', 'update');
  const canRead = hasPermission(currentUser.role, 'Sales Confirmation', 'read');
  const canApprove = hasPermission(currentUser.role, 'Sales Confirmation', 'approve');

  // Filter confirmations
  const filteredConfirmations = useMemo(() => {
    return confirmations.filter(c => {
      const confirmationDate = new Date(c.date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      if (start && confirmationDate < start) return false;
      if (end && confirmationDate > end) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      
      return c.organization === currentOrganization && c.financialYear === currentFinancialYear;
    });
  }, [confirmations, currentOrganization, currentFinancialYear, startDate, endDate, statusFilter]);

  const handleOpenModal = (mode: 'create' | 'edit' | 'amend' | 'view', confirmation: SalesConfirmation | null = null) => {
    setModalMode(mode);
    setSelectedConfirmation(confirmation);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedConfirmation(null);
  };

  const generateConfirmationNumber = (): string => {
    const year = currentFinancialYear.slice(-2);
    const nextNum = confirmations.length + 1;
    return `SC-${year}-${String(nextNum).padStart(4, '0')}`;
  };

  const createAuditEntry = (action: ConfirmationAuditEntry['action'], details: string, changes?: any): ConfirmationAuditEntry => {
    return {
      id: `audit-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id.toString(),
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      details,
      changes,
    };
  };

  const sendEmail = (confirmation: SalesConfirmation, isAmendment: boolean = false) => {
    const buyer = businessPartners.find(bp => bp.id === confirmation.buyerId);
    const seller = businessPartners.find(bp => bp.id === confirmation.sellerId);

    if (!buyer || !seller) return;

    const emailData: SalesConfirmationEmailData = {
      confirmationNo: confirmation.confirmationNo,
      confirmationDate: new Date(confirmation.date).toLocaleDateString('en-IN'),
      buyerName: buyer.legal_name,
      sellerName: seller.legal_name,
      buyerEmail: buyer.contact_email,
      sellerEmail: seller.contact_email,
      lineItems: confirmation.lineItems.map(item => ({
        commodity: item.commodityName,
        variety: item.variety,
        quantity: `${item.quantity} ${commodities.find(c => c.id === item.commodityId)?.unit || ''}`,
        rate: `₹ ${item.rate.toFixed(2)}`,
        amount: `₹ ${item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      })),
      totalAmount: `₹ ${confirmation.lineItems.reduce((sum, item) => sum + item.amount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      deliveryLocation: confirmation.deliveryLocation,
      deliveryTerms: confirmation.deliveryTerms,
      paymentTerms: confirmation.paymentTerms,
      remarks: confirmation.remarks,
      createdBy: confirmation.createdBy,
      status: confirmation.status,
    };

    // In a real application, this would call an API to send the email
    if (isAmendment && confirmation.amendmentReason) {
      const amendmentData = {
        ...emailData,
        amendmentReason: confirmation.amendmentReason,
        previousVersion: confirmation.version - 1,
      };
      console.log('Sending amendment email:', generateSalesConfirmationAmendmentEmail(amendmentData));
    } else {
      console.log('Sending confirmation email:', generateSalesConfirmationEmail(emailData));
    }

    // Update confirmation with email sent status
    return {
      ...confirmation,
      emailSent: true,
      emailSentAt: new Date().toISOString(),
      emailSentTo: [buyer.contact_email, seller.contact_email],
    };
  };

  const sendNotifications = (confirmation: SalesConfirmation, isAmendment: boolean = false) => {
    if (isAmendment && confirmation.amendmentReason) {
      addNotification(createSalesConfirmationAmendmentNotification(
        confirmation.confirmationNo,
        confirmation.amendmentReason
      ));
    } else if (confirmation.status === 'Pending') {
      addNotification(createSalesConfirmationPendingNotification(
        confirmation.confirmationNo,
        confirmation.createdBy
      ));
    } else {
      addNotification(createSalesConfirmationNotification(
        confirmation.confirmationNo,
        confirmation.buyerName,
        confirmation.sellerName,
        confirmation.lineItems.length
      ));
    }

    return {
      ...confirmation,
      notificationSent: true,
      notificationSentAt: new Date().toISOString(),
    };
  };

  const handleSaveConfirmation = (confirmationData: Omit<SalesConfirmation, 'id'>, amendmentReason?: string) => {
    if (modalMode === 'create') {
      const newConfirmation: SalesConfirmation = {
        ...confirmationData,
        id: `conf_${Date.now()}`,
        confirmationNo: generateConfirmationNumber(),
        organization: currentOrganization,
        financialYear: currentFinancialYear,
        version: 1,
        status: 'Draft',
        createdBy: currentUser.name,
        createdAt: new Date().toISOString(),
        auditTrail: [
          createAuditEntry('Created', `Sales Confirmation created by ${currentUser.name}`)
        ],
      };

      // Send email and notifications
      let updatedConfirmation = sendEmail(newConfirmation, false);
      updatedConfirmation = sendNotifications(updatedConfirmation, false);

      // Add email sent audit entry
      updatedConfirmation.auditTrail.push(
        createAuditEntry('Email Sent', `Confirmation email sent to buyer and seller`)
      );
      updatedConfirmation.auditTrail.push(
        createAuditEntry('Notification Sent', `System notification sent`)
      );

      setConfirmations(prev => [updatedConfirmation, ...prev]);
      
      addAuditLog({
        user: currentUser.name,
        role: currentUser.role,
        action: 'Create',
        module: 'Sales Confirmation',
        details: `Created confirmation ${newConfirmation.confirmationNo} with ${newConfirmation.lineItems.length} commodity items`,
        reason: 'New confirmation entry',
      });

      alert(`Sales Confirmation ${newConfirmation.confirmationNo} created successfully!`);
    } else if (modalMode === 'amend' && selectedConfirmation && amendmentReason) {
      const amendedConfirmation: SalesConfirmation = {
        ...confirmationData,
        id: `${selectedConfirmation.id}-v${selectedConfirmation.version + 1}`,
        confirmationNo: selectedConfirmation.confirmationNo,
        version: selectedConfirmation.version + 1,
        amendmentReason,
        status: 'Amended',
        previousVersionId: selectedConfirmation.id,
        amendedBy: currentUser.name,
        amendedAt: new Date().toISOString(),
        auditTrail: [
          ...selectedConfirmation.auditTrail,
          createAuditEntry('Amended', `Confirmation amended by ${currentUser.name}. Reason: ${amendmentReason}`)
        ],
      };

      // Send amendment email and notifications
      let updatedConfirmation = sendEmail(amendedConfirmation, true);
      updatedConfirmation = sendNotifications(updatedConfirmation, true);

      // Add email sent audit entry
      updatedConfirmation.auditTrail.push(
        createAuditEntry('Email Sent', `Amendment email sent to buyer and seller`)
      );
      updatedConfirmation.auditTrail.push(
        createAuditEntry('Notification Sent', `Amendment notification sent`)
      );

      setConfirmations(prev => [updatedConfirmation, ...prev]);

      addAuditLog({
        user: currentUser.name,
        role: currentUser.role,
        action: 'Amend',
        module: 'Sales Confirmation',
        details: `Amended confirmation ${selectedConfirmation.confirmationNo} (Version ${amendedConfirmation.version})`,
        reason: amendmentReason,
      });

      alert(`Sales Confirmation ${selectedConfirmation.confirmationNo} amended successfully! New version: ${amendedConfirmation.version}`);
    } else if (modalMode === 'edit' && selectedConfirmation) {
      const updatedConfirmation: SalesConfirmation = {
        ...confirmationData,
        id: selectedConfirmation.id,
        confirmationNo: selectedConfirmation.confirmationNo,
        version: selectedConfirmation.version,
        auditTrail: [
          ...selectedConfirmation.auditTrail,
          createAuditEntry('Updated', `Confirmation updated by ${currentUser.name}`)
        ],
      };

      setConfirmations(prev => prev.map(c => c.id === selectedConfirmation.id ? updatedConfirmation : c));

      addAuditLog({
        user: currentUser.name,
        role: currentUser.role,
        action: 'Update',
        module: 'Sales Confirmation',
        details: `Updated confirmation ${selectedConfirmation.confirmationNo}`,
        reason: 'Confirmation details updated',
      });

      alert(`Sales Confirmation ${selectedConfirmation.confirmationNo} updated successfully!`);
    }

    handleCloseModal();
  };

  const handleApprove = () => {
    if (!selectedConfirmation) return;

    const approvedConfirmation: SalesConfirmation = {
      ...selectedConfirmation,
      status: 'Confirmed',
      approvedBy: currentUser.name,
      approvedAt: new Date().toISOString(),
      auditTrail: [
        ...selectedConfirmation.auditTrail,
        createAuditEntry('Approved', `Confirmation approved by ${currentUser.name}`)
      ],
    };

    // Send approval notification
    addNotification(createSalesConfirmationApprovalNotification(
      selectedConfirmation.confirmationNo,
      currentUser.name
    ));

    approvedConfirmation.auditTrail.push(
      createAuditEntry('Notification Sent', `Approval notification sent`)
    );

    setConfirmations(prev => prev.map(c => c.id === selectedConfirmation.id ? approvedConfirmation : c));

    addAuditLog({
      user: currentUser.name,
      role: currentUser.role,
      action: 'Approve',
      module: 'Sales Confirmation',
      details: `Approved confirmation ${selectedConfirmation.confirmationNo}`,
      reason: 'Confirmation approved',
    });

    setIsApprovalModalOpen(false);
    alert(`Sales Confirmation ${selectedConfirmation.confirmationNo} approved successfully!`);
  };

  const handleReject = () => {
    if (!selectedConfirmation || !rejectionReason) {
      alert('Please provide a rejection reason');
      return;
    }

    const rejectedConfirmation: SalesConfirmation = {
      ...selectedConfirmation,
      status: 'Rejected',
      rejectedBy: currentUser.name,
      rejectedAt: new Date().toISOString(),
      rejectionReason,
      auditTrail: [
        ...selectedConfirmation.auditTrail,
        createAuditEntry('Rejected', `Confirmation rejected by ${currentUser.name}. Reason: ${rejectionReason}`)
      ],
    };

    setConfirmations(prev => prev.map(c => c.id === selectedConfirmation.id ? rejectedConfirmation : c));

    addAuditLog({
      user: currentUser.name,
      role: currentUser.role,
      action: 'Reject',
      module: 'Sales Confirmation',
      details: `Rejected confirmation ${selectedConfirmation.confirmationNo}`,
      reason: rejectionReason,
    });

    setIsRejectionModalOpen(false);
    setRejectionReason('');
    alert(`Sales Confirmation ${selectedConfirmation.confirmationNo} rejected.`);
  };

  const buyers = businessPartners.filter(bp => bp.business_type === 'BUYER' || bp.business_type === 'BOTH');
  const sellers = businessPartners.filter(bp => bp.business_type === 'SELLER' || bp.business_type === 'BOTH');

  if (!canRead) {
    return (
      <Card title="Access Denied">
        <p className="text-red-600">You do not have permission to view this page.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Sales Confirmation</h1>
          <p className="text-slate-600 mt-1">Manage sales confirmations for multiple commodities</p>
        </div>
        {canCreate && (
          <Button onClick={() => handleOpenModal('create')} variant="primary">
            <FileText className="w-4 h-4 mr-2" />
            New Confirmation
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <FormLabel>Start Date</FormLabel>
            <FormInput
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <FormLabel>End Date</FormLabel>
            <FormInput
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div>
            <FormLabel>Status</FormLabel>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Amended">Amended</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              variant="secondary"
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setStatusFilter('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Confirmations Table */}
      <Card>
        {filteredConfirmations.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No sales confirmations found</p>
          </div>
        ) : (
          <Table<SalesConfirmation>
            data={filteredConfirmations}
            columns={[
              {
                header: 'Confirmation No',
                accessor: (confirmation) => (
                  <div>
                    {confirmation.confirmationNo}
                    {confirmation.version > 1 && (
                      <span className="ml-2 text-xs text-blue-600">(v{confirmation.version})</span>
                    )}
                  </div>
                ),
              },
              {
                header: 'Date',
                accessor: (confirmation) => new Date(confirmation.date).toLocaleDateString('en-IN'),
              },
              {
                header: 'Buyer',
                accessor: 'buyerName',
              },
              {
                header: 'Seller',
                accessor: 'sellerName',
              },
              {
                header: 'Items',
                accessor: (confirmation) => (
                  <div className="text-center">{confirmation.lineItems.length}</div>
                ),
              },
              {
                header: 'Total Amount',
                accessor: (confirmation) => (
                  <span className="font-semibold">
                    ₹ {confirmation.lineItems.reduce((sum, item) => sum + item.amount, 0).toLocaleString('en-IN')}
                  </span>
                ),
              },
              {
                header: 'Status',
                accessor: (confirmation) => <StatusBadge status={confirmation.status} />,
              },
              {
                header: 'Actions',
                accessor: (confirmation) => (
                  <div className="space-x-2 flex items-center">
                    <button
                      onClick={() => handleOpenModal('view', confirmation)}
                      className="text-blue-600 hover:text-blue-900"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {canUpdate && confirmation.status === 'Draft' && (
                      <button
                        onClick={() => handleOpenModal('edit', confirmation)}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {canUpdate && (confirmation.status === 'Confirmed' || confirmation.status === 'Amended') && (
                      <button
                        onClick={() => handleOpenModal('amend', confirmation)}
                        className="text-purple-600 hover:text-purple-900"
                        title="Amend"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    )}
                    {canApprove && confirmation.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedConfirmation(confirmation);
                            setIsApprovalModalOpen(true);
                          }}
                          className="text-green-600 hover:text-green-900"
                          title="Approve"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedConfirmation(confirmation);
                            setIsRejectionModalOpen(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="Reject"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                ),
              },
            ]}
          />
        )}
      </Card>

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={
          modalMode === 'create' ? 'Create Sales Confirmation' :
          modalMode === 'amend' ? 'Amend Sales Confirmation' :
          modalMode === 'edit' ? 'Edit Sales Confirmation' :
          'View Sales Confirmation'
        }
        size="xl"
      >
        <SalesConfirmationForm
          confirmation={selectedConfirmation}
          mode={modalMode}
          buyers={buyers}
          sellers={sellers}
          commodities={commodities}
          currentUser={currentUser}
          currentOrganization={currentOrganization}
          currentFinancialYear={currentFinancialYear}
          onSave={handleSaveConfirmation}
          onCancel={handleCloseModal}
        />
      </Modal>

      {/* Approval Modal */}
      <Modal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        title="Approve Confirmation"
      >
        <div className="space-y-4">
          <p>Are you sure you want to approve this sales confirmation?</p>
          <p className="font-semibold">
            Confirmation No: {selectedConfirmation?.confirmationNo}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsApprovalModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleApprove}>
              Approve
            </Button>
          </div>
        </div>
      </Modal>

      {/* Rejection Modal */}
      <Modal
        isOpen={isRejectionModalOpen}
        onClose={() => {
          setIsRejectionModalOpen(false);
          setRejectionReason('');
        }}
        title="Reject Confirmation"
      >
        <div className="space-y-4">
          <p>Please provide a reason for rejecting this sales confirmation:</p>
          <p className="font-semibold">
            Confirmation No: {selectedConfirmation?.confirmationNo}
          </p>
          <div>
            <FormLabel htmlFor="rejectionReason">Rejection Reason *</FormLabel>
            <textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter reason for rejection..."
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setIsRejectionModalOpen(false);
                setRejectionReason('');
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleReject}>
              Reject
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SalesConfirmationPage;
