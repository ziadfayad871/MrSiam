import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { usePrefersReducedMotion } from '../motion/hooks';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  side?: 'start' | 'end';
  className?: string;
}

/** RTL-aware drawer (side: 'start' = right in RTL) */
export function Drawer({ open, onClose, title, children, side = 'end', className = '' }: DrawerProps) {
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const x = side === 'end' ? '100%' : '-100%';

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80]">
          <motion.button
            aria-label="إغلاق"
            className="absolute inset-0 cursor-default bg-navy-deep/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className={`absolute inset-y-0 ${side === 'end' ? 'end-0' : 'start-0'} flex w-full max-w-sm flex-col border-s border-border-subtle bg-surface-elevated shadow-floating ${className}`}
            initial={reduced ? { opacity: 0 } : { x }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduced ? { opacity: 0 } : { x }}
            transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
              <h3 className="text-base font-bold text-text-primary">{title}</h3>
              <button
                onClick={onClose}
                className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-surface-sunken hover:text-text-primary"
                aria-label="إغلاق"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

export default Drawer;
