import {
  Award,
  BookOpenCheck,
  CalendarDays,
  ClipboardCheck,
  FileCheck2,
  FileText,
  GraduationCap,
  GraduationCap2,
  Globe,
  Home,
  LogOut,
  Map,
  Moon,
  NotebookPen,
  Phone,
  Play,
  Radio,
  ShieldCheck,
  Sparkles,
  Target,
  Telescope,
  Ticket,
  Trophy,
  Users,
  XCircle,
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { Avatar } from '../design-system/ui/Avatar';
import { Badge } from '../design-system/ui/Badge';
import { Button } from '../design-system/ui/Button';
import { Breadcrumb } from '../design-system/ui/Breadcrumb';
import { Card } from '../design-system/ui/Card';
import { Drawer } from '../design-system/ui/Drawer';
import { Field } from '../design-system/ui/Field';
import { Input } from '../design-system/ui/Field';
import { Select } from '../design-system/ui/Field';
import { Tooltip } from '../design-system/ui/Tooltip';
import { api } from '../lib/api';
import type { UserDto } from '../lib/types';
import { Tabs } from '../design-system/ui/Tabs';
import { BrandLogo } from '../design-system/components/BrandLogo';

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `من ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `من ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return `من ${days} يوم`;
}

const NAV_ITEMS = {
  student: [
    { key: 'dashboard', label: 'الرحلة', icon: Home },
    { key: 'courses', label: 'المقررات', icon: Map },
    { key: 'achievements', label: 'الاكتشافات', icon: Award },
    { key: 'timeline', label: 'رحلة التاريخ', icon: ScrollText },
  ],
  parent: [
    { key: 'parent', label: 'أبنائي', icon: Home },
  ],
  teacher: [
    { key: 'dashboard', label: 'لوحة القيادة', icon: Home },
    { key: 'content', label: 'المحتوى', icon: <BookOpen size={15} /> },
    { key: 'analytics', label: 'التحليلات', icon: <BarChart3 size={15} /> },
    { key: 'live', label: 'البث المباشر', icon: <Radio size={15} /> },
  ],
  secretary: [
    { key: 'overview', label: 'نظرة عامة', icon: <Users size={15} /> },
    { key: 'students', label: 'إدارة الطلبة', icon: <Users size={15} /> },
    { key: 'billing', label: 'الفوترة والاشتراكات', icon: <CreditCard size={15} /> },
    { key: 'analytics', label: 'التحليلات', icon: <BarChart3 size={15} /> },
  ],
  admin: [
    { key: 'dashboard', label: 'لوحة التحكم', icon: Home },
    { key: 'timeline', label: 'رحلة التاريخ', icon: ScrollText },
  ],
} as const;

function getNavItems(user: UserDto | null): NavItem[] {
  if (!user) return [];
  const role = user.role;
  if (role === 'Student') return NAV_ITEMS.student;
  if (role === 'Parent') return NAV_ITEMS.parent;
  if (role === 'Teacher') return NAV_ITEMS.teacher;
  if (role === 'Secretary') return NAV_ITEMS.secretary;
  if (role === 'Admin') return NAV_ITEMS.admin;
  return [];
}

interface NavCollapsedItem {
  key: string;
  icon: React.ElementType;
  title: string;
  href: string;
}

function useCollapsedState(initial = false): [boolean, () => void] {
  const [collapsed, setCollapsed] = useState(initial);
  const toggle = useCallback(() => setCollapsed(c => !c), []);
  return [collapsed, toggle];
}

function getCurrentNavItem(user: UserDto | null, pathname: string): NavItem | null {
  if (!user) return null;
  const items = getNavItems(user);
  return items.find((i) => i.to === pathname) || null;
}

export function ProfessionalDashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(0);

  const isCollapsed = sidebarCollapsed && user?.role !== 'Student';
  const navItems = user ? getNavItems(user) : [];
  const currentNavItem = user ? getCurrentNavItem(user, navigate().toString()) : null;

  // Build collapsed nav (icon-only with tooltips)
  const collapsedNav = navItems.map((item) => ({
    key: item.key,
    icon: item.icon,
    title: item.label,
    href: item.to,
  });

  // Build expanded nav (full text)
  const expandedNav = navItems.map((item) => ({
    key: item.key,
    label: item.label,
    icon: item.icon,
    to: item.to,
  }));

  // Top bar notifications toggle
  const toggleNotifications = useCallback(() => setShowNotifications(!showNotifications), []);
  const markAllRead = useCallback(async () => {
    try { await api.post('/student/notifications/read'); } catch {}
    setNotificationsCount(0);
    setShowNotifications(false);
  }, []);

  // User dropdown items
  const userDropdownItems = [
    { label: 'الملف الشخصي', onClick: () => navigate('/profile') },
    { label: 'الإعدادات', onClick: () => navigate('/settings') },
    { divider: true },
    { label: 'تسجيل الخروج', onClick: logout, danger: true },
  ];

  // User initials / role label for top bar
  const userInitials = user?.fullName?.split(' ').map(w => w[0]).join('') || '?';
  const userRoleLabel = user?.role === 'Student' ? 'طالب' : user?.role === 'Teacher' ? 'مدرس' : user?.role === 'Secretary' ? 'أمين' : user?.role === 'Parent' ? 'ولي أمر' : 'مدير';

  // Mobile nav links
  const mobileNav = navItems.map((item) => (
    <NavLink
      key={item.key}
      to={item.to}
      onClick={() => setMenuOpen(false)}
      className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-text-secondary hover:bg-surface-sunken hover:text-text-primary"
    >
      <item.icon size={17} className="text-gold" />
      <span className="font-medium text-text-primary">{item.label}</span>
    </NavLink>
  ));

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ============ SIDEBAR ============ */}
      <aside
        className={`fixed left-0 top-0 bottom-0 w-64 lg:w-72 transition-all duration-300 ${
          isCollapsed ? 'transform translate-x-full' : 'transform translate-x-0'
        } md:border-r bg-surface-sunken/50 z-20`}
        aria-label="القائمة الجانبية">
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex flex-col lg:flex-row items-center justify-between px-6 py-4 border-b border-border-subtle">
            <BrandLogo size="md" imageSrc="/mr-siam-logo.jpeg" />
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gold">رحلتك التعليمية</span>
              <Badge variant="gold" className="text-[10px] font-bold">
                {user?.role === 'Student' ? 'طالب' : user?.role === 'Teacher' ? 'مدرس' : user?.role === 'Secretary' ? 'أمين' : 'ولي أمر'}
              </Badge>
            </div>
          </div>

          {/* Sidebar toggle (mobile only when expanded) */}
          {!isCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(true)}
              className="mt-2 lg:hidden w-full rounded-md bg-gold/10 px-4 py-2.5 text-sm font-medium text-gold hover:bg-gold/20"
              aria-label="طي القائمة"
            >
              <X size={16} className="mr-1" /> إخفاء القائمة
            </button>
          )}

          {/* ============ COLLAPSED SIDEBAR (icon-only) ============ */}
          {isCollapsed ? (
            <div className="flex-1 flex flex-col gap-1 px-2 py-2">
              {collapsedNav.map((item) => (
                <Tooltip
                  key={item.key}
                  title={item.title}
                  side="top"
                  className="mx-auto"
                >
                  <NavLink
                    key={item.key}
                    to={item.href}
                    className="flex items-center justify-center rounded-md px-3 py-2.5 hover:bg-gold/10 transition-colors"
                  >
                    <item.icon size={18} className="text-gold" />
                  </NavLink>
                </Tooltip>
              ))}
            </div>
          ) : (
            {/* ============ EXPANDED SIDEBAR (full labels) ============ */}
            <nav className="flex-1 flex flex-col gap-1 px-2 py-2">
              {expandedNav.map((item) => (
                <NavLink
                  key={item.key}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-md px-3.5 py-2.5 text-sm transition-colors ${
                      isActive
                        ? 'bg-gold/10 font-semibold text-gold'
                        : 'text-text-secondary hover:bg-surface-sunken hover:text-text-primary'
                    }`
                  }
                >
                  <item.icon size={17} className="text-gold" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          )}

          {/* Sidebar footer (theme + logout) */}
          <div className="border-t border-border-subtle mt-auto p-3">
            <button
              onClick={toggleTheme}
              className="flex w-full items-center gap-2 rounded-md px-3.5 py-2.5 text-sm text-text-secondary transition-colors hover:bg-surface-sunken hover:text-text-primary"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              {theme === 'light' ? 'الوضع الليلي' : 'الوضع النهاري'}
            </button>
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="flex w-full items-center gap-2 rounded-md px-3.5 py-2.5 text-sm text-text-secondary transition-colors hover:bg-surface-sunken hover:text-error mt-2"
            >
              <LogOut size={16} /> خروج
            </button>
          </div>
        </div>
      </aside>

      {/* ============ MOBILE DRAWER ============ */}
      <Drawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="القائمة"
        side="start"
      >
        <div className="flex flex-col gap-1">
          {mobileNav}
          <div className="mt-4 border-t border-border-subtle pt-4">
            <Button variant="outline" className="w-full" onClick={() => { logout(); navigate('/'); }}>
              خروج
            </Button>
          </div>
        </div>
      </Drawer>

      {/* ============ TOP NAVBAR ============ */}
      <header
        className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border-subtle bg-background/85 px-6 py-2 backdrop-blur-md lg:hidden"
      >
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setMenuOpen(true)}
            aria-label="القائمة"
            className="p-1.5"
          >
            <Menu size={20} />
          </Button>
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo size="sm" />
            <span className="text-xs font-bold text-text-secondary">رحلتي</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            aria-label="تبديل الوضع"
          >
            {theme === 'light' ? <Moon size={13} /> : <Sun size={13} />}
          </Button>

          {/* User menu */}
          <Dropdown
            items={userDropdownItems}
            className="w-48"
          >
            <span className="flex items-center gap-2">
              <Avatar name={user?.fullName ?? 'مستخدم'} size="sm" />
              <span className="font-medium text-text-primary">{user?.fullName}</span>
            </span>
          </Dropdown>
        </div>
      </header>

      {/* ============ MAIN CONTENT ============ */}
      <main className="flex-1 overflow-x-hidden">
        {/* Top bar with breadcrumbs and actions (desktop only) */}
        <div className="sticky top-0 z-10 hidden lg:flex items-center justify-between border-b border-border-subtle bg-background/80 px-6 py-3 backdrop-blur-md">
          <div className="flex items-center gap-2.5 text-sm text-text-muted">
            <FileText size={15} className="text-gold" />
            <span>القيصر الرقمي</span>
            <span className="opacity-40">|</span>
            <GraduationCap size={15} className="text-gold" />
            <span>رحلتك التعليمية</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNotifications(true)}
              className="flex items-center gap-1.5"
            >
              <Sparkles size={13} className="text-gold" />
              <span className="text-[10px] font-medium text-gold">{notificationsCount}</span>
            </Button>

            <Tooltip
              title="رسائل غير مقروءة"
              side="bottom"
              className="left-1/2 -mt-2"
            >
              <Sparkles size={12} className="text-gold" />
            </Tooltip>

            {/* Search (condensed) */}
            <Field>
              <Input
                placeholder="بحث..."
                className="w-48 lg:w-64"
                disabled
              />
            </Field>

            {/* User avatar */}
            <Avatar name={user?.fullName ?? 'مستخدم'} size="sm" />
          </div>
        </div>

        {/* Breadcrumb navigation */}
        <Breadcrumb
          items={[
            { label: 'الرئيسية', to: '/' },
            { label: currentNavItem?.label ?? 'الرحلة', to: currentNavItem?.to ?? '/' },
          ]}
        />

        {/* Content area */}
        <div className="p-4 sm:p-6 lg:p-8 lg:pt-10">
          {children}
        </div>
      </main>
    </div>
  );
}