import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const CONFIRM_MSG = 'فيه بيانات مكتوبة ومتسجلتش — متأكد إنك عايز تسيب الصفحة؟';

/**
 * يحذّر المستخدم قبل الخروج من صفحة فيها بيانات متسجلتش:
 * - refresh / إغلاق التبويب (beforeunload)
 * - زرار الرجوع/التقدم في المتصفح (popstate)
 * - اللينكات الداخلية (سايد بار، اللوجو، ...)
 * - التنقل البرمجي عبر navigateGuarded
 *
 * بعد الحفظ الناجح استخدم disarm() عشان الخروج يعدّي من غير تحذير.
 */
export function useUnsavedGuard(dirty: boolean) {
  const dirtyRef = useRef(dirty);
  const location = useLocation();
  const navigate = useNavigate();
  const locationRef = useRef(location);
  locationRef.current = location;

  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  const confirmLeave = useCallback(() => (dirtyRef.current ? window.confirm(CONFIRM_MSG) : true), []);

  // Refresh / إغلاق التبويب
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  // زرار الرجوع/التقدم في المتصفح
  useEffect(() => {
    if (!dirty) return;
    const handler = () => {
      if (!confirmLeave()) {
        const { pathname, search, hash } = locationRef.current;
        window.history.pushState(null, '', pathname + search + hash);
      }
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [dirty, confirmLeave]);

  // اللينكات الداخلية (سايد بار، اللوجو، ...)
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as Element | null)?.closest?.('a[href]');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      const current = locationRef.current.pathname + locationRef.current.search + locationRef.current.hash;
      if (href === current) return;
      if (!confirmLeave()) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [dirty, confirmLeave]);

  // تنقل برمجي بحراسة — للأزرار اللي بنكتبها إحنا (إلغاء، رجوع للمحتوى)
  const navigateGuarded = useCallback(
    (to: string) => {
      if (!confirmLeave()) return;
      navigate(to);
    },
    [confirmLeave, navigate],
  );

  const disarm = useCallback(() => {
    dirtyRef.current = false;
  }, []);

  return { disarm, navigateGuarded };
}
