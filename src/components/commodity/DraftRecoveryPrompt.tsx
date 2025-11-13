/**
 * Draft Recovery Prompt Component
 * 
 * Prompts user to recover unsaved draft from localStorage
 * Shows draft age and provides recover/discard options
 */

import React from 'react';

interface DraftRecoveryPromptProps {
  onRecover: () => void;
  onDiscard: () => void;
  draftAge: number; // in minutes
}

const DraftRecoveryPrompt: React.FC<DraftRecoveryPromptProps> = ({
  onRecover,
  onDiscard,
  draftAge,
}) => {
  const formatDraftAge = (minutes: number): string => {
    if (minutes < 1) return 'less than a minute';
    if (minutes === 1) return '1 minute';
    if (minutes < 60) return `${minutes} minutes`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours === 1 && remainingMinutes === 0) return '1 hour';
    if (hours === 1) return `1 hour ${remainingMinutes} minutes`;
    if (remainingMinutes === 0) return `${hours} hours`;
    return `${hours} hours ${remainingMinutes} minutes`;
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex items-start">
        <svg className="w-6 h-6 mr-3 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
        
        <div className="flex-1">
          <h4 className="font-bold text-blue-900 text-lg mb-1">
            Unsaved Draft Found
          </h4>
          <p className="text-blue-800 text-sm mb-3">
            You have an unsaved draft from <span className="font-semibold">{formatDraftAge(draftAge)} ago</span>. 
            Would you like to recover it and continue where you left off?
          </p>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onRecover}
              className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Recover Draft
            </button>
            
            <button
              onClick={onDiscard}
              className="px-5 py-2.5 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Start Fresh
            </button>
          </div>
          
          <div className="mt-3 text-xs text-blue-700">
            <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Drafts are automatically saved every 2 seconds and expire after 24 hours
          </div>
        </div>
      </div>
    </div>
  );
};

export default DraftRecoveryPrompt;
