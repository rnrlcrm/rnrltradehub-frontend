import React, { useState, useEffect } from 'react';
import { User } from '../types';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { Button } from '../components/ui/Form';
import Modal from '../components/ui/Modal';
import {
  Truck,
  MapPin,
  Navigation,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Download,
  Eye,
  Play,
  Pause,
  Flag,
  Package,
  Phone,
  User as UserIcon,
} from 'lucide-react';

interface TransportProps {
  currentUser: User;
}

type TransportMilestone = 
  | 'Pending Assignment'
  | 'Assigned'
  | 'Truck Reached'
  | 'Loading Started'
  | 'Loading Finished'
  | 'Dispatched'
  | 'En Route'
  | 'Arrived'
  | 'Delivered';

interface TransportOrder {
  id: string;
  toNumber: string;
  contractNo: string;
  partyName: string;
  commodity: string;
  quantity: number;
  unit: string;
  fromLocation: string;
  toLocation: string;
  currentMilestone: TransportMilestone;
  transporterName?: string;
  vehicleNo?: string;
  driverName?: string;
  driverPhone?: string;
  assignedDate?: string;
  dispatchDate?: string;
  expectedArrival?: string;
  currentLocation?: { lat: number; lng: number; address: string };
  milestones: {
    milestone: TransportMilestone;
    timestamp?: string;
    location?: string;
    remarks?: string;
  }[];
}

// Mock transport orders
const mockTransportOrders: TransportOrder[] = [
  {
    id: 'TO001',
    toNumber: 'TO-2024-001',
    contractNo: 'SC-2024-001',
    partyName: 'ABC Mills Pvt Ltd',
    commodity: 'Cotton',
    quantity: 100,
    unit: 'Bales',
    fromLocation: 'Warehouse A, Mumbai',
    toLocation: 'ABC Mills, Surat',
    currentMilestone: 'Assigned',
    transporterName: 'Express Logistics',
    vehicleNo: 'MH-01-AB-1234',
    driverName: 'Rajesh Kumar',
    driverPhone: '+91-9876543210',
    assignedDate: '2024-11-15',
    expectedArrival: '2024-11-17',
    milestones: [
      {
        milestone: 'Assigned',
        timestamp: '2024-11-15T10:00:00Z',
        remarks: 'Transporter assigned',
      },
    ],
  },
  {
    id: 'TO002',
    toNumber: 'TO-2024-002',
    contractNo: 'SC-2024-002',
    partyName: 'XYZ Traders',
    commodity: 'Cotton',
    quantity: 150,
    unit: 'Bales',
    fromLocation: 'Warehouse B, Delhi',
    toLocation: 'XYZ Godown, Ahmedabad',
    currentMilestone: 'En Route',
    transporterName: 'Fast Track Transport',
    vehicleNo: 'DL-01-CD-5678',
    driverName: 'Suresh Patel',
    driverPhone: '+91-9876543211',
    assignedDate: '2024-11-14',
    dispatchDate: '2024-11-15T08:00:00Z',
    expectedArrival: '2024-11-16',
    currentLocation: {
      lat: 23.0225,
      lng: 72.5714,
      address: 'NH-48, Near Udaipur, Rajasthan',
    },
    milestones: [
      {
        milestone: 'Assigned',
        timestamp: '2024-11-14T09:00:00Z',
        remarks: 'Transporter assigned',
      },
      {
        milestone: 'Truck Reached',
        timestamp: '2024-11-15T06:00:00Z',
        location: 'Warehouse B, Delhi',
      },
      {
        milestone: 'Loading Started',
        timestamp: '2024-11-15T07:00:00Z',
      },
      {
        milestone: 'Loading Finished',
        timestamp: '2024-11-15T07:45:00Z',
      },
      {
        milestone: 'Dispatched',
        timestamp: '2024-11-15T08:00:00Z',
        location: 'Warehouse B, Delhi',
      },
      {
        milestone: 'En Route',
        timestamp: '2024-11-15T08:30:00Z',
      },
    ],
  },
  {
    id: 'TO003',
    toNumber: 'TO-2024-003',
    contractNo: 'SC-2024-003',
    partyName: 'PQR Industries',
    commodity: 'Cotton',
    quantity: 200,
    unit: 'Bales',
    fromLocation: 'Warehouse C, Ahmedabad',
    toLocation: 'PQR Factory, Rajkot',
    currentMilestone: 'Pending Assignment',
    expectedArrival: '2024-11-18',
    milestones: [],
  },
];

const Transport: React.FC<TransportProps> = ({ currentUser }) => {
  const [orders, setOrders] = useState<TransportOrder[]>(mockTransportOrders);
  const [selectedOrder, setSelectedOrder] = useState<TransportOrder | null>(null);
  const [showToPdf, setShowToPdf] = useState(false);
  const [showTracking, setShowTracking] = useState(false);
  const [filterMilestone, setFilterMilestone] = useState<string>('All');

  const getMilestoneColor = (milestone: TransportMilestone): string => {
    switch (milestone) {
      case 'Delivered':
        return 'success';
      case 'En Route':
      case 'Dispatched':
        return 'info';
      case 'Pending Assignment':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getMilestoneIcon = (milestone: TransportMilestone) => {
    switch (milestone) {
      case 'Delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'En Route':
      case 'Dispatched':
        return <Truck className="w-4 h-4" />;
      case 'Pending Assignment':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const handleMilestoneUpdate = (orderId: string, milestone: TransportMilestone) => {
    const updatedOrders = orders.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          currentMilestone: milestone,
          milestones: [
            ...order.milestones,
            {
              milestone,
              timestamp: new Date().toISOString(),
            },
          ],
        };
      }
      return order;
    });
    setOrders(updatedOrders);
    alert(`Milestone updated to: ${milestone}`);
  };

  const generateToPdf = () => {
    alert('TO PDF generation would be implemented here. This would generate a Transport Order PDF with all details.');
  };

  const filteredOrders = filterMilestone === 'All'
    ? orders
    : orders.filter(order => order.currentMilestone === filterMilestone);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Transport Management</h1>
          <p className="text-slate-600 mt-1">Track and manage transport orders with real-time updates</p>
        </div>
        <Badge variant="info">
          <Truck className="w-3 h-3 mr-1" />
          {orders.length} Active Orders
        </Badge>
      </div>

      {/* Milestone Filter */}
      <Card>
        <div className="flex gap-2 flex-wrap">
          {['All', 'Pending Assignment', 'Assigned', 'Truck Reached', 'Loading Started', 'Loading Finished', 'Dispatched', 'En Route', 'Arrived', 'Delivered'].map(
            milestone => (
              <button
                key={milestone}
                onClick={() => setFilterMilestone(milestone)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filterMilestone === milestone
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {milestone}
              </button>
            )
          )}
        </div>
      </Card>

      {/* Transport Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredOrders.map(order => (
          <Card key={order.id} title={`TO: ${order.toNumber}`}>
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm text-slate-600">Contract: {order.contractNo}</p>
                  <p className="text-sm text-slate-600">Party: {order.partyName}</p>
                  <p className="text-sm text-slate-600">
                    {order.quantity} {order.unit} of {order.commodity}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getMilestoneIcon(order.currentMilestone)}
                  <Badge variant={getMilestoneColor(order.currentMilestone)}>
                    {order.currentMilestone}
                  </Badge>
                </div>
              </div>

              {/* Route */}
              <div className="bg-slate-50 rounded-md p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">From</p>
                    <p className="text-sm font-medium">{order.fromLocation}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Flag className="w-4 h-4 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">To</p>
                    <p className="text-sm font-medium">{order.toLocation}</p>
                  </div>
                </div>
              </div>

              {/* Transporter Details */}
              {order.transporterName && (
                <div className="border border-slate-200 rounded-md p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-medium">{order.transporterName}</span>
                  </div>
                  {order.vehicleNo && (
                    <p className="text-sm text-slate-600">Vehicle: {order.vehicleNo}</p>
                  )}
                  {order.driverName && (
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-slate-600" />
                      <span className="text-sm">{order.driverName}</span>
                      {order.driverPhone && (
                        <>
                          <Phone className="w-3 h-3 text-slate-400 ml-2" />
                          <span className="text-sm text-slate-500">{order.driverPhone}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Current Location for En Route */}
              {order.currentLocation && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Navigation className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Live Location</span>
                  </div>
                  <p className="text-sm text-blue-800">{order.currentLocation.address}</p>
                </div>
              )}

              {/* Timeline */}
              {order.milestones.length > 0 && (
                <div className="border-t pt-3">
                  <p className="text-xs font-medium text-slate-700 mb-2">Recent Milestones</p>
                  <div className="space-y-1">
                    {order.milestones.slice(-3).reverse().map((m, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        <span>{m.milestone}</span>
                        {m.timestamp && (
                          <span className="text-slate-400">
                            {new Date(m.timestamp).toLocaleString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                {order.currentMilestone === 'Pending Assignment' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setSelectedOrder(order);
                      // Show assignment modal
                      alert('Transporter assignment modal would open here');
                    }}
                  >
                    Assign Transporter
                  </Button>
                )}
                {order.currentMilestone === 'Assigned' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleMilestoneUpdate(order.id, 'Truck Reached')}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Mark Truck Reached
                  </Button>
                )}
                {order.currentMilestone === 'Truck Reached' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleMilestoneUpdate(order.id, 'Loading Started')}
                  >
                    <Package className="w-4 h-4 mr-1" />
                    Start Loading
                  </Button>
                )}
                {order.currentMilestone === 'Loading Started' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleMilestoneUpdate(order.id, 'Loading Finished')}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Complete Loading
                  </Button>
                )}
                {order.currentMilestone === 'Loading Finished' && (
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleMilestoneUpdate(order.id, 'Dispatched')}
                  >
                    <Truck className="w-4 h-4 mr-1" />
                    Dispatch
                  </Button>
                )}
                {order.currentMilestone === 'En Route' && (
                  <Button
                    variant="info"
                    size="sm"
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowTracking(true);
                    }}
                  >
                    <Navigation className="w-4 h-4 mr-1" />
                    Live Tracking
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedOrder(order);
                    setShowToPdf(true);
                  }}
                >
                  <FileText className="w-4 h-4 mr-1" />
                  View TO
                </Button>
                {order.currentMilestone !== 'Pending Assignment' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedOrder(order);
                      // Show milestone history
                      alert('Full milestone history would be shown here');
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Timeline
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* TO PDF Modal */}
      <Modal
        isOpen={showToPdf}
        onClose={() => setShowToPdf(false)}
        title={`Transport Order: ${selectedOrder?.toNumber}`}
      >
        <div className="space-y-4">
          <div className="border rounded-md p-4 bg-slate-50">
            <h3 className="font-semibold text-lg mb-3">Transport Order Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-600">TO Number</p>
                <p className="font-medium">{selectedOrder?.toNumber}</p>
              </div>
              <div>
                <p className="text-slate-600">Contract</p>
                <p className="font-medium">{selectedOrder?.contractNo}</p>
              </div>
              <div>
                <p className="text-slate-600">Party</p>
                <p className="font-medium">{selectedOrder?.partyName}</p>
              </div>
              <div>
                <p className="text-slate-600">Commodity</p>
                <p className="font-medium">{selectedOrder?.commodity}</p>
              </div>
              <div>
                <p className="text-slate-600">Quantity</p>
                <p className="font-medium">
                  {selectedOrder?.quantity} {selectedOrder?.unit}
                </p>
              </div>
              <div>
                <p className="text-slate-600">Status</p>
                <Badge variant={getMilestoneColor(selectedOrder?.currentMilestone || 'Pending Assignment')}>
                  {selectedOrder?.currentMilestone}
                </Badge>
              </div>
            </div>

            {selectedOrder?.transporterName && (
              <>
                <h4 className="font-semibold mt-4 mb-2">Transporter Details</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-600">Transporter</p>
                    <p className="font-medium">{selectedOrder.transporterName}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Vehicle No</p>
                    <p className="font-medium">{selectedOrder.vehicleNo}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Driver Name</p>
                    <p className="font-medium">{selectedOrder.driverName}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Driver Phone</p>
                    <p className="font-medium">{selectedOrder.driverPhone}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowToPdf(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={generateToPdf}>
              <Download className="w-4 h-4 mr-1" />
              Download PDF
            </Button>
          </div>
        </div>
      </Modal>

      {/* Live Tracking Modal */}
      <Modal
        isOpen={showTracking}
        onClose={() => setShowTracking(false)}
        title="Live GPS Tracking"
      >
        <div className="space-y-4">
          <div className="bg-slate-100 rounded-md h-64 flex items-center justify-center">
            <div className="text-center text-slate-600">
              <Navigation className="w-12 h-12 mx-auto mb-2" />
              <p>GPS Map Integration</p>
              <p className="text-sm">
                Current Location: {selectedOrder?.currentLocation?.address}
              </p>
            </div>
          </div>

          <div className="border rounded-md p-4">
            <h4 className="font-semibold mb-2">Tracking Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Vehicle</span>
                <span className="font-medium">{selectedOrder?.vehicleNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Driver</span>
                <span className="font-medium">{selectedOrder?.driverName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Expected Arrival</span>
                <span className="font-medium">{selectedOrder?.expectedArrival}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowTracking(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={() => alert('Refresh location')}>
              <Navigation className="w-4 h-4 mr-1" />
              Refresh Location
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Transport;
