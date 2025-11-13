/**
 * Business Rule Violations Component
 * 
 * Displays validation results from the Business Rule Engine
 * Shows errors (red), warnings (yellow), and info (blue) messages
 */

import React from 'react';

interface RuleViolation {
  rule: string;
  message: string;
  field?: string;
}

interface BusinessRuleViolationsProps {
  errors: RuleViolation[];
  warnings: RuleViolation[];
  info: RuleViolation[];
}

const BusinessRuleViolations: React.FC<BusinessRuleViolationsProps> = ({
  errors,
  warnings,
  info,
}) => {
  if (errors.length === 0 && warnings.length === 0 && info.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-4">
      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold text-red-900">
              Errors ({errors.length})
            </span>
          </div>
          <div className="space-y-2">
            {errors.map((error, i) => (
              <div key={i} className="flex items-start text-sm">
                <span className="text-red-600 mr-2">•</span>
                <div className="flex-1">
                  <div className="text-red-800">{error.message}</div>
                  {error.field && (
                    <div className="text-xs text-red-600 mt-0.5">Field: {error.field}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <svg className="w-5 h-5 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-semibold text-amber-900">
              Warnings ({warnings.length})
            </span>
          </div>
          <div className="space-y-2">
            {warnings.map((warning, i) => (
              <div key={i} className="flex items-start text-sm">
                <span className="text-amber-600 mr-2">•</span>
                <div className="flex-1">
                  <div className="text-amber-800">{warning.message}</div>
                  {warning.field && (
                    <div className="text-xs text-amber-600 mt-0.5">Field: {warning.field}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      {info.length > 0 && (
        <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold text-blue-900">
              Information ({info.length})
            </span>
          </div>
          <div className="space-y-2">
            {info.map((item, i) => (
              <div key={i} className="flex items-start text-sm">
                <span className="text-blue-600 mr-2">•</span>
                <div className="flex-1">
                  <div className="text-blue-800">{item.message}</div>
                  {item.field && (
                    <div className="text-xs text-blue-600 mt-0.5">Field: {item.field}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessRuleViolations;
