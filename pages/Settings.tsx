
import React from 'react';
import MasterDataManagement from '../components/management/MasterDataManagement';
import LocationManagement from '../components/management/LocationManagement';
import CommissionMasterManagement from '../components/management/CommissionMasterManagement';
import StructuredTermManagement from '../components/management/StructuredTermManagement';
import CciTermManagement from '../components/management/CciTermManagement';
import GstRateManagement from '../components/management/GstRateManagement';
import { mockMasterData, mockLocations } from '../data/mockData';
import { User, AuditLog } from '../types';
import Card from '../components/ui/Card';

interface SettingsProps {
  currentUser: User;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
}

const Settings: React.FC<SettingsProps> = ({ currentUser, addAuditLog }) => {
  if (currentUser.role !== 'Admin') {
    return (
      <Card title="Access Denied">
        <p className="text-red-600">You do not have permission to view this page. Please contact an administrator.</p>      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Settings & Master Data</h1>
      <p className="text-slate-600 -mt-4">Manage core system configurations. Changes here affect options available across the ERP.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MasterDataManagement title="Organizations" initialData={mockMasterData.organizations} currentUser={currentUser} addAuditLog={addAuditLog} />
        <MasterDataManagement title="Trade Types" initialData={mockMasterData.tradeTypes} currentUser={currentUser} addAuditLog={addAuditLog} />
        <MasterDataManagement title="Bargain Types" initialData={mockMasterData.bargainTypes} currentUser={currentUser} addAuditLog={addAuditLog} />
        <MasterDataManagement title="Varieties" initialData={mockMasterData.varieties} currentUser={currentUser} addAuditLog={addAuditLog} />
        <MasterDataManagement title="Dispute Reasons" initialData={mockMasterData.disputeReasons} currentUser={currentUser} addAuditLog={addAuditLog} />
        <MasterDataManagement title="Weightment Terms" initialData={mockMasterData.weightmentTerms} currentUser={currentUser} addAuditLog={addAuditLog} />
        <MasterDataManagement title="Passing Terms" initialData={mockMasterData.passingTerms} currentUser={currentUser} addAuditLog={addAuditLog} />
        <MasterDataManagement title="Financial Years" initialData={mockMasterData.financialYears} currentUser={currentUser} addAuditLog={addAuditLog} />
      </div>

      <div className="mt-8">
        <GstRateManagement initialData={mockMasterData.gstRates} currentUser={currentUser} addAuditLog={addAuditLog} />
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StructuredTermManagement title="Delivery Terms" initialData={mockMasterData.deliveryTerms} currentUser={currentUser} addAuditLog={addAuditLog} />
        <StructuredTermManagement title="Payment Terms" initialData={mockMasterData.paymentTerms} currentUser={currentUser} addAuditLog={addAuditLog} />
      </div>

      <div className="mt-8">
        <CommissionMasterManagement initialData={mockMasterData.commissions} currentUser={currentUser} addAuditLog={addAuditLog} />
      </div>

      <div className="mt-8">
        <CciTermManagement initialData={mockMasterData.cciTerms} currentUser={currentUser} addAuditLog={addAuditLog} />
      </div>

      <div className="mt-8">
        <LocationManagement initialData={mockLocations} currentUser={currentUser} addAuditLog={addAuditLog} />
      </div>
    </div>
  );
};

export default Settings;
