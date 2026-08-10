import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { usePrefersReducedMotion } from '../motion/hooks';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-3xl' } as const;

export function Modal({ open, onClose, title, children, footer, size = 'md', className = '' }: ModalProps) {
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

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <motion.button
            aria-label="إغلاق"
            className="absolute inset-0 cursor-default bg-navy-deep/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className={`relative w-full rounded-lg border border-border-soft bg-surface-elevated shadow-floating ${SIZES[size]} ${className}`}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
              <h3 className="text-base font-bold text-text-primary">{title}</h3>
              <button
                onClick={onClose}
                className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-surface-sunken hover:text-text-primary"
                aria-label="إغلاق"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5">{children}</div>
            {footer && <div className="flex justify-end gap-3 border-t border-border-subtle px-6 py-4">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default Modal;
