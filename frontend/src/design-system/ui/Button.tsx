import { motion, type HTMLMotionProps } from 'motion/react';
import type { ReactNode } from 'react';
import { usePrefersReducedMotion } from '../motion/hooks';

export type ButtonVariant = 'primary' | 'gold' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white hover:brightness-110 shadow-sm border border-transparent',
  gold:
    'bg-gold text-navy-deep font-bold hover:brightness-110 shadow-sm border border-gold-bright/40',
  outline:
    'border border-border-soft bg-transparent text-text-primary hover:border-gold hover:text-gold',
  ghost: 'bg-transparent text-text-secondary hover:bg-surface-sunken hover:text-text-primary',
  danger: 'bg-error text-white hover:brightness-110',
};

const SIZES: Record<ButtonSize, string> = {
  xs: 'px-2.5 py-1 text-xs gap-1.5',
  sm: 'px-3.5 py-1.5 text-sm gap-2',
  md: 'px-5 py-2.5 text-sm gap-2.5',
  lg: 'px-7 py-3.5 text-base gap-3',
};

/** Brand button — every interaction returns to the same motion language */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.button
      whileHover={reduced || disabled ? undefined : { y: -2 }}
      whileTap={reduced || disabled ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 420, damping: 24 }}
      disabled={disabled || loading}
      className={`relative inline-flex cursor-pointer select-none items-center justify-center overflow-hidden rounded-lg transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
      ) : (
        icon
      )}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}

export default Button;
