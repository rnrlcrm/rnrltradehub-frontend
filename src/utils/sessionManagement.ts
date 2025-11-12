/**
 * Session Management Utilities
 * Handles JWT token storage, refresh, and expiry
 */

import { apiClient } from '../api/client';

export interface SessionInfo {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
  userId: string;
  userType: string;
}

const SESSION_STORAGE_KEY = 'rnrl_session';
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry

/**
 * Stores session information
 */
export function storeSession(session: SessionInfo): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    apiClient.setToken(session.accessToken);
  } catch (error) {
    console.error('Failed to store session:', error);
  }
}

/**
 * Retrieves current session
 */
export function getSession(): SessionInfo | null {
  try {
    const sessionData = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionData) return null;
    
    const session: SessionInfo = JSON.parse(sessionData);
    return session;
  } catch (error) {
    console.error('Failed to retrieve session:', error);
    return null;
  }
}

/**
 * Clears session data
 */
export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    apiClient.clearToken();
  } catch (error) {
    console.error('Failed to clear session:', error);
  }
}

/**
 * Checks if session is expired
 */
export function isSessionExpired(session: SessionInfo | null): boolean {
  if (!session) return true;
  
  const now = Date.now();
  return now >= session.expiresAt;
}

/**
 * Checks if session needs refresh
 */
export function shouldRefreshSession(session: SessionInfo | null): boolean {
  if (!session) return false;
  
  const now = Date.now();
  const timeUntilExpiry = session.expiresAt - now;
  
  return timeUntilExpiry <= TOKEN_REFRESH_THRESHOLD && timeUntilExpiry > 0;
}

/**
 * Refreshes the access token
 */
export async function refreshSession(): Promise<SessionInfo | null> {
  const currentSession = getSession();
  if (!currentSession) {
    return null;
  }

  try {
    // Call backend refresh endpoint
    const response = await apiClient.post<{
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    }>('/api/auth/refresh', {
      refreshToken: currentSession.refreshToken,
    });

    // Calculate new expiry time
    const expiresAt = Date.now() + (response.data.expiresIn * 1000);

    const newSession: SessionInfo = {
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
      expiresAt,
      userId: currentSession.userId,
      userType: currentSession.userType,
    };

    storeSession(newSession);
    return newSession;
  } catch (error) {
    console.error('Failed to refresh session:', error);
    clearSession();
    return null;
  }
}

/**
 * Auto-refresh session if needed
 * Returns true if session is valid, false if expired/invalid
 */
export async function ensureValidSession(): Promise<boolean> {
  const session = getSession();

  if (!session) {
    return false;
  }

  if (isSessionExpired(session)) {
    clearSession();
    return false;
  }

  if (shouldRefreshSession(session)) {
    const refreshedSession = await refreshSession();
    return refreshedSession !== null;
  }

  return true;
}

/**
 * Decodes JWT token payload (without verification)
 * Note: This is only for reading claims, not for security validation
 */
export function decodeJWT(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Gets time remaining until session expires (in seconds)
 */
export function getSessionTimeRemaining(): number {
  const session = getSession();
  if (!session) return 0;

  const now = Date.now();
  const remaining = Math.max(0, session.expiresAt - now);
  return Math.floor(remaining / 1000);
}

/**
 * Formats time remaining for display
 */
export function formatSessionTimeRemaining(): string {
  const seconds = getSessionTimeRemaining();
  
  if (seconds === 0) return 'Expired';
  
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
  
  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }
  
  return `${seconds}s`;
}

/**
 * Session monitoring - call this periodically to check session status
 */
export class SessionMonitor {
  private intervalId: number | null = null;
  private onSessionExpired: () => void;
  private onSessionExpiringSoon: (secondsRemaining: number) => void;
  private checkInterval: number = 60000; // Check every minute
  private expiryWarningThreshold: number = 5 * 60; // Warn 5 minutes before expiry

  constructor(
    onSessionExpired: () => void,
    onSessionExpiringSoon: (secondsRemaining: number) => void = () => {},
    checkInterval: number = 60000
  ) {
    this.onSessionExpired = onSessionExpired;
    this.onSessionExpiringSoon = onSessionExpiringSoon;
    this.checkInterval = checkInterval;
  }

  start(): void {
    if (this.intervalId) {
      this.stop();
    }

    this.intervalId = window.setInterval(() => {
      this.checkSession();
    }, this.checkInterval);

    // Check immediately
    this.checkSession();
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async checkSession(): Promise<void> {
    const session = getSession();

    if (!session) {
      this.onSessionExpired();
      return;
    }

    if (isSessionExpired(session)) {
      this.onSessionExpired();
      return;
    }

    const secondsRemaining = getSessionTimeRemaining();

    // Warn if expiring soon
    if (secondsRemaining <= this.expiryWarningThreshold) {
      this.onSessionExpiringSoon(secondsRemaining);
    }

    // Auto-refresh if needed
    if (shouldRefreshSession(session)) {
      await refreshSession();
    }
  }
}
