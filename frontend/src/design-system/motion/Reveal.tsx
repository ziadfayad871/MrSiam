import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { fadeUp } from './presets';

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  /** Direction variants for scroll choreography */
  as?: 'div' | 'section' | 'li' | 'span';
  once?: boolean;
}

/** Scroll-triggered reveal — the standard entrance for all content blocks */
export function Reveal({ children, delay = 0, className, as = 'div', once = true }: RevealProps) {
  const Tag = motion[as] as typeof motion.div;

  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-64px' }}
      transition={fadeUp.visible(delay)}
    >
      {children}
    </Tag>
  );
}

export default Reveal;
