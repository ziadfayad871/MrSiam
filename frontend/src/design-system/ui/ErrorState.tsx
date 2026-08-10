import { motion } from 'motion/react';
import { Compass } from '../components/Compass';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

/** Brand error state — "البوصلة لخبطت شوية" */
export function ErrorState({
  title = 'واضح إن البوصلة لخبطت شوية.',
  description = 'حصل خطأ غير متوقع. جرب تاني وشوف لو الرحلة كملت.',
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <motion.div
      className={`flex flex-col items-center justify-center gap-5 px-8 py-16 text-center ${className}`}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative">
        <Compass size="large" direction="s" className="opacity-80" />
        <motion.span
          className="pointer-events-none absolute inset-0 rounded-full border-2 border-dashed border-error/40"
          animate={{ rotate: 360 }}
          transition={{ duration: 14, ease: 'linear', repeat: Infinity }}
        />
      </div>
      <div>
        <h3 className="text-lg font-bold text-text-primary">{title}</h3>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-text-muted">{description}</p>
      </div>
      {onRetry && <Button variant="gold" onClick={onRetry}>جرب تاني</Button>}
    </motion.div>
  );
}

export default ErrorState;
