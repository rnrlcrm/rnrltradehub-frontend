import React, { useState } from 'react';
import OrganizationManagement from '../components/forms/OrganizationManagement';
import LocationManagement from '../components/forms/LocationManagement';
import CciTermManagement from '../components/forms/CciTermManagement';
import FYManagement from '../components/forms/FYManagement';
import CommodityManagement from '../components/forms/CommodityManagement';
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
        <p className="text-red-600">You do not have permission to view this page. Please contact an administrator.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Settings & Configuration</h1>
      <p className="text-slate-600 -mt-4">Manage core system configurations and master data.</p>
      
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
          {/* Commodity Master - Core Module */}
          <div className="mt-6">
            <CommodityManagement 
              currentUser={currentUser} 
              addAuditLog={addAuditLog} 
            />
          </div>

          {/* Organizations */}
          <div className="mt-8">
            <OrganizationManagement 
              initialData={mockOrganizationsDetailed} 
              currentUser={currentUser} 
              addAuditLog={addAuditLog} 
            />
          </div>

          {/* CCI Terms - Cotton-specific */}
          <div className="mt-8">
            <CciTermManagement 
              initialData={mockMasterData.cciTerms} 
              currentUser={currentUser} 
              addAuditLog={addAuditLog} 
            />
          </div>

          {/* Location Master with Bulk Upload */}
          <div className="mt-8">
            <LocationManagement 
              initialData={mockLocations} 
              currentUser={currentUser} 
              addAuditLog={addAuditLog} 
            />
          </div>

          {/* Information Card about Streamlined Architecture */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              ℹ️ Streamlined Settings - Clean Architecture
            </h3>
            <p className="text-blue-800 mb-4">
              The Settings module has been completely streamlined to eliminate all duplication and improve maintainability.
            </p>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">
                  🎯 What's in Settings (CORE ONLY):
                </h4>
                <ul className="list-disc list-inside text-blue-700 space-y-1 text-sm">
                  <li><strong>Commodity Master</strong> - Core module with inline trading parameters</li>
                  <li><strong>Organizations</strong> - Organization/company management</li>
                  <li><strong>CCI Terms</strong> - Cotton-specific contract terms</li>
                  <li><strong>Location Master</strong> - Locations with bulk upload capability</li>
                  <li><strong>Financial Year</strong> - FY management and configuration</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">
                  ✅ Removed - Now Managed Inline in Commodity:
                </h4>
                <ul className="list-disc list-inside text-blue-700 space-y-1 text-sm">
                  <li>Trade Types, Bargain Types, Varieties</li>
                  <li>Weightment Terms, Passing Terms</li>
                  <li>Delivery Terms, Payment Terms</li>
                  <li>Commission Master</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">
                  🔧 Removed - Handled by Backend/Separate Modules:
                </h4>
                <ul className="list-disc list-inside text-blue-700 space-y-1 text-sm">
                  <li><strong>GST Master</strong> - Managed entirely on backend as per GST Act</li>
                  <li><strong>Dispute Reasons</strong> - Handled by backend business rule engine</li>
                  <li><strong>Access Control</strong> - Separate dedicated module (User Management & Roles)</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800 text-sm font-medium">
                ✓ Zero duplication - All master data is in one place only<br/>
                ✓ Clean separation - Frontend handles UI, backend handles business logic<br/>
                ✓ Modular design - Each concern has its own dedicated module<br/>
                ✓ Audit trail - All operations logged with commodity ID tracking
              </p>
            </div>
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
