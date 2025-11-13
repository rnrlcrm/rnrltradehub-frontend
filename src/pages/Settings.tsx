import React, { useState } from 'react';
import MasterDataManagement from '../components/forms/MasterDataManagement';
import OrganizationManagement from '../components/forms/OrganizationManagement';
import LocationManagement from '../components/forms/LocationManagement';
import CciTermManagement from '../components/forms/CciTermManagement';
import FYManagement from '../components/forms/FYManagement';
import CommodityManagement from '../components/forms/CommodityManagement';
import UserManagement from './UserManagement';
import RolesAndRights from './RolesAndRights';
import { mockMasterData, mockLocations, mockOrganizationsDetailed } from '../data/mockData';
import { User, AuditLog } from '../types';
import Card from '../components/ui/Card';

interface SettingsProps {
  currentUser: User;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
}

const Settings: React.FC<SettingsProps> = ({ currentUser, addAuditLog }) => {
  const [activeTab, setActiveTab] = useState<'master-data' | 'fy-management' | 'access-control'>('master-data');
  const [accessControlSubTab, setAccessControlSubTab] = useState<'users' | 'roles'>('users');

  if (currentUser.role !== 'Admin') {
    return (
      <Card title="Access Denied">
        <p className="text-red-600">You do not have permission to view this page. Please contact an administrator.</p>      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Settings & Configuration</h1>
      <p className="text-slate-600 -mt-4">Manage core system configurations, master data, and access control settings.</p>
      
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
          <button
            onClick={() => setActiveTab('access-control')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'access-control'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Access Control
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'master-data' && (
        <>
          {/* Commodity Master - Featured Section */}
          <div className="mt-6">
            <CommodityManagement 
              currentUser={currentUser} 
              addAuditLog={addAuditLog} 
            />
          </div>

          {/* Organizations - Featured Section */}
          <div className="mt-8">
            <OrganizationManagement 
              initialData={mockOrganizationsDetailed} 
              currentUser={currentUser} 
              addAuditLog={addAuditLog} 
            />
          </div>

          {/* CCI Terms - Cotton-specific */}
          <div className="mt-8">
            <CciTermManagement initialData={mockMasterData.cciTerms} currentUser={currentUser} addAuditLog={addAuditLog} />
          </div>

          {/* Location Master with Bulk Upload */}
          <div className="mt-8">
            <LocationManagement initialData={mockLocations} currentUser={currentUser} addAuditLog={addAuditLog} />
          </div>

          {/* Dispute Reasons - Still needed for contracts */}
          <div className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <MasterDataManagement title="Dispute Reasons" initialData={mockMasterData.disputeReasons} currentUser={currentUser} addAuditLog={addAuditLog} />
            </div>
          </div>

          {/* Information Card about removed sections */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">ℹ️ Streamlined Settings Architecture</h3>
            <p className="text-blue-800 mb-4">
              The following sections have been removed from Settings to eliminate duplication and improve data management:
            </p>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Trading Parameters (Now in Commodity Form)</h4>
                <ul className="list-disc list-inside text-blue-700 space-y-1 text-sm">
                  <li><strong>Trade Types</strong> - Managed inline per commodity</li>
                  <li><strong>Bargain Types</strong> - Managed inline per commodity</li>
                  <li><strong>Varieties</strong> - Managed inline per commodity (commodity-specific)</li>
                  <li><strong>Weightment Terms</strong> - Managed inline per commodity</li>
                  <li><strong>Passing Terms</strong> - Managed inline per commodity</li>
                  <li><strong>Delivery Terms</strong> - Managed inline per commodity</li>
                  <li><strong>Payment Terms</strong> - Managed inline per commodity</li>
                  <li><strong>Commission Master</strong> - Managed inline per commodity</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">GST Master (Removed)</h4>
                <p className="text-blue-700 text-sm">
                  ✅ <strong>GST rates are now managed entirely on the backend</strong> as per GST Act laws. 
                  The system automatically determines HSN codes and GST rates based on commodity classification.
                  No manual GST management needed in frontend.
                </p>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800 text-sm font-medium">
                ✓ This ensures each commodity has its own parameters with no cross-contamination<br/>
                ✓ GST compliance is guaranteed through backend validation<br/>
                ✓ Reduces complexity and prevents duplicate data entry
              </p>
            </div>
          </div>
        </>
      )}

      {activeTab === 'fy-management' && (
        <FYManagement />
      )}

      {activeTab === 'access-control' && (
        <div className="space-y-6">
          {/* Access Control Sub-tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setAccessControlSubTab('users')}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  accessControlSubTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                User Management
              </button>
              <button
                onClick={() => setAccessControlSubTab('roles')}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  accessControlSubTab === 'roles'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Roles & Rights
              </button>
            </nav>
          </div>

          {/* Access Control Sub-tab Content */}
          {accessControlSubTab === 'users' && (
            <UserManagement currentUser={currentUser} />
          )}
          
          {accessControlSubTab === 'roles' && (
            <RolesAndRights currentUser={currentUser} />
          )}
        </div>
      )}
    </div>
  );
};

export default Settings;
