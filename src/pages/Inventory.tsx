import React, { useState } from 'react';
import { User, InventoryItem } from '../types';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { Package, MapPin, Calendar, FileText, Download, Eye, Search } from 'lucide-react';

interface InventoryProps {
  currentUser: User;
}

// Mock data for inventory
const mockInventory: InventoryItem[] = [
  {
    id: 'INV001',
    contractId: 'SC001',
    contractNo: 'SC-2024-001',
    commodity: 'Cotton',
    variety: 'MCU-5',
    quantity: 100,
    unit: 'Bales',
    location: 'Mumbai',
    warehouse: 'Mumbai Warehouse A',
    lotNumber: 'LOT-2024-001',
    baleNumbers: ['B001', 'B002', 'B003'],
    qualityGrade: 'Grade A',
    inspectionId: 'QI002',
    inspectionStatus: 'Approved',
    status: 'In Stock',
    receivedDate: '2024-11-10T10:00:00Z',
    weight: 17000,
    packages: 100,
    storageLocation: 'Section A, Row 5',
    rackNumber: 'A5-12',
    documents: [
      {
        id: 'DOC001',
        name: 'grn_001.pdf',
        type: 'grn',
        uploadDate: '2024-11-10T10:30:00Z',
        url: '#',
      },
      {
        id: 'DOC002',
        name: 'weighment_slip.pdf',
        type: 'weighment',
        uploadDate: '2024-11-10T11:00:00Z',
        url: '#',
      },
    ],
    owner: 'ABC Mills Pvt Ltd',
    ownerOrg: 'ABC Mills',
    createdBy: 'Warehouse Manager',
    createdAt: '2024-11-10T10:00:00Z',
    updatedAt: '2024-11-10T11:00:00Z',
  },
  {
    id: 'INV002',
    contractId: 'SC002',
    contractNo: 'SC-2024-002',
    commodity: 'Cotton',
    variety: 'Shankar-6',
    quantity: 150,
    unit: 'Bales',
    location: 'Delhi',
    warehouse: 'Delhi Warehouse B',
    lotNumber: 'LOT-2024-002',
    baleNumbers: ['D001', 'D002', 'D003'],
    qualityGrade: 'Grade A+',
    inspectionId: 'QI001',
    inspectionStatus: 'Approved',
    status: 'Reserved',
    receivedDate: '2024-11-12T09:00:00Z',
    weight: 25500,
    packages: 150,
    storageLocation: 'Section B, Row 3',
    rackNumber: 'B3-08',
    documents: [
      {
        id: 'DOC003',
        name: 'grn_002.pdf',
        type: 'grn',
        uploadDate: '2024-11-12T09:30:00Z',
        url: '#',
      },
    ],
    owner: 'XYZ Traders',
    ownerOrg: 'XYZ Trading Co',
    createdBy: 'Warehouse Staff',
    createdAt: '2024-11-12T09:00:00Z',
    updatedAt: '2024-11-12T09:30:00Z',
  },
];

const InventoryPage: React.FC<InventoryProps> = ({ currentUser }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>(mockInventory);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [filter, setFilter] = useState<{
    status?: string;
    location?: string;
    commodity?: string;
    search?: string;
  }>({});

  const getFilteredInventory = () => {
    let filtered = inventory;

    if (filter.status) {
      filtered = filtered.filter(i => i.status === filter.status);
    }
    if (filter.location) {
      filtered = filtered.filter(i => i.location === filter.location);
    }
    if (filter.commodity) {
      filtered = filtered.filter(i => i.commodity === filter.commodity);
    }
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(i =>
        i.contractNo.toLowerCase().includes(searchLower) ||
        i.lotNumber.toLowerCase().includes(searchLower) ||
        i.owner.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
      'In Stock': 'success',
      'Reserved': 'info',
      'In Transit': 'warning',
      'Delivered': 'success',
      'Damaged': 'error',
    };
    return <Badge variant={variants[status] || 'info'}>{status}</Badge>;
  };

  const getTotalQuantity = () => {
    return inventory.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotalWeight = () => {
    return inventory.reduce((sum, item) => sum + item.weight, 0);
  };

  const getLocationSummary = () => {
    const summary: Record<string, number> = {};
    inventory.forEach(item => {
      summary[item.location] = (summary[item.location] || 0) + item.quantity;
    });
    return summary;
  };

  const filteredInventory = getFilteredInventory();
  const locationSummary = getLocationSummary();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Inventory Management</h1>
          <p className="text-slate-600 mt-1">Track and manage inventory across locations</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-semibold mt-1">{inventory.length}</p>
            </div>
            <Package size={32} className="text-blue-600" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Quantity</p>
              <p className="text-2xl font-semibold mt-1">{getTotalQuantity()}</p>
            </div>
            <Package size={32} className="text-green-600" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Weight</p>
              <p className="text-2xl font-semibold mt-1">{(getTotalWeight() / 1000).toFixed(2)} T</p>
            </div>
            <Package size={32} className="text-purple-600" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Locations</p>
              <p className="text-2xl font-semibold mt-1">{Object.keys(locationSummary).length}</p>
            </div>
            <MapPin size={32} className="text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Search size={14} className="inline mr-1" />
              Search
            </label>
            <input
              type="text"
              placeholder="Contract, Lot, Owner..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={filter.search || ''}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={filter.status || ''}
              onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined })}
            >
              <option value="">All Status</option>
              <option value="In Stock">In Stock</option>
              <option value="Reserved">Reserved</option>
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
              <option value="Damaged">Damaged</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={filter.location || ''}
              onChange={(e) => setFilter({ ...filter, location: e.target.value || undefined })}
            >
              <option value="">All Locations</option>
              {Object.keys(locationSummary).map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Commodity</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={filter.commodity || ''}
              onChange={(e) => setFilter({ ...filter, commodity: e.target.value || undefined })}
            >
              <option value="">All Commodities</option>
              <option value="Cotton">Cotton</option>
              <option value="Wheat">Wheat</option>
              <option value="Rice">Rice</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilter({})}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </Card>

      {/* Inventory Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lot Number</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contract</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commodity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quality</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.lotNumber}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{item.contractNo}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {item.commodity}
                    <div className="text-xs text-gray-500">{item.variety}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {item.quantity} {item.unit}
                    <div className="text-xs text-gray-500">{item.weight} kg</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <MapPin size={14} className="inline text-gray-400 mr-1" />
                    {item.location}
                    <div className="text-xs text-gray-500">{item.warehouse}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {item.qualityGrade && (
                      <Badge variant="success">{item.qualityGrade}</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">{getStatusBadge(item.status)}</td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Eye size={14} />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredInventory.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No inventory items found matching your criteria
            </div>
          )}
        </div>
      </Card>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">{selectedItem.lotNumber}</h2>
                <p className="text-sm text-gray-600 mt-1">{selectedItem.contractNo} - {selectedItem.owner}</p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Details */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Commodity:</span>
                    <p className="font-medium">{selectedItem.commodity} - {selectedItem.variety}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Quantity:</span>
                    <p className="font-medium">{selectedItem.quantity} {selectedItem.unit}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Weight:</span>
                    <p className="font-medium">{selectedItem.weight} kg</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Packages:</span>
                    <p className="font-medium">{selectedItem.packages}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Status:</span>
                    <p className="mt-1">{getStatusBadge(selectedItem.status)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Quality Grade:</span>
                    <p className="mt-1">
                      {selectedItem.qualityGrade && (
                        <Badge variant="success">{selectedItem.qualityGrade}</Badge>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location Details */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  <MapPin size={18} className="inline mr-2" />
                  Location Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Location:</span>
                    <p className="font-medium">{selectedItem.location}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Warehouse:</span>
                    <p className="font-medium">{selectedItem.warehouse}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Storage Location:</span>
                    <p className="font-medium">{selectedItem.storageLocation}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Rack Number:</span>
                    <p className="font-medium">{selectedItem.rackNumber}</p>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  <Calendar size={18} className="inline mr-2" />
                  Important Dates
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Received Date:</span>
                    <p className="font-medium">{new Date(selectedItem.receivedDate).toLocaleDateString()}</p>
                  </div>
                  {selectedItem.expiryDate && (
                    <div>
                      <span className="text-sm text-gray-600">Expiry Date:</span>
                      <p className="font-medium">{new Date(selectedItem.expiryDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bale Numbers */}
              {selectedItem.baleNumbers && selectedItem.baleNumbers.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Bale Numbers</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.baleNumbers.map((bale, idx) => (
                      <Badge key={idx} variant="info">{bale}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  <FileText size={18} className="inline mr-2" />
                  Documents
                </h3>
                {selectedItem.documents.length > 0 ? (
                  <div className="space-y-2">
                    {selectedItem.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-3">
                          <FileText size={20} className="text-gray-500" />
                          <div>
                            <div className="font-medium text-sm">{doc.name}</div>
                            <div className="text-xs text-gray-500">
                              {doc.type} - Uploaded on {new Date(doc.uploadDate).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <button className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800">
                          <Download size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 bg-gray-50 rounded">
                    No documents uploaded
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
