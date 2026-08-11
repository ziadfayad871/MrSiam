import { Menu, Moon, Sun } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { Drawer } from '../design-system/ui/Drawer';
import { Button } from '../design-system/ui/Button';
import { BrandLogo } from '../design-system/components/BrandLogo';

const NAV = [
  { to: '/', label: 'الرئيسية' },
  { to: '/teacher-profile', label: 'مستر محمد صيام' },
  { to: '/timeline', label: 'رحلة التاريخ' },
  { to: '/dashboard', label: 'لوحة الطالب' },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="group flex items-center gap-2.5">
          <BrandLogo size="sm" imageSrc="/mr-siam-logo.jpeg" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-md px-3.5 py-2 text-sm transition-colors ${
                  isActive ? 'font-semibold text-gold' : 'text-text-secondary hover:text-text-primary'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <button
            onClick={toggle}
            className="rounded-md p-2 text-text-secondary transition-colors hover:bg-surface-sunken hover:text-gold"
            aria-label="تبديل الوضع الليلي"
          >
            {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
          </button>
          {user ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
                لوحتي
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
              >
                خروج
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/staff-login')}>
                بوابة المستر
              </Button>
              <Button variant="gold" size="sm" onClick={() => navigate('/login')}>
                دخول الطلاب
              </Button>
            </div>
          )}
        </div>

        <button
          className="rounded-md p-2 text-text-primary md:hidden"
          onClick={() => setMenuOpen(true)}
          aria-label="القائمة"
        >
          <Menu size={22} />
        </button>
      </div>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="القائمة" side="start">
        <div className="flex flex-col gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className="rounded-md px-3 py-2.5 text-sm text-text-secondary hover:bg-surface-sunken hover:text-text-primary"
            >
              {item.label}
            </NavLink>
          ))}
          <button
            onClick={() => {
              setMenuOpen(false);
              toggle();
            }}
            className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-text-secondary hover:bg-surface-sunken"
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            {theme === 'light' ? 'الوضع الليلي' : 'الوضع النهاري'}
          </button>
          <div className="mt-3 border-t border-border-subtle pt-3">
            {user ? (
              <Button variant="gold" className="w-full" onClick={() => { setMenuOpen(false); navigate('/dashboard'); }}>
                لوحتي
              </Button>
            ) : (
              <div className="flex flex-col gap-2">
                <Button variant="gold" className="w-full" onClick={() => { setMenuOpen(false); navigate('/login'); }}>
                  دخول الطلاب
                </Button>
                <Button variant="outline" className="w-full" onClick={() => { setMenuOpen(false); navigate('/staff-login'); }}>
                  بوابة المستر
                </Button>
              </div>
            )}
          </div>
        </div>
      </Drawer>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border-subtle bg-surface-sunken/60">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <BrandLogo size="sm" imageSrc="/mr-siam-logo.jpeg" />
          </div>

          <p className="display-serif text-sm font-bold text-gold">
            مع أبو كيان .. الدراسات في أمان
          </p>

          <div className="flex gap-6 text-sm text-text-muted">
            <Link to="/teacher-profile" className="transition-colors hover:text-gold">
              من هو مستر صيام؟
            </Link>
            <Link to="/timeline" className="transition-colors hover:text-gold">
              رحلة التاريخ
            </Link>
            <Link to="/login" className="transition-colors hover:text-gold">
              دخول الطلاب
            </Link>
            <Link to="/staff-login" className="transition-colors hover:text-gold">
              بوابة المستر
            </Link>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-border-subtle pt-5 text-[11px] text-text-muted">
          <span dir="ltr" className="font-plex tracking-[0.18em]">
            31°15′N / 32°18′E
          </span>
          <span>© {new Date().getFullYear()} مستر محمد صيام — القيصر الرقمي للتعليم</span>
        </div>
      </div>
    </footer>
  );
}

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
