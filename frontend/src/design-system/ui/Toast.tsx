import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle, type LucideIcon } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { usePrefersReducedMotion } from '../motion/hooks';

export type ToastTone = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastContextValue {
  toast: (title: string, description?: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => undefined });
export const useToast = () => useContext(ToastContext);

const TONES: Record<ToastTone, { icon: LucideIcon; color: string }> = {
  success: { icon: CheckCircle2, color: 'text-success' },
  error: { icon: XCircle, color: 'text-error' },
  warning: { icon: AlertTriangle, color: 'text-warning' },
  info: { icon: Info, color: 'text-gold' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const reduced = usePrefersReducedMotion();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (title: string, description?: string, tone: ToastTone = 'info') => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev.slice(-3), { id, title, description, tone }]);
      setTimeout(() => remove(id), 4200);
    },
    [remove],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-6 start-1/2 z-[95] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4" dir="rtl">
        <AnimatePresence>
          {toasts.map((t) => {
            const Tone = TONES[t.tone];
            return (
              <motion.div
                key={t.id}
                className="pointer-events-auto flex items-start gap-3 rounded-lg border border-border-soft bg-surface-elevated p-4 shadow-floating"
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.97 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                role="status"
              >
                <Tone.icon size={19} className={`mt-0.5 shrink-0 ${Tone.color}`} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-text-primary">{t.title}</p>
                  {t.description && <p className="mt-0.5 text-xs text-text-secondary">{t.description}</p>}
                </div>
                <button onClick={() => remove(t.id)} className="text-text-muted hover:text-text-primary" aria-label="إغلاق">
                  <X size={15} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
