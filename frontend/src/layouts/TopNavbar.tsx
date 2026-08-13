'use client';

import { Bell, ChevronDown, LogOut, Search, Sun, Moon, User, Settings, Shield, Menu } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { Avatar } from '../design-system/ui/Avatar';
import { Button } from '../design-system/ui/Button';
import { Badge } from '../design-system/ui/Badge';
import { Dropdown } from '../design-system/ui/Dropdown';
import { motion, AnimatePresence } from 'motion/react';
import { usePrefersReducedMotion } from '../design-system/motion/hooks';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface TopNavbarProps {
  breadcrumbs?: BreadcrumbItem[];
  pageTitle?: string;
  pageDescription?: string;
  onMenuClick?: () => void;
  children?: ReactNode;
}

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'لوحة القيادة',
  '/courses': 'المقررات',
  '/achievements': 'الاكتشافات',
  '/timeline': 'رحلة التاريخ',
  '/passport': 'جواز السفر',
  '/mistakes': 'كراسة الأخطاء',
  '/certificates': 'الشهادات',
  '/parent': 'أبنائي',
  '/teacher/content': 'المحتوى',
  '/teacher/analytics': 'التحليلات',
  '/teacher/live': 'البث المباشر',
  '/secretary/students': 'إدارة الطلبة',
  '/secretary/attendance': 'الحضور والغياب',
  '/secretary/payments': 'التحصيل والمدفوعات',
  '/secretary/groups': 'المجموعات والشعب',
  '/secretary/schedule': 'الجدول الدراسي',
  '/secretary/billing': 'الفوترة',
  '/secretary/analytics': 'التحليلات',
};

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [{ label: 'الرئيسية', href: '/' }];

  let currentPath = '';
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const label = ROUTE_LABELS[currentPath] || segment;
    breadcrumbs.push({ label, href: currentPath });
  }

  return breadcrumbs;
}

interface Notification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
  link?: string;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', title: 'امتحان جديد متاح', body: 'تم إضافة امتحان "مقدمة في التاريخ" للمقررات', createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), isRead: false, link: '/courses' },
  { id: '2', title: 'شهادة جديدة', body: 'حصلت على شهادة "مستكشف التاريخ"', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), isRead: true, link: '/certificates' },
  { id: '3', title: 'بث مباشر قادم', body: 'جلسة مراجعة للصف الثالث الإعدادي غداً الساعة 7 مساءً', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), isRead: false, link: '/teacher/live' },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return `منذ ${days} يوم`;
}

export function TopNavbar({
  breadcrumbs,
  pageTitle,
  pageDescription,
  onMenuClick,
  children,
}: TopNavbarProps) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const computedBreadcrumbs = breadcrumbs || generateBreadcrumbs(location.pathname);
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.isRead).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  return (
    <header className={`platform-topbar sticky top-0 z-30 mx-3 mt-3 rounded-2xl border border-border-gold/45 ${theme === 'dark' ? 'bg-[#17191f]/92' : 'bg-surface-elevated/92'} shadow-[0_8px_30px_rgba(64,20,14,.10)] backdrop-blur-xl`} dir="rtl">
      <div className="mx-auto flex h-16 max-w-full items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Menu toggle + Breadcrumbs */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <button
            onClick={onMenuClick}
            className="rounded-md p-2 text-text-secondary lg:hidden transition-colors hover:bg-surface-sunken hover:text-text-primary"
            aria-label="فتح القائمة"
          >
            <Menu size={20} />
          </button>

          <nav className="hidden lg:flex items-center gap-1.5" aria-label="مسار التنقل">
            {computedBreadcrumbs.map((item, index) => (
              <span key={item.label} className="flex items-center gap-1.5">
                {index > 0 && (
                  <ChevronDown size={14} className="text-text-muted shrink-0" />
                )}
                {item.href ? (
                  <Link
                    to={item.href}
                    className={`text-sm transition-colors ${
                      index === computedBreadcrumbs.length - 1
                        ? 'font-semibold text-text-primary'
                        : 'text-text-muted hover:text-gold'
                    }`}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-sm font-semibold text-text-primary">{item.label}</span>
                )}
              </span>
            ))}
          </nav>
        </div>

        {/* Center: Page Title (mobile) + Search */}
        <div className="flex items-center gap-3 flex-1 justify-center lg:hidden">
          {pageTitle && (
            <h1 className="text-base font-bold text-text-primary truncate max-w-[200px]">
              {pageTitle}
            </h1>
          )}
        </div>

        {/* Center: Search (desktop) */}
        <div className="hidden lg:flex flex-1 max-w-xl justify-center">
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center gap-2.5 rounded-md border border-border-soft bg-surface px-4 py-2 text-sm text-text-muted transition-all duration-200 hover:border-gold/50 focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/20"
            >
              <Search size={16} className="shrink-0" />
              <span>ابحث في المقررات، الدروس، الشهادات...</span>
              <kbd className="hidden shrink-0 ml-auto rounded bg-surface-sunken px-1.5 py-0.5 text-[10px] text-text-muted border border-border-soft">⌘K</kbd>
            </button>

            {searchOpen && (
              <AnimatePresence>
                <motion.form
                  onSubmit={handleSearch}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-2 z-50"
                >
                  <div className="relative">
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
                      onKeyDown={(e) => e.key === 'Escape' && setSearchOpen(false)}
                      placeholder="ابحث..."
                      className="w-full rounded-md border border-gold/50 bg-surface px-4 py-2.5 text-sm text-text-primary outline-none ring-2 ring-gold/20"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={!searchQuery.trim()}
                      className="absolute inset-y-0 end-0 flex items-center justify-center px-3 text-gold hover:text-gold-bright"
                      aria-label="بحث"
                    >
                      <Search size={18} />
                    </button>
                  </div>
                </motion.form>
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Right: Notifications, Theme, User Menu */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Dropdown
            trigger={
              <button
                className="relative rounded-md p-2 text-text-secondary transition-colors hover:bg-surface-sunken hover:text-text-primary"
                aria-label={`الإشعارات${unreadCount > 0 ? ` (${unreadCount} جديد)` : ''}`}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -end-1 flex h-5 w-5 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            }
            content={
              <div className="w-80 p-2">
                <div className="flex items-center justify-between border-b border-border-subtle px-2 py-3">
                  <h3 className="font-bold text-text-primary">الإشعارات</h3>
                  {MOCK_NOTIFICATIONS.some((n) => !n.isRead) && (
                    <button className="text-xs font-semibold text-gold hover:underline">تحديد الكل كمقروء</button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {MOCK_NOTIFICATIONS.length === 0 ? (
                    <p className="py-6 text-center text-sm text-text-muted">لا توجد إشعارات</p>
                  ) : (
                    MOCK_NOTIFICATIONS.map((n) => (
                      <Link
                        key={n.id}
                        to={n.link || '#'}
                        onClick={() => setNotificationsOpen(false)}
                        className={`block rounded-md border px-3 py-2.5 transition-colors ${
                          n.isRead ? 'border-border-soft hover:bg-surface-sunken' : 'border-gold/50 bg-gold/5'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm font-bold ${n.isRead ? 'text-text-secondary' : 'text-text-primary'}`}>{n.title}</p>
                          <span className="shrink-0 text-[9px] text-text-muted">{timeAgo(n.createdAt)}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-text-muted">{n.body}</p>
                      </Link>
                    ))
                  )}
                </div>
                <div className="mt-2 border-t border-border-subtle pt-2 text-center">
                  <Link to="/notifications" className="text-xs font-semibold text-gold hover:underline">
                    عرض جميع الإشعارات
                  </Link>
                </div>
              </div>
            }
            align="end"
          />

          {/* Theme Toggle */}
          <button
            onClick={toggle}
            className="rounded-md p-2 text-text-secondary transition-colors hover:bg-surface-sunken hover:text-gold"
            aria-label={theme === 'light' ? 'تفعيل الوضع الليلي' : 'تفعيل الوضع النهاري'}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {/* User Menu */}
          <Dropdown
            trigger={
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-md p-1.5 pr-3 text-text-secondary transition-colors hover:bg-surface-sunken hover:text-text-primary"
                aria-label="قائمة المستخدم"
                aria-expanded={userMenuOpen}
              >
                <Avatar name={user?.fullName ?? 'مستخدم'} size="sm" />
                <span className="hidden lg:block text-sm font-medium text-text-primary truncate max-w-[120px]">
                  {user?.fullName}
                </span>
                <ChevronDown size={16} className="hidden lg:block text-text-muted" />
              </button>
            }
            content={
              <div className="w-56 p-2">
                <div className="border-b border-border-subtle px-2 py-3">
                  <p className="font-bold text-text-primary">{user?.fullName}</p>
                  <p className="text-[11px] text-text-muted">
                    {user?.role === 'Student' ? 'طالب' : user?.role === 'Teacher' ? 'مدرس' : user?.role === 'Secretary' ? 'أمين' : user?.role === 'Parent' ? 'ولي أمر' : 'مدير'}
                  </p>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-text-secondary hover:bg-surface-sunken hover:text-text-primary"
                >
                  <User size={16} /> الملف الشخصي
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-text-secondary hover:bg-surface-sunken hover:text-text-primary"
                >
                  <Settings size={16} /> الإعدادات
                </Link>
                {user?.role === 'Teacher' || user?.role === 'Secretary' ? (
                  <Link
                    to="/admin"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-text-secondary hover:bg-surface-sunken hover:text-text-primary"
                  >
                    <Shield size={16} /> لوحة الإدارة
                  </Link>
                ) : null}
                <div className="mt-2 border-t border-border-subtle" />
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-error hover:bg-error/10"
                >
                  <LogOut size={16} /> تسجيل الخروج
                </button>
              </div>
            }
            align="end"
          />
        </div>
      </div>

      {/* Page Header (desktop) */}
      {(pageTitle || pageDescription) && (
        <div className="hidden lg:block border-t border-border-subtle px-4 sm:px-6 lg:px-8 py-3">
          <div className="mx-auto max-w-full flex items-center justify-between gap-4">
            <div>
              {pageTitle && (
                <h1 className="display-serif text-xl font-bold text-text-primary">{pageTitle}</h1>
              )}
              {pageDescription && (
                <p className="mt-0.5 text-sm text-text-muted">{pageDescription}</p>
              )}
            </div>
            {children && <div className="flex-shrink-0">{children}</div>}
          </div>
        </div>
      )}
    </header>
  );
}

export default TopNavbar;
