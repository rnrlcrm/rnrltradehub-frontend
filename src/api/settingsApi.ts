/**
 * Settings API Service
 * 
 * API client for all Settings module operations including:
 * - Organizations
 * - Master Data (Trade Types, Varieties, etc.)
 * - GST Rates
 * - Locations
 * - Commissions
 * - CCI Terms
 * - Structured Terms (Delivery, Payment)
 */

import { apiClient, USE_MOCK_API, ApiResponse } from './client';
import {
  Organization,
  MasterDataItem,
  GstRate,
  Location,
  CommissionStructure,
  CciTerm,
  StructuredTerm,
} from '../types';

// Mock data imports (used when USE_MOCK_API is true)
import {
  mockOrganizationsDetailed,
  mockMasterData,
  mockLocations,
} from '../data/mockData';

// API helper utilities
import { mockDelay } from '../utils/apiHelpers';

// ============================================================================
// ORGANIZATIONS
// ============================================================================

export const organizationsApi = {
  getAll: async (): Promise<ApiResponse<Organization[]>> => {
    if (USE_MOCK_API) {
      await mockDelay();
      return {
        data: mockOrganizationsDetailed,
        success: true,
      };
    }
    return apiClient.get<Organization[]>('/settings/organizations');
  },

  getById: async (id: number): Promise<ApiResponse<Organization>> => {
    if (USE_MOCK_API) {
      await mockDelay(200);
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
      await mockDelay(400);
      const newOrg: Organization = {
        ...data,
        id: Date.now(), // In real API, this comes from backend
      };
      return { data: newOrg, success: true, message: 'Organization created successfully' };
    }
    return apiClient.post<Organization>('/settings/organizations', data);
  },

  update: async (id: number, data: Partial<Organization>): Promise<ApiResponse<Organization>> => {
    if (USE_MOCK_API) {
      await mockDelay(400);
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
      await mockDelay();
      return { data: undefined as void, success: true, message: 'Organization deleted successfully' };
    }
    return apiClient.delete<void>(`/settings/organizations/${id}`);
  },
};

// ============================================================================
// MASTER DATA (Generic)
// Note: Financial Years removed - managed only in FY Management tab
// ============================================================================

export type MasterDataType =
  | 'trade-types'
  | 'bargain-types'
  | 'varieties'
  | 'dispute-reasons'
  | 'weightment-terms'
  | 'passing-terms';

export const masterDataApi = {
  getAll: async (type: MasterDataType): Promise<ApiResponse<MasterDataItem[]>> => {
    if (USE_MOCK_API) {
      await mockDelay();
      const typeMap: Record<MasterDataType, MasterDataItem[]> = {
        'trade-types': mockMasterData.tradeTypes,
        'bargain-types': mockMasterData.bargainTypes,
        'varieties': mockMasterData.varieties,
        'dispute-reasons': mockMasterData.disputeReasons,
        'weightment-terms': mockMasterData.weightmentTerms,
        'passing-terms': mockMasterData.passingTerms,
      };
      return { data: typeMap[type] || [], success: true };
    }
    return apiClient.get<MasterDataItem[]>(`/settings/master-data/${type}`);
  },

  create: async (type: MasterDataType, data: { name: string }): Promise<ApiResponse<MasterDataItem>> => {
    if (USE_MOCK_API) {
      await mockDelay(400);
      const newItem: MasterDataItem = {
        id: Date.now(),
        name: data.name,
      };
      return { data: newItem, success: true, message: 'Item created successfully' };
    }
    return apiClient.post<MasterDataItem>(`/settings/master-data/${type}`, data);
  },

  update: async (type: MasterDataType, id: number, data: { name: string }): Promise<ApiResponse<MasterDataItem>> => {
    if (USE_MOCK_API) {
      await mockDelay(400);
      const updated: MasterDataItem = { id, name: data.name };
      return { data: updated, success: true, message: 'Item updated successfully' };
    }
    return apiClient.put<MasterDataItem>(`/settings/master-data/${type}/${id}`, data);
  },

  delete: async (type: MasterDataType, id: number): Promise<ApiResponse<void>> => {
    if (USE_MOCK_API) {
      await mockDelay();
      return { data: undefined as void, success: true, message: 'Item deleted successfully' };
    }
    return apiClient.delete<void>(`/settings/master-data/${type}/${id}`);
  },
};

// ============================================================================
// GST RATES
// ============================================================================

export const gstRatesApi = {
  getAll: async (): Promise<ApiResponse<GstRate[]>> => {
    if (USE_MOCK_API) {
      await mockDelay();
      return { data: mockMasterData.gstRates, success: true };
    }
    return apiClient.get<GstRate[]>('/settings/gst-rates');
  },

  create: async (data: Omit<GstRate, 'id'>): Promise<ApiResponse<GstRate>> => {
    if (USE_MOCK_API) {
      await mockDelay(400);
      const newRate: GstRate = { ...data, id: Date.now() };
      return { data: newRate, success: true, message: 'GST rate created successfully' };
    }
    return apiClient.post<GstRate>('/settings/gst-rates', data);
  },

  update: async (id: number, data: Partial<GstRate>): Promise<ApiResponse<GstRate>> => {
    if (USE_MOCK_API) {
      await mockDelay(400);
      const updated: GstRate = {
        ...(mockMasterData.gstRates.find(r => r.id === id) || {} as GstRate),
        ...data,
        id,
      };
      return { data: updated, success: true, message: 'GST rate updated successfully' };
    }
    return apiClient.put<GstRate>(`/settings/gst-rates/${id}`, data);
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    if (USE_MOCK_API) {
      await mockDelay();
      return { data: undefined as void, success: true, message: 'GST rate deleted successfully' };
    }
    return apiClient.delete<void>(`/settings/gst-rates/${id}`);
  },
};

// ============================================================================
// LOCATIONS
// ============================================================================

export const locationsApi = {
  getAll: async (): Promise<ApiResponse<Location[]>> => {
    if (USE_MOCK_API) {
      await mockDelay();
      return { data: mockLocations, success: true };
    }
    return apiClient.get<Location[]>('/settings/locations');
  },

  create: async (data: Omit<Location, 'id'>): Promise<ApiResponse<Location>> => {
    if (USE_MOCK_API) {
      await mockDelay(400);
      const newLocation: Location = { ...data, id: Date.now() };
      return { data: newLocation, success: true, message: 'Location created successfully' };
    }
    return apiClient.post<Location>('/settings/locations', data);
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    if (USE_MOCK_API) {
      await mockDelay();
      return { data: undefined as void, success: true, message: 'Location deleted successfully' };
    }
    return apiClient.delete<void>(`/settings/locations/${id}`);
  },
};

// ============================================================================
// COMMISSIONS
// ============================================================================

export const commissionsApi = {
  getAll: async (): Promise<ApiResponse<CommissionStructure[]>> => {
    if (USE_MOCK_API) {
      await mockDelay();
      return { data: mockMasterData.commissions, success: true };
    }
    return apiClient.get<CommissionStructure[]>('/settings/commissions');
  },

  create: async (data: Omit<CommissionStructure, 'id'>): Promise<ApiResponse<CommissionStructure>> => {
    if (USE_MOCK_API) {
      await mockDelay(400);
      const newCommission: CommissionStructure = { ...data, id: Date.now() };
      return { data: newCommission, success: true, message: 'Commission created successfully' };
    }
    return apiClient.post<CommissionStructure>('/settings/commissions', data);
  },

  update: async (id: number, data: Partial<CommissionStructure>): Promise<ApiResponse<CommissionStructure>> => {
    if (USE_MOCK_API) {
      await mockDelay(400);
      const updated: CommissionStructure = {
        ...(mockMasterData.commissions.find(c => c.id === id) || {} as CommissionStructure),
        ...data,
        id,
      };
      return { data: updated, success: true, message: 'Commission updated successfully' };
    }
    return apiClient.put<CommissionStructure>(`/settings/commissions/${id}`, data);
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    if (USE_MOCK_API) {
      await mockDelay();
      return { data: undefined as void, success: true, message: 'Commission deleted successfully' };
    }
    return apiClient.delete<void>(`/settings/commissions/${id}`);
  },
};

// ============================================================================
// CCI TERMS
// ============================================================================

export const cciTermsApi = {
  getAll: async (): Promise<ApiResponse<CciTerm[]>> => {
    if (USE_MOCK_API) {
      await mockDelay();
      return { data: mockMasterData.cciTerms, success: true };
    }
    return apiClient.get<CciTerm[]>('/settings/cci-terms');
  },

  create: async (data: Omit<CciTerm, 'id'>): Promise<ApiResponse<CciTerm>> => {
    if (USE_MOCK_API) {
      await mockDelay(400);
      const newTerm: CciTerm = { ...data, id: Date.now() };
      return { data: newTerm, success: true, message: 'CCI term created successfully' };
    }
    return apiClient.post<CciTerm>('/settings/cci-terms', data);
  },

  update: async (id: number, data: Partial<CciTerm>): Promise<ApiResponse<CciTerm>> => {
    if (USE_MOCK_API) {
      await mockDelay(400);
      const updated: CciTerm = {
        ...(mockMasterData.cciTerms.find(t => t.id === id) || {} as CciTerm),
        ...data,
        id,
      };
      return { data: updated, success: true, message: 'CCI term updated successfully' };
    }
    return apiClient.put<CciTerm>(`/settings/cci-terms/${id}`, data);
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    if (USE_MOCK_API) {
      await mockDelay();
      return { data: undefined as void, success: true, message: 'CCI term deleted successfully' };
    }
    return apiClient.delete<void>(`/settings/cci-terms/${id}`);
  },
};

// ============================================================================
// STRUCTURED TERMS (Delivery & Payment)
// ============================================================================

export type StructuredTermType = 'delivery-terms' | 'payment-terms';

export const structuredTermsApi = {
  getAll: async (type: StructuredTermType): Promise<ApiResponse<StructuredTerm[]>> => {
    if (USE_MOCK_API) {
      await mockDelay();
      const data = type === 'delivery-terms' ? mockMasterData.deliveryTerms : mockMasterData.paymentTerms;
      return { data, success: true };
    }
    return apiClient.get<StructuredTerm[]>(`/settings/${type}`);
  },

  create: async (type: StructuredTermType, data: Omit<StructuredTerm, 'id'>): Promise<ApiResponse<StructuredTerm>> => {
    if (USE_MOCK_API) {
      await mockDelay(400);
      const newTerm: StructuredTerm = { ...data, id: Date.now() };
      return { data: newTerm, success: true, message: 'Term created successfully' };
    }
    return apiClient.post<StructuredTerm>(`/settings/${type}`, data);
  },

  update: async (type: StructuredTermType, id: number, data: Partial<StructuredTerm>): Promise<ApiResponse<StructuredTerm>> => {
    if (USE_MOCK_API) {
      await mockDelay(400);
      const terms = type === 'delivery-terms' ? mockMasterData.deliveryTerms : mockMasterData.paymentTerms;
      const updated: StructuredTerm = {
        ...(terms.find(t => t.id === id) || {} as StructuredTerm),
        ...data,
        id,
      };
      return { data: updated, success: true, message: 'Term updated successfully' };
    }
    return apiClient.put<StructuredTerm>(`/settings/${type}/${id}`, data);
  },

  delete: async (type: StructuredTermType, id: number): Promise<ApiResponse<void>> => {
    if (USE_MOCK_API) {
      await mockDelay();
      return { data: undefined as void, success: true, message: 'Term deleted successfully' };
    }
    return apiClient.delete<void>(`/settings/${type}/${id}`);
  },
};

// Export all APIs
export const settingsApi = {
  organizations: organizationsApi,
  masterData: masterDataApi,
  gstRates: gstRatesApi,
  locations: locationsApi,
  commissions: commissionsApi,
  cciTerms: cciTermsApi,
  structuredTerms: structuredTermsApi,
};
