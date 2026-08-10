import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { Reveal } from '../motion/Reveal';
import CoordinateLabel from './CoordinateLabel';

export interface HistoricalSectionHeaderProps {
  /** e.g. "01" */
  number: string;
  /** Arabic title — e.g. "رحلة التاريخ" */
  title: string;
  /** Latin subtitle — e.g. "THE HISTORY JOURNEY" */
  subtitle: string;
  /** Left/right coordinate details */
  coordinates?: string;
  children?: ReactNode;
  align?: 'start' | 'center';
  className?: string;
}

/** Editorial section header with coordinates and an animated gold line */
export function HistoricalSectionHeader({
  number,
  title,
  subtitle,
  align = 'start',
  className = '',
  children,
}: HistoricalSectionHeaderProps) {
  const centered = align === 'center';

  return (
    <Reveal className={className}>
      <div className={centered ? 'flex flex-col items-center text-center' : 'text-start'}>
        <div className="flex items-center gap-4">
          <span className="font-historical text-lg font-bold tracking-[0.2em] text-gold opacity-80">{number}</span>
          <span className="h-px w-10 bg-border-gold" />
          <span className="font-plex text-[11px] font-semibold uppercase tracking-[0.3em] text-text-muted" dir="ltr">
            {subtitle}
          </span>
        </div>

        <h2 className="display-serif mt-3 text-3xl font-bold leading-snug text-text-primary sm:text-4xl">{title}</h2>

        <div className="mt-4 flex items-center gap-3">
          <motion.span
            className="h-[2px] w-16 origin-right rounded-full bg-gold"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          />
          <span className="h-[2px] w-6 rounded-full bg-border-gold" />
        </div>

        {children && <div className="mt-6 max-w-2xl text-text-secondary">{children}</div>}
      </div>
    </Reveal>
  );
}

export default HistoricalSectionHeader;
