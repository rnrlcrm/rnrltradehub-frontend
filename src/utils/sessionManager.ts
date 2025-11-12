/**
 * Session Management Utility
 * Handles session timeout, activity tracking, and auto-logout
 */

import { SessionConfig, SessionInfo } from '../types/auth';
import { DEFAULT_SESSION_CONFIG } from '../config/security';
import { authApi } from '../api/authApi';

export class SessionManager {
  private sessionConfig: SessionConfig;
  private sessionInfo: SessionInfo | null = null;
  private activityTimer: NodeJS.Timeout | null = null;
  private warningTimer: NodeJS.Timeout | null = null;
  private expiryTimer: NodeJS.Timeout | null = null;
  private onSessionExpired?: () => void;
  private onSessionWarning?: (minutesRemaining: number) => void;

  constructor(
    config: Partial<SessionConfig> = {},
    callbacks?: {
      onSessionExpired?: () => void;
      onSessionWarning?: (minutesRemaining: number) => void;
    }
  ) {
    this.sessionConfig = { ...DEFAULT_SESSION_CONFIG, ...config };
    this.onSessionExpired = callbacks?.onSessionExpired;
    this.onSessionWarning = callbacks?.onSessionWarning;
  }

  /**
   * Initialize session
   */
  initSession(userId: string): void {
    const now = Date.now();
    const maxDuration = this.sessionConfig.maxDurationHours * 60 * 60 * 1000;
    
    this.sessionInfo = {
      userId,
      startTime: now,
      lastActivity: now,
      expiresAt: now + maxDuration,
      isActive: true,
    };

    // Save to storage
    localStorage.setItem('sessionInfo', JSON.stringify(this.sessionInfo));

    // Start timers
    this.startTimers();
    this.setupActivityListeners();
  }

  /**
   * Update activity timestamp
   */
  updateActivity(): void {
    if (!this.sessionInfo || !this.sessionInfo.isActive) return;

    const now = Date.now();
    this.sessionInfo.lastActivity = now;
    localStorage.setItem('sessionInfo', JSON.stringify(this.sessionInfo));

    // Restart inactivity timer
    this.restartInactivityTimer();

    // Notify backend
    authApi.updateActivity().catch(err => {
      console.error('Failed to update activity:', err);
    });
  }

  /**
   * Check if session is active
   */
  isSessionActive(): boolean {
    if (!this.sessionInfo) {
      // Try to restore from storage
      const stored = localStorage.getItem('sessionInfo');
      if (stored) {
        try {
          this.sessionInfo = JSON.parse(stored);
        } catch {
          return false;
        }
      } else {
        return false;
      }
    }

    const now = Date.now();
    const inactivityTimeout = this.sessionConfig.timeoutMinutes * 60 * 1000;
    const timeSinceActivity = now - this.sessionInfo.lastActivity;

    // Check if session expired due to inactivity
    if (timeSinceActivity > inactivityTimeout) {
      this.expireSession('inactivity');
      return false;
    }

    // Check if session exceeded max duration
    if (now > this.sessionInfo.expiresAt) {
      this.expireSession('max_duration');
      return false;
    }

    return this.sessionInfo.isActive;
  }

  /**
   * Get remaining session time in minutes
   */
  getRemainingTime(): number {
    if (!this.sessionInfo) return 0;

    const now = Date.now();
    const inactivityTimeout = this.sessionConfig.timeoutMinutes * 60 * 1000;
    const timeSinceActivity = now - this.sessionInfo.lastActivity;
    const remainingMs = inactivityTimeout - timeSinceActivity;

    return Math.max(0, Math.floor(remainingMs / 60000));
  }

  /**
   * Expire session
   */
  private expireSession(_reason: 'inactivity' | 'max_duration' | 'manual'): void {
    if (this.sessionInfo) {
      this.sessionInfo.isActive = false;
      localStorage.removeItem('sessionInfo');
    }

    this.clearTimers();
    this.removeActivityListeners();

    if (this.onSessionExpired) {
      this.onSessionExpired();
    }

    // Logout
    authApi.logout().catch(err => {
      console.error('Failed to logout:', err);
    });
  }

  /**
   * Manual logout
   */
  logout(): void {
    this.expireSession('manual');
  }

  /**
   * Start timers for session management
   */
  private startTimers(): void {
    this.restartInactivityTimer();
    this.startExpiryTimer();
  }

  /**
   * Restart inactivity timer
   */
  private restartInactivityTimer(): void {
    // Clear existing timers
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
    }

    // Set warning timer
    const warningMs = (this.sessionConfig.timeoutMinutes - this.sessionConfig.warningMinutes) * 60 * 1000;
    this.warningTimer = setTimeout(() => {
      if (this.onSessionWarning) {
        this.onSessionWarning(this.sessionConfig.warningMinutes);
      }
    }, warningMs);

    // Set expiry timer
    const timeoutMs = this.sessionConfig.timeoutMinutes * 60 * 1000;
    this.activityTimer = setTimeout(() => {
      this.expireSession('inactivity');
    }, timeoutMs);
  }

  /**
   * Start absolute expiry timer
   */
  private startExpiryTimer(): void {
    if (!this.sessionInfo) return;

    const now = Date.now();
    const timeUntilExpiry = this.sessionInfo.expiresAt - now;

    this.expiryTimer = setTimeout(() => {
      this.expireSession('max_duration');
    }, timeUntilExpiry);
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = null;
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
    if (this.expiryTimer) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
  }

  /**
   * Setup activity listeners
   */
  private setupActivityListeners(): void {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      window.addEventListener(event, this.handleActivity);
    });
  }

  /**
   * Remove activity listeners
   */
  private removeActivityListeners(): void {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      window.removeEventListener(event, this.handleActivity);
    });
  }

  /**
   * Handle activity event
   */
  private handleActivity = (): void => {
    this.updateActivity();
  };

  /**
   * Destroy session manager
   */
  destroy(): void {
    this.clearTimers();
    this.removeActivityListeners();
  }
}

// Singleton instance
let sessionManager: SessionManager | null = null;

export function initializeSessionManager(
  config?: Partial<SessionConfig>,
  callbacks?: {
    onSessionExpired?: () => void;
    onSessionWarning?: (minutesRemaining: number) => void;
  }
): SessionManager {
  if (sessionManager) {
    sessionManager.destroy();
  }
  
  sessionManager = new SessionManager(config, callbacks);
  return sessionManager;
}

export function getSessionManager(): SessionManager | null {
  return sessionManager;
}
