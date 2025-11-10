import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary-500 text-white',
        secondary: 'border-transparent bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50',
        success: 'border-transparent bg-success-light text-success-dark dark:bg-success dark:text-white',
        warning: 'border-transparent bg-warning-light text-warning-dark dark:bg-warning dark:text-white',
        error: 'border-transparent bg-error-light text-error-dark dark:bg-error dark:text-white',
        info: 'border-transparent bg-info-light text-info-dark dark:bg-info dark:text-white',
        outline: 'text-neutral-700 border-neutral-300 dark:text-neutral-300 dark:border-neutral-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
