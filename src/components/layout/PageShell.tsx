import React from 'react';
import { cn } from '../../../lib/utils';
import { Breadcrumbs, BreadcrumbItem } from '../shadcn/breadcrumbs';

export interface PageShellProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

/**
 * PageShell component provides a consistent layout structure for all pages
 * Following ERP design system guidelines with breadcrumbs, title, and action area
 */
export const PageShell: React.FC<PageShellProps> = ({
  children,
  title,
  description,
  breadcrumbs,
  actions,
  className,
}) => {
  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {/* Header Section */}
      {(breadcrumbs || title || description || actions) && (
        <div className="flex flex-col gap-4">
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <Breadcrumbs items={breadcrumbs} />
          )}

          {/* Title and Actions Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              {title && (
                <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
                  {title}
                </h1>
              )}
              {description && (
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {description}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};
