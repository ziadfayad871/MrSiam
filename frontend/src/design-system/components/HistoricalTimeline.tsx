import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { usePrefersReducedMotion } from '../motion/hooks';

export type TimelineState = 'completed' | 'current' | 'locked' | 'default';

export interface TimelineItemData {
  id: string;
  year?: string | number;
  title: string;
  description?: string;
  state?: TimelineState;
  content?: ReactNode;
}

export interface HistoricalTimelineProps {
  items: TimelineItemData[];
  variant?: 'vertical' | 'horizontal';
  className?: string;
  renderItem?: (item: TimelineItemData) => ReactNode;
}

/** Brand timeline: the line draws as you scroll, nodes activate on entry */
export function HistoricalTimeline({ items, variant = 'vertical', className = '', renderItem }: HistoricalTimelineProps) {
  const reduced = usePrefersReducedMotion();

  if (variant === 'horizontal') {
    return (
      <div className={`relative ${className}`}>
        <motion.div
          className="absolute inset-x-6 top-1/2 h-[2px] origin-center -translate-y-1/2 rounded-full bg-border-subtle"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.div
          className="absolute inset-x-6 top-1/2 h-[2px] origin-center -translate-y-1/2 rounded-full bg-gold"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ boxShadow: '0 0 12px var(--gold-glow)' }}
        />
        <div className="relative flex justify-between">
          {items.map((item, i) => (
            <TimelineNode key={item.id} item={item} index={i} horizontal reduced={reduced} renderItem={renderItem} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* The route */}
      <div className="absolute inset-y-0 start-4 w-[2px] rounded-full bg-border-subtle sm:start-1/2" />

      <motion.div
        className="absolute inset-y-0 start-4 w-[2px] origin-top rounded-full bg-gradient-to-b from-gold via-gold to-gold-bright sm:start-1/2"
        style={{ boxShadow: '0 0 12px var(--gold-glow)' }}
        initial={reduced ? undefined : { scaleY: 0 }}
        whileInView={reduced ? undefined : { scaleY: 1 }}
        viewport={{ once: false, margin: '-40px' }}
        transition={{ duration: 1.8, ease: 'easeInOut' }}
      />

      <div className="space-y-12">
        {items.map((item, i) => (
          <TimelineRow key={item.id} item={item} index={i} reduced={reduced} renderItem={renderItem} />
        ))}
      </div>
    </div>
  );
}

function TimelineNode({
  item,
  index,
  horizontal,
  reduced,
  renderItem,
}: {
  item: TimelineItemData;
  index: number;
  horizontal?: boolean;
  reduced: boolean;
  renderItem?: (item: TimelineItemData) => ReactNode;
}) {
  const state = item.state ?? 'default';

  return (
    <motion.div
      initial={reduced ? undefined : { opacity: 0, y: 18 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-48px' }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: index * 0.05 }}
      className="group relative"
    >
      {/* Node */}
      <span
        className={`absolute top-5 start-4 -translate-x-1/2 sm:start-1/2 ${
          horizontal ? 'static translate-x-0' : ''
        }`}
      >
        <motion.span
          className="block rounded-full border-2"
          style={{
            width: state === 'current' ? 18 : 14,
            height: state === 'current' ? 18 : 14,
            borderColor:
              state === 'completed' || state === 'current' ? 'var(--gold-accent)' : 'var(--border-soft)',
            background:
              state === 'completed'
                ? 'var(--gold-accent)'
                : state === 'current'
                  ? 'var(--surface-elevated)'
                  : 'var(--surface)',
          }}
          whileInView={!reduced && state === 'current' ? { scale: [1, 1.25, 1] } : undefined}
          viewport={{ once: false }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        {state === 'current' && (
          <span className="absolute inset-0 rounded-full" style={{ animation: 'pulse-ring 2.4s ease-out infinite' }} />
        )}
      </span>

      {renderItem ? (
        renderItem(item)
      ) : (
        <div
          className={`ms-12 sm:ms-0 ${
            index % 2 === 0 ? 'sm:pe-[calc(50%+2rem)]' : 'sm:ps-[calc(50%+2rem)]'
          } ${index % 2 === 0 ? '' : 'sm:text-start'}`}
        >
          <div
            className={`rounded-lg border border-border-subtle bg-surface p-5 shadow-sm transition-shadow duration-300 hover:shadow-md ${
              state === 'locked' ? 'opacity-45' : ''
            }`}
          >
            {item.year !== undefined && (
              <span className="font-historical text-lg font-bold text-gold">{item.year}</span>
            )}
            <h4 className="mt-1 font-semibold text-text-primary">{item.title}</h4>
            {item.description && <p className="mt-1 text-sm leading-relaxed text-text-secondary">{item.description}</p>}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function TimelineRow({
  item,
  index,
  reduced,
  renderItem,
}: {
  item: TimelineItemData;
  index: number;
  reduced: boolean;
  renderItem?: (item: TimelineItemData) => ReactNode;
}) {
  return <TimelineNode item={item} index={index} reduced={reduced} renderItem={renderItem} />;
}

export default HistoricalTimeline;
