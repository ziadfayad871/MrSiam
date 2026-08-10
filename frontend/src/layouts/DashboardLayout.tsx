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
  type LucideIcon,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { Avatar } from '../design-system/ui/Avatar';
import { Button } from '../design-system/ui/Button';
import { Drawer } from '../design-system/ui/Drawer';
import { BrandLogo } from '../design-system/components/BrandLogo';
import { Menu } from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const nav: NavItem[] = [
    { to: '/dashboard', label: 'الرحلة', icon: Home },
    { to: '/courses', label: 'المقررات', icon: Map },
    { to: '/achievements', label: 'الاكتشافات', icon: Award },
    { to: '/timeline', label: 'رحلة التاريخ', icon: ScrollText },
  ];

  const icon = nav.find((n) => window.location.pathname.startsWith(n.to))?.icon ?? Home;

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-e border-border-subtle bg-surface-sunken/50 lg:flex">
        <Link to="/" className="border-b border-border-subtle px-5 py-4">
          <BrandLogo size="md" imageSrc="/mr-siam-logo.jpeg" />
        </Link>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3.5 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-gold/10 font-semibold text-gold'
                    : 'text-text-secondary hover:bg-surface-sunken hover:text-text-primary'
                }`
              }
            >
              <item.icon size={17} strokeWidth={1.8} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border-subtle p-3">
          <button
            onClick={toggle}
            className="flex w-full items-center gap-3 rounded-md px-3.5 py-2.5 text-sm text-text-secondary transition-colors hover:bg-surface-sunken hover:text-text-primary"
          >
            {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
            {theme === 'light' ? 'الوضع الليلي' : 'الوضع النهاري'}
          </button>
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="flex w-full items-center gap-3 rounded-md px-3.5 py-2.5 text-sm text-text-secondary transition-colors hover:bg-surface-sunken hover:text-error"
          >
            <LogOut size={17} />
            خروج
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border-subtle bg-background/85 px-4 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-2">
          <button onClick={() => setMenuOpen(true)} aria-label="القائمة">
            <Menu size={20} />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo size="sm" />
            <span className="text-xs font-bold text-text-secondary">{user?.fullName ?? 'رحلتي'}</span>
          </Link>
        </div>
        <button onClick={toggle} className="p-1.5 text-text-secondary" aria-label="تبديل الوضع">
          {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
        </button>
      </header>

      {/* Mobile drawer */}
      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="القائمة" side="start">
        <div className="flex flex-col gap-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-text-secondary hover:bg-surface-sunken hover:text-text-primary"
            >
              <item.icon size={17} />
              {item.label}
            </NavLink>
          ))}
          <div className="mt-4 border-t border-border-subtle pt-4">
            <Button variant="outline" className="w-full" onClick={() => { logout(); navigate('/'); }}>
              خروج
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Content */}
      <main className="flex-1 overflow-x-hidden">
        {/* Top bar */}
        <div className="sticky top-0 z-30 hidden items-center justify-between border-b border-border-subtle bg-background/80 px-6 py-3 backdrop-blur-md lg:flex">
          <div className="flex items-center gap-2.5 text-sm text-text-muted">
            <FileText size={15} className="text-gold" />
            <span>القيصر الرقمي</span>
            <span className="opacity-40">|</span>
            <GraduationCap size={15} className="text-gold" />
            <span>رحلتك التعليمية</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-plex text-[10px] tracking-[0.18em] text-text-muted" dir="ltr">
              31°15′N / 32°18′E
            </span>
            <div className="flex items-center gap-2.5">
              <div className="text-end leading-tight">
                <p className="text-sm font-semibold text-text-primary">{user?.fullName}</p>
                <p className="text-[11px] text-text-muted">
                  {user?.role === 'Student' ? 'طالب' : user?.role === 'Teacher' ? 'مدرس' : user?.role === 'Secretary' ? 'أمين' : 'مدير'}
                </p>
              </div>
              <Avatar name={user?.fullName ?? 'مستخدم'} size="sm" />
            </div>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}

export default DashboardLayout;
