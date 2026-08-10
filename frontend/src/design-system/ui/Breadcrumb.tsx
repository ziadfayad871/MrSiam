import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Fragment } from 'react';
import { Link } from 'react-router-dom';

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumb({ items, className = '' }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="مسار الصفحة" className={`flex items-center gap-1.5 text-xs text-text-muted ${className}`}>
      {items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && <ChevronLeft size={12} className="opacity-50" />}
          {item.to ? (
            <Link to={item.to} className="transition-colors hover:text-gold">
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold text-text-secondary">{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}

export default Breadcrumb;
