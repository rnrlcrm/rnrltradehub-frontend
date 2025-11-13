import React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';

interface ToastProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({
  open,
  onOpenChange,
  title,
  description,
  variant = 'success',
  duration = 5000,
}) => {
  const variantStyles = {
    success: 'bg-green-50 border-green-500 text-green-900',
    error: 'bg-red-50 border-red-500 text-red-900',
    warning: 'bg-yellow-50 border-yellow-500 text-yellow-900',
    info: 'bg-blue-50 border-blue-500 text-blue-900',
  };

  const iconStyles = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <ToastPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      duration={duration}
      className={`${variantStyles[variant]} border-l-4 rounded-md shadow-lg p-4 flex items-start gap-3 max-w-md`}
    >
      <div className="flex-shrink-0 text-xl font-bold">{iconStyles[variant]}</div>
      <div className="flex-1">
        <ToastPrimitive.Title className="font-semibold text-sm mb-1">
          {title}
        </ToastPrimitive.Title>
        {description && (
          <ToastPrimitive.Description className="text-xs opacity-90">
            {description}
          </ToastPrimitive.Description>
        )}
      </div>
      <ToastPrimitive.Close className="flex-shrink-0 text-sm opacity-50 hover:opacity-100">
        ✕
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ToastPrimitive.Provider>
      {children}
      <ToastPrimitive.Viewport className="fixed top-4 right-4 flex flex-col gap-2 w-96 max-w-full z-50" />
    </ToastPrimitive.Provider>
  );
};

export default Toast;
