/**
 * Location API
 * 
 * Provides location master data for cascading selections
 */

import { apiClient } from './client';
import { Location } from '../types';

export const locationApi = {
  /**
   * Get all locations from master data
   */
  async getAllLocations(): Promise<Location[]> {
    const response = await apiClient.get<Location[]>('/api/locations');
    return response.data;
  },

  /**
   * Get states for a country
   */
  async getStates(country: string = 'India'): Promise<string[]> {
    const response = await apiClient.get<string[]>(`/api/locations/states?country=${country}`);
    return response.data;
  },

  /**
   * Get regions for a state
   */
  async getRegions(state: string, country: string = 'India'): Promise<string[]> {
    const response = await apiClient.get<string[]>(
      `/api/locations/regions?country=${country}&state=${state}`
    );
    return response.data;
  },

  /**
   * Get cities for a state (and optionally region)
   */
  async getCities(state: string, region?: string, country: string = 'India'): Promise<string[]> {
    let url = `/api/locations/cities?country=${country}&state=${state}`;
    if (region) {
      url += `&region=${region}`;
    }
    const response = await apiClient.get<string[]>(url);
    return response.data;
  },

  /**
   * Add new location
   */
  async addLocation(location: Omit<Location, 'id'>): Promise<Location> {
    const response = await apiClient.post<Location>('/api/locations', location);
    return response.data;
  },

  /**
   * Bulk upload locations
   */
  async bulkUploadLocations(locations: Omit<Location, 'id'>[]): Promise<{ 
    success: number; 
    failed: number; 
    errors: string[] 
  }> {
    const response = await apiClient.post<{ 
      success: number; 
      failed: number; 
      errors: string[] 
    }>('/api/locations/bulk', { locations });
    return response.data;
  },

  /**
   * Delete location
   */
  async deleteLocation(id: number): Promise<void> {
    await apiClient.delete(`/api/locations/${id}`);
  },
};
