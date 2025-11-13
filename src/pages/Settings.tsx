import React, { useState } from 'react';
import OrganizationManagement from '../components/forms/OrganizationManagement';
import LocationManagement from '../components/forms/LocationManagement';
import CciTermManagement from '../components/forms/CciTermManagement';
import FYManagementEnhanced from '../components/forms/FYManagementEnhanced';
import CommodityManagement from '../components/forms/CommodityManagement';
import { mockMasterData, mockLocations, mockOrganizationsDetailed } from '../data/mockData';
import { User, AuditLog } from '../types';
import Card from '../components/ui/Card';

interface SettingsProps {
  currentUser: User;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
}

const Settings: React.FC<SettingsProps> = ({ currentUser, addAuditLog }) => {
  const [activeTab, setActiveTab] = useState<'commodity' | 'organization' | 'cci-terms' | 'location' | 'fy-management'>('commodity');

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
      
      {/* Tab Navigation - Flattened structure for better UX */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('commodity')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'commodity'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Commodity Master
          </button>
          <button
            onClick={() => setActiveTab('organization')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'organization'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Organisation Master
          </button>
          <button
            onClick={() => setActiveTab('cci-terms')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'cci-terms'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            CCI Trade Terms Master
          </button>
          <button
            onClick={() => setActiveTab('location')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'location'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Location Master
          </button>
          <button
            onClick={() => setActiveTab('fy-management')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'fy-management'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Financial Year Management
          </button>
        </nav>
      </div>

      {/* Tab Content - Each module gets its own clean space */}
      <div className="mt-6">
        {activeTab === 'commodity' && (
          <CommodityManagement 
            currentUser={currentUser} 
            addAuditLog={addAuditLog} 
          />
        )}

        {activeTab === 'organization' && (
          <OrganizationManagement 
            initialData={mockOrganizationsDetailed} 
            currentUser={currentUser} 
            addAuditLog={addAuditLog} 
          />
        )}

        {activeTab === 'cci-terms' && (
          <CciTermManagement 
            initialData={mockMasterData.cciTerms} 
            currentUser={currentUser} 
            addAuditLog={addAuditLog} 
          />
        )}

        {activeTab === 'location' && (
          <LocationManagement 
            initialData={mockLocations} 
            currentUser={currentUser} 
            addAuditLog={addAuditLog} 
          />
        )}

        {activeTab === 'fy-management' && (
          <FYManagementEnhanced />
        )}
      </div>

      {/* Information Card about Streamlined Architecture - Only show on Commodity tab */}
      {activeTab === 'commodity' && (
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
                🎯 What&apos;s in Settings (CORE ONLY):
              </h4>
              <ul className="list-disc list-inside text-blue-700 space-y-1 text-sm">
                <li><strong>Commodity Master</strong> - Core module with inline trading parameters</li>
                <li><strong>Organisation Master</strong> - Organization/company management</li>
                <li><strong>CCI Trade Terms Master</strong> - Cotton-specific contract terms</li>
                <li><strong>Location Master</strong> - Locations with bulk upload capability</li>
                <li><strong>Financial Year Management</strong> - FY management and configuration</li>
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
      )}
    </div>
  );
};

export default Settings;
