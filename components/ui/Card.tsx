
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  actions?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, className = '', title, actions }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-slate-200/80 ${className}`}>
      {(title || actions) && (
        <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200/80 flex justify-between items-center">
          {title && <h3 className="text-lg font-semibold text-slate-800">{title}</h3>}
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default Card;
