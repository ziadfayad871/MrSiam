import type { ReactNode } from 'react';

export type BadgeVariant = 'gold' | 'neutral' | 'success' | 'warning' | 'error' | 'outline';

const VARIANTS: Record<BadgeVariant, string> = {
  gold: 'bg-gold/12 text-gold border border-gold/30',
  neutral: 'bg-surface-sunken text-text-secondary border border-border-subtle',
  success: 'bg-success-soft text-success border border-success/25',
  warning: 'bg-warning-soft text-warning border border-warning/25',
  error: 'bg-error-soft text-error border border-error/25',
  outline: 'bg-transparent text-text-secondary border border-border-soft',
};

export interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}

export function Badge({ variant = 'neutral', children, className = '', icon }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${VARIANTS[variant]} ${className}`}>
      {icon}
      {children}
    </span>
  );
}

export default Badge;
