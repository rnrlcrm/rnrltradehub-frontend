/**
 * Real API Client Implementation with Axios
 * Handles authentication, interceptors, error handling
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// API Base URL - configure based on environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * API Client Instance
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Get stored access token
 */
export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Get stored refresh token
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Store tokens
 */
export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

/**
 * Clear tokens
 */
export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Request Interceptor
 * Adds authentication token to requests
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles token refresh and error responses
 */
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Wait for token refresh
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        // No refresh token, redirect to login
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        // Attempt to refresh token
        const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        setTokens(accessToken, newRefreshToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        processQueue(null, accessToken);
        isRefreshing = false;

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(error, null);
        isRefreshing = false;
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    return Promise.reject(error);
  }
);

/**
 * API Error Handler
 * Converts axios errors to user-friendly messages
 */
export function handleApiError(error: unknown): {
  message: string;
  code?: string;
  details?: any;
} {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;

    if (axiosError.response) {
      // Server responded with error
      return {
        message: axiosError.response.data?.message || 'An error occurred',
        code: axiosError.response.data?.code || axiosError.response.status.toString(),
        details: axiosError.response.data?.details,
      };
    } else if (axiosError.request) {
      // Request made but no response
      return {
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
      };
    } else {
      // Error setting up request
      return {
        message: axiosError.message || 'An unexpected error occurred',
        code: 'REQUEST_ERROR',
      };
    }
  }

  // Non-axios error
  return {
    message: error instanceof Error ? error.message : 'An unknown error occurred',
    code: 'UNKNOWN_ERROR',
  };
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

/**
 * Mock Mode for Development
 * When backend is not available, use mock data
 */
let mockMode = false;

export function enableMockMode(): void {
  mockMode = true;
}

export function disableMockMode(): void {
  mockMode = false;
}

export function isMockMode(): boolean {
  return mockMode;
}

/**
 * Mock API Client for development
 */
export const mockApiClient = {
  get: async (url: string, config?: any): Promise<any> => {
    console.log('[MOCK] GET', url, config);
    return { data: {} };
  },
  post: async (url: string, data?: any, config?: any): Promise<any> => {
    console.log('[MOCK] POST', url, data, config);
    return { data: {} };
  },
  put: async (url: string, data?: any, config?: any): Promise<any> => {
    console.log('[MOCK] PUT', url, data, config);
    return { data: {} };
  },
  delete: async (url: string, config?: any): Promise<any> => {
    console.log('[MOCK] DELETE', url, config);
    return { data: {} };
  },
};

/**
 * Get appropriate API client based on mode
 */
export function getApiClient(): AxiosInstance {
  return mockMode ? (mockApiClient as any) : apiClient;
}

export default apiClient;
