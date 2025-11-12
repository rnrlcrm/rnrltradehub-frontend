/**
 * API Helper Utilities
 * Common utility functions used across API files to reduce code duplication
 */

/**
 * Simulate API delay for mock responses
 * @param ms - Delay in milliseconds (default: 300ms)
 */
export const mockDelay = (ms: number = 300): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Build query parameters string from filters object
 * @param filters - Object containing filter parameters
 * @returns Query string with leading '?' if filters exist, empty string otherwise
 */
export const buildQueryParams = (filters?: Record<string, string | undefined>): string => {
  if (!filters) return '';
  
  // Filter out undefined values
  const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, string>);
  
  const queryString = new URLSearchParams(cleanFilters).toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Create a mock API wrapper for CRUD operations
 * Provides consistent mock responses with automatic delays
 */
export const createMockApiWrapper = <T>(
  mockData: T[],
  config?: {
    getDelay?: number;
    createDelay?: number;
    updateDelay?: number;
    deleteDelay?: number;
  }
) => {
  const delays = {
    getDelay: config?.getDelay ?? 300,
    createDelay: config?.createDelay ?? 400,
    updateDelay: config?.updateDelay ?? 400,
    deleteDelay: config?.deleteDelay ?? 300,
  };

  return {
    /**
     * Mock getAll operation
     */
    async getAll(): Promise<T[]> {
      await mockDelay(delays.getDelay);
      return mockData;
    },

    /**
     * Mock getById operation
     */
    async getById(id: number | string, idField: keyof T = 'id' as keyof T): Promise<T | undefined> {
      await mockDelay(delays.getDelay);
      return mockData.find(item => item[idField] === id);
    },

    /**
     * Mock create operation
     */
    async create(data: Partial<T>): Promise<T> {
      await mockDelay(delays.createDelay);
      return { ...data, id: Date.now() } as T;
    },

    /**
     * Mock update operation
     */
    async update(id: number | string, data: Partial<T>, idField: keyof T = 'id' as keyof T): Promise<T> {
      await mockDelay(delays.updateDelay);
      const existing = mockData.find(item => item[idField] === id);
      return { ...existing, ...data, [idField]: id } as T;
    },

    /**
     * Mock delete operation
     */
    async delete(): Promise<void> {
      await mockDelay(delays.deleteDelay);
      return undefined as void;
    },
  };
};
