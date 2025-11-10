/**
 * Custom Dialog Components
 * 
 * Replaces native window.alert and window.confirm with accessible,
 * styled dialog components using Radix UI
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '../ui/Form';

// ============================================================================
// TYPES
// ============================================================================

interface AlertDialogProps {
  title: string;
  message: string;
  onClose: () => void;
}

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
  onCancel: () => void;
}

interface DialogContextType {
  showAlert: (title: string, message: string) => Promise<void>;
  showConfirm: (title: string, message: string, options?: {
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
  }) => Promise<boolean>;
}

// ============================================================================
// ALERT DIALOG COMPONENT
// ============================================================================

const AlertDialog: React.FC<AlertDialogProps> = ({ title, message, onClose }) => {
  return (
    <Dialog.Root open={true} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg">
          <div className="flex flex-col space-y-2">
            <Dialog.Title className="text-lg font-semibold text-slate-900">
              {title}
            </Dialog.Title>
            <Dialog.Description className="text-sm text-slate-600">
              {message}
            </Dialog.Description>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              OK
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

// ============================================================================
// CONFIRM DIALOG COMPONENT
// ============================================================================

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog.Root open={true} onOpenChange={onCancel}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg">
          <div className="flex flex-col space-y-2">
            <Dialog.Title className="text-lg font-semibold text-slate-900">
              {title}
            </Dialog.Title>
            <Dialog.Description className="text-sm text-slate-600">
              {message}
            </Dialog.Description>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              onClick={onCancel}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800"
            >
              {cancelText}
            </Button>
            <Button
              onClick={onConfirm}
              className={
                variant === 'destructive'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }
            >
              {confirmText}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

// ============================================================================
// DIALOG CONTEXT & PROVIDER
// ============================================================================

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alertDialog, setAlertDialog] = useState<{
    title: string;
    message: string;
    resolve: () => void;
  } | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    options?: {
      confirmText?: string;
      cancelText?: string;
      variant?: 'default' | 'destructive';
    };
    resolve: (value: boolean) => void;
  } | null>(null);

  const showAlert = (title: string, message: string): Promise<void> => {
    return new Promise((resolve) => {
      setAlertDialog({ title, message, resolve });
    });
  };

  const showConfirm = (
    title: string,
    message: string,
    options?: {
      confirmText?: string;
      cancelText?: string;
      variant?: 'default' | 'destructive';
    }
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmDialog({ title, message, options, resolve });
    });
  };

  const handleAlertClose = () => {
    if (alertDialog) {
      alertDialog.resolve();
      setAlertDialog(null);
    }
  };

  const handleConfirmAccept = () => {
    if (confirmDialog) {
      confirmDialog.resolve(true);
      setConfirmDialog(null);
    }
  };

  const handleConfirmCancel = () => {
    if (confirmDialog) {
      confirmDialog.resolve(false);
      setConfirmDialog(null);
    }
  };

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {alertDialog && (
        <AlertDialog
          title={alertDialog.title}
          message={alertDialog.message}
          onClose={handleAlertClose}
        />
      )}
      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.options?.confirmText}
          cancelText={confirmDialog.options?.cancelText}
          variant={confirmDialog.options?.variant}
          onConfirm={handleConfirmAccept}
          onCancel={handleConfirmCancel}
        />
      )}
    </DialogContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useDialog = (): DialogContextType => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within DialogProvider');
  }
  return context;
};

// Export for direct use if needed
export { AlertDialog, ConfirmDialog };
