/**
 * Enhanced Login Component
 * Features:
 * - JWT token management
 * - Session timeout (30 minutes)
 * - Password strength validation
 * - First-time password reset
 * - Account lockout after failed attempts
 */

import React, { useState, useEffect } from 'react';
import { authApi } from '../api/authApi';
import { LoginRequest } from '../types/auth';
import { Button } from '../components/ui/Form';
import { initializeSessionManager } from '../utils/sessionManager';
import { DEFAULT_SESSION_CONFIG } from '../config/security';

interface EnhancedLoginProps {
  onLoginSuccess: (user: any, requiresPasswordReset: boolean) => void;
  onSessionExpired?: () => void;
}

const EnhancedLogin: React.FC<EnhancedLoginProps> = ({ onLoginSuccess, onSessionExpired }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    // Check if there's an active session
    const sessionInfo = localStorage.getItem('sessionInfo');
    if (sessionInfo) {
      try {
        const session = JSON.parse(sessionInfo);
        const now = Date.now();
        
        // Check if session is still valid
        if (session.isActive && session.expiresAt > now) {
          // Session exists, try to restore user
          const savedUser = localStorage.getItem('currentUser');
          if (savedUser) {
            const user = JSON.parse(savedUser);
            onLoginSuccess(user, false);
          }
        } else {
          // Session expired, clear it
          localStorage.removeItem('sessionInfo');
          localStorage.removeItem('currentUser');
        }
      } catch (e) {
        console.error('Failed to restore session:', e);
      }
    }
  }, [onLoginSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate inputs
      if (!email || !password) {
        throw new Error('Please enter both email and password');
      }

      // Attempt login
      const credentials: LoginRequest = { email: email.trim(), password };
      const response = await authApi.login(credentials);

      // Initialize session management
      const sessionManager = initializeSessionManager(
        DEFAULT_SESSION_CONFIG,
        {
          onSessionExpired: () => {
            // Handle session expiration
            localStorage.removeItem('currentUser');
            localStorage.removeItem('sessionInfo');
            if (onSessionExpired) {
              onSessionExpired();
            } else {
              window.location.reload();
            }
          },
          onSessionWarning: (minutesRemaining) => {
            // Show warning dialog
            const shouldContinue = window.confirm(
              `Your session will expire in ${minutesRemaining} minutes due to inactivity. Click OK to continue your session.`
            );
            if (shouldContinue) {
              sessionManager.updateActivity();
            }
          },
        }
      );

      // Start session
      sessionManager.initSession(response.user.id);

      // Save user to local storage
      localStorage.setItem('currentUser', JSON.stringify(response.user));

      // Call success callback
      onLoginSuccess(response.user, response.requiresPasswordReset);
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Handle specific errors
      if (err.code === '401') {
        setError('Invalid email or password. Please try again.');
      } else if (err.code === '423') {
        setError('Account is locked due to too many failed login attempts. Please try again later or contact support.');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Login failed. Please check your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!resetEmail) {
        throw new Error('Please enter your email address');
      }

      await authApi.requestPasswordReset({ email: resetEmail.trim() });
      setResetSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-50 p-4">
        <div className="max-w-md w-full">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-800">RNRL TradeHub</h1>
            <p className="text-slate-600 mt-2">Password Reset</p>
          </div>

          {/* Reset Card */}
          <div className="bg-white shadow-lg rounded-lg border border-slate-200 p-8">
            {resetSuccess ? (
              <div>
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
                  <p className="font-semibold">Password reset email sent!</p>
                  <p className="text-sm mt-1">Please check your email for instructions to reset your password.</p>
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetSuccess(false);
                    setResetEmail('');
                  }}
                  className="w-full"
                >
                  Back to Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <p className="text-sm text-slate-600">
                  Enter your email address and we'll send you instructions to reset your password.
                </p>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="resetEmail" className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="resetEmail"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="block w-full border border-slate-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition"
                    placeholder="your.email@company.com"
                    required
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowForgotPassword(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-50 p-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-800">RNRL TradeHub</h1>
          <p className="text-slate-600 mt-2">Enterprise Resource Planning System</p>
        </div>

        {/* Login Card */}
        <div className="bg-white shadow-lg rounded-lg border border-slate-200 p-8">
          <h2 className="text-2xl font-semibold text-slate-800 mb-6">Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full border border-slate-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition"
                placeholder="your.email@company.com"
                required
                autoFocus
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full border border-slate-300 rounded-lg shadow-sm py-2.5 px-4 pr-12 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition"
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  disabled={loading}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  disabled={loading}
                />
                <span className="ml-2 text-sm text-slate-600">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-blue-600 hover:text-blue-700"
                disabled={loading}
              >
                Forgot password?
              </button>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Security Notice:</strong> Your session will automatically expire after 30 minutes of inactivity. 
              You will receive a warning 5 minutes before expiration.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-slate-600">
          <p>
            Don't have an account?{' '}
            <a href="#contact" className="text-blue-600 hover:text-blue-700 font-medium">
              Contact Administrator
            </a>
          </p>
          <p className="mt-4">
            <a href="#privacy" className="text-slate-500 hover:text-slate-700">Privacy Policy</a>
            {' · '}
            <a href="#terms" className="text-slate-500 hover:text-slate-700">Terms of Service</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnhancedLogin;
