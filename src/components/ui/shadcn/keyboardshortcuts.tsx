import * as React from 'react';
import { Keyboard, Command } from 'lucide-react';
import { cn } from '../../../lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './dialog';

export interface KeyboardShortcut {
  id: string;
  keys: string[];
  description: string;
  category?: string;
  action: () => void;
}

export interface KeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  shortcuts,
  open: controlledOpen,
  onOpenChange,
}) => {
  const [open, setOpen] = React.useState(false);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : open;

  const handleOpenChange = (newOpen: boolean) => {
    if (isControlled) {
      onOpenChange?.(newOpen);
    } else {
      setOpen(newOpen);
    }
  };

  // Group shortcuts by category
  const groupedShortcuts = React.useMemo(() => {
    const groups: Record<string, KeyboardShortcut[]> = {};
    shortcuts.forEach((shortcut) => {
      const category = shortcut.category || 'General';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(shortcut);
    });
    return groups;
  }, [shortcuts]);

  // Show shortcuts dialog with ?
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !isOpen) {
        e.preventDefault();
        handleOpenChange(true);
      } else if (e.key === 'Escape' && isOpen) {
        handleOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const renderKey = (key: string) => {
    // Format special keys
    const formattedKey = key
      .replace('Ctrl', '⌃')
      .replace('Cmd', '⌘')
      .replace('Shift', '⇧')
      .replace('Alt', '⌥')
      .replace('Meta', '⌘');

    return (
      <kbd className="px-2 py-1 text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded">
        {formattedKey}
      </kbd>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[500px] overflow-y-auto space-y-6 py-4">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut) => (
                  <div
                    key={shortcut.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900"
                  >
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, index) => (
                        <React.Fragment key={index}>
                          {index > 0 && (
                            <span className="text-xs text-neutral-400 mx-1">+</span>
                          )}
                          {renderKey(key)}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
            Press <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 rounded">?</kbd> to toggle this dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Hook to register and manage keyboard shortcuts
export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if any shortcut matches
      for (const shortcut of shortcuts) {
        const keysMatch = shortcut.keys.every((key) => {
          const lowerKey = key.toLowerCase();
          if (lowerKey === 'ctrl') return e.ctrlKey;
          if (lowerKey === 'cmd' || lowerKey === 'meta') return e.metaKey;
          if (lowerKey === 'shift') return e.shiftKey;
          if (lowerKey === 'alt') return e.altKey;
          return e.key.toLowerCase() === lowerKey;
        });

        if (keysMatch) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);

  return { open, setOpen };
};
