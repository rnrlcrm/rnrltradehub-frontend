/**
 * Authentication and Session Management Types
 */

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
  tokenType: 'Bearer';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
  tokens: AuthToken;
  requiresPasswordReset: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  userType: 'back_office' | 'client' | 'vendor';
  businessPartnerId?: string;
  branchIds?: string[]; // Branch access for data isolation
  permissions: string[];
  isFirstLogin: boolean;
  lastLoginAt?: string;
}

export interface SessionInfo {
  userId: string;
  startTime: number;
  lastActivity: number;
  expiresAt: number;
  isActive: boolean;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  specialChars: string;
  preventReuse: number; // Number of previous passwords to check
  expiryDays: number; // Password expiration in days (0 = never)
  maxAttempts: number; // Max failed login attempts before lockout
  lockoutDurationMinutes: number;
}

export interface SessionConfig {
  timeoutMinutes: number; // Inactivity timeout (default: 30)
  warningMinutes: number; // Show warning before timeout (default: 5)
  maxDurationHours: number; // Absolute max session duration (default: 12)
  allowConcurrentSessions: boolean;
  refreshTokenExpiryDays: number; // Refresh token validity (default: 7)
}
