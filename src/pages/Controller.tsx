import React, { useState } from 'react';
import { User } from '../types';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { Button } from '../components/ui/Form';
import Modal from '../components/ui/Modal';
import { 
  MapPin, 
  Camera, 
  Scale, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Upload,
  Navigation,
  Shield,
  FileText
} from 'lucide-react';

interface ControllerProps {
  currentUser: User;
}

interface ControllerTask {
  id: string;
  contractNo: string;
  partyName: string;
  commodity: string;
  quantity: number;
  unit: string;
  location: string;
  status: 'Pending' | 'Check-In' | 'Sampling' | 'Weighment' | 'Loading' | 'Dispatched' | 'Delivered';
  assignedDate: string;
  dueDate: string;
  currentStep?: string;
}

// Mock data for controller tasks
const mockTasks: ControllerTask[] = [
  {
    id: 'CT001',
    contractNo: 'SC-2024-001',
    partyName: 'ABC Mills Pvt Ltd',
    commodity: 'Cotton',
    quantity: 100,
    unit: 'Bales',
    location: 'Warehouse A, Mumbai',
    status: 'Check-In',
    assignedDate: '2024-11-15',
    dueDate: '2024-11-17',
    currentStep: 'Awaiting GPS verification',
  },
  {
    id: 'CT002',
    contractNo: 'SC-2024-002',
    partyName: 'XYZ Traders',
    commodity: 'Cotton',
    quantity: 150,
    unit: 'Bales',
    location: 'Warehouse B, Delhi',
    status: 'Sampling',
    assignedDate: '2024-11-14',
    dueDate: '2024-11-16',
    currentStep: 'Quality parameters being recorded',
  },
  {
    id: 'CT003',
    contractNo: 'SC-2024-003',
    partyName: 'PQR Industries',
    commodity: 'Cotton',
    quantity: 200,
    unit: 'Bales',
    location: 'Warehouse C, Ahmedabad',
    status: 'Pending',
    assignedDate: '2024-11-16',
    dueDate: '2024-11-18',
  },
];

const Controller: React.FC<ControllerProps> = ({ currentUser }) => {
  const [tasks, setTasks] = useState<ControllerTask[]>(mockTasks);
  const [selectedTask, setSelectedTask] = useState<ControllerTask | null>(null);
  const [activeWorkflow, setActiveWorkflow] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Workflow states
  const [checkInData, setCheckInData] = useState({ gpsLat: '', gpsLong: '', otp: '' });
  const [samplingData, setSamplingData] = useState({
    moisture: '',
    staple: '',
    micronaire: '',
    trash: '',
    images: [] as File[],
  });
  const [weighmentData, setWeighmentData] = useState({ gross: '', tare: '', net: '' });
  const [loadingData, setLoadingData] = useState({
    bagsCount: '',
    sealNumber: '',
    vehicleNo: '',
    driverName: '',
    driverPhone: '',
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'success';
      case 'Dispatched':
        return 'info';
      case 'Pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'Pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const handleCheckIn = () => {
    if (!selectedTask) return;
    
    // Simulate GPS capture
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setCheckInData({
          gpsLat: position.coords.latitude.toFixed(6),
          gpsLong: position.coords.longitude.toFixed(6),
          otp: '',
        });
      });
    }
    
    setActiveWorkflow('check-in');
  };

  const submitCheckIn = () => {
    if (!selectedTask || !checkInData.otp) return;
    
    const updatedTasks = tasks.map(task =>
      task.id === selectedTask.id
        ? { ...task, status: 'Sampling' as const, currentStep: 'Check-in completed' }
        : task
    );
    setTasks(updatedTasks);
    setActiveWorkflow(null);
    setSelectedTask(null);
    alert('Check-in completed successfully!');
  };

  const submitSampling = () => {
    if (!selectedTask) return;
    
    const updatedTasks = tasks.map(task =>
      task.id === selectedTask.id
        ? { ...task, status: 'Weighment' as const, currentStep: 'Sampling completed' }
        : task
    );
    setTasks(updatedTasks);
    setActiveWorkflow(null);
    setSelectedTask(null);
    alert('Sampling data recorded successfully!');
  };

  const submitWeighment = () => {
    if (!selectedTask) return;
    
    const updatedTasks = tasks.map(task =>
      task.id === selectedTask.id
        ? { ...task, status: 'Loading' as const, currentStep: 'Weighment completed' }
        : task
    );
    setTasks(updatedTasks);
    setActiveWorkflow(null);
    setSelectedTask(null);
    alert('Weighment recorded successfully!');
  };

  const submitLoading = () => {
    if (!selectedTask) return;
    
    const updatedTasks = tasks.map(task =>
      task.id === selectedTask.id
        ? { ...task, status: 'Dispatched' as const, currentStep: 'Loading completed, ready for dispatch' }
        : task
    );
    setTasks(updatedTasks);
    setActiveWorkflow(null);
    setSelectedTask(null);
    alert('Loading verification completed!');
  };

  const submitDispatch = () => {
    if (!selectedTask) return;
    
    const updatedTasks = tasks.map(task =>
      task.id === selectedTask.id
        ? { ...task, status: 'Delivered' as const, currentStep: 'Dispatched' }
        : task
    );
    setTasks(updatedTasks);
    setSelectedTask(null);
    alert('Dispatch confirmed!');
  };

  const filteredTasks = filterStatus === 'All' 
    ? tasks 
    : tasks.filter(task => task.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Controller Module</h1>
          <p className="text-slate-600 mt-1">Unified Quality & Execution Management</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="info">
            <Shield className="w-3 h-3 mr-1" />
            {currentUser.name}
          </Badge>
        </div>
      </div>

      {/* Status Filter */}
      <Card>
        <div className="flex gap-2 flex-wrap">
          {['All', 'Pending', 'Check-In', 'Sampling', 'Weighment', 'Loading', 'Dispatched', 'Delivered'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </Card>

      {/* Tasks List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTasks.map(task => (
          <Card key={task.id} title={`Contract: ${task.contractNo}`}>
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-600">Party: {task.partyName}</p>
                  <p className="text-sm text-slate-600">
                    {task.quantity} {task.unit} of {task.commodity}
                  </p>
                  <p className="text-sm text-slate-600 flex items-center mt-1">
                    <MapPin className="w-3 h-3 mr-1" />
                    {task.location}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(task.status)}
                  <Badge variant={getStatusBadgeVariant(task.status)}>{task.status}</Badge>
                </div>
              </div>

              {task.currentStep && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm text-blue-800">{task.currentStep}</p>
                </div>
              )}

              <div className="flex gap-2 text-xs text-slate-500">
                <span>Assigned: {task.assignedDate}</span>
                <span>•</span>
                <span>Due: {task.dueDate}</span>
              </div>

              {/* Action Buttons based on status */}
              <div className="flex gap-2 flex-wrap">
                {task.status === 'Pending' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setSelectedTask(task);
                      handleCheckIn();
                    }}
                  >
                    <Navigation className="w-4 h-4 mr-1" />
                    Start Check-In
                  </Button>
                )}
                {task.status === 'Check-In' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setSelectedTask(task);
                      setActiveWorkflow('sampling');
                    }}
                  >
                    <Camera className="w-4 h-4 mr-1" />
                    Start Sampling
                  </Button>
                )}
                {task.status === 'Sampling' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setSelectedTask(task);
                      setActiveWorkflow('weighment');
                    }}
                  >
                    <Scale className="w-4 h-4 mr-1" />
                    Start Weighment
                  </Button>
                )}
                {task.status === 'Weighment' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setSelectedTask(task);
                      setActiveWorkflow('loading');
                    }}
                  >
                    <Package className="w-4 h-4 mr-1" />
                    Verify Loading
                  </Button>
                )}
                {task.status === 'Loading' && (
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => {
                      setSelectedTask(task);
                      submitDispatch();
                    }}
                  >
                    <Truck className="w-4 h-4 mr-1" />
                    Confirm Dispatch
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedTask(task)}
                >
                  <FileText className="w-4 h-4 mr-1" />
                  View Details
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Check-In Modal */}
      <Modal
        isOpen={activeWorkflow === 'check-in'}
        onClose={() => setActiveWorkflow(null)}
        title="Check-In Workflow"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Contract: {selectedTask?.contractNo} - {selectedTask?.location}
          </p>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              GPS Location
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Latitude"
                value={checkInData.gpsLat}
                readOnly
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50"
              />
              <input
                type="text"
                placeholder="Longitude"
                value={checkInData.gpsLong}
                readOnly
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Warehouse Manager OTP
            </label>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              value={checkInData.otp}
              onChange={(e) => setCheckInData({ ...checkInData, otp: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setActiveWorkflow(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={submitCheckIn}
              disabled={!checkInData.otp || checkInData.otp.length !== 6}
            >
              Complete Check-In
            </Button>
          </div>
        </div>
      </Modal>

      {/* Sampling Modal */}
      <Modal
        isOpen={activeWorkflow === 'sampling'}
        onClose={() => setActiveWorkflow(null)}
        title="Sampling & Quality Check"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Contract: {selectedTask?.contractNo} - {selectedTask?.commodity}
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Moisture (%)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g., 8.5"
                value={samplingData.moisture}
                onChange={(e) => setSamplingData({ ...samplingData, moisture: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Staple (mm)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g., 29.5"
                value={samplingData.staple}
                onChange={(e) => setSamplingData({ ...samplingData, staple: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Micronaire
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g., 3.8"
                value={samplingData.micronaire}
                onChange={(e) => setSamplingData({ ...samplingData, micronaire: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Trash (%)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g., 2.5"
                value={samplingData.trash}
                onChange={(e) => setSamplingData({ ...samplingData, trash: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Sample Images
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-md p-4 text-center">
              <Camera className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-sm text-slate-600">Click to capture images</p>
              <input
                type="file"
                multiple
                accept="image/*"
                capture="environment"
                className="hidden"
                id="sample-images"
              />
              <label
                htmlFor="sample-images"
                className="inline-block mt-2 px-4 py-2 bg-blue-500 text-white rounded-md cursor-pointer hover:bg-blue-600"
              >
                Capture Images
              </label>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setActiveWorkflow(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={submitSampling}
              disabled={!samplingData.moisture || !samplingData.staple}
            >
              Complete Sampling
            </Button>
          </div>
        </div>
      </Modal>

      {/* Weighment Modal */}
      <Modal
        isOpen={activeWorkflow === 'weighment'}
        onClose={() => setActiveWorkflow(null)}
        title="Weighment"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Contract: {selectedTask?.contractNo}
          </p>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Gross Weight (kg)
              </label>
              <input
                type="number"
                placeholder="Enter gross weight"
                value={weighmentData.gross}
                onChange={(e) => setWeighmentData({ ...weighmentData, gross: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tare Weight (kg)
              </label>
              <input
                type="number"
                placeholder="Enter tare weight"
                value={weighmentData.tare}
                onChange={(e) => setWeighmentData({ ...weighmentData, tare: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Net Weight (kg)
              </label>
              <input
                type="number"
                placeholder="Calculated"
                value={weighmentData.gross && weighmentData.tare 
                  ? (parseFloat(weighmentData.gross) - parseFloat(weighmentData.tare)).toFixed(2)
                  : ''}
                readOnly
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setActiveWorkflow(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={submitWeighment}
              disabled={!weighmentData.gross || !weighmentData.tare}
            >
              Complete Weighment
            </Button>
          </div>
        </div>
      </Modal>

      {/* Loading Verification Modal */}
      <Modal
        isOpen={activeWorkflow === 'loading'}
        onClose={() => setActiveWorkflow(null)}
        title="Loading Verification"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Contract: {selectedTask?.contractNo}
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Number of Bags/Bales
              </label>
              <input
                type="number"
                placeholder="Enter count"
                value={loadingData.bagsCount}
                onChange={(e) => setLoadingData({ ...loadingData, bagsCount: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Seal Number
              </label>
              <input
                type="text"
                placeholder="Enter seal number"
                value={loadingData.sealNumber}
                onChange={(e) => setLoadingData({ ...loadingData, sealNumber: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Vehicle Number
              </label>
              <input
                type="text"
                placeholder="e.g., MH-01-AB-1234"
                value={loadingData.vehicleNo}
                onChange={(e) => setLoadingData({ ...loadingData, vehicleNo: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Driver Name
              </label>
              <input
                type="text"
                placeholder="Enter driver name"
                value={loadingData.driverName}
                onChange={(e) => setLoadingData({ ...loadingData, driverName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Driver Phone
              </label>
              <input
                type="tel"
                placeholder="Enter phone number"
                value={loadingData.driverPhone}
                onChange={(e) => setLoadingData({ ...loadingData, driverPhone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Vehicle Photos & E-way Bill
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-md p-4 text-center">
              <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-sm text-slate-600">Upload documents</p>
              <input
                type="file"
                multiple
                accept="image/*,application/pdf"
                className="hidden"
                id="loading-docs"
              />
              <label
                htmlFor="loading-docs"
                className="inline-block mt-2 px-4 py-2 bg-blue-500 text-white rounded-md cursor-pointer hover:bg-blue-600"
              >
                Upload Files
              </label>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setActiveWorkflow(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={submitLoading}
              disabled={!loadingData.bagsCount || !loadingData.vehicleNo || !loadingData.driverName}
            >
              Complete Loading
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Controller;
