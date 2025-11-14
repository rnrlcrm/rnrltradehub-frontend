/**
 * useLocations Hook
 * 
 * Manages location master data with caching
 */

import { useState, useEffect } from 'react';
import { locationsApi } from '../api/settingsApi';
import { Location } from '../types';

export const useLocations = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await locationsApi.getAll();
      setLocations(response.data);
    } catch (err: any) {
      // If API fails, use empty array and allow manual entry
      console.error('Failed to load locations:', err);
      setError(err.message || 'Failed to load locations. Manual entry available.');
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshLocations = () => {
    loadLocations();
  };

  return {
    locations,
    loading,
    error,
    refreshLocations,
  };
};
