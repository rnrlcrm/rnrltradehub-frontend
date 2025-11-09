import React, { useState } from 'react';
import { User } from '../types';
import { Button } from '../components/ui/Form';

interface LoginProps {
  onLogin: (user: User) => void;
  availableUsers: User[];
}

const Login: React.FC<LoginProps> = ({ onLogin, availableUsers }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Find user by email
    const user = availableUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      setError('Invalid email or password');
      return;
    }

    // In production, this would verify password against backend
    // For now, we'll accept any password for demo purposes
    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    onLogin(user);
  };

  const handleDemoLogin = (role: string) => {
    const demoUser = availableUsers.find(u => u.role === role);
    if (demoUser) {
      onLogin(demoUser);
    }
  };

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
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
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
                />
                <span className="ml-2 text-sm text-slate-600">Remember me</span>
              </label>
              <a href="#forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
                Forgot password?
              </a>
            </div>

            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>

          {/* Demo Login Section */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-600 text-center mb-4">Quick Demo Access</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleDemoLogin('Admin')}
                className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 transition"
              >
                Admin Demo
              </button>
              <button
                onClick={() => handleDemoLogin('Accounts')}
                className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 transition"
              >
                Accounts Demo
              </button>
              <button
                onClick={() => handleDemoLogin('Sales')}
                className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 transition"
              >
                Sales Demo
              </button>
              <button
                onClick={() => handleDemoLogin('Vendor/Client')}
                className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 transition"
              >
                Vendor Demo
              </button>
            </div>
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

export default Login;
