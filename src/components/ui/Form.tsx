
import React from 'react';

export const FormRow: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2 items-center py-1.5 ${className}`}>{children}</div>
);

export const FormLabel: React.FC<{ htmlFor: string; children: React.ReactNode; className?: string }> = ({ htmlFor, children, className='' }) => (
  <label htmlFor={htmlFor} className={`block text-sm font-medium text-slate-700 md:text-right md:pr-4 ${className}`}>
    {children}
  </label>
);

type FormInputProps = React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> & {
    isReadOnly?: boolean;
    component?: 'input' | 'select' | 'textarea';
};

export const FormInput: React.FC<FormInputProps> = ({ isReadOnly = false, component = 'input', ...props }) => {
  const baseClasses = "block w-full border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm";
  const readOnlyClasses = "bg-slate-100 text-slate-500 cursor-not-allowed";
  const finalClassName = `${baseClasses} ${isReadOnly ? readOnlyClasses : ''} md:col-span-2`;

  const finalProps = { ...props, readOnly: isReadOnly, disabled: isReadOnly, className: finalClassName };

  if (component === 'select') {
    // @ts-ignore
    return <select {...finalProps}>{props.children}</select>;
  }
  if (component === 'textarea') {
    // @ts-ignore
    return <textarea {...finalProps} rows={props.rows || 3}></textarea>;
  }
  return <input {...finalProps} />;
};

export const FormActions: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="bg-slate-50 px-6 py-4 mt-8 -mx-6 -mb-6 border-t border-slate-200 flex flex-row-reverse items-center rounded-b-lg">
        {children}
    </div>
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }> = ({ variant = 'primary', ...props }) => {
    const baseClasses = "inline-flex items-center justify-center rounded-md border shadow-sm px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";
    
    const variantClasses = {
        primary: "border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
        secondary: "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-blue-500",
        danger: "border-transparent bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    };

    return (
        <button {...props} className={`${baseClasses} ${variantClasses[variant]} ${props.className || ''}`}>
            {props.children}
        </button>
    );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => {
    const baseClasses = "block w-full border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm";
    return <input {...props} className={`${baseClasses} ${props.className || ''}`} />;
};

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => {
    const baseClasses = "block w-full border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm";
    return <select {...props} className={`${baseClasses} ${props.className || ''}`}>{props.children}</select>;
};
