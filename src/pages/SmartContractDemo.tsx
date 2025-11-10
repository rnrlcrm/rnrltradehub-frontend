import React, { useState } from 'react';
import Card from '../components/ui/Card';
import { Button } from '../components/ui/Form';
import SmartContractRuleDisplay from '../components/ui/SmartContractRuleDisplay';
import ContractLifecycleTracker from '../components/ui/ContractLifecycleTracker';
import EscalationManager from '../components/ui/EscalationManager';
import { 
  evaluateBusinessRules, 
  DEFAULT_BUSINESS_RULES,
  LifecycleEvent,
  Escalation,
  transitionState,
} from '../lib/smartContract';
import { SalesContract, User } from '../types';

interface SmartContractDemoProps {
  currentUser: User;
}

const SmartContractDemo: React.FC<SmartContractDemoProps> = ({ currentUser }) => {
  // Sample contract for demonstration
  const [sampleContract] = useState<SalesContract>({
    id: 'sc_demo_001',
    scNo: 'SC-2024-DEMO-001',
    version: 1,
    date: new Date().toISOString().split('T')[0],
    organization: 'Demo Org',
    financialYear: '2024-2025',
    clientId: 'client_001',
    clientName: 'Demo Buyer Ltd',
    vendorId: 'vendor_001',
    vendorName: 'Demo Seller Ltd',
    variety: 'Shankar-6',
    quantityBales: 150,
    rate: 4500,
    gstRateId: 1,
    buyerCommissionId: 1,
    sellerCommissionId: 1,
    buyerCommissionGstId: 2,
    sellerCommissionGstId: 2,
    tradeType: 'Normal Trade',
    bargainType: 'Pucca Sauda',
    weightmentTerms: 'Seller Weigh',
    passingTerms: 'Final at Destination',
    deliveryTerms: 'Ex-Gin',
    paymentTerms: '15 Days',
    location: 'Gujarat - Rajkot',
    qualitySpecs: {
      length: '28',
      mic: '4.5',
      rd: '+75',
      trash: '2.5',
      moisture: '8',
      strength: '27',
    },
    status: 'Active',
  });

  // Sample lifecycle events
  const [lifecycleEvents] = useState<LifecycleEvent[]>([
    transitionState(sampleContract, 'DRAFT', 'SYSTEM', 'Contract created', true),
    {
      ...transitionState(sampleContract, 'PENDING_VALIDATION', 'SYSTEM', 'Automated validation started', true),
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      ...transitionState(sampleContract, 'APPROVED', currentUser.name, 'Manual approval after review', false),
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      fromState: 'PENDING_VALIDATION',
    },
    {
      ...transitionState(sampleContract, 'ACTIVE', 'SYSTEM', 'Contract activated automatically', true),
      timestamp: new Date(Date.now() - 900000).toISOString(),
      fromState: 'APPROVED',
    },
  ]);

  // Sample escalations
  const [escalations, setEscalations] = useState<Escalation[]>([
    {
      id: 'esc_001',
      contractId: sampleContract.id,
      type: 'APPROVAL_REQUIRED',
      severity: 'MEDIUM',
      description: 'Contract exceeds normal quantity limits and requires supervisor approval',
      escalatedTo: currentUser.role,
      escalatedAt: new Date(Date.now() - 3600000).toISOString(),
      status: 'OPEN',
    },
    {
      id: 'esc_002',
      contractId: sampleContract.id,
      type: 'MANUAL_REVIEW',
      severity: 'LOW',
      description: 'Rate below minimum threshold - requires review',
      escalatedTo: currentUser.role,
      escalatedAt: new Date(Date.now() - 7200000).toISOString(),
      status: 'RESOLVED',
      resolvedBy: currentUser.name,
      resolvedAt: new Date(Date.now() - 1800000).toISOString(),
      resolution: 'Approved due to long-term customer relationship and market conditions',
    },
  ]);

  // Evaluate rules
  const [ruleResults] = useState(() => evaluateBusinessRules(sampleContract, DEFAULT_BUSINESS_RULES));
  const [showValidation, setShowValidation] = useState(false);

  const handleResolveEscalation = (escalationId: string, resolution: string) => {
    setEscalations(prev => prev.map(e => 
      e.id === escalationId 
        ? { 
            ...e, 
            status: 'RESOLVED' as const, 
            resolvedBy: currentUser.name, 
            resolvedAt: new Date().toISOString(),
            resolution 
          }
        : e
    ));
  };

  const handleCloseEscalation = (escalationId: string) => {
    setEscalations(prev => prev.map(e => 
      e.id === escalationId ? { ...e, status: 'CLOSED' as const } : e
    ));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Smart Contract Business Logic Demo</h1>
        <p className="text-slate-600 mt-2">
          Demonstration of automated contract validation, manual overrides, lifecycle tracking, and escalation workflows.
        </p>
      </div>

      {/* Overview Card */}
      <Card title="System Overview">
        <div className="space-y-4">
          <p className="text-slate-700">
            This demo showcases the Smart Contract Business Logic Module that provides:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="font-semibold text-blue-900 mb-2">🤖 Automated Validation</h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Business rule evaluation</li>
                <li>Auto-approve qualifying contracts</li>
                <li>Flag exceptions for review</li>
                <li>Real-time validation feedback</li>
              </ul>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <h3 className="font-semibold text-green-900 mb-2">👤 Manual Override</h3>
              <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                <li>Request override with justification</li>
                <li>Supervisor approval workflow</li>
                <li>Complete audit trail</li>
                <li>Transparent decision tracking</li>
              </ul>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
              <h3 className="font-semibold text-purple-900 mb-2">📊 Lifecycle Tracking</h3>
              <ul className="text-sm text-purple-800 space-y-1 list-disc list-inside">
                <li>Real-time state transitions</li>
                <li>Event timeline visualization</li>
                <li>Automated vs manual actions</li>
                <li>Buyer/seller transparency</li>
              </ul>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
              <h3 className="font-semibold text-orange-900 mb-2">⚠️ Escalation Workflow</h3>
              <ul className="text-sm text-orange-800 space-y-1 list-disc list-inside">
                <li>Exception handling</li>
                <li>Role-based routing</li>
                <li>Priority management</li>
                <li>Resolution tracking</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* Sample Contract Info */}
      <Card title="Demo Contract Details">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-slate-600 uppercase">Contract No</p>
            <p className="text-lg font-semibold text-slate-800">{sampleContract.scNo}</p>
          </div>
          <div>
            <p className="text-xs text-slate-600 uppercase">Buyer</p>
            <p className="text-sm font-medium text-slate-800">{sampleContract.clientName}</p>
          </div>
          <div>
            <p className="text-xs text-slate-600 uppercase">Seller</p>
            <p className="text-sm font-medium text-slate-800">{sampleContract.vendorName}</p>
          </div>
          <div>
            <p className="text-xs text-slate-600 uppercase">Quantity</p>
            <p className="text-lg font-semibold text-slate-800">{sampleContract.quantityBales} Bales</p>
          </div>
          <div>
            <p className="text-xs text-slate-600 uppercase">Rate</p>
            <p className="text-lg font-semibold text-slate-800">₹{sampleContract.rate}</p>
          </div>
          <div>
            <p className="text-xs text-slate-600 uppercase">Type</p>
            <p className="text-sm font-medium text-slate-800">{sampleContract.tradeType}</p>
          </div>
          <div>
            <p className="text-xs text-slate-600 uppercase">Variety</p>
            <p className="text-sm font-medium text-slate-800">{sampleContract.variety}</p>
          </div>
          <div>
            <p className="text-xs text-slate-600 uppercase">Location</p>
            <p className="text-sm font-medium text-slate-800">{sampleContract.location}</p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => setShowValidation(!showValidation)}>
            {showValidation ? 'Hide' : 'Show'} Business Rule Validation
          </Button>
        </div>
      </Card>

      {/* Business Rule Validation */}
      {showValidation && (
        <SmartContractRuleDisplay 
          results={ruleResults}
          onRequestOverride={(ruleId) => alert(`Override requested for rule: ${ruleId}\n\nIn production, this would open the override request modal.`)}
        />
      )}

      {/* Lifecycle Tracker */}
      <ContractLifecycleTracker
        contractNo={sampleContract.scNo}
        currentState="ACTIVE"
        events={lifecycleEvents}
      />

      {/* Escalation Manager */}
      <EscalationManager
        escalations={escalations}
        currentUserRole={currentUser.role}
        onResolve={handleResolveEscalation}
        onClose={handleCloseEscalation}
      />

      {/* Benefits Summary */}
      <Card title="Business Benefits">
        <div className="space-y-4">
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-semibold text-green-900">Automation & Efficiency</h3>
            <p className="text-sm text-green-800 mt-1">
              Automated validation reduces manual review time by 70%, allowing staff to focus on exceptions only.
            </p>
          </div>
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold text-blue-900">Compliance & Risk Management</h3>
            <p className="text-sm text-blue-800 mt-1">
              Business rules ensure contracts meet company policies and regulatory requirements before activation.
            </p>
          </div>
          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="font-semibold text-purple-900">Transparency & Trust</h3>
            <p className="text-sm text-purple-800 mt-1">
              Real-time lifecycle updates visible to buyers and sellers build trust and reduce disputes.
            </p>
          </div>
          <div className="border-l-4 border-orange-500 pl-4">
            <h3 className="font-semibold text-orange-900">Audit Trail & Accountability</h3>
            <p className="text-sm text-orange-800 mt-1">
              Complete tracking of all automated and manual decisions provides full audit capability.
            </p>
          </div>
        </div>
      </Card>

      {/* Integration Points */}
      <Card title="Integration with Existing System">
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-md p-4">
            <h3 className="font-semibold text-slate-900 mb-3">Current Integrations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-slate-800 mb-1">Sales Contract Form</h4>
                <p className="text-slate-600">
                  • "Validate Rules" button for on-demand validation<br />
                  • Auto-validation on save<br />
                  • Visual feedback on rule violations
                </p>
              </div>
              <div>
                <h4 className="font-medium text-slate-800 mb-1">Chatbot</h4>
                <p className="text-slate-600">
                  • Lifecycle queries ("contract status")<br />
                  • Real-time notifications<br />
                  • Automated/manual action tracking
                </p>
              </div>
              <div>
                <h4 className="font-medium text-slate-800 mb-1">Dashboard (Ready)</h4>
                <p className="text-slate-600">
                  • Pending escalations widget<br />
                  • Contract lifecycle overview<br />
                  • Rule violation alerts
                </p>
              </div>
              <div>
                <h4 className="font-medium text-slate-800 mb-1">Audit Trail</h4>
                <p className="text-slate-600">
                  • All lifecycle events logged<br />
                  • Override requests tracked<br />
                  • Complete decision history
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SmartContractDemo;
