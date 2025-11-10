import * as React from 'react';
import { History, Clock, User } from 'lucide-react';
import { cn } from '../../../lib/utils';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from './drawer';
import { Badge } from './badge';

export interface AuditEntry {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details?: string;
  changes?: {
    field: string;
    oldValue: string;
    newValue: string;
  }[];
}

export interface AuditDrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  entries: AuditEntry[];
  className?: string;
}

export const AuditDrawer: React.FC<AuditDrawerProps> = ({
  open,
  onOpenChange,
  title = 'Version History',
  entries,
  className,
}) => {
  const getActionColor = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('create')) return 'success';
    if (actionLower.includes('update') || actionLower.includes('edit')) return 'info';
    if (actionLower.includes('delete')) return 'error';
    return 'default';
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent side="right" className={cn('w-full sm:max-w-lg', className)}>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {title}
          </DrawerTitle>
          <DrawerDescription>
            Track changes and version history
          </DrawerDescription>
        </DrawerHeader>
        
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History className="h-12 w-12 text-neutral-400 mb-4" />
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                No audit history available
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Changes will appear here once modifications are made
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry, index) => (
                <div
                  key={entry.id}
                  className="relative pl-8 pb-4 border-l-2 border-neutral-200 dark:border-neutral-700 last:border-transparent"
                >
                  {/* Timeline dot */}
                  <div className="absolute left-[-9px] top-0 h-4 w-4 rounded-full bg-white dark:bg-neutral-950 border-2 border-primary-500" />
                  
                  {/* Content */}
                  <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge variant={getActionColor(entry.action) as any}>
                        {entry.action}
                      </Badge>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {entry.timestamp}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {entry.user}
                      </span>
                    </div>
                    
                    {entry.details && (
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                        {entry.details}
                      </p>
                    )}
                    
                    {entry.changes && entry.changes.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">
                          Changes
                        </p>
                        {entry.changes.map((change, changeIndex) => (
                          <div
                            key={changeIndex}
                            className="bg-neutral-50 dark:bg-neutral-800 rounded p-2 text-xs"
                          >
                            <div className="font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                              {change.field}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-error line-through">
                                {change.oldValue || '(empty)'}
                              </span>
                              <span className="text-neutral-400">→</span>
                              <span className="text-success font-medium">
                                {change.newValue || '(empty)'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

// Hook to manage audit drawer state
export const useAuditDrawer = () => {
  const [open, setOpen] = React.useState(false);
  const [entries, setEntries] = React.useState<AuditEntry[]>([]);

  const addEntry = (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => {
    const newEntry: AuditEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toLocaleString('en-IN', {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
    };
    setEntries((prev) => [newEntry, ...prev]);
  };

  const clearEntries = () => setEntries([]);

  return {
    open,
    setOpen,
    entries,
    addEntry,
    clearEntries,
  };
};
