/**
 * First Login Password Reset Component
 * Forces users to change their password on first login
 */

import React, { useState } from 'react';
import { authApi } from '../api/authApi';
import { validatePassword } from '../config/security';
import { DEFAULT_PASSWORD_POLICY } from '../config/security';
import { Button } from '../components/ui/Form';

interface FirstLoginPasswordResetProps {
  user: any;
  onPasswordChanged: () => void;
  onCancel: () => void;
}

const FirstLoginPasswordReset: React.FC<FirstLoginPasswordResetProps> = ({
  user,
  onPasswordChanged,
  onCancel,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handlePasswordChange = (value: string) => {
    setNewPassword(value);
    
    // Validate password in real-time
    const validation = validatePassword(value, DEFAULT_PASSWORD_POLICY);
    setValidationErrors(validation.errors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please try again.');
      return;
    }

    // Validate password policy
    const validation = validatePassword(newPassword, DEFAULT_PASSWORD_POLICY);
    if (!validation.valid) {
      setError('Password does not meet security requirements. Please check the requirements below.');
      setValidationErrors(validation.errors);
      return;
    }

    setLoading(true);

    try {
      await authApi.forcePasswordChange(newPassword);
      onPasswordChanged();
    } catch (err: any) {
      console.error('Password change error:', err);
      setError(err.message || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    let strength = 0;
    
    if (password.length >= DEFAULT_PASSWORD_POLICY.minLength) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 20;
    if (new RegExp(`[${DEFAULT_PASSWORD_POLICY.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(password)) strength += 20;
    
    if (strength <= 40) return { strength, label: 'Weak', color: 'bg-red-500' };
    if (strength <= 60) return { strength, label: 'Fair', color: 'bg-orange-500' };
    if (strength <= 80) return { strength, label: 'Good', color: 'bg-yellow-500' };
    return { strength, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-50 p-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Change Password</h1>
          <p className="text-slate-600 mt-2">First-time login - Please set a new password</p>
        </div>

        {/* Password Reset Card */}
        <div className="bg-white shadow-lg rounded-lg border border-slate-200 p-8">
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Welcome, {user?.name}!</strong><br />
              For security reasons, you must change your password before accessing the system.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-2">
                New Password *
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className="block w-full border border-slate-300 rounded-lg shadow-sm py-2.5 px-4 pr-12 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition"
                  placeholder="Enter new password"
                  required
                  autoFocus
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  disabled={loading}
                >
                  {showNewPassword ? (
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
              
              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-600">Password Strength:</span>
                    <span className={`text-xs font-semibold ${
                      passwordStrength.strength <= 40 ? 'text-red-600' :
                      passwordStrength.strength <= 60 ? 'text-orange-600' :
                      passwordStrength.strength <= 80 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`${passwordStrength.color} h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${passwordStrength.strength}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                Confirm New Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full border border-slate-300 rounded-lg shadow-sm py-2.5 px-4 pr-12 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition"
                  placeholder="Confirm new password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  disabled={loading}
                >
                  {showConfirmPassword ? (
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

            {/* Password Requirements */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-sm font-semibold text-slate-700 mb-2">Password Requirements:</p>
              <ul className="space-y-1 text-xs text-slate-600">
                <li className={newPassword.length >= DEFAULT_PASSWORD_POLICY.minLength ? 'text-green-600' : ''}>
                  ✓ At least {DEFAULT_PASSWORD_POLICY.minLength} characters long
                </li>
                <li className={/[A-Z]/.test(newPassword) ? 'text-green-600' : ''}>
                  ✓ At least one uppercase letter
                </li>
                <li className={/[a-z]/.test(newPassword) ? 'text-green-600' : ''}>
                  ✓ At least one lowercase letter
                </li>
                <li className={/[0-9]/.test(newPassword) ? 'text-green-600' : ''}>
                  ✓ At least one number
                </li>
                <li className={new RegExp(`[${DEFAULT_PASSWORD_POLICY.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(newPassword) ? 'text-green-600' : ''}>
                  ✓ At least one special character ({DEFAULT_PASSWORD_POLICY.specialChars.substring(0, 10)}...)
                </li>
              </ul>
              
              {validationErrors.length > 0 && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                  <p className="text-xs font-semibold text-red-700 mb-1">Issues:</p>
                  <ul className="space-y-1">
                    {validationErrors.map((err, idx) => (
                      <li key={idx} className="text-xs text-red-600">• {err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={onCancel}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading || validationErrors.length > 0 || !newPassword || !confirmPassword}
              >
                {loading ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FirstLoginPasswordReset;
