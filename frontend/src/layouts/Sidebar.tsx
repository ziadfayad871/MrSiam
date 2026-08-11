'use client';

import {
  Award,
  FileText,
  GraduationCap,
  Home,
  LogOut,
  Map,
  Moon,
  ScrollText,
  Sun,
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
import { ChevronLeft, ChevronRight, Menu } from 'lucide-react';
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
            { to: '/teacher/analytics', label: 'التحليلات', icon: Award },
            { to: '/teacher/live', label: 'البث المباشر', icon: Users },
            { to: '/courses', label: 'المقررات', icon: Map },
            { to: '/timeline', label: 'رحلة التاريخ', icon: ScrollText },
          ]
        : [
            { to: '/secretary', label: 'نظرة عامة', icon: Home },
            { to: '/secretary/students', label: 'إدارة الطلبة', icon: Users },
            { to: '/secretary/billing', label: 'الفوترة', icon: FileText },
            { to: '/secretary/analytics', label: 'التحليلات', icon: Award },
          ];

  const isActive = (to: string) => location.pathname.startsWith(to);

  const SidebarContent = () => (
    <aside
      className={`flex flex-col transition-all duration-300 ease-in-out ${
        collapsed ? 'w-16' : 'w-64'
      } border-e border-border-subtle bg-surface-elevated/80 backdrop-blur-md lg:flex`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link
        to="/"
        className={`flex items-center justify-between border-b border-border-subtle px-3 py-4 transition-all duration-300 ${
          collapsed ? 'justify-center' : ''
        }`}
        aria-label="الذهاب للرئيسية"
      >
        <BrandLogo size={collapsed ? 'sm' : 'md'} imageSrc="/mr-siam-logo.jpeg" />
        {!collapsed && (
          <span className="text-xs font-bold text-text-secondary">القيصر الرقمي</span>
        )}
      </Link>

      <nav className="flex flex-1 flex-col gap-1 p-3 overflow-y-auto" role="navigation" aria-label="القائمة الرئيسية">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => !collapsed && onToggle()}
            className={({ isActive: active }) => `
              relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all duration-200
              ${active
                ? 'bg-gold/10 font-semibold text-gold border-r-2 border-gold'
                : 'text-text-secondary hover:bg-surface-sunken hover:text-text-primary'
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

      <button
        onClick={() => onCollapseChange(!collapsed)}
        className={`absolute -top-10 left-full z-10 flex h-10 w-10 items-center justify-center rounded-e-lg border border-border-subtle bg-surface-elevated shadow-lg transition-all duration-300 hover:bg-gold/10 hover:border-gold/50 ${
          collapsed ? 'rotate-180' : ''
        }`}
        aria-label={collapsed ? 'توسيع الشريط الجانبي' : 'طي الشريط الجانبي'}
        aria-expanded={!collapsed}
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
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

export default Sidebar;