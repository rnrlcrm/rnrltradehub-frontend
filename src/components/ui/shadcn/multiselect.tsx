import * as React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Badge } from './badge';
import { Button } from './button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './dialog';

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  value?: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxDisplay?: number;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value = [],
  onChange,
  placeholder = 'Select items...',
  className,
  disabled = false,
  maxDisplay = 3,
}) => {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<string[]>(value);

  React.useEffect(() => {
    setSelected(value);
  }, [value]);

  const handleToggle = (optionValue: string) => {
    const newSelected = selected.includes(optionValue)
      ? selected.filter((v) => v !== optionValue)
      : [...selected, optionValue];
    
    setSelected(newSelected);
    onChange?.(newSelected);
  };

  const handleRemove = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = selected.filter((v) => v !== optionValue);
    setSelected(newSelected);
    onChange?.(newSelected);
  };

  const selectedOptions = options.filter((opt) => selected.includes(opt.value));
  const displayedOptions = selectedOptions.slice(0, maxDisplay);
  const remainingCount = selectedOptions.length - maxDisplay;

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          'w-full justify-start text-left font-normal h-auto min-h-[40px] py-2',
          !selected.length && 'text-neutral-400',
          className
        )}
        onClick={() => !disabled && setOpen(true)}
        disabled={disabled}
      >
        <div className="flex flex-wrap gap-1 w-full">
          {selected.length === 0 && <span>{placeholder}</span>}
          {displayedOptions.map((option) => (
            <Badge
              key={option.value}
              variant="secondary"
              className="mr-1"
            >
              {option.label}
              <button
                className="ml-1 ring-offset-white rounded-full outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRemove(option.value, e as any);
                  }
                }}
                onMouseDown={(e) => handleRemove(option.value, e)}
              >
                <X className="h-3 w-3 text-neutral-500 hover:text-neutral-700" />
              </button>
            </Badge>
          ))}
          {remainingCount > 0 && (
            <Badge variant="secondary">
              +{remainingCount} more
            </Badge>
          )}
        </div>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Items</DialogTitle>
          </DialogHeader>
          <div className="max-h-[300px] overflow-y-auto space-y-2 py-4">
            {options.map((option) => {
              const isSelected = selected.includes(option.value);
              return (
                <button
                  key={option.value}
                  className={cn(
                    'flex items-center justify-between w-full px-4 py-2 rounded-md text-sm transition-colors',
                    isSelected
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-200'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  )}
                  onClick={() => handleToggle(option.value)}
                >
                  <span>{option.label}</span>
                  {isSelected && <Check className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>
              Done ({selected.length} selected)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
