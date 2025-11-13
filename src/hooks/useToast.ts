import { useState, useCallback } from 'react';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((
    title: string,
    options?: {
      description?: string;
      variant?: 'success' | 'error' | 'warning' | 'info';
      duration?: number;
    }
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastMessage = {
      id,
      title,
      description: options?.description,
      variant: options?.variant || 'success',
      duration: options?.duration || 5000,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto-remove after duration
    setTimeout(() => {
      removeToast(id);
    }, newToast.duration);

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((title: string, description?: string) => {
    return showToast(title, { description, variant: 'success' });
  }, [showToast]);

  const error = useCallback((title: string, description?: string) => {
    return showToast(title, { description, variant: 'error' });
  }, [showToast]);

  const warning = useCallback((title: string, description?: string) => {
    return showToast(title, { description, variant: 'warning' });
  }, [showToast]);

  const info = useCallback((title: string, description?: string) => {
    return showToast(title, { description, variant: 'info' });
  }, [showToast]);

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };
};
