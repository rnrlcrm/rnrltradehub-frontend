/**
 * Complete Authentication Service Implementation
 * Real working login/logout with session management
 */

import { apiClient, setTokens, clearTokens, getAccessToken } from '../api/realApiClient';
import { sessionManager } from '../utils/sessionManager';
import type { LoginRequest, LoginResponse, AuthToken } from '../types/auth';
import type { EnhancedUser } from '../types/accessControl';

export class AuthService {
  private static currentUser: EnhancedUser | null = null;

  /**
   * Login user
   */
  static async login(credentials: LoginRequest): Promise<{
    user: EnhancedUser;
    tokens: AuthToken;
    requiresPasswordReset: boolean;
  }> {
    try {
      const response = await apiClient.post<LoginResponse>('/api/auth/login', credentials);
      
      const { user, tokens, requiresPasswordReset } = response.data;

      // Store tokens
      setTokens(tokens.accessToken, tokens.refreshToken);

      // Store user
      this.currentUser = user;
      localStorage.setItem('current_user', JSON.stringify(user));

      // Start session
      sessionManager.startSession(user.id, tokens.accessToken);

      // Log audit trail
      await this.logAudit('LOGIN_SUCCESS', user.id);

      return { user, tokens, requiresPasswordReset };
    } catch (error: any) {
      // Log failed attempt
      await this.logAudit('LOGIN_FAILED', credentials.email);
      throw error;
    }
  }

  /**
   * Logout user
   */
  static async logout(): Promise<void> {
    try {
      const user = this.getCurrentUser();
      
      // Call logout API
      await apiClient.post('/api/auth/logout');

      // Log audit trail
      if (user) {
        await this.logAudit('LOGOUT', user.id);
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear local state regardless of API response
      clearTokens();
      this.currentUser = null;
      localStorage.removeItem('current_user');
      sessionManager.endSession();
    }
  }

  /**
   * Get current user
   */
  static getCurrentUser(): EnhancedUser | null {
    if (this.currentUser) {
      return this.currentUser;
    }

    // Try to restore from localStorage
    const stored = localStorage.getItem('current_user');
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored);
        return this.currentUser;
      } catch {
        return null;
      }
    }

    return null;
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return !!getAccessToken() && !!this.getCurrentUser();
  }

  /**
   * Reset password
   */
  static async resetPassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    await apiClient.post('/api/auth/password-reset/confirm', {
      userId,
      currentPassword,
      newPassword,
    });

    await this.logAudit('PASSWORD_RESET', userId);
  }

  /**
   * Request password reset email
   */
  static async requestPasswordReset(email: string): Promise<void> {
    await apiClient.post('/api/auth/password-reset/request', { email });
  }

  /**
   * Validate session
   */
  static async validateSession(): Promise<boolean> {
    try {
      const response = await apiClient.get('/api/auth/session/validate');
      return response.data.isActive;
    } catch {
      return false;
    }
  }

  /**
   * Update activity
   */
  static async updateActivity(): Promise<void> {
    try {
      await apiClient.post('/api/auth/session/activity');
      sessionManager.updateActivity();
    } catch (error) {
      console.error('Failed to update activity:', error);
    }
  }

  /**
   * Log audit trail
   */
  private static async logAudit(action: string, userId: string): Promise<void> {
    try {
      await apiClient.post('/api/audit/log', {
        action,
        userId,
        timestamp: new Date().toISOString(),
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent,
      });
    } catch (error) {
      console.error('Failed to log audit:', error);
    }
  }

  /**
   * Get client IP address
   */
  private static async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }
}

export default AuthService;
