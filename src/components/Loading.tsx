/**
 * Loading Components
 * 
 * Reusable loading indicators for different contexts
 */

import React from 'react';

// ============================================================================
// SPINNER
// ============================================================================

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div
      className={`${sizeClasses[size]} border-blue-600 border-t-transparent rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// ============================================================================
// LOADING OVERLAY
// ============================================================================

interface LoadingOverlayProps {
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-lg flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-slate-700 font-medium">{message}</p>
      </div>
    </div>
  );
};

// ============================================================================
// SKELETON LOADERS
// ============================================================================

export const SkeletonLine: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

export const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
    <SkeletonLine className="h-6 w-1/3" />
    <div className="space-y-2">
      <SkeletonLine className="h-4 w-full" />
      <SkeletonLine className="h-4 w-5/6" />
      <SkeletonLine className="h-4 w-4/6" />
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
    <div className="p-4 border-b border-gray-200">
      <SkeletonLine className="h-6 w-1/4" />
    </div>
    <div className="divide-y divide-gray-200">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex gap-4">
          <SkeletonLine className="h-4 w-1/4" />
          <SkeletonLine className="h-4 w-1/3" />
          <SkeletonLine className="h-4 w-1/6" />
          <SkeletonLine className="h-4 w-20" />
        </div>
      ))}
    </div>
  </div>
);

export const SettingsSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <SkeletonLine className="h-8 w-1/3" />
      <SkeletonLine className="h-4 w-2/3" />
    </div>
    
    <div className="border-b border-gray-200">
      <div className="flex gap-8 pb-4">
        <SkeletonLine className="h-6 w-40" />
        <SkeletonLine className="h-6 w-40" />
      </div>
    </div>

    <SkeletonCard />
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>

    <SkeletonTable />
  </div>
);

// ============================================================================
// INLINE LOADING
// ============================================================================

interface InlineLoadingProps {
  text?: string;
  className?: string;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({ 
  text = 'Loading...', 
  className = '' 
}) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <Spinner size="sm" />
    <span className="text-sm text-gray-600">{text}</span>
  </div>
);

// ============================================================================
// BUTTON LOADING STATE
// ============================================================================

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  loadingText,
  children,
  disabled,
  className = '',
  ...props
}) => {
  return (
    <button
      {...props}
      disabled={loading || disabled}
      className={`relative ${className} ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
    >
      {loading && (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Spinner size="sm" />
        </span>
      )}
      <span className={loading ? 'invisible' : ''}>
        {loading && loadingText ? loadingText : children}
      </span>
    </button>
  );
};

export default Spinner;
