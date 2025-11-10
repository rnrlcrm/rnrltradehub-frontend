import React from 'react';
import { Escalation } from '../../lib/smartContract';
import Card from './Card';
import { Button } from './Form';

interface EscalationManagerProps {
  escalations: Escalation[];
  currentUserRole: string;
  onResolve?: (escalationId: string, resolution: string) => void;
  onClose?: (escalationId: string) => void;
}

const SeverityBadge: React.FC<{ severity: Escalation['severity'] }> = ({ severity }) => {
  const baseClasses = 'px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full';
  const severityClasses = {
    CRITICAL: 'bg-red-100 text-red-800',
    HIGH: 'bg-orange-100 text-orange-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    LOW: 'bg-blue-100 text-blue-800',
  };
  return <span className={`${baseClasses} ${severityClasses[severity]}`}>{severity}</span>;
};

const StatusBadge: React.FC<{ status: Escalation['status'] }> = ({ status }) => {
  const baseClasses = 'px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full';
  const statusClasses = {
    OPEN: 'bg-red-100 text-red-800',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    RESOLVED: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-100 text-gray-800',
  };
  return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>;
};

const TypeBadge: React.FC<{ type: Escalation['type'] }> = ({ type }) => {
  const baseClasses = 'px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full';
  const typeClasses = {
    EXCEPTION: 'bg-purple-100 text-purple-800',
    APPROVAL_REQUIRED: 'bg-blue-100 text-blue-800',
    MANUAL_REVIEW: 'bg-indigo-100 text-indigo-800',
  };
  
  const typeLabels = {
    EXCEPTION: 'Exception',
    APPROVAL_REQUIRED: 'Approval Required',
    MANUAL_REVIEW: 'Manual Review',
  };
  
  return <span className={`${baseClasses} ${typeClasses[type]}`}>{typeLabels[type]}</span>;
};

const EscalationManager: React.FC<EscalationManagerProps> = ({
  escalations,
  currentUserRole,
  onResolve,
  onClose,
}) => {
  const [selectedEscalation, setSelectedEscalation] = React.useState<string | null>(null);
  const [resolutionText, setResolutionText] = React.useState('');

  // Filter escalations by user role
  const myEscalations = escalations.filter(e => e.escalatedTo === currentUserRole);
  const openEscalations = myEscalations.filter(e => e.status === 'OPEN' || e.status === 'IN_PROGRESS');
  const resolvedEscalations = myEscalations.filter(e => e.status === 'RESOLVED' || e.status === 'CLOSED');

  const criticalCount = openEscalations.filter(e => e.severity === 'CRITICAL').length;
  const highCount = openEscalations.filter(e => e.severity === 'HIGH').length;

  const handleResolveClick = (escalationId: string) => {
    setSelectedEscalation(escalationId);
    setResolutionText('');
  };

  const handleSubmitResolution = () => {
    if (selectedEscalation && resolutionText.trim() && onResolve) {
      onResolve(selectedEscalation, resolutionText);
      setSelectedEscalation(null);
      setResolutionText('');
    }
  };

  return (
    <Card title="Escalation Management">
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-md">
          <div>
            <p className="text-xs text-slate-600 uppercase">Total Open</p>
            <p className="text-2xl font-bold text-slate-800">{openEscalations.length}</p>
          </div>
          <div>
            <p className="text-xs text-red-600 uppercase">Critical</p>
            <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
          </div>
          <div>
            <p className="text-xs text-orange-600 uppercase">High Priority</p>
            <p className="text-2xl font-bold text-orange-600">{highCount}</p>
          </div>
          <div>
            <p className="text-xs text-green-600 uppercase">Resolved</p>
            <p className="text-2xl font-bold text-green-600">{resolvedEscalations.length}</p>
          </div>
        </div>

        {/* No Escalations Message */}
        {myEscalations.length === 0 && (
          <div className="text-center py-8 text-slate-600">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-lg font-medium">No escalations assigned to you</p>
            <p className="text-sm mt-1">All clear! There are no items requiring your attention.</p>
          </div>
        )}

        {/* Open Escalations */}
        {openEscalations.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Open Escalations</h4>
            <div className="space-y-3">
              {openEscalations.map(escalation => (
                <div 
                  key={escalation.id}
                  className={`border-l-4 p-4 rounded-r-md ${
                    escalation.severity === 'CRITICAL' ? 'border-red-500 bg-red-50' :
                    escalation.severity === 'HIGH' ? 'border-orange-500 bg-orange-50' :
                    escalation.severity === 'MEDIUM' ? 'border-yellow-500 bg-yellow-50' :
                    'border-blue-500 bg-blue-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <TypeBadge type={escalation.type} />
                        <SeverityBadge severity={escalation.severity} />
                        <StatusBadge status={escalation.status} />
                      </div>
                      <p className="text-sm font-medium text-slate-800 mb-1">
                        Contract: <span className="font-semibold">{escalation.contractId}</span>
                      </p>
                      <p className="text-sm text-slate-700 mb-2">{escalation.description}</p>
                      <p className="text-xs text-slate-500">
                        Escalated: {new Date(escalation.escalatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Resolution Form */}
                  {selectedEscalation === escalation.id ? (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Resolution Notes
                      </label>
                      <textarea
                        value={resolutionText}
                        onChange={(e) => setResolutionText(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Describe how this escalation was resolved..."
                      />
                      <div className="flex justify-end space-x-2 mt-2">
                        <Button
                          variant="secondary"
                          className="!px-3 !py-1 !text-sm"
                          onClick={() => setSelectedEscalation(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          className="!px-3 !py-1 !text-sm"
                          onClick={handleSubmitResolution}
                          disabled={!resolutionText.trim()}
                        >
                          Submit Resolution
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex space-x-2 mt-3">
                      {onResolve && (
                        <Button
                          variant="primary"
                          className="!px-3 !py-1 !text-sm"
                          onClick={() => handleResolveClick(escalation.id)}
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resolved Escalations */}
        {resolvedEscalations.length > 0 && (
          <details className="border border-slate-200 rounded-md">
            <summary className="px-4 py-2 bg-slate-50 cursor-pointer hover:bg-slate-100 font-medium text-sm text-slate-700">
              View Resolved ({resolvedEscalations.length})
            </summary>
            <div className="p-4 space-y-3">
              {resolvedEscalations.map(escalation => (
                <div 
                  key={escalation.id}
                  className="border border-slate-200 p-3 rounded-md bg-white"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <TypeBadge type={escalation.type} />
                        <SeverityBadge severity={escalation.severity} />
                        <StatusBadge status={escalation.status} />
                      </div>
                      <p className="text-sm font-medium text-slate-800 mb-1">
                        Contract: <span className="font-semibold">{escalation.contractId}</span>
                      </p>
                      <p className="text-sm text-slate-700 mb-2">{escalation.description}</p>
                      {escalation.resolution && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-xs font-medium text-green-800 mb-1">Resolution:</p>
                          <p className="text-sm text-green-900">{escalation.resolution}</p>
                        </div>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                        <span>Escalated: {new Date(escalation.escalatedAt).toLocaleString()}</span>
                        {escalation.resolvedAt && (
                          <>
                            <span>•</span>
                            <span>Resolved: {new Date(escalation.resolvedAt).toLocaleString()}</span>
                          </>
                        )}
                        {escalation.resolvedBy && (
                          <>
                            <span>•</span>
                            <span>By: {escalation.resolvedBy}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {escalation.status === 'RESOLVED' && onClose && (
                    <div className="mt-2">
                      <Button
                        variant="secondary"
                        className="!px-3 !py-1 !text-xs"
                        onClick={() => onClose(escalation.id)}
                      >
                        Close Escalation
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </Card>
  );
};

export default EscalationManager;
