import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

const baseField =
  'w-full rounded-md border border-border-subtle bg-surface-elevated px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-200 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20';

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  icon?: ReactNode;
  className?: string;
}

export function FieldShell({ label, hint, error, required, icon, className = '', children }: FieldProps & { children: ReactNode }) {
  const id = useId();
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-text-secondary">
          {label}
          {required && <span className="ms-0.5 text-gold">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-text-muted">{icon}</span>}
        {children}
      </div>
      {error ? (
        <p className="text-xs text-error">{error}</p>
      ) : hint ? (
        <p className="text-xs text-text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ label, hint, error, required, icon, className = '', ...rest }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} icon={icon} className={className}>
      <input className={`${baseField} ${icon ? 'ps-10' : ''}`} {...rest} />
    </FieldShell>
  );
}

export function Textarea({ label, hint, error, required, className = '', ...rest }: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} className={className}>
      <textarea className={`${baseField} min-h-24 resize-y`} {...rest} />
    </FieldShell>
  );
}

export function Select({ label, hint, error, required, icon, className = '', children, ...rest }: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} icon={icon} className={className}>
      <select className={`${baseField} appearance-none ${icon ? 'ps-10' : ''} ${error ? 'border-error' : ''}`} {...rest}>
        {children}
      </select>
    </FieldShell>
  );
}

export default Input;
