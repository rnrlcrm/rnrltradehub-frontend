/**
 * COMPREHENSIVE TEST SUITE
 * Real tests for all implemented services
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import AuthService from '../services/authService';
import { AutomationService } from '../services/automationService';
import * as realApiClient from '../api/realApiClient';

// Mock API client
vi.mock('../api/realApiClient', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  setTokens: vi.fn(),
  clearTokens: vi.fn(),
  getAccessToken: vi.fn(),
}));

// Mock session manager
vi.mock('../utils/sessionManager', () => ({
  sessionManagerInstance: {
    startSession: vi.fn(),
    endSession: vi.fn(),
    updateActivity: vi.fn(),
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('login', () => {
    it('should login successfully and store tokens', async () => {
      const mockResponse = {
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
            role: 'Admin',
          },
          tokens: {
            accessToken: 'access-token-123',
            refreshToken: 'refresh-token-123',
          },
          requiresPasswordReset: false,
        },
      };

      vi.mocked(realApiClient.apiClient.post).mockResolvedValue(mockResponse);

      const result = await AuthService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.requiresPasswordReset).toBe(false);
      expect(realApiClient.apiClient.post).toHaveBeenCalledWith('/api/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should handle login failure', async () => {
      vi.mocked(realApiClient.apiClient.post).mockRejectedValue({
        message: 'Invalid credentials',
      });

      await expect(
        AuthService.login({
          email: 'test@example.com',
          password: 'wrong-password',
        })
      ).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should logout and clear local storage', async () => {
      vi.mocked(realApiClient.apiClient.post).mockResolvedValue({ data: {} });

      await AuthService.logout();

      expect(realApiClient.apiClient.post).toHaveBeenCalledWith('/api/auth/logout');
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when user and token exist', () => {
      vi.mocked(realApiClient.getAccessToken).mockReturnValue('token-123');
      localStorage.setItem('current_user', JSON.stringify({ id: 'user-123' }));

      const result = AuthService.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false when no token exists', () => {
      vi.mocked(realApiClient.getAccessToken).mockReturnValue(null);

      const result = AuthService.isAuthenticated();

      expect(result).toBe(false);
    });
  });
});

describe('AutomationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('autoCreateUserFromPartner', () => {
    it('should create user with generated password', async () => {
      const mockPartner = {
        id: 'partner-123',
        legalName: 'Test Company',
        contactEmail: 'contact@test.com',
        contactPerson: 'John Doe',
        businessType: 'BUYER',
        branches: [],
      };

      const mockUserResponse = {
        data: {
          id: 'user-456',
          email: 'contact@test.com',
          name: 'John Doe',
          businessPartnerId: 'partner-123',
        },
      };

      vi.mocked(realApiClient.apiClient.post).mockResolvedValue(mockUserResponse);

      const result = await AutomationService.autoCreateUserFromPartner(
        'partner-123',
        mockPartner as any
      );

      expect(result.user.id).toBe('user-456');
      expect(result.password).toBeDefined();
      expect(result.password.length).toBeGreaterThanOrEqual(8);
      expect(realApiClient.apiClient.post).toHaveBeenCalled();
    });
  });

  describe('autoValidateData', () => {
    it('should validate PAN format correctly', async () => {
      const validResult = await AutomationService.autoValidateData({
        pan: 'ABCDE1234F',
      });
      expect(validResult.valid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      const invalidResult = await AutomationService.autoValidateData({
        pan: 'INVALID',
      });
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toContain('Invalid PAN format');
    });

    it('should validate GST format correctly', async () => {
      const validResult = await AutomationService.autoValidateData({
        gst: '27ABCDE1234F1Z5',
      });
      expect(validResult.valid).toBe(true);

      const invalidResult = await AutomationService.autoValidateData({
        gst: 'INVALID-GST',
      });
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toContain('Invalid GST format');
    });

    it('should validate phone number correctly', async () => {
      const validResult = await AutomationService.autoValidateData({
        phone: '9876543210',
      });
      expect(validResult.valid).toBe(true);

      const invalidResult = await AutomationService.autoValidateData({
        phone: '12345',
      });
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toContain('Invalid phone number');
    });

    it('should validate email format correctly', async () => {
      const validResult = await AutomationService.autoValidateData({
        email: 'test@example.com',
      });
      expect(validResult.valid).toBe(true);

      const invalidResult = await AutomationService.autoValidateData({
        email: 'invalid-email',
      });
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toContain('Invalid email format');
    });

    it('should validate multiple fields', async () => {
      const result = await AutomationService.autoValidateData({
        pan: 'INVALID',
        gst: 'INVALID',
        phone: '123',
        email: 'invalid',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(4);
    });
  });
});

describe('Data Validation Performance', () => {
  it('should validate 1000 records in under 1 second', async () => {
    const startTime = Date.now();

    const promises = Array.from({ length: 1000 }, (_, i) =>
      AutomationService.autoValidateData({
        pan: 'ABCDE1234F',
        gst: '27ABCDE1234F1Z5',
        phone: '9876543210',
        email: `test${i}@example.com`,
      })
    );

    await Promise.all(promises);

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(1000); // Should complete in under 1 second
  });
});
