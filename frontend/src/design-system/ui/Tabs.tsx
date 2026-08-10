import { motion } from 'motion/react';
import { useId, type ReactNode } from 'react';

export interface TabsProps {
  items: { key: string; label: ReactNode; icon?: ReactNode }[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}

/** Tabs with the gold indicator — a small compass line marks the active tab */
export function Tabs({ items, active, onChange, className = '' }: TabsProps) {
  const id = useId();

  return (
    <div className={`flex gap-1 overflow-x-auto rounded-md border border-border-subtle bg-surface p-1 ${className}`} role="tablist">
      {items.map((item) => {
        const isActive = item.key === active;
        return (
          <button
            key={item.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.key)}
            className={`relative flex items-center gap-2 whitespace-nowrap rounded px-4 py-2 text-sm transition-colors ${
              isActive ? 'font-semibold text-gold' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId={`tab-${id}`}
                className="absolute inset-0 rounded bg-gold/10"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              />
            )}
            {item.icon && <span className="relative">{item.icon}</span>}
            <span className="relative">{item.label}</span>
            {isActive && <motion.span layoutId={`tabline-${id}`} className="absolute bottom-1 h-[2px] w-6 rounded-full bg-gold" />}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
