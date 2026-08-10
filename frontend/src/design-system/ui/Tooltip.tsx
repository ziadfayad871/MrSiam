import { AnimatePresence, motion } from 'motion/react';
import { useRef, useState, type ReactNode } from 'react';
import { usePrefersReducedMotion } from '../motion/hooks';

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'start' | 'end';
  className?: string;
}

export function Tooltip({ content, children, side = 'top', className = '' }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const reduced = usePrefersReducedMotion();
  const wrapper = useRef<HTMLSpanElement>(null);

  const sideClass =
    side === 'top'
      ? 'bottom-full mb-2'
      : side === 'bottom'
        ? 'top-full mt-2'
        : side === 'start'
          ? 'end-full me-2'
          : 'start-full ms-2';

  return (
    <span
      ref={wrapper}
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      <AnimatePresence>
        {open && (
          <motion.span
            role="tooltip"
            className={`pointer-events-none absolute z-50 whitespace-nowrap rounded-md border border-border-soft bg-surface-elevated px-2.5 py-1.5 text-xs text-text-primary shadow-md ${sideClass}`}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
          >
            {content}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

export default Tooltip;
