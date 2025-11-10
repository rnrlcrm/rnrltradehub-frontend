/**
 * useSmartDefaults Hook
 * React hook for smart defaults functionality
 * 
 * Usage:
 * const { getDefaultsForClient, applyDefaults, suggestion } = useSmartDefaults();
 */

import { useState, useEffect } from 'react';
import * as smartDefaultsUtils from '../utils/smartDefaults';

export function useSmartDefaults(clientId?: string) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [shouldSuggest, setShouldSuggest] = useState(false);

  useEffect(() => {
    if (clientId) {
      const suggest = smartDefaultsUtils.shouldSuggestDefaults(clientId);
      setShouldSuggest(suggest);
      
      if (suggest) {
        const message = smartDefaultsUtils.getSuggestionMessage(clientId);
        setSuggestion(message);
      } else {
        setSuggestion(null);
      }
    }
  }, [clientId]);

  const getDefaultsForClient = (clientId: string) => {
    return smartDefaultsUtils.getLastContractForClient(clientId);
  };

  const applyDefaults = (clientId: string, currentFormData: any = {}) => {
    return smartDefaultsUtils.applySmartDefaults(clientId, currentFormData);
  };

  const getPreferredTerms = (clientId: string) => {
    return smartDefaultsUtils.getPreferredTerms(clientId);
  };

  const getClientStats = (clientId: string) => {
    return smartDefaultsUtils.getClientStats(clientId);
  };

  return {
    suggestion,
    shouldSuggest,
    getDefaultsForClient,
    applyDefaults,
    getPreferredTerms,
    getClientStats,
  };
}

export default useSmartDefaults;
