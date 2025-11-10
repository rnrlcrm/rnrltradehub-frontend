
import React, { useState } from 'react';
import MasterDataManagement from '../components/forms/MasterDataManagement';
import OrganizationManagement from '../components/forms/OrganizationManagement';
import LocationManagement from '../components/forms/LocationManagement';
import CommissionMasterManagement from '../components/forms/CommissionMasterManagement';
import StructuredTermManagement from '../components/forms/StructuredTermManagement';
import CciTermManagement from '../components/forms/CciTermManagement';
import GstRateManagement from '../components/forms/GstRateManagement';
import FYManagement from '../components/forms/FYManagement';
import { mockMasterData, mockLocations, mockOrganizationsDetailed } from '../data/mockData';
import { User, AuditLog } from '../types';
import Card from '../components/ui/Card';

interface SettingsProps {
  currentUser: User;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
}

const Settings: React.FC<SettingsProps> = ({ currentUser, addAuditLog }) => {
  const [activeTab, setActiveTab] = useState<'master-data' | 'fy-management'>('master-data');

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
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('master-data')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'master-data'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Master Data Management
          </button>
          <button
            onClick={() => setActiveTab('fy-management')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'fy-management'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Financial Year Management
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'master-data' && (
        <>
          {/* Organizations - Featured Section */}
          <div className="mt-6">
            <OrganizationManagement 
              initialData={mockOrganizationsDetailed} 
              currentUser={currentUser} 
              addAuditLog={addAuditLog} 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        </>
      )}

      {activeTab === 'fy-management' && (
        <FYManagement />
      )}
    </div>
  );
};

export default Settings;
