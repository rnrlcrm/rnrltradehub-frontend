import React from 'react';
import { TradeCycleStatus } from '../../lib/smartContract';
import Card from './Card';

interface CompleteTradeCycleTrackerProps {
  tradeCycleStatus: TradeCycleStatus;
}

const ProgressBar: React.FC<{ percentage: number; color?: string }> = ({ percentage, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600',
  };

  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div
        className={`${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue} h-2.5 rounded-full transition-all duration-500`}
        style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
      ></div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('complete') || lowerStatus.includes('passed') || lowerStatus.includes('reconciled')) {
      return 'bg-green-100 text-green-800';
    }
    if (lowerStatus.includes('pending') || lowerStatus.includes('awaiting')) {
      return 'bg-yellow-100 text-yellow-800';
    }
    if (lowerStatus.includes('failed') || lowerStatus.includes('dispute')) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
      {status}
    </span>
  );
};

const CompleteTradeCycleTracker: React.FC<CompleteTradeCycleTrackerProps> = ({ tradeCycleStatus }) => {
  const deliveryPercentage = tradeCycleStatus.deliveryComplete ? 100 : 
    (tradeCycleStatus.totalDelivered / (tradeCycleStatus.deliveryOrders.reduce((sum, d) => sum + d.quantity, 0) || 1)) * 100;
  
  const paymentPercentage = tradeCycleStatus.paymentComplete ? 100 :
    tradeCycleStatus.totalInvoiced > 0 ? (tradeCycleStatus.totalPaid / tradeCycleStatus.totalInvoiced) * 100 : 0;

  return (
    <Card title={`Complete Trade Cycle: ${tradeCycleStatus.contractNo}`}>
      <div className="space-y-6">
        {/* Header with Trade Type */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 uppercase tracking-wide mb-1">Trade Type</p>
              <h3 className="text-xl font-bold text-blue-900">{tradeCycleStatus.tradeType}</h3>
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-600 uppercase tracking-wide mb-1">Current Status</p>
              <StatusBadge status={tradeCycleStatus.currentState.replace(/_/g, ' ')} />
            </div>
          </div>
        </div>

        {/* Workflow Progress */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Trade Cycle Workflow</h4>
          <div className="space-y-4">
            {/* Contract Phase */}
            <div className="border-l-4 border-green-500 pl-4 py-2 bg-green-50 rounded-r">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-900">✓ Contract Created & Approved</p>
                  <p className="text-xs text-green-700">Contract is active and ready for execution</p>
                </div>
                <span className="text-2xl">✅</span>
              </div>
            </div>

            {/* Quality Passing Phase (CCI Trade) */}
            {tradeCycleStatus.qualityCheckRequired && (
              <div className={`border-l-4 ${tradeCycleStatus.qualityCheckPassed ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'} pl-4 py-2 rounded-r`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-medium ${tradeCycleStatus.qualityCheckPassed ? 'text-green-900' : 'text-yellow-900'}`}>
                      {tradeCycleStatus.qualityCheckPassed ? '✓ Quality Check Passed' : '⏳ Quality Check Required'}
                    </p>
                    <p className={`text-xs ${tradeCycleStatus.qualityCheckPassed ? 'text-green-700' : 'text-yellow-700'}`}>
                      {tradeCycleStatus.qualityCheckPassed 
                        ? `Passed on ${tradeCycleStatus.qualityCheckDate || 'N/A'}`
                        : 'Awaiting quality inspection (Required for CCI Trade)'}
                    </p>
                  </div>
                  <span className="text-2xl">{tradeCycleStatus.qualityCheckPassed ? '✅' : '⏳'}</span>
                </div>
              </div>
            )}

            {/* Delivery Phase */}
            <div className={`border-l-4 ${tradeCycleStatus.deliveryComplete ? 'border-green-500 bg-green-50' : 'border-blue-500 bg-blue-50'} pl-4 py-2 rounded-r`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <p className={`font-medium ${tradeCycleStatus.deliveryComplete ? 'text-green-900' : 'text-blue-900'}`}>
                    {tradeCycleStatus.deliveryComplete ? '✓ Delivery Complete' : '📦 Delivery In Progress'}
                  </p>
                  <p className={`text-xs ${tradeCycleStatus.deliveryComplete ? 'text-green-700' : 'text-blue-700'} mb-2`}>
                    {tradeCycleStatus.totalDelivered} / {tradeCycleStatus.deliveryOrders.reduce((sum, d) => sum + d.quantity, 0)} bales delivered
                  </p>
                  <ProgressBar percentage={deliveryPercentage} color={tradeCycleStatus.deliveryComplete ? 'green' : 'blue'} />
                </div>
                <span className="text-2xl ml-4">{tradeCycleStatus.deliveryComplete ? '✅' : '📦'}</span>
              </div>
              {tradeCycleStatus.deliveryOrders.length > 0 && (
                <details className="mt-2">
                  <summary className="text-xs font-medium text-blue-700 cursor-pointer">
                    View Delivery Orders ({tradeCycleStatus.deliveryOrders.length})
                  </summary>
                  <div className="mt-2 space-y-1">
                    {tradeCycleStatus.deliveryOrders.map((dO, idx) => (
                      <div key={idx} className="text-xs bg-white p-2 rounded border border-blue-200">
                        <span className="font-medium">{dO.doNo}</span> - {dO.quantity} bales - {dO.date}
                        <StatusBadge status={dO.status} />
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>

            {/* Payment Phase */}
            <div className={`border-l-4 ${tradeCycleStatus.paymentComplete ? 'border-green-500 bg-green-50' : 'border-purple-500 bg-purple-50'} pl-4 py-2 rounded-r`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <p className={`font-medium ${tradeCycleStatus.paymentComplete ? 'text-green-900' : 'text-purple-900'}`}>
                    {tradeCycleStatus.paymentComplete ? '✓ Payment Complete' : '💰 Payment In Progress'}
                  </p>
                  <p className={`text-xs ${tradeCycleStatus.paymentComplete ? 'text-green-700' : 'text-purple-700'} mb-2`}>
                    ₹{tradeCycleStatus.totalPaid.toLocaleString()} / ₹{tradeCycleStatus.totalInvoiced.toLocaleString()} paid
                  </p>
                  <ProgressBar percentage={paymentPercentage} color={tradeCycleStatus.paymentComplete ? 'green' : 'yellow'} />
                </div>
                <span className="text-2xl ml-4">{tradeCycleStatus.paymentComplete ? '✅' : '💰'}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                {tradeCycleStatus.invoices.length > 0 && (
                  <details>
                    <summary className="text-xs font-medium text-purple-700 cursor-pointer">
                      Invoices ({tradeCycleStatus.invoices.length})
                    </summary>
                    <div className="mt-2 space-y-1">
                      {tradeCycleStatus.invoices.map((inv, idx) => (
                        <div key={idx} className="text-xs bg-white p-2 rounded border border-purple-200">
                          {inv.invoiceNo} - ₹{inv.amount.toLocaleString()}
                          <StatusBadge status={inv.status} />
                        </div>
                      ))}
                    </div>
                  </details>
                )}
                {tradeCycleStatus.payments.length > 0 && (
                  <details>
                    <summary className="text-xs font-medium text-purple-700 cursor-pointer">
                      Payments ({tradeCycleStatus.payments.length})
                    </summary>
                    <div className="mt-2 space-y-1">
                      {tradeCycleStatus.payments.map((pay, idx) => (
                        <div key={idx} className="text-xs bg-white p-2 rounded border border-purple-200">
                          {pay.paymentId} - ₹{pay.amount.toLocaleString()} - {pay.method}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>

            {/* Reconciliation Phase */}
            <div className={`border-l-4 ${tradeCycleStatus.reconciled ? 'border-green-500 bg-green-50' : 'border-slate-500 bg-slate-50'} pl-4 py-2 rounded-r`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium ${tradeCycleStatus.reconciled ? 'text-green-900' : 'text-slate-900'}`}>
                    {tradeCycleStatus.reconciled ? '✓ Accounts Reconciled' : '⏳ Reconciliation Pending'}
                  </p>
                  <p className={`text-xs ${tradeCycleStatus.reconciled ? 'text-green-700' : 'text-slate-700'}`}>
                    {tradeCycleStatus.reconciled 
                      ? `Completed on ${tradeCycleStatus.reconciliationDate || 'N/A'}`
                      : 'Awaiting final accounts reconciliation'}
                  </p>
                </div>
                <span className="text-2xl">{tradeCycleStatus.reconciled ? '✅' : '⏳'}</span>
              </div>
            </div>

            {/* Disputes (if any) */}
            {tradeCycleStatus.disputes.length > 0 && (
              <div className="border-l-4 border-orange-500 bg-orange-50 pl-4 py-2 rounded-r">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-orange-900">⚠️ Active Disputes</p>
                    <p className="text-xs text-orange-700 mb-2">
                      {tradeCycleStatus.disputes.filter(d => d.status === 'Open').length} open disputes
                    </p>
                    <details>
                      <summary className="text-xs font-medium text-orange-700 cursor-pointer">
                        View Disputes ({tradeCycleStatus.disputes.length})
                      </summary>
                      <div className="mt-2 space-y-1">
                        {tradeCycleStatus.disputes.map((dispute, idx) => (
                          <div key={idx} className="text-xs bg-white p-2 rounded border border-orange-200">
                            <div className="font-medium">{dispute.disputeId}</div>
                            <div className="text-slate-600">{dispute.reason}</div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-slate-500">{dispute.raisedDate}</span>
                              <StatusBadge status={dispute.status} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                  <span className="text-2xl ml-4">⚠️</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transparency Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h4 className="text-xs font-semibold text-blue-900">Complete Transparency</h4>
              <p className="text-xs text-blue-700 mt-1">
                All updates are visible in real-time to both buyer and seller. Automated reminders are sent via chat, email, and dashboard.
                Last updated: {new Date(tradeCycleStatus.lastUpdated).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CompleteTradeCycleTracker;
