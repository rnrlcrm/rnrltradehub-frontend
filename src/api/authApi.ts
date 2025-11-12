/**
 * Authentication API
 * Handles login, logout, password reset, and session management
 */

import { apiClient } from './client';
import {
  LoginRequest,
  LoginResponse,
  AuthToken,
  PasswordResetRequest,
  PasswordResetConfirm,
  PasswordChangeRequest,
  SessionInfo,
} from '../types/auth';

export const authApi = {
  /**
   * Login with email and password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/api/auth/login', credentials);
    
    // Store tokens in session management
    if (response.data.tokens) {
      apiClient.setToken(response.data.tokens.accessToken);
      sessionStorage.setItem('refreshToken', response.data.tokens.refreshToken);
      sessionStorage.setItem('tokenExpiresAt', String(Date.now() + response.data.tokens.expiresIn * 1000));
    }
    
    return response.data;
  },

  /**
   * Logout and clear session
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout', {});
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API call success
      apiClient.clearToken();
      sessionStorage.removeItem('refreshToken');
      sessionStorage.removeItem('tokenExpiresAt');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('sessionInfo');
    }
  },

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(): Promise<AuthToken> {
    const refreshToken = sessionStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await apiClient.post<AuthToken>('/api/auth/refresh', {
      refreshToken,
    });
    
    // Update tokens
    apiClient.setToken(response.data.accessToken);
    sessionStorage.setItem('refreshToken', response.data.refreshToken);
    sessionStorage.setItem('tokenExpiresAt', String(Date.now() + response.data.expiresIn * 1000));
    
    return response.data;
  },

  /**
   * Request password reset
   */
  async requestPasswordReset(request: PasswordResetRequest): Promise<void> {
    await apiClient.post('/api/auth/password-reset/request', request);
  },

  /**
   * Confirm password reset with token
   */
  async confirmPasswordReset(request: PasswordResetConfirm): Promise<void> {
    await apiClient.post('/api/auth/password-reset/confirm', request);
  },

  /**
   * Change password (requires current password)
   */
  async changePassword(request: PasswordChangeRequest): Promise<void> {
    await apiClient.post('/api/auth/password/change', request);
  },

  /**
   * Force password change on first login
   */
  async forcePasswordChange(newPassword: string): Promise<void> {
    await apiClient.post('/api/auth/password/first-login', {
      newPassword,
    });
  },

  /**
   * Validate session
   */
  async validateSession(): Promise<SessionInfo> {
    const response = await apiClient.get<SessionInfo>('/api/auth/session/validate');
    return response.data;
  },

  /**
   * Update session activity (keep-alive)
   */
  async updateActivity(): Promise<void> {
    await apiClient.post('/api/auth/session/activity', {});
  },

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<LoginResponse['user']> {
    const response = await apiClient.get<LoginResponse['user']>('/api/auth/me');
    return response.data;
  },
};
