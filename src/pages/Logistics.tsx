import React, { useState } from 'react';
import { User, DeliveryOrder, DeliveryStatus } from '../types';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { Button } from '../components/ui/Form';
import TransporterBillForm from '../components/forms/TransporterBillForm';
import { Truck, MapPin, Calendar, FileText, Download, Eye, Edit, X } from 'lucide-react';

interface LogisticsProps {
  currentUser: User;
}

// Mock data for delivery orders
const mockDeliveryOrders: DeliveryOrder[] = [
  {
    id: 'DO001',
    doNumber: 'DO-2024-001',
    contractId: 'SC001',
    contractNo: 'SC-2024-001',
    partyName: 'ABC Mills Pvt Ltd',
    partyOrg: 'ABC Mills',
    commodity: 'Cotton',
    variety: 'MCU-5',
    quantity: 100,
    unit: 'Bales',
    deliveredQuantity: 0,
    pendingQuantity: 100,
    fromLocation: 'Mumbai Warehouse A',
    toLocation: 'ABC Mills, Surat',
    transportMode: 'Road',
    status: 'Pending',
    expectedDeliveryDate: '2024-11-20T00:00:00Z',
    documents: [],
    auditTrail: [
      {
        action: 'Delivery Order Created',
        performedBy: 'Logistics Manager',
        performedAt: '2024-11-14T10:00:00Z',
      },
    ],
    createdBy: 'Logistics Manager',
    createdAt: '2024-11-14T10:00:00Z',
    updatedAt: '2024-11-14T10:00:00Z',
  },
  {
    id: 'DO002',
    doNumber: 'DO-2024-002',
    contractId: 'SC002',
    contractNo: 'SC-2024-002',
    partyName: 'XYZ Traders',
    partyOrg: 'XYZ Trading Co',
    commodity: 'Cotton',
    variety: 'Shankar-6',
    quantity: 150,
    unit: 'Bales',
    deliveredQuantity: 75,
    pendingQuantity: 75,
    fromLocation: 'Delhi Warehouse B',
    toLocation: 'XYZ Godown, Ahmedabad',
    transportMode: 'Road',
    vehicleNumber: 'GJ-01-AB-1234',
    driverName: 'Ramesh Kumar',
    driverPhone: '9876543210',
    transporterName: 'Quick Transport Services',
    status: 'Partial',
    dispatchDate: '2024-11-13T08:00:00Z',
    expectedDeliveryDate: '2024-11-16T00:00:00Z',
    actualDeliveryDate: '2024-11-15T14:00:00Z',
    transportCost: 25000,
    otherCharges: 2000,
    documents: [
      {
        id: 'DOC001',
        name: 'delivery_challan.pdf',
        type: 'delivery_challan',
        uploadDate: '2024-11-13T08:30:00Z',
        uploadedBy: 'Logistics Staff',
        url: '#',
        ocrSummary: 'Delivery Challan #DC-001, Quantity: 75 Bales',
      },
      {
        id: 'DOC002',
        name: 'lr_copy.pdf',
        type: 'lr_copy',
        uploadDate: '2024-11-13T09:00:00Z',
        uploadedBy: 'Logistics Staff',
        url: '#',
      },
    ],
    remarks: 'Partial delivery completed. Remaining 75 bales to be delivered next week.',
    auditTrail: [
      {
        action: 'Delivery Order Created',
        performedBy: 'Logistics Manager',
        performedAt: '2024-11-12T15:00:00Z',
      },
      {
        action: 'Assigned to Transporter',
        performedBy: 'Logistics Manager',
        performedAt: '2024-11-13T07:00:00Z',
        remarks: 'Assigned to Quick Transport Services',
      },
      {
        action: 'Dispatched',
        performedBy: 'Warehouse Staff',
        performedAt: '2024-11-13T08:00:00Z',
      },
      {
        action: 'Partial Delivery',
        performedBy: 'Logistics Staff',
        performedAt: '2024-11-15T14:00:00Z',
        remarks: '75 bales delivered',
      },
    ],
    createdBy: 'Logistics Manager',
    createdAt: '2024-11-12T15:00:00Z',
    updatedAt: '2024-11-15T14:00:00Z',
  },
];

const LogisticsPage: React.FC<LogisticsProps> = ({ currentUser }) => {
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>(mockDeliveryOrders);
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [isTransporterBillModalOpen, setIsTransporterBillModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [filter, setFilter] = useState<{
    status?: DeliveryStatus;
    transportMode?: string;
    search?: string;
  }>({});

  const getFilteredOrders = () => {
    let filtered = deliveryOrders;

    if (filter.status) {
      filtered = filtered.filter(o => o.status === filter.status);
    }
    if (filter.transportMode) {
      filtered = filtered.filter(o => o.transportMode === filter.transportMode);
    }
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(o =>
        o.doNumber.toLowerCase().includes(searchLower) ||
        o.contractNo.toLowerCase().includes(searchLower) ||
        o.partyName.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  };

  const getStatusBadge = (status: DeliveryStatus) => {
    const variants: Record<DeliveryStatus, 'success' | 'warning' | 'error' | 'info'> = {
      'Pending': 'warning',
      'Assigned': 'info',
      'In Transit': 'info',
      'Delivered': 'success',
      'Cancelled': 'error',
      'Partial': 'warning',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const handleAssign = (order: DeliveryOrder) => {
    const updated = {
      ...order,
      status: 'Assigned' as DeliveryStatus,
      transporterName: 'Sample Transport Co',
      auditTrail: [
        ...order.auditTrail,
        {
          action: 'Assigned to Transporter',
          performedBy: currentUser.name,
          performedAt: new Date().toISOString(),
          remarks: 'Assigned to Sample Transport Co',
        },
      ],
    };
    setDeliveryOrders(deliveryOrders.map(o => o.id === order.id ? updated : o));
    setSelectedOrder(updated);
  };

  const handleDispatch = (order: DeliveryOrder) => {
    const updated = {
      ...order,
      status: 'In Transit' as DeliveryStatus,
      dispatchDate: new Date().toISOString(),
      auditTrail: [
        ...order.auditTrail,
        {
          action: 'Dispatched',
          performedBy: currentUser.name,
          performedAt: new Date().toISOString(),
        },
      ],
    };
    setDeliveryOrders(deliveryOrders.map(o => o.id === order.id ? updated : o));
    setSelectedOrder(updated);
  };

  const handleCancel = (order: DeliveryOrder, reason: string) => {
    const updated = {
      ...order,
      status: 'Cancelled' as DeliveryStatus,
      remarks: reason,
      auditTrail: [
        ...order.auditTrail,
        {
          action: 'Cancelled',
          performedBy: currentUser.name,
          performedAt: new Date().toISOString(),
          remarks: reason,
        },
      ],
    };
    setDeliveryOrders(deliveryOrders.map(o => o.id === order.id ? updated : o));
    setSelectedOrder(updated);
  };

  const filteredOrders = getFilteredOrders();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Logistics & Delivery Management</h1>
          <p className="text-slate-600 mt-1">Track and manage delivery orders and logistics</p>
        </div>
        <Button
          onClick={() => setIsTransporterBillModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <FileText className="w-4 h-4 mr-2" />
          Add Transporter Bill
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-semibold mt-1">{deliveryOrders.length}</p>
            </div>
            <Truck size={32} className="text-blue-600" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Transit</p>
              <p className="text-2xl font-semibold mt-1">
                {deliveryOrders.filter(o => o.status === 'In Transit').length}
              </p>
            </div>
            <Truck size={32} className="text-orange-600" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Delivered</p>
              <p className="text-2xl font-semibold mt-1">
                {deliveryOrders.filter(o => o.status === 'Delivered').length}
              </p>
            </div>
            <Truck size={32} className="text-green-600" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-semibold mt-1">
                {deliveryOrders.filter(o => o.status === 'Pending').length}
              </p>
            </div>
            <Truck size={32} className="text-yellow-600" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="DO Number, Contract, Party..."
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
              onChange={(e) => setFilter({ ...filter, status: e.target.value as DeliveryStatus || undefined })}
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Assigned">Assigned</option>
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Partial">Partial</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transport Mode</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={filter.transportMode || ''}
              onChange={(e) => setFilter({ ...filter, transportMode: e.target.value || undefined })}
            >
              <option value="">All Modes</option>
              <option value="Road">Road</option>
              <option value="Rail">Rail</option>
              <option value="Air">Air</option>
              <option value="Sea">Sea</option>
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

      {/* Delivery Orders Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">DO Number</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contract</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Party</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commodity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{order.doNumber}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{order.contractNo}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{order.partyName}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {order.commodity}
                    <div className="text-xs text-gray-500">{order.variety}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {order.quantity} {order.unit}
                    {order.deliveredQuantity && order.deliveredQuantity > 0 && (
                      <div className="text-xs text-green-600">
                        Delivered: {order.deliveredQuantity}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <div className="flex items-center gap-1">
                      <MapPin size={12} className="text-gray-400" />
                      <span className="text-xs">{order.fromLocation}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      → {order.toLocation}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{getStatusBadge(order.status)}</td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => setSelectedOrder(order)}
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

          {filteredOrders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No delivery orders found matching your criteria
            </div>
          )}
        </div>
      </Card>

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">{selectedOrder.doNumber}</h2>
                <p className="text-sm text-gray-600 mt-1">{selectedOrder.contractNo} - {selectedOrder.partyName}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Status:</span>
                {getStatusBadge(selectedOrder.status)}
              </div>

              {/* Commodity Details */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Commodity Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Commodity:</span>
                    <p className="font-medium">{selectedOrder.commodity} - {selectedOrder.variety}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Total Quantity:</span>
                    <p className="font-medium">{selectedOrder.quantity} {selectedOrder.unit}</p>
                  </div>
                  {selectedOrder.deliveredQuantity && selectedOrder.deliveredQuantity > 0 && (
                    <>
                      <div>
                        <span className="text-sm text-gray-600">Delivered:</span>
                        <p className="font-medium text-green-600">
                          {selectedOrder.deliveredQuantity} {selectedOrder.unit}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Pending:</span>
                        <p className="font-medium text-orange-600">
                          {selectedOrder.pendingQuantity} {selectedOrder.unit}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Route & Transport */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  <Truck size={18} className="inline mr-2" />
                  Route & Transport Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">From:</span>
                    <p className="font-medium">{selectedOrder.fromLocation}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">To:</span>
                    <p className="font-medium">{selectedOrder.toLocation}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Transport Mode:</span>
                    <p className="font-medium">{selectedOrder.transportMode}</p>
                  </div>
                  {selectedOrder.transporterName && (
                    <div>
                      <span className="text-sm text-gray-600">Transporter:</span>
                      <p className="font-medium">{selectedOrder.transporterName}</p>
                    </div>
                  )}
                  {selectedOrder.vehicleNumber && (
                    <div>
                      <span className="text-sm text-gray-600">Vehicle Number:</span>
                      <p className="font-medium">{selectedOrder.vehicleNumber}</p>
                    </div>
                  )}
                  {selectedOrder.driverName && (
                    <div>
                      <span className="text-sm text-gray-600">Driver:</span>
                      <p className="font-medium">{selectedOrder.driverName}</p>
                      {selectedOrder.driverPhone && (
                        <p className="text-sm text-gray-600">{selectedOrder.driverPhone}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  <Calendar size={18} className="inline mr-2" />
                  Important Dates
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedOrder.dispatchDate && (
                    <div>
                      <span className="text-sm text-gray-600">Dispatch Date:</span>
                      <p className="font-medium">{new Date(selectedOrder.dispatchDate).toLocaleString()}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-gray-600">Expected Delivery:</span>
                    <p className="font-medium">{new Date(selectedOrder.expectedDeliveryDate).toLocaleDateString()}</p>
                  </div>
                  {selectedOrder.actualDeliveryDate && (
                    <div>
                      <span className="text-sm text-gray-600">Actual Delivery:</span>
                      <p className="font-medium text-green-600">
                        {new Date(selectedOrder.actualDeliveryDate).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial */}
              {(selectedOrder.transportCost || selectedOrder.otherCharges) && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Financial Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedOrder.transportCost && (
                      <div>
                        <span className="text-sm text-gray-600">Transport Cost:</span>
                        <p className="font-medium">₹{selectedOrder.transportCost.toLocaleString()}</p>
                      </div>
                    )}
                    {selectedOrder.otherCharges && (
                      <div>
                        <span className="text-sm text-gray-600">Other Charges:</span>
                        <p className="font-medium">₹{selectedOrder.otherCharges.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Documents */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  <FileText size={18} className="inline mr-2" />
                  Documents
                </h3>
                {selectedOrder.documents.length > 0 ? (
                  <div className="space-y-2">
                    {selectedOrder.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-3">
                          <FileText size={20} className="text-gray-500" />
                          <div>
                            <div className="font-medium text-sm">{doc.name}</div>
                            <div className="text-xs text-gray-500">
                              Uploaded by {doc.uploadedBy} on {new Date(doc.uploadDate).toLocaleString()}
                            </div>
                            {doc.ocrSummary && (
                              <div className="text-xs text-blue-600 mt-1">OCR: {doc.ocrSummary}</div>
                            )}
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

              {/* Remarks */}
              {selectedOrder.remarks && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Remarks</h3>
                  <p className="text-sm text-gray-700 p-3 bg-gray-50 rounded">{selectedOrder.remarks}</p>
                </div>
              )}

              {/* Audit Trail */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Audit Trail</h3>
                <div className="space-y-2">
                  {selectedOrder.auditTrail.map((entry, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                      <Calendar size={16} className="text-gray-500 mt-1" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{entry.action}</div>
                        <div className="text-xs text-gray-600">
                          by {entry.performedBy} on {new Date(entry.performedAt).toLocaleString()}
                        </div>
                        {entry.remarks && (
                          <div className="text-sm text-gray-700 mt-1">{entry.remarks}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                {selectedOrder.status === 'Pending' && (
                  <button
                    onClick={() => handleAssign(selectedOrder)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Edit size={16} />
                    Assign Transporter
                  </button>
                )}
                {selectedOrder.status === 'Assigned' && (
                  <button
                    onClick={() => handleDispatch(selectedOrder)}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                  >
                    <Truck size={16} />
                    Mark as Dispatched
                  </button>
                )}
                {(selectedOrder.status === 'Pending' || selectedOrder.status === 'Assigned') && (
                  <button
                    onClick={() => handleCancel(selectedOrder, 'Cancelled by user')}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
                  >
                    <X size={16} />
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transporter Bill Modal */}
      <Modal
        isOpen={isTransporterBillModalOpen}
        onClose={() => {
          setIsTransporterBillModalOpen(false);
          setSelectedBill(null);
        }}
        title={selectedBill ? 'View Transporter Bill' : 'Add Transporter Bill'}
      >
        <TransporterBillForm
          bill={selectedBill}
          onSave={(data) => {
            console.log('Transporter bill saved:', data);
            setIsTransporterBillModalOpen(false);
            setSelectedBill(null);
          }}
          onCancel={() => {
            setIsTransporterBillModalOpen(false);
            setSelectedBill(null);
          }}
        />
      </Modal>
    </div>
  );
};

export default LogisticsPage;
