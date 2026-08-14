'use client';

import {
  Award,
  CalendarDays,
  FileText,
  GraduationCap,
  Home,
  LayoutGrid,
  Library,
  LogOut,
  Map,
  Medal,
  MessageSquareQuote,
  Moon,
  Plus,
  ScrollText,
  Settings2,
  Sun,
  Trophy,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { Avatar } from '../design-system/ui/Avatar';
import { Button } from '../design-system/ui/Button';
import { BrandLogo } from '../design-system/components/BrandLogo';
import { ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePrefersReducedMotion } from '../design-system/motion/hooks';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  collapsed: boolean;
  onCollapseChange: (collapsed: boolean) => void;
}

export function Sidebar({ isOpen, onToggle, collapsed, onCollapseChange }: SidebarProps) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const reduced = usePrefersReducedMotion();
  const [hovered, setHovered] = useState(false);

  const isStudent = user?.role === 'Student';
  const isParent = user?.role === 'Parent';
  const isTeacher = user?.role === 'Teacher';
  const isSecretary = user?.role === 'Secretary';
  const isAdmin = user?.role === 'Admin';

  const nav: NavItem[] = isStudent
    ? [
        { to: '/dashboard', label: 'الرحلة', icon: Home },
        { to: '/courses', label: 'المقررات', icon: Map },
        { to: '/achievements', label: 'الاكتشافات', icon: Award },
        { to: '/timeline', label: 'رحلة التاريخ', icon: ScrollText },
        { to: '/passport', label: 'جواز السفر', icon: FileText },
        { to: '/mistakes', label: 'كراسة الأخطاء', icon: GraduationCap },
        { to: '/certificates', label: 'الشهادات', icon: Award },
      ]
    : isParent
      ? [{ to: '/parent', label: 'أبنائي', icon: Home }]
      : isTeacher
        ? [
            { to: '/teacher', label: 'لوحة القيادة', icon: Home },
            { to: '/teacher/content', label: 'المحتوى', icon: FileText },
            { to: '/teacher/class', label: 'الفصول والتنبيهات', icon: Users },
            { to: '/teacher/attendance', label: 'تحضير اليوم', icon: GraduationCap },
            { to: '/teacher/attendance/monthly', label: 'تقرير الحضور الشهري', icon: CalendarDays },
            { to: '/teacher/analytics', label: 'التحليلات', icon: Award },
            { to: '/teacher/live', label: 'البث المباشر', icon: Users },
            { to: '/teacher/testimonials', label: 'آراء الطلاب', icon: Award },
          ]
        : [
            { to: '/secretary', label: 'نظرة عامة', icon: Home },
            { to: '/secretary/students', label: 'إدارة الطلبة', icon: Users },
            { to: '/secretary/attendance', label: 'التحضير اليومي', icon: GraduationCap },
            { to: '/secretary/attendance/monthly', label: 'تقرير الحضور الشهري', icon: CalendarDays },
            { to: '/secretary/payments', label: 'التحصيل والمدفوعات', icon: FileText },
            { to: '/secretary/groups', label: 'المجموعات والشعب', icon: Users },
            { to: '/secretary/schedule', label: 'الجدول الدراسي', icon: Map },
            { to: '/secretary/billing', label: 'الفوترة', icon: FileText },
            { to: '/secretary/analytics', label: 'التحليلات', icon: Award },
          ];

  const isActive = (to: string) => location.pathname.startsWith(to);

  const SidebarContent = () => (
    <aside
      className={`${
        isOpen ? 'max-lg:!flex' : 'max-lg:!hidden'
      } lg:flex fixed inset-y-0 start-0 z-50 flex-col transition-all duration-300 ease-in-out ${
        collapsed ? 'w-16' : 'w-64'
      } border-s border-border-gold/55 ${theme === 'dark' ? 'bg-[#17191f]/95' : 'bg-surface-elevated/95'} shadow-[0_16px_45px_rgba(64,20,14,.14)] backdrop-blur-xl lg:relative lg:inset-auto lg:z-auto lg:my-3 lg:me-3 lg:rounded-2xl lg:border`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`flex items-center border-b border-border-subtle px-3 py-3 ${collapsed ? 'flex-col gap-2.5 justify-center' : 'justify-between'}`}>
        {collapsed ? (
          <>
            <Link to="/" className="grid shrink-0 place-items-center" aria-label="الذهاب للرئيسية">
              <img src="/caesar-logo.webp" alt="شعار القيصر" className="h-9 w-9 rounded-full border border-gold/40 bg-black object-contain" draggable={false} />
            </Link>
            <button
              type="button"
              onClick={() => onCollapseChange(false)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border-gold/55 bg-gold/10 text-gold shadow-sm transition hover:bg-gold/25 active:scale-95"
              aria-label="توسيع الشريط الجانبي"
              aria-expanded="false"
              title="توسيع الشريط الجانبي"
            >
              <PanelLeftOpen size={17} strokeWidth={1.9} />
            </button>
          </>
        ) : (
          <>
            <Link to="/" className="min-w-0" aria-label="الذهاب للرئيسية">
              <BrandLogo size="md" />
            </Link>
            <button
              type="button"
              onClick={() => onCollapseChange(true)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border-gold/55 text-gold shadow-sm transition hover:bg-gold/10 active:scale-95"
              aria-label="طي الشريط الجانبي"
              aria-expanded="true"
              title="طي الشريط الجانبي"
            >
              <PanelLeftClose size={17} strokeWidth={1.9} />
            </button>
          </>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3 overflow-y-auto" role="navigation" aria-label="القائمة الرئيسية">
        {isAdmin && <AdminUsersDropdown collapsed={collapsed} onNavigate={() => onToggle()} />}
        {isAdmin && <CoursesManagementDropdown collapsed={collapsed} onNavigate={() => onToggle()} />}
        {isAdmin && <TopAchieversDropdown collapsed={collapsed} onNavigate={() => onToggle()} />}
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => onToggle()}
            className={({ isActive: active }) => `
              relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all duration-200
              ${active
                ? 'bg-gradient-to-l from-gold/25 to-gold/5 font-semibold text-gold border-s-2 border-gold shadow-[inset_0_0_22px_rgba(201,162,39,.08)]'
                : 'text-text-secondary hover:bg-white/[.045] hover:text-gold-bright'
              }
              ${collapsed ? 'justify-center' : ''}
            `}
            title={collapsed ? item.label : undefined}
            aria-current={isActive(item.to) ? 'page' : undefined}
          >
            <span className="flex-shrink-0" aria-hidden="true">
              <item.icon size={18} strokeWidth={1.8} />
            </span>
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
            {item.badge && !collapsed && (
              <span className="ml-auto rounded-full bg-gold/15 text-gold px-1.5 py-0.5 text-[10px] font-bold">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border-subtle p-3 transition-all duration-300">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.15 }}
            >
              <div className="mb-2 flex items-center gap-3 rounded-md px-3 py-2.5">
                <Avatar name={user?.fullName ?? 'مستخدم'} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text-primary">{user?.fullName}</p>
                  <p className="text-[11px] text-text-muted">
                    {user?.role === 'Student' ? 'طالب' : user?.role === 'Teacher' ? 'مدرس' : user?.role === 'Secretary' ? 'أمين' : user?.role === 'Parent' ? 'ولي أمر' : 'مدير'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-1">
          <button
            onClick={toggle}
            className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-text-secondary transition-colors hover:bg-surface-sunken hover:text-text-primary ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? (theme === 'light' ? 'الوضع الليلي' : 'الوضع النهاري') : undefined}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                >
                  {theme === 'light' ? 'الوضع الليلي' : 'الوضع النهاري'}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-text-secondary transition-colors hover:bg-surface-sunken hover:text-error ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? 'تسجيل الخروج' : undefined}
          >
            <LogOut size={18} />
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                >
                  خروج
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {!collapsed && (
          <div className="mt-4 rounded-md border border-gold/30 bg-gold/5 p-3">
            <p className="display-serif text-xs font-bold text-gold text-center">
              مع أبو كيان .. الدراسات في أمان
            </p>
          </div>
        )}
      </div>
    </aside>
  );

  if (typeof window === 'undefined') return null;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy-deep/50 backdrop-blur-sm lg:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}
      <SidebarContent />
    </>
  );
}

function AdminUsersDropdown({ collapsed, onNavigate }: { collapsed: boolean; onNavigate: () => void }) {
  const location = useLocation();
  const [open, setOpen] = useState(true);
  const items = [
    { to: '/admin/users/new', label: 'إضافة', icon: UserPlus },
    { to: '/admin/users', label: 'قائمة المستخدمين', icon: Users },
    { to: '/admin/audit-logs', label: 'سجل العمليات', icon: ScrollText },
  ];
  const anyActive = items.some((i) => location.pathname.startsWith(i.to));

  if (collapsed) {
    return (
      <div className="mb-1 border-b border-border-subtle pb-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="mx-auto grid h-9 w-9 place-items-center rounded-md text-text-secondary transition hover:bg-white/[.045] hover:text-gold-bright"
          title="إدارة المستخدمين"
          aria-label="إدارة المستخدمين"
        >
          <Settings2 size={18} strokeWidth={1.8} />
        </button>
        {open && (
          <div className="mt-1 flex flex-col items-center gap-1">
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                title={item.label}
                className={`grid h-9 w-9 place-items-center rounded-md transition ${location.pathname.startsWith(item.to) ? 'bg-gold/20 text-gold' : 'text-text-secondary hover:bg-white/[.045] hover:text-gold-bright'}`}
              >
                <item.icon size={16} strokeWidth={1.8} />
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mb-1 border-b border-border-subtle pb-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all duration-200 ${anyActive ? 'bg-gradient-to-l from-gold/25 to-gold/5 font-semibold text-gold border-s-2 border-gold shadow-[inset_0_0_22px_rgba(201,162,39,.08)]' : 'text-text-secondary hover:bg-white/[.045] hover:text-gold-bright'}`}
        aria-expanded={open}
      >
        <span className="flex-shrink-0" aria-hidden="true">
          <Settings2 size={18} strokeWidth={1.8} />
        </span>
        <span className="flex-1 text-start">إدارة المستخدمين</span>
        <ChevronRight size={14} className={`transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-0.5 py-1 ps-4">
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  className={({ isActive: active }) => `
                    relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-200
                    ${active ? 'bg-gold/15 font-semibold text-gold' : 'text-text-secondary hover:bg-white/[.045] hover:text-gold-bright'}
                  `}
                  aria-current={location.pathname.startsWith(item.to) ? 'page' : undefined}
                >
                  <item.icon size={15} strokeWidth={1.8} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CoursesManagementDropdown({ collapsed, onNavigate }: { collapsed: boolean; onNavigate: () => void }) {
  const location = useLocation();
  const [open, setOpen] = useState(true);
  const items = [
    { to: '/admin/courses/new', label: 'إضافة كورس', icon: Plus },
    { to: '/admin/courses', label: 'الكورسات', icon: LayoutGrid },
    { to: '/teacher/content', label: 'المحتوى', icon: FileText },
  ];
  const anyActive = items.some((i) => location.pathname.startsWith(i.to));

  if (collapsed) {
    return (
      <div className="mb-1 border-b border-border-subtle pb-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="mx-auto grid h-9 w-9 place-items-center rounded-md text-text-secondary transition hover:bg-white/[.045] hover:text-gold-bright"
          title="إدارة الكورسات"
          aria-label="إدارة الكورسات"
        >
          <Library size={18} strokeWidth={1.8} />
        </button>
        {open && (
          <div className="mt-1 flex flex-col items-center gap-1">
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                title={item.label}
                className={`grid h-9 w-9 place-items-center rounded-md transition ${location.pathname.startsWith(item.to) ? 'bg-gold/20 text-gold' : 'text-text-secondary hover:bg-white/[.045] hover:text-gold-bright'}`}
              >
                <item.icon size={16} strokeWidth={1.8} />
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mb-1 border-b border-border-subtle pb-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all duration-200 ${anyActive ? 'bg-gradient-to-l from-gold/25 to-gold/5 font-semibold text-gold border-s-2 border-gold shadow-[inset_0_0_22px_rgba(201,162,39,.08)]' : 'text-text-secondary hover:bg-white/[.045] hover:text-gold-bright'}`}
        aria-expanded={open}
      >
        <span className="flex-shrink-0" aria-hidden="true">
          <Library size={18} strokeWidth={1.8} />
        </span>
        <span className="flex-1 text-start">إدارة الكورسات</span>
        <ChevronRight size={14} className={`transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-0.5 py-1 ps-4">
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  className={({ isActive: active }) => `
                    relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-200
                    ${active ? 'bg-gold/15 font-semibold text-gold' : 'text-text-secondary hover:bg-white/[.045] hover:text-gold-bright'}
                  `}
                  aria-current={location.pathname.startsWith(item.to) ? 'page' : undefined}
                >
                  <item.icon size={15} strokeWidth={1.8} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TopAchieversDropdown({ collapsed, onNavigate }: { collapsed: boolean; onNavigate: () => void }) {
  const location = useLocation();
  const [open, setOpen] = useState(true);
  const items = [
    { to: '/admin/top-students', label: 'ألبوم الأوائل', icon: Medal },
    { to: '/admin/testimonials', label: 'آراء طلابنا', icon: MessageSquareQuote },
  ];
  const anyActive = items.some((i) => location.pathname.startsWith(i.to));

  if (collapsed) {
    return (
      <div className="mb-1 border-b border-border-subtle pb-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="mx-auto grid h-9 w-9 place-items-center rounded-md text-text-secondary transition hover:bg-white/[.045] hover:text-gold-bright"
          title="المتفوقين"
          aria-label="المتفوقين"
        >
          <Trophy size={18} strokeWidth={1.8} />
        </button>
        {open && (
          <div className="mt-1 flex flex-col items-center gap-1">
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                title={item.label}
                className={`grid h-9 w-9 place-items-center rounded-md transition ${location.pathname.startsWith(item.to) ? 'bg-gold/20 text-gold' : 'text-text-secondary hover:bg-white/[.045] hover:text-gold-bright'}`}
              >
                <item.icon size={16} strokeWidth={1.8} />
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mb-1 border-b border-border-subtle pb-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all duration-200 ${anyActive ? 'bg-gradient-to-l from-gold/25 to-gold/5 font-semibold text-gold border-s-2 border-gold shadow-[inset_0_0_22px_rgba(201,162,39,.08)]' : 'text-text-secondary hover:bg-white/[.045] hover:text-gold-bright'}`}
        aria-expanded={open}
      >
        <span className="flex-shrink-0" aria-hidden="true">
          <Trophy size={18} strokeWidth={1.8} />
        </span>
        <span className="flex-1 text-start">المتفوقين</span>
        <ChevronRight size={14} className={`transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-0.5 py-1 ps-4">
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  className={({ isActive: active }) => `
                    relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-200
                    ${active ? 'bg-gold/15 font-semibold text-gold' : 'text-text-secondary hover:bg-white/[.045] hover:text-gold-bright'}
                  `}
                  aria-current={location.pathname.startsWith(item.to) ? 'page' : undefined}
                >
                  <item.icon size={15} strokeWidth={1.8} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Sidebar;
