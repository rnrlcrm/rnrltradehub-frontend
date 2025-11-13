/**
 * GST Information Panel Component
 * 
 * Displays auto-determined GST information for a commodity
 * Shows HSN code, GST rate, exemption status, and compliance notes
 */

import React from 'react';
import { autoDetectGST } from '../../services/gstDeterminationEngine';

interface GSTInfoPanelProps {
  commodityName: string;
  isProcessed: boolean;
}

const GSTInfoPanel: React.FC<GSTInfoPanelProps> = ({ commodityName, isProcessed }) => {
  if (!commodityName || commodityName.trim().length === 0) {
    return null;
  }

  const gstInfo = autoDetectGST(commodityName, isProcessed);

  const confidenceColor = {
    high: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-gray-100 text-gray-800',
  }[gstInfo.confidence];

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-blue-900 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          GST Information (Auto-Determined as per GST Act)
        </h4>
        <span className={`px-2 py-1 rounded text-xs font-medium ${confidenceColor}`}>
          {gstInfo.confidence} confidence
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
        <div>
          <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">HSN Code</label>
          <div className="font-mono text-2xl font-bold text-blue-900 mt-1">{gstInfo.hsnCode}</div>
          <div className="text-xs text-gray-600 mt-1">{gstInfo.description}</div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">GST Rate</label>
          <div className="text-3xl font-bold text-blue-900 mt-1">
            {gstInfo.gstRate}%
            {gstInfo.gstRate === 0 && (
              <span className="text-sm ml-2 text-green-600 font-normal">Exempt</span>
            )}
          </div>
          <div className="text-xs text-gray-600 mt-1">{gstInfo.category} Product</div>
        </div>
      </div>

      {gstInfo.exemptionAvailable && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm mb-2">
          <div className="flex items-start">
            <svg className="w-5 h-5 mr-2 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <div className="font-semibold text-amber-900">GST Exemption May Be Available</div>
              {gstInfo.exemptionConditions && gstInfo.exemptionConditions.length > 0 && (
                <div className="text-amber-800 mt-1">
                  <div className="font-medium text-xs mb-1">Conditions:</div>
                  <ul className="list-disc list-inside text-xs space-y-0.5">
                    {gstInfo.exemptionConditions.map((condition, i) => (
                      <li key={i}>{condition}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {gstInfo.suggestions && gstInfo.suggestions.length > 0 && (
        <div className="bg-blue-100 border border-blue-200 rounded-md p-2 text-xs text-blue-800">
          <div className="font-semibold mb-1">Note:</div>
          {gstInfo.suggestions.map((suggestion, i) => (
            <div key={i} className="flex items-start">
              <span className="mr-1">•</span>
              <span>{suggestion}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-blue-200">
        <div className="text-xs text-gray-600">
          <span className="font-semibold">Compliance Note:</span> GST rate is auto-determined based on HSN code as per GST Act. 
          No manual selection required.
        </div>
      </div>
    </div>
  );
};

export default GSTInfoPanel;
