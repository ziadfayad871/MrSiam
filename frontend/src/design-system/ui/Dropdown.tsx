import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode, Fragment } from 'react';
import { usePrefersReducedMotion } from '../motion/hooks';

export interface DropdownItem {
  label: string;
  onClick?: () => void;
  icon?: ReactNode;
  danger?: boolean;
  divider?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items?: DropdownItem[];
  content?: ReactNode;
  align?: 'start' | 'end';
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Dropdown({ trigger, items, content, align = 'end', className = '', open: controlledOpen, onOpenChange }: DropdownProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled ? onOpenChange ?? (() => {}) : setUncontrolledOpen;

  const reduced = usePrefersReducedMotion();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node) || contentRef.current?.contains(e.target as Node))
        return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, setOpen]);

  const triggerButton = (
    <button
      ref={triggerRef}
      type="button"
      onClick={() => setOpen(!open)}
      className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-sunken hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-gold/40"
      aria-expanded={open}
      aria-haspopup="true"
    >
      {trigger}
      <ChevronDown size={14} className={open ? 'rotate-180' : ''} />
    </button>
  );

  const dropdownContent = (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={contentRef}
          role="menu"
          className={`absolute z-50 mt-1.5 min-w-[200px] rounded-md border border-border-soft bg-surface-elevated shadow-floating ${align === 'end' ? 'end-0' : 'start-0'}`}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: 0.16 }}
        >
          <div className="py-1">
            {content ? (
              content
            ) : items?.map((item, i) => (
              <Fragment key={i}>
                {item.divider && i > 0 && <div className="my-1 border-t border-border-subtle" />}
                {item.divider ? null : (
                  <button
                    type="button"
                    onClick={() => { item.onClick?.(); setOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                      item.danger ? 'text-error hover:bg-error-soft' : 'text-text-secondary hover:bg-surface-sunken hover:text-text-primary'
                    }`}
                    role="menuitem"
                  >
                    {item.icon && <span className="shrink-0">{item.icon}</span>}
                    {item.label}
                  </button>
                )}
              </Fragment>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className={`relative inline-flex ${className}`}>
      {triggerButton}
      {dropdownContent}
    </div>
  );
}

export default Dropdown;