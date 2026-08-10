import { Check } from 'lucide-react';
import { useId, type InputHTMLAttributes } from 'react';

export function Checkbox({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <label className={`inline-flex cursor-pointer select-none items-center gap-2.5 text-sm text-text-primary ${className}`}>
      <span className="relative">
        <input id={id} type="checkbox" className="peer sr-only" {...rest} />
        <span className="block h-5 w-5 rounded border border-border-soft bg-surface-elevated transition-colors peer-checked:border-gold peer-checked:bg-gold peer-checked:shadow-[0_0_10px_var(--gold-glow)] peer-focus-visible:outline-2 peer-focus-visible:outline-gold">
          <Check size={13} className="hidden text-navy-deep peer-checked:block" strokeWidth={3} />
        </span>
      </span>
      <span className="flex-1">{rest['aria-label'] ?? 'اختيار'}</span>
    </label>
  );
}

export function Radio({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <label className={`inline-flex cursor-pointer select-none items-center gap-2.5 text-sm text-text-primary ${className}`}>
      <span className="relative">
        <input id={id} type="radio" className="peer sr-only" {...rest} />
        <span className="block h-5 w-5 rounded-full border border-border-soft bg-surface-elevated transition-colors peer-checked:border-gold">
          <span className="absolute inset-1 rounded-full bg-gold opacity-0 transition-opacity peer-checked:opacity-100" />
        </span>
      </span>
      <span className="flex-1">{rest['aria-label'] ?? 'اختيار'}</span>
    </label>
  );
}

export default Checkbox;
