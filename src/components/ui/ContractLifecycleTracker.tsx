import React from 'react';
import { LifecycleEvent, ContractLifecycleState } from '../../lib/smartContract';
import Card from './Card';

interface ContractLifecycleTrackerProps {
  contractNo: string;
  currentState: ContractLifecycleState;
  events: LifecycleEvent[];
}

const StateIcon: React.FC<{ state: ContractLifecycleState }> = ({ state }) => {
  const icons: Record<ContractLifecycleState, JSX.Element> = {
    DRAFT: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
      </svg>
    ),
    PENDING_VALIDATION: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
    ),
    VALIDATION_FAILED: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
    PENDING_APPROVAL: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
    APPROVED: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    ACTIVE: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    PENDING_EXECUTION: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
    ),
    IN_EXECUTION: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
      </svg>
    ),
    COMPLETED: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    DISPUTED: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    CANCELLED: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
      </svg>
    ),
    AMENDED: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
      </svg>
    ),
  };
  
  return icons[state] || icons.DRAFT;
};

const getStateColor = (state: ContractLifecycleState): string => {
  const colors: Record<ContractLifecycleState, string> = {
    DRAFT: 'text-gray-600 bg-gray-100',
    PENDING_VALIDATION: 'text-blue-600 bg-blue-100',
    VALIDATION_FAILED: 'text-red-600 bg-red-100',
    PENDING_APPROVAL: 'text-yellow-600 bg-yellow-100',
    APPROVED: 'text-green-600 bg-green-100',
    ACTIVE: 'text-green-600 bg-green-100',
    PENDING_EXECUTION: 'text-blue-600 bg-blue-100',
    IN_EXECUTION: 'text-indigo-600 bg-indigo-100',
    COMPLETED: 'text-purple-600 bg-purple-100',
    DISPUTED: 'text-orange-600 bg-orange-100',
    CANCELLED: 'text-gray-600 bg-gray-100',
    AMENDED: 'text-teal-600 bg-teal-100',
  };
  return colors[state] || 'text-gray-600 bg-gray-100';
};

const formatStateName = (state: ContractLifecycleState): string => {
  return state.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const ContractLifecycleTracker: React.FC<ContractLifecycleTrackerProps> = ({
  contractNo,
  currentState,
  events,
}) => {
  const sortedEvents = [...events].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <Card title={`Contract Lifecycle: ${contractNo}`}>
      <div className="space-y-6">
        {/* Current State Display */}
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600 uppercase tracking-wide mb-1">Current Status</p>
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-md ${getStateColor(currentState)}`}>
                  <StateIcon state={currentState} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">{formatStateName(currentState)}</h3>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-600 uppercase tracking-wide mb-1">Total Events</p>
              <p className="text-2xl font-bold text-slate-800">{events.length}</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-4">Event Timeline</h4>
          <div className="space-y-4">
            {sortedEvents.map((event, index) => (
              <div key={event.id} className="relative pl-8 pb-4">
                {/* Timeline Line */}
                {index < sortedEvents.length - 1 && (
                  <div className="absolute left-2 top-8 bottom-0 w-0.5 bg-slate-200"></div>
                )}
                
                {/* Event Marker */}
                <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-white ${
                  event.automated ? 'bg-blue-500' : 'bg-green-500'
                }`}></div>
                
                {/* Event Content */}
                <div className={`bg-white border ${event.overridden ? 'border-orange-300' : 'border-slate-200'} rounded-md p-3 shadow-sm`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {event.fromState && (
                          <>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${getStateColor(event.fromState)}`}>
                              {formatStateName(event.fromState)}
                            </span>
                            <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </>
                        )}
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getStateColor(event.toState)}`}>
                          {formatStateName(event.toState)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-800">{event.reason}</p>
                      <div className="flex items-center space-x-3 mt-2 text-xs text-slate-500">
                        <span className="flex items-center">
                          {event.triggeredBy === 'SYSTEM' ? (
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                          )}
                          {event.actor}
                        </span>
                        <span>•</span>
                        <span>{new Date(event.timestamp).toLocaleString()}</span>
                        {event.automated && (
                          <>
                            <span>•</span>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              Automated
                            </span>
                          </>
                        )}
                        {event.overridden && (
                          <>
                            <span>•</span>
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                              Manual Override
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="border-t border-slate-200 pt-4">
          <p className="text-xs text-slate-600 uppercase tracking-wide mb-2">Legend</p>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
              <span className="text-slate-600">System Automated</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span className="text-slate-600">User Action</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full border-2 border-orange-300 bg-white mr-2"></div>
              <span className="text-slate-600">Manual Override</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ContractLifecycleTracker;
