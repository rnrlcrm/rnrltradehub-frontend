import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '../../../lib/utils';

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-neutral-950 dark:[&>svg]:text-neutral-50',
  {
    variants: {
      variant: {
        default: 'bg-white text-neutral-950 dark:bg-neutral-950 dark:text-neutral-50 border-neutral-200 dark:border-neutral-800',
        success: 'border-success-light bg-success-light/50 text-success-dark dark:border-success dark:bg-success/20 [&>svg]:text-success-dark dark:[&>svg]:text-success',
        warning: 'border-warning-light bg-warning-light/50 text-warning-dark dark:border-warning dark:bg-warning/20 [&>svg]:text-warning-dark dark:[&>svg]:text-warning',
        error: 'border-error-light bg-error-light/50 text-error-dark dark:border-error dark:bg-error/20 [&>svg]:text-error-dark dark:[&>svg]:text-error',
        info: 'border-info-light bg-info-light/50 text-info-dark dark:border-info dark:bg-info/20 [&>svg]:text-info-dark dark:[&>svg]:text-info',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, children, ...props }, ref) => {
  const icons = {
    default: Info,
    success: CheckCircle2,
    warning: AlertCircle,
    error: XCircle,
    info: Info,
  };

  const Icon = variant ? icons[variant] : icons.default;

  return (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <Icon className="h-4 w-4" />
      {children}
    </div>
  );
});
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-medium leading-none tracking-tight', className)}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm [&_p]:leading-relaxed', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
