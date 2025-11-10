import React from 'react';
import { RuleEvaluationResult, RuleSeverity } from '../../lib/smartContract';
import Card from './Card';

interface SmartContractRuleDisplayProps {
  results: RuleEvaluationResult[];
  onRequestOverride?: (ruleId: string) => void;
}

const SeverityBadge: React.FC<{ severity: RuleSeverity }> = ({ severity }) => {
  const baseClasses = 'px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full';
  const severityClasses = {
    ERROR: 'bg-red-100 text-red-800',
    WARNING: 'bg-yellow-100 text-yellow-800',
    INFO: 'bg-blue-100 text-blue-800',
  };
  return <span className={`${baseClasses} ${severityClasses[severity]}`}>{severity}</span>;
};

const ActionBadge: React.FC<{ action: string; passed: boolean }> = ({ action, passed }) => {
  const baseClasses = 'px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full';
  
  if (passed) {
    return <span className={`${baseClasses} bg-green-100 text-green-800`}>✓ PASSED</span>;
  }
  
  const actionClasses = {
    BLOCK: 'bg-red-100 text-red-800',
    WARN: 'bg-yellow-100 text-yellow-800',
    ESCALATE: 'bg-orange-100 text-orange-800',
    AUTO_APPROVE: 'bg-green-100 text-green-800',
  };
  
  return <span className={`${baseClasses} ${actionClasses[action as keyof typeof actionClasses] || 'bg-gray-100 text-gray-800'}`}>{action}</span>;
};

const SmartContractRuleDisplay: React.FC<SmartContractRuleDisplayProps> = ({ results, onRequestOverride }) => {
  const failedRules = results.filter(r => !r.passed);
  const passedRules = results.filter(r => r.passed);
  const blockedRules = failedRules.filter(r => r.action === 'BLOCK');
  const warningRules = failedRules.filter(r => r.action === 'WARN');
  const escalationRules = failedRules.filter(r => r.action === 'ESCALATE');
  
  return (
    <Card title="Smart Contract Rule Evaluation">
      <div className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-md">
          <div>
            <p className="text-xs text-slate-600 uppercase">Total Rules</p>
            <p className="text-2xl font-bold text-slate-800">{results.length}</p>
          </div>
          <div>
            <p className="text-xs text-green-600 uppercase">Passed</p>
            <p className="text-2xl font-bold text-green-600">{passedRules.length}</p>
          </div>
          <div>
            <p className="text-xs text-red-600 uppercase">Failed</p>
            <p className="text-2xl font-bold text-red-600">{failedRules.length}</p>
          </div>
          <div>
            <p className="text-xs text-orange-600 uppercase">Escalations</p>
            <p className="text-2xl font-bold text-orange-600">{escalationRules.length}</p>
          </div>
        </div>

        {/* Blocked Rules (Highest Priority) */}
        {blockedRules.length > 0 && (
          <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-md">
            <h4 className="text-sm font-semibold text-red-800 mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              Blocking Issues - Contract Cannot Proceed
            </h4>
            <div className="space-y-2">
              {blockedRules.map(rule => (
                <div key={rule.ruleId} className="bg-white p-3 rounded-md border border-red-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-red-900">{rule.ruleName}</p>
                      <p className="text-sm text-red-700 mt-1">{rule.message}</p>
                    </div>
                    <div className="ml-4 flex flex-col items-end space-y-1">
                      <SeverityBadge severity={rule.severity} />
                      <ActionBadge action={rule.action} passed={rule.passed} />
                    </div>
                  </div>
                  {rule.requiresOverride && onRequestOverride && (
                    <button
                      onClick={() => onRequestOverride(rule.ruleId)}
                      className="mt-2 text-xs font-medium text-red-700 hover:text-red-900 underline"
                    >
                      Request Override
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Escalation Required */}
        {escalationRules.length > 0 && (
          <div className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-r-md">
            <h4 className="text-sm font-semibold text-orange-800 mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Requires Manual Approval
            </h4>
            <div className="space-y-2">
              {escalationRules.map(rule => (
                <div key={rule.ruleId} className="bg-white p-3 rounded-md border border-orange-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-orange-900">{rule.ruleName}</p>
                      <p className="text-sm text-orange-700 mt-1">{rule.message}</p>
                      {rule.escalateTo && (
                        <p className="text-xs text-orange-600 mt-1">
                          Escalate to: <span className="font-semibold">{rule.escalateTo}</span>
                        </p>
                      )}
                    </div>
                    <div className="ml-4 flex flex-col items-end space-y-1">
                      <SeverityBadge severity={rule.severity} />
                      <ActionBadge action={rule.action} passed={rule.passed} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {warningRules.length > 0 && (
          <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded-r-md">
            <h4 className="text-sm font-semibold text-yellow-800 mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Warnings - Review Recommended
            </h4>
            <div className="space-y-2">
              {warningRules.map(rule => (
                <div key={rule.ruleId} className="bg-white p-3 rounded-md border border-yellow-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-yellow-900">{rule.ruleName}</p>
                      <p className="text-sm text-yellow-700 mt-1">{rule.message}</p>
                    </div>
                    <div className="ml-4 flex flex-col items-end space-y-1">
                      <SeverityBadge severity={rule.severity} />
                      <ActionBadge action={rule.action} passed={rule.passed} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Rules Passed */}
        {failedRules.length === 0 && (
          <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-md">
            <h4 className="text-sm font-semibold text-green-800 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              All Business Rules Passed - Contract Ready to Proceed
            </h4>
          </div>
        )}

        {/* Detailed Rules List (Collapsed by default) */}
        <details className="border border-slate-200 rounded-md">
          <summary className="px-4 py-2 bg-slate-50 cursor-pointer hover:bg-slate-100 font-medium text-sm text-slate-700">
            View All Rules ({results.length})
          </summary>
          <div className="p-4 space-y-2">
            {results.map(rule => (
              <div key={rule.ruleId} className={`p-2 rounded-md border ${rule.passed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-700">{rule.ruleName}</span>
                  <ActionBadge action={rule.action} passed={rule.passed} />
                </div>
              </div>
            ))}
          </div>
        </details>
      </div>
    </Card>
  );
};

export default SmartContractRuleDisplay;
