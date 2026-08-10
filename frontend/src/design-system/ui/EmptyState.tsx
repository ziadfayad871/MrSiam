import { motion } from 'motion/react';
import { Compass } from '../components/Compass';
import { Button } from './Button';
import { usePrefersReducedMotion } from '../motion/hooks';

export interface EmptyStateProps {
  icon?: 'compass' | 'map' | 'scroll' | 'trophy';
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

/** Empty states in the brand language — a compass with no destination */
export function EmptyState({ icon = 'compass', title, description, actionLabel, onAction, className = '' }: EmptyStateProps) {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.div
      className={`flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border-soft bg-surface/50 px-8 py-14 text-center ${className}`}
      initial={reduced ? undefined : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {icon === 'compass' ? (
        <Compass size="large" direction="n" className="opacity-70" />
      ) : (
        <span className="font-historical text-4xl text-gold opacity-70">
          {icon === 'map' ? '🗺' : icon === 'scroll' ? '📜' : '🏅'}
        </span>
      )}
      <div>
        <h3 className="text-base font-bold text-text-primary">{title}</h3>
        {description && <p className="mt-1.5 text-sm text-text-muted">{description}</p>}
      </div>
      {actionLabel && onAction && <Button variant="gold" size="sm" onClick={onAction}>{actionLabel}</Button>}
    </motion.div>
  );
}

export default EmptyState;
