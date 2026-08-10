import { motion } from 'motion/react';
import { Compass } from './Compass';

export interface CompassLoaderProps {
  text?: string;
  className?: string;
}

/** Brand loading state — "بنجهز رحلتك التعليمية..." */
export function CompassLoader({ text = 'بنجهز رحلتك التعليمية...', className = '' }: CompassLoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-5 ${className}`} role="status" aria-live="polite">
      <div className="relative">
        <Compass size="loading" animated route />
      </div>
      <motion.p
        className="font-plex text-sm tracking-wide text-text-muted"
        animate={{ opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {text}
      </motion.p>
    </div>
  );
}

export default CompassLoader;
