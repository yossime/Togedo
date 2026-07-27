import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div>
        <input
          className={cn(
            'input-field',
            error && 'ring-red-300 focus:ring-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="error-text">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div>
        <textarea
          className={cn(
            'input-field min-h-[80px]',
            error && 'ring-red-300 focus:ring-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="error-text">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <div>
        <select
          className={cn(
            'input-field',
            error && 'ring-red-300 focus:ring-red-500',
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        {error && <p className="error-text">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, required, ...props }, ref) => {
    return (
      <label className={cn('form-label', className)} ref={ref} {...props}>
        {children}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
    );
  }
);
Label.displayName = 'Label';

export interface FormFieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FormField({ label, error, required, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      {label && <Label required={required}>{label}</Label>}
      {children}
      {error && <p className="error-text">{error}</p>}
    </div>
  );
} 