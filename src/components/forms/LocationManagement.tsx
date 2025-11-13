
import React, { useState, useRef } from 'react';
import Card from '../ui/Card';
import Table from '../ui/Table';
import Modal from '../ui/Modal';
import LocationForm from '../forms/LocationForm';
import { Location, User, AuditLog } from '../../types';
import { Button } from '../ui/Form';

interface LocationManagementProps {
  initialData: Location[];
  currentUser: User;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
}

const LocationManagement: React.FC<LocationManagementProps> = ({ initialData, currentUser, addAuditLog }) => {
  const [locations, setLocations] = useState<Location[]>(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [bulkUploadData, setBulkUploadData] = useState('');
  const [bulkUploadErrors, setBulkUploadErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveLocation = (location: Omit<Location, 'id'>) => {
    const newLocation = { ...location, id: Date.now() };
    setLocations([newLocation, ...locations]);
    addAuditLog({
      user: currentUser.name,
      role: currentUser.role,
      action: 'Create',
      module: 'Settings',
      details: `Created new location: ${location.city}, ${location.state}`,
      reason: 'Master data management'
    });
    setIsModalOpen(false);
  };

  const handleDeleteLocation = (location: Location) => {
    if (window.confirm(`Are you sure you want to delete the location '${location.city}, ${location.state}'?`)) {
      setLocations(locations.filter(loc => loc.id !== location.id));
      addAuditLog({
        user: currentUser.name,
        role: currentUser.role,
        action: 'Delete',
        module: 'Settings',
        details: `Deleted location: ${location.city}, ${location.state}`,
        reason: 'Master data management'
      });
    }
  };

  const handleBulkUpload = () => {
    const errors: string[] = [];
    const newLocations: Location[] = [];
    
    // Parse CSV data
    const lines = bulkUploadData.trim().split('\n');
    
    // Skip header row if it exists
    const startIndex = lines[0]?.toLowerCase().includes('country') ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = line.split(',').map(part => part.trim());
      
      if (parts.length !== 3) {
        errors.push(`Line ${i + 1}: Invalid format. Expected 3 columns (Country, State, City), got ${parts.length}`);
        continue;
      }
      
      const [country, state, city] = parts;
      
      if (!country || !state || !city) {
        errors.push(`Line ${i + 1}: Missing required fields`);
        continue;
      }
      
      // Check for duplicates in existing locations
      const isDuplicate = locations.some(
        loc => loc.country.toLowerCase() === country.toLowerCase() &&
               loc.state.toLowerCase() === state.toLowerCase() &&
               loc.city.toLowerCase() === city.toLowerCase()
      );
      
      if (isDuplicate) {
        errors.push(`Line ${i + 1}: Duplicate location - ${city}, ${state}, ${country}`);
        continue;
      }
      
      newLocations.push({
        id: Date.now() + i,
        country,
        state,
        city,
      });
    }
    
    setBulkUploadErrors(errors);
    
    if (newLocations.length > 0) {
      setLocations([...newLocations, ...locations]);
      addAuditLog({
        user: currentUser.name,
        role: currentUser.role,
        action: 'Bulk Upload',
        module: 'Settings - Location Master',
        details: `Bulk uploaded ${newLocations.length} locations${errors.length > 0 ? ` (${errors.length} errors)` : ''}`,
        reason: 'Bulk location import',
      });
      
      if (errors.length === 0) {
        setIsBulkUploadModalOpen(false);
        setBulkUploadData('');
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setBulkUploadData(text);
      setBulkUploadErrors([]);
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const template = 'Country,State,City\nIndia,Maharashtra,Mumbai\nIndia,Gujarat,Ahmedabad\nIndia,Karnataka,Bangalore';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'locations_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    { header: 'Country', accessor: 'country' },
    { header: 'State', accessor: 'state' },
    { header: 'City', accessor: 'city' },
    {
      header: 'Actions',
      accessor: (item: Location) => (
        <button onClick={() => handleDeleteLocation(item)} className="text-red-600 hover:underline text-sm font-medium">Delete</button>
      ),
    },
  ];

  return (
    <>
      <Card 
        title="Location Master" 
        subtitle="Manage locations with bulk upload support"
        actions={
          <div className="flex gap-2">
            <Button onClick={() => setIsBulkUploadModalOpen(true)} variant="secondary" className="text-sm">
              Bulk Upload
            </Button>
            <Button onClick={() => setIsModalOpen(true)} className="text-sm">Add Location</Button>
          </div>
        }
      >
        <Table<Location> data={locations} columns={columns} />
      </Card>
      
      {/* Single Location Add Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Location">
        <LocationForm onSave={handleSaveLocation} onCancel={() => setIsModalOpen(false)} />
      </Modal>
      
      {/* Bulk Upload Modal */}
      <Modal 
        isOpen={isBulkUploadModalOpen} 
        onClose={() => {
          setIsBulkUploadModalOpen(false);
          setBulkUploadData('');
          setBulkUploadErrors([]);
        }} 
        title="Bulk Upload Locations"
        size="large"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">CSV Format Instructions:</h4>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li>Format: Country,State,City (one location per line)</li>
              <li>First line can be a header row (will be skipped)</li>
              <li>No quotes needed unless values contain commas</li>
              <li>Duplicates will be automatically detected and skipped</li>
            </ul>
            <button
              onClick={downloadTemplate}
              className="mt-3 text-xs text-blue-600 hover:underline font-medium"
            >
              📥 Download CSV Template
            </button>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload CSV File or Paste Data
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-3"
            />
            
            <textarea
              value={bulkUploadData}
              onChange={(e) => {
                setBulkUploadData(e.target.value);
                setBulkUploadErrors([]);
              }}
              className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="Country,State,City&#10;India,Maharashtra,Mumbai&#10;India,Gujarat,Ahmedabad"
            />
          </div>
          
          {bulkUploadErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-red-900 mb-2">
                ⚠️ Validation Errors ({bulkUploadErrors.length}):
              </h4>
              <ul className="text-xs text-red-800 space-y-1 max-h-40 overflow-y-auto">
                {bulkUploadErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              onClick={() => {
                setIsBulkUploadModalOpen(false);
                setBulkUploadData('');
                setBulkUploadErrors([]);
              }}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleBulkUpload}
              disabled={!bulkUploadData.trim()}
            >
              Upload Locations
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default LocationManagement;
