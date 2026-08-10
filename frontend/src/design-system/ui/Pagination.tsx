import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, totalPages, onChange, className = '' }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );

  return (
    <nav className={`flex items-center justify-center gap-1.5 ${className}`} aria-label="ترقيم الصفحات">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-border-subtle text-text-secondary transition-colors hover:border-gold hover:text-gold disabled:opacity-40"
        aria-label="السابق"
      >
        <ChevronRight size={15} />
      </button>

      {pages.map((p, i) => (
        <span key={p} className="flex items-center">
          {i > 0 && pages[i - 1] !== p - 1 && <span className="px-1 text-text-muted">…</span>}
          <button
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors ${
              p === page
                ? 'border border-gold/40 bg-gold/10 font-bold text-gold'
                : 'border border-transparent text-text-secondary hover:border-border-soft hover:text-text-primary'
            }`}
          >
            {p}
          </button>
        </span>
      ))}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-border-subtle text-text-secondary transition-colors hover:border-gold hover:text-gold disabled:opacity-40"
        aria-label="التالي"
      >
        <ChevronLeft size={15} />
      </button>
    </nav>
  );
}

export default Pagination;
