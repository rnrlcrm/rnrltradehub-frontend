/**
 * Settings API Service
 * 
 * Streamlined API client for Settings module with NO DUPLICATES
 * Only includes:
 * - Organizations
 * - Locations (with bulk upload support)
 * - CCI Terms (Cotton-specific)
 * - Commodities (with inline trading parameters)
 * 
 * REMOVED (now inline in commodities or backend-managed):
 * - Master Data API (Trade Types, Bargain Types, Varieties - now inline)
 * - GST Rates API (managed on backend)
 * - Commissions API (now inline in commodities)
 * - Structured Terms API (Delivery/Payment - now inline)
 */

import { apiClient, USE_MOCK_API, ApiResponse } from './client';
import {
  Organization,
  Location,
  CciTerm,
  Commodity,
  CommodityParameter,
} from '../types';

// Mock data imports (used when USE_MOCK_API is true)
import {
  mockOrganizationsDetailed,
  mockLocations,
  mockMasterData,
} from '../data/mockData';

// ============================================================================
// ORGANIZATIONS API
// ============================================================================

export const organizationsApi = {
  getAll: async (): Promise<ApiResponse<Organization[]>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        data: mockOrganizationsDetailed,
        success: true,
      };
    }
    return apiClient.get<Organization[]>('/settings/organizations');
  },

  getById: async (id: number): Promise<ApiResponse<Organization>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const org = mockOrganizationsDetailed.find(o => o.id === id);
      if (!org) {
        throw { message: 'Organization not found', code: '404' };
      }
      return { data: org, success: true };
    }
    return apiClient.get<Organization>(`/settings/organizations/${id}`);
  },

  create: async (data: Omit<Organization, 'id'>): Promise<ApiResponse<Organization>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 400));
      const newOrg: Organization = {
        ...data,
        id: Date.now(),
      };
      return { data: newOrg, success: true, message: 'Organization created successfully' };
    }
    return apiClient.post<Organization>('/settings/organizations', data);
  },

  update: async (id: number, data: Partial<Organization>): Promise<ApiResponse<Organization>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 400));
      const updated: Organization = {
        ...(mockOrganizationsDetailed.find(o => o.id === id) || {} as Organization),
        ...data,
        id,
      };
      return { data: updated, success: true, message: 'Organization updated successfully' };
    }
    return apiClient.put<Organization>(`/settings/organizations/${id}`, data);
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return { data: undefined as void, success: true, message: 'Organization deleted successfully' };
    }
    return apiClient.delete<void>(`/settings/organizations/${id}`);
  },
};

// ============================================================================
// LOCATIONS API (with Bulk Upload Support)
// ============================================================================

export const locationsApi = {
  getAll: async (): Promise<ApiResponse<Location[]>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        data: mockLocations,
        success: true,
      };
    }
    return apiClient.get<Location[]>('/settings/locations');
  },

  // Cascading location methods for hierarchical selection
  getStates: async (country: string = 'India'): Promise<ApiResponse<string[]>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const states = Array.from(new Set(mockLocations.filter(loc => loc.country === country).map(loc => loc.state))).sort();
      return { data: states, success: true };
    }
    return apiClient.get<string[]>(`/settings/locations/states?country=${country}`);
  },

  getRegions: async (state: string, country: string = 'India'): Promise<ApiResponse<string[]>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const regions = Array.from(
        new Set(
          mockLocations
            .filter(loc => loc.country === country && loc.state === state)
            .map(loc => loc.region)
            .filter(Boolean) as string[]
        )
      ).sort();
      return { data: regions, success: true };
    }
    return apiClient.get<string[]>(`/settings/locations/regions?country=${country}&state=${state}`);
  },

  getCities: async (state: string, region?: string, country: string = 'India'): Promise<ApiResponse<string[]>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 200));
      let filteredLocations = mockLocations.filter(loc => loc.country === country && loc.state === state);
      if (region) {
        filteredLocations = filteredLocations.filter(loc => loc.region === region);
      }
      const cities = Array.from(new Set(filteredLocations.map(loc => loc.city))).sort();
      return { data: cities, success: true };
    }
    let url = `/settings/locations/cities?country=${country}&state=${state}`;
    if (region) {
      url += `&region=${region}`;
    }
    return apiClient.get<string[]>(url);
  },

  create: async (data: Omit<Location, 'id'>): Promise<ApiResponse<Location>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const newLocation: Location = {
        ...data,
        id: Date.now(),
      };
      return { data: newLocation, success: true, message: 'Location created successfully' };
    }
    return apiClient.post<Location>('/settings/locations', data);
  },

  bulkCreate: async (locations: Omit<Location, 'id'>[]): Promise<ApiResponse<Location[]>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newLocations = locations.map((loc, index) => ({
        ...loc,
        id: Date.now() + index,
      }));
      return {
        data: newLocations,
        success: true,
        message: `${newLocations.length} locations created successfully`,
      };
    }
    return apiClient.post<Location[]>('/settings/locations/bulk', { locations });
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 200));
      return { data: undefined as void, success: true, message: 'Location deleted successfully' };
    }
    return apiClient.delete<void>(`/settings/locations/${id}`);
  },
};

// ============================================================================
// CCI TERMS API (Cotton-Specific Contract Terms)
// ============================================================================

export const cciTermsApi = {
  getAll: async (): Promise<ApiResponse<CciTerm[]>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        data: mockMasterData.cciTerms,
        success: true,
      };
    }
    return apiClient.get<CciTerm[]>('/settings/cci-terms');
  },

  getById: async (id: number): Promise<ApiResponse<CciTerm>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const term = mockMasterData.cciTerms.find(t => t.id === id);
      if (!term) {
        throw { message: 'CCI Term not found', code: '404' };
      }
      return { data: term, success: true };
    }
    return apiClient.get<CciTerm>(`/settings/cci-terms/${id}`);
  },

  create: async (data: Omit<CciTerm, 'id'>): Promise<ApiResponse<CciTerm>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 400));
      const newTerm: CciTerm = {
        ...data,
        id: Date.now(),
      };
      return { data: newTerm, success: true, message: 'CCI Term created successfully' };
    }
    return apiClient.post<CciTerm>('/settings/cci-terms', data);
  },

  update: async (id: number, data: Partial<CciTerm>): Promise<ApiResponse<CciTerm>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 400));
      const updated: CciTerm = {
        ...(mockMasterData.cciTerms.find(t => t.id === id) || {} as CciTerm),
        ...data,
        id,
      };
      return { data: updated, success: true, message: 'CCI Term updated successfully' };
    }
    return apiClient.put<CciTerm>(`/settings/cci-terms/${id}`, data);
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return { data: undefined as void, success: true, message: 'CCI Term deleted successfully' };
    }
    return apiClient.delete<void>(`/settings/cci-terms/${id}`);
  },
};

// ============================================================================
// COMMODITIES API (Core Module with Inline Trading Parameters)
// ============================================================================

export const commoditiesApi = {
  getAll: async (): Promise<ApiResponse<Commodity[]>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 400));
      return {
        data: mockMasterData.commodities,
        success: true,
      };
    }
    return apiClient.get<Commodity[]>('/commodities');
  },

  getById: async (id: number): Promise<ApiResponse<Commodity>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const commodity = mockMasterData.commodities.find(c => c.id === id);
      if (!commodity) {
        throw { message: 'Commodity not found', code: '404' };
      }
      return { data: commodity, success: true };
    }
    return apiClient.get<Commodity>(`/commodities/${id}`);
  },

  create: async (data: Omit<Commodity, 'id'>): Promise<ApiResponse<Commodity>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newCommodity: Commodity = {
        ...data,
        id: Date.now(),
      };
      return { data: newCommodity, success: true, message: 'Commodity created successfully' };
    }
    return apiClient.post<Commodity>('/commodities', data);
  },

  update: async (id: number, data: Partial<Commodity>): Promise<ApiResponse<Commodity>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const updated: Commodity = {
        ...(mockMasterData.commodities.find(c => c.id === id) || {} as Commodity),
        ...data,
        id,
      };
      return { data: updated, success: true, message: 'Commodity updated successfully' };
    }
    return apiClient.put<Commodity>(`/commodities/${id}`, data);
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 400));
      return { data: undefined as void, success: true, message: 'Commodity deleted successfully' };
    }
    return apiClient.delete<void>(`/commodities/${id}`);
  },

  deactivate: async (id: number): Promise<ApiResponse<Commodity>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 400));
      const commodity = mockMasterData.commodities.find(c => c.id === id);
      if (!commodity) {
        throw { message: 'Commodity not found', code: '404' };
      }
      const deactivated: Commodity = {
        ...commodity,
        isActive: false,
      };
      return { data: deactivated, success: true, message: 'Commodity deactivated successfully' };
    }
    return apiClient.patch<Commodity>(`/commodities/${id}/deactivate`, {});
  },

  autoGst: async (commodityName: string, isProcessed: boolean): Promise<ApiResponse<{
    hsnCode: string;
    gstRate: number;
    gstExemptionAvailable: boolean;
    gstCategory: string;
    confidence: string;
    description: string;
  }>> => {
    if (USE_MOCK_API) {
      await new Promise(resolve => setTimeout(resolve, 300));
      // Simple mock logic - in reality this comes from backend GST engine
      const mockResponse = {
        hsnCode: '5201',
        gstRate: 5,
        gstExemptionAvailable: false,
        gstCategory: 'Agricultural',
        confidence: 'high',
        description: 'Auto-determined based on commodity name',
      };
      return { data: mockResponse, success: true };
    }
    return apiClient.post<any>('/commodities/auto-gst', { commodityName, isProcessed });
  },
};

// ============================================================================
// COMMODITY PARAMETERS API
// ============================================================================

export const commodityParametersApi = {
  getAll: async (commodityId: number): Promise<ApiResponse<CommodityParameter[]>> => {
    return apiClient.get<CommodityParameter[]>(`/commodity/${commodityId}/parameters`);
  },

  create: async (commodityId: number, data: Omit<CommodityParameter, 'id' | 'commodityId' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<CommodityParameter>> => {
    return apiClient.post<CommodityParameter>(`/commodity/${commodityId}/parameters`, data);
  },

  update: async (parameterId: number, data: Partial<CommodityParameter>): Promise<ApiResponse<CommodityParameter>> => {
    return apiClient.put<CommodityParameter>(`/commodity/parameters/${parameterId}`, data);
  },

  delete: async (parameterId: number): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(`/commodity/parameters/${parameterId}`);
  },
};

// ============================================================================
// MAIN SETTINGS API EXPORT
// ============================================================================

export const settingsApi = {
  organizations: organizationsApi,
  locations: locationsApi,
  cciTerms: cciTermsApi,
  commodities: commoditiesApi,
  commodityParameters: commodityParametersApi,
};

export default settingsApi;
