import React, { useState } from 'react';
import { User, QualityInspection, InspectionStatus, InspectionType } from '../types';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { AlertCircle, CheckCircle, Clock, FileText, Upload, Download, Eye } from 'lucide-react';

interface QualityInspectionProps {
  currentUser: User;
}

// Mock data for quality inspections
const mockInspections: QualityInspection[] = [
  {
    id: 'QI001',
    contractId: 'SC001',
    contractNo: 'SC-2024-001',
    partyName: 'ABC Mills Pvt Ltd',
    partyOrg: 'ABC Mills',
    commodity: 'Cotton',
    variety: 'MCU-5',
    quantity: 100,
    unit: 'Bales',
    inspectionType: 'Pre-Delivery',
    status: 'Pending',
    qualityParams: [
      { parameter: 'Staple Length', expectedValue: '28-30 mm', tolerance: '±2 mm', status: undefined },
      { parameter: 'Micronaire', expectedValue: '3.7-4.2', tolerance: '±0.3', status: undefined },
      { parameter: 'Trash Content', expectedValue: '< 3%', tolerance: '0.5%', status: undefined },
      { parameter: 'Moisture', expectedValue: '7-9%', tolerance: '±1%', status: undefined },
    ],
    documents: [],
    auditTrail: [
      {
        action: 'Inspection Request Created',
        performedBy: 'John Doe',
        performedAt: '2024-11-10T10:00:00Z',
      },
    ],
    createdBy: 'John Doe',
    createdAt: '2024-11-10T10:00:00Z',
    updatedAt: '2024-11-10T10:00:00Z',
  },
  {
    id: 'QI002',
    contractId: 'SC002',
    contractNo: 'SC-2024-002',
    partyName: 'XYZ Traders',
    partyOrg: 'XYZ Trading Co',
    commodity: 'Cotton',
    variety: 'Shankar-6',
    quantity: 150,
    unit: 'Bales',
    inspectionType: 'Quality Check',
    status: 'Approved',
    inspectionDate: '2024-11-12T14:00:00Z',
    inspectorName: 'Inspector A',
    inspectorOrg: currentUser.organization,
    qualityParams: [
      { parameter: 'Staple Length', expectedValue: '30-32 mm', actualValue: '31 mm', tolerance: '±2 mm', status: 'Pass' },
      { parameter: 'Micronaire', expectedValue: '3.5-4.0', actualValue: '3.8', tolerance: '±0.3', status: 'Pass' },
      { parameter: 'Trash Content', expectedValue: '< 3%', actualValue: '2.1%', tolerance: '0.5%', status: 'Pass' },
      { parameter: 'Moisture', expectedValue: '7-9%', actualValue: '8.2%', tolerance: '±1%', status: 'Pass' },
    ],
    documents: [
      {
        id: 'DOC001',
        name: 'inspection_report.pdf',
        type: 'inspection_report',
        uploadDate: '2024-11-12T14:30:00Z',
        uploadedBy: 'Inspector A',
        url: '#',
        ocrSummary: 'Quality parameters verified: All within acceptable range',
      },
    ],
    remarks: 'Quality meets specifications. Approved for delivery.',
    approvedBy: 'Inspector A',
    approvedDate: '2024-11-12T15:00:00Z',
    auditTrail: [
      {
        action: 'Inspection Request Created',
        performedBy: 'Jane Smith',
        performedAt: '2024-11-11T09:00:00Z',
      },
      {
        action: 'Inspection Completed',
        performedBy: 'Inspector A',
        performedAt: '2024-11-12T14:00:00Z',
        remarks: 'All parameters checked',
      },
      {
        action: 'Approved',
        performedBy: 'Inspector A',
        performedAt: '2024-11-12T15:00:00Z',
        remarks: 'Quality meets specifications',
      },
    ],
    createdBy: 'Jane Smith',
    createdAt: '2024-11-11T09:00:00Z',
    updatedAt: '2024-11-12T15:00:00Z',
  },
];

const QualityInspectionPage: React.FC<QualityInspectionProps> = ({ currentUser }) => {
  const [inspections, setInspections] = useState<QualityInspection[]>(mockInspections);
  const [selectedTab, setSelectedTab] = useState<'pending' | 'all' | 'my-org'>('pending');
  const [selectedInspection, setSelectedInspection] = useState<QualityInspection | null>(null);
  const [filter, setFilter] = useState<{
    status?: InspectionStatus;
    type?: InspectionType;
    search?: string;
  }>({});

  const getFilteredInspections = () => {
    let filtered = inspections;

    // Tab filtering
    if (selectedTab === 'pending') {
      filtered = filtered.filter(i => i.status === 'Pending' || i.status === 'In Progress');
    } else if (selectedTab === 'my-org') {
      filtered = filtered.filter(i => 
        i.partyOrg === currentUser.organization || 
        i.inspectorOrg === currentUser.organization
      );
    }

    // Additional filters
    if (filter.status) {
      filtered = filtered.filter(i => i.status === filter.status);
    }
    if (filter.type) {
      filtered = filtered.filter(i => i.inspectionType === filter.type);
    }
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(i =>
        i.contractNo.toLowerCase().includes(searchLower) ||
        i.partyName.toLowerCase().includes(searchLower) ||
        i.commodity.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  };

  const getStatusBadge = (status: InspectionStatus) => {
    const variants: Record<InspectionStatus, 'success' | 'warning' | 'error' | 'info'> = {
      'Pending': 'warning',
      'In Progress': 'info',
      'Approved': 'success',
      'Rejected': 'error',
      'Resample Required': 'warning',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const handleApprove = (inspection: QualityInspection) => {
    const updated = {
      ...inspection,
      status: 'Approved' as InspectionStatus,
      approvedBy: currentUser.name,
      approvedDate: new Date().toISOString(),
      auditTrail: [
        ...inspection.auditTrail,
        {
          action: 'Approved',
          performedBy: currentUser.name,
          performedAt: new Date().toISOString(),
        },
      ],
    };
    setInspections(inspections.map(i => i.id === inspection.id ? updated : i));
    setSelectedInspection(updated);
  };

  const handleReject = (inspection: QualityInspection, reason: string) => {
    const updated = {
      ...inspection,
      status: 'Rejected' as InspectionStatus,
      rejectionReason: reason,
      auditTrail: [
        ...inspection.auditTrail,
        {
          action: 'Rejected',
          performedBy: currentUser.name,
          performedAt: new Date().toISOString(),
          remarks: reason,
        },
      ],
    };
    setInspections(inspections.map(i => i.id === inspection.id ? updated : i));
    setSelectedInspection(updated);
  };

  const handleResample = (inspection: QualityInspection, reason: string) => {
    const updated = {
      ...inspection,
      status: 'Resample Required' as InspectionStatus,
      resampleReason: reason,
      auditTrail: [
        ...inspection.auditTrail,
        {
          action: 'Resample Required',
          performedBy: currentUser.name,
          performedAt: new Date().toISOString(),
          remarks: reason,
        },
      ],
    };
    setInspections(inspections.map(i => i.id === inspection.id ? updated : i));
    setSelectedInspection(updated);
  };

  const filteredInspections = getFilteredInspections();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Quality Inspection & Inventory</h1>
          <p className="text-slate-600 mt-1">Manage quality inspections and approvals</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setSelectedTab('pending')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'pending'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pending Inspections
          </button>
          <button
            onClick={() => setSelectedTab('my-org')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'my-org'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Organization
          </button>
          <button
            onClick={() => setSelectedTab('all')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Inspections
          </button>
        </nav>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Contract No, Party, Commodity..."
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
              onChange={(e) => setFilter({ ...filter, status: e.target.value as InspectionStatus || undefined })}
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Resample Required">Resample Required</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={filter.type || ''}
              onChange={(e) => setFilter({ ...filter, type: e.target.value as InspectionType || undefined })}
            >
              <option value="">All Types</option>
              <option value="Pre-Delivery">Pre-Delivery</option>
              <option value="Post-Delivery">Post-Delivery</option>
              <option value="Quality Check">Quality Check</option>
              <option value="Final Inspection">Final Inspection</option>
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

      {/* Inspections List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredInspections.map((inspection) => (
          <Card key={inspection.id}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-slate-800">{inspection.contractNo}</h3>
                  {getStatusBadge(inspection.status)}
                  <Badge variant="info">{inspection.inspectionType}</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Party:</span>
                    <span className="ml-2 font-medium">{inspection.partyName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Commodity:</span>
                    <span className="ml-2 font-medium">{inspection.commodity} - {inspection.variety}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Quantity:</span>
                    <span className="ml-2 font-medium">{inspection.quantity} {inspection.unit}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <span className="ml-2">{new Date(inspection.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                {inspection.inspectorName && (
                  <div className="mt-2 text-sm">
                    <span className="text-gray-500">Inspector:</span>
                    <span className="ml-2 font-medium">{inspection.inspectorName}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedInspection(inspection)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                >
                  <Eye size={16} />
                  View Details
                </button>
              </div>
            </div>
          </Card>
        ))}

        {filteredInspections.length === 0 && (
          <Card>
            <div className="text-center py-8 text-gray-500">
              No inspections found matching your criteria
            </div>
          </Card>
        )}
      </div>

      {/* Detail Modal */}
      {selectedInspection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">{selectedInspection.contractNo} - Quality Inspection</h2>
                <p className="text-sm text-gray-600 mt-1">{selectedInspection.partyName}</p>
              </div>
              <button
                onClick={() => setSelectedInspection(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Status:</span>
                {getStatusBadge(selectedInspection.status)}
                <Badge variant="info">{selectedInspection.inspectionType}</Badge>
              </div>

              {/* Quality Parameters */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Quality Parameters</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parameter</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actual</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tolerance</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedInspection.qualityParams.map((param, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{param.parameter}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{param.expectedValue}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{param.actualValue || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{param.tolerance || '-'}</td>
                          <td className="px-4 py-3 text-sm">
                            {param.status ? (
                              <Badge variant={param.status === 'Pass' ? 'success' : param.status === 'Fail' ? 'error' : 'warning'}>
                                {param.status}
                              </Badge>
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Documents</h3>
                {selectedInspection.documents.length > 0 ? (
                  <div className="space-y-2">
                    {selectedInspection.documents.map((doc) => (
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

              {/* Audit Trail */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Audit Trail</h3>
                <div className="space-y-2">
                  {selectedInspection.auditTrail.map((entry, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                      <Clock size={16} className="text-gray-500 mt-1" />
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
              {selectedInspection.status === 'Pending' && (
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleApprove(selectedInspection)}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                  >
                    <CheckCircle size={16} />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(selectedInspection, 'Quality parameters not met')}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
                  >
                    <AlertCircle size={16} />
                    Reject
                  </button>
                  <button
                    onClick={() => handleResample(selectedInspection, 'Resampling required for verification')}
                    className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 flex items-center gap-2"
                  >
                    <Upload size={16} />
                    Request Resample
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QualityInspectionPage;
