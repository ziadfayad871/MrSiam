import type { ReactNode } from 'react';

export type CardVariant = 'plain' | 'course' | 'lesson' | 'exam' | 'achievement' | 'map' | 'stats';

export interface CardProps {
  variant?: CardVariant;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

const VARIANTS: Record<CardVariant, string> = {
  plain: '',
  course: '',
  lesson: '',
  exam: '',
  achievement: '',
  map: '',
  stats: '',
};

/** One card language: same spacing, borders, hover — themed per variant */
export function Card({ variant = 'plain', children, className = '', onClick, hoverable = false }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl border border-border-gold/55 bg-surface/90 p-5 shadow-sm backdrop-blur-sm transition-all duration-300 ${
        hoverable
          ? 'hover:-translate-y-1.5 hover:border-gold/50 hover:shadow-md'
          : ''
      } ${VARIANTS[variant]} ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export default Card;
