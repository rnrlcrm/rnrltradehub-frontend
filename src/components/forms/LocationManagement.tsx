
import React, { useState } from 'react';
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
      <Card title="Location Master" actions={
        <Button onClick={() => setIsModalOpen(true)} className="text-sm">Add Location</Button>
      }>
        <Table<Location> data={locations} columns={columns} />
      </Card>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Location">
        <LocationForm onSave={handleSaveLocation} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </>
  );
};

export default LocationManagement;
