import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const spinnerVariants = cva(
  'animate-spin',
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        default: 'h-6 w-6',
        lg: 'h-8 w-8',
        xl: 'h-12 w-12',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

export interface SpinnerProps
  extends React.HTMLAttributes<SVGElement>,
    VariantProps<typeof spinnerVariants> {
  label?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ 
  className, 
  size, 
  label = 'Loading...',
  ...props 
}) => {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <Loader2 
        className={cn(spinnerVariants({ size }), className)} 
        aria-label={label}
        {...props}
      />
      {label && (
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          {label}
        </span>
      )}
    </div>
  );
};

export const InlineSpinner: React.FC<Omit<SpinnerProps, 'label'>> = ({ 
  className, 
  size, 
  ...props 
}) => {
  return (
    <Loader2 
      className={cn(spinnerVariants({ size }), className)} 
      {...props}
    />
  );
};
