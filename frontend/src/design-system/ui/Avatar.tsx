import { motion } from 'motion/react';
import { usePrefersReducedMotion } from '../motion/hooks';

export interface AvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  src?: string;
  className?: string;
}

const SIZES = { xs: 'h-7 w-7 text-[10px]', sm: 'h-9 w-9 text-xs', md: 'h-11 w-11 text-sm', lg: 'h-16 w-16 text-xl' } as const;

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0]?.slice(0, 2) ?? '؟';
}

export function Avatar({ name, size = 'md', src, className = '' }: AvatarProps) {
  const reduced = usePrefersReducedMotion();

  if (src) {
    return <img src={src} alt={name} className={`rounded-full object-cover ${SIZES[size]} ${className}`} />;
  }

  return (
    <motion.span
      whileHover={reduced ? undefined : { scale: 1.06 }}
      className={`flex shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gradient-to-br from-primary-light to-primary-dark font-bold text-gold-bright ${SIZES[size]} ${className}`}
      aria-label={name}
    >
      {initials(name)}
    </motion.span>
  );
}

export default Avatar;
