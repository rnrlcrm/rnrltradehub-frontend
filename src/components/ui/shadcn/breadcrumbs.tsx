import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className }) => {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center space-x-1 text-sm', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            )}
            {isLast ? (
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {item.label}
              </span>
            ) : item.onClick ? (
              <button
                onClick={item.onClick}
                className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors"
              >
                {item.label}
              </button>
            ) : item.href ? (
              <a
                href={item.href}
                className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors"
              >
                {item.label}
              </a>
            ) : (
              <span className="text-neutral-600 dark:text-neutral-400">{item.label}</span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
