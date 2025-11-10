import * as React from 'react';
import { Command } from 'lucide-react';
import { cn } from '../../../lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Input } from './input';

export interface QuickAction {
  id: string;
  label: string;
  description?: string;
  icon?: React.ElementType;
  keywords?: string[];
  onSelect: () => void;
}

export interface QuickActionsPanelProps {
  actions: QuickAction[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({
  actions,
  open: controlledOpen,
  onOpenChange,
}) => {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : open;

  const handleOpenChange = (newOpen: boolean) => {
    if (isControlled) {
      onOpenChange?.(newOpen);
    } else {
      setOpen(newOpen);
    }
    if (!newOpen) {
      setSearch('');
      setSelectedIndex(0);
    }
  };

  // Filter actions based on search
  const filteredActions = React.useMemo(() => {
    if (!search) return actions;
    
    const searchLower = search.toLowerCase();
    return actions.filter((action) => {
      const labelMatch = action.label.toLowerCase().includes(searchLower);
      const descMatch = action.description?.toLowerCase().includes(searchLower);
      const keywordMatch = action.keywords?.some((kw) => 
        kw.toLowerCase().includes(searchLower)
      );
      return labelMatch || descMatch || keywordMatch;
    });
  }, [actions, search]);

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) {
        // Cmd+K or Ctrl+Shift+P to open
        if ((e.metaKey || e.ctrlKey) && e.key === 'k' && e.shiftKey) {
          e.preventDefault();
          handleOpenChange(true);
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < filteredActions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter' && filteredActions[selectedIndex]) {
        e.preventDefault();
        filteredActions[selectedIndex].onSelect();
        handleOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredActions, selectedIndex]);

  // Reset selected index when search changes
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="p-0 max-w-2xl">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Command className="h-5 w-5" />
            Quick Actions
          </DialogTitle>
        </DialogHeader>
        <div className="p-4 pt-0">
          <Input
            type="text"
            placeholder="Search actions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-4"
            autoFocus
          />
          <div className="max-h-[400px] overflow-y-auto space-y-1">
            {filteredActions.length === 0 ? (
              <div className="py-8 text-center text-sm text-neutral-500">
                No actions found
              </div>
            ) : (
              filteredActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-md text-left transition-colors',
                      index === selectedIndex
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-200'
                        : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    )}
                    onClick={() => {
                      action.onSelect();
                      handleOpenChange(false);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    {Icon && (
                      <Icon className="h-5 w-5 flex-shrink-0 text-neutral-500 dark:text-neutral-400" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{action.label}</div>
                      {action.description && (
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                          {action.description}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
              Press <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 rounded">↑</kbd>{' '}
              <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 rounded">↓</kbd> to navigate,{' '}
              <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 rounded">Enter</kbd> to select,{' '}
              <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 rounded">Esc</kbd> to close
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Hook to use quick actions panel
export const useQuickActions = () => {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k' && e.shiftKey) {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { open, setOpen };
};
