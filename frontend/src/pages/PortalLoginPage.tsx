import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Moon, Quote, Sun } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../design-system/ui/Toast';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import type { UserDto } from '../lib/types';

interface PortalLoginProps {
  portal: 'student' | 'staff';
}

const PORTALS = {
  student: {
    path: '/staff-login', pathLabel: 'بوابة المستر', title: 'مرحباً بك', subtitle: 'سجّل دخولك واستمر في رحلتك التعليمية',
    roleMessage: 'دي بوابة الطلاب — الحساب ده تابع لبوابة المستر', demoNote: null, demo: [],
  },
  staff: {
    path: '/login', pathLabel: 'بوابة الطلاب', title: 'بوابة المستر', subtitle: 'سجّل دخولك لإدارة رحلتك التعليمية',
    roleMessage: 'دي بوابة المستر — الحساب ده تابع لبوابة الطلاب', demoNote: 'حسابات تجريبية — كلمة المرور: 123456',
    demo: [{ label: 'مستر صيام', username: 'siam', desc: 'مدرس' }, { label: 'أمين المعهد', username: 'secretary', desc: 'أمين' }],
  },
} as const;

export default function PortalLoginPage({ portal }: PortalLoginProps) {
  const { login, loading, logout } = useAuth();
  const { toast } = useToast();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const meta = PORTALS[portal];
  const [params] = useSearchParams();
  const [username, setUsername] = useState(params.get('u') ?? '');
  const [password, setPassword] = useState(params.get('p') ?? '');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const user = await login(username.trim(), password);
      if (!portalAllows(portal, user)) {
        logout();
        setError(meta.roleMessage);
        return;
      }
      toast('أهلاً بيك في رحلتك', `مرحباً يا ${user.fullName}`, 'success');
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تسجيل الدخول');
    }
  }

  return (
    <main className="login-page min-h-screen bg-[#0b0d0b] p-3 text-[#f8eddb] sm:p-5" dir="rtl">
      <div className="login-ambient" aria-hidden />
      <div className="login-mobile-portrait" aria-hidden />
      <button onClick={toggle} className="absolute left-6 top-6 z-20 flex overflow-hidden rounded-full border border-[#bd8732]/50 bg-[#161613]/80 p-1 text-[#dfb35f] backdrop-blur" aria-label="تبديل الوضع الليلي">
        <span className={`grid h-9 w-9 place-items-center rounded-full transition ${theme === 'light' ? 'bg-[#c78d32] text-[#17130d]' : ''}`}><Sun size={18} /></span>
        <span className={`grid h-9 w-9 place-items-center rounded-full transition ${theme === 'dark' ? 'bg-[#c78d32] text-[#17130d]' : ''}`}><Moon size={18} /></span>
      </button>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1500px] items-stretch gap-7 md:grid-cols-[1.12fr_.88fr] md:gap-8 lg:gap-12">
        <motion.aside
          initial={{ opacity: 0, x: reduced ? 0 : 25 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.65 }}
          className="login-showcase relative hidden min-h-[720px] overflow-hidden rounded-[1.6rem] border border-[#ba8433]/55 md:block"
        >
          <img src="/siam-platform-portrait.jpeg" alt="مستر محمد صيام" className="absolute inset-0 h-full w-full object-cover object-[45%_center]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,10,8,.92)_0%,rgba(9,10,8,.38)_47%,rgba(9,10,8,.12)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(9,10,8,.75),transparent_45%)]" />
          <div className="absolute inset-y-12 right-10 w-px bg-gradient-to-b from-transparent via-[#c99236]/70 to-transparent" />
          <div className="relative flex h-full max-w-[45%] flex-col justify-center pr-14 text-right">
            <img src="/caesar-logo.webp" alt="شعار القيصر" className="login-caesar-emblem mb-8" />
            <p className="text-4xl font-extrabold text-[#dca444]">القيصر</p>
            <p className="mt-2 text-lg font-bold text-white">مستر محمد صيام</p>
            <span className="my-7 h-px w-28 bg-[#c99236]/70" />
            <p className="text-sm font-bold text-[#dca444]">مدرس الدراسات الاجتماعية</p>
            <div className="mt-auto mb-16">
              <Quote className="mb-3 text-[#dca444]" size={38} fill="currentColor" />
              <p className="text-lg leading-9 text-white/90">العلم ليس ما تحفظه،<br />بل ما ينفعك وينفع بك.</p>
              <p className="mt-4 font-bold text-[#dca444]">— محمد صيام</p>
            </div>
          </div>
        </motion.aside>

        <section className="relative flex min-h-[calc(100vh-1.5rem)] items-center justify-center py-16 md:py-8">
          <motion.div initial={{ opacity: 0, y: reduced ? 0 : 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6 }} className="login-form-card w-full max-w-[620px] rounded-[1.6rem] border border-[#b98131]/55 px-6 py-10 shadow-[0_24px_80px_rgba(0,0,0,.35)] backdrop-blur-xl sm:px-12 sm:py-14">
            <header className="text-center">
              <div className="flex items-center justify-center gap-3 text-[#d9a247]"><span className="h-px w-10 bg-current/40" /> <span className="text-2xl">♛</span> <span className="h-px w-10 bg-current/40" /></div>
              <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">{meta.title}</h1>
              <p className="mt-3 text-base text-[#d7c0a0]">{meta.subtitle}</p>
              <span className="mx-auto mt-5 block h-px w-16 bg-[#d9a247]/70" />
            </header>

            <form onSubmit={submit} className="mt-9 space-y-6">
              <label className="block text-sm font-bold text-[#f0dfc6]">البريد الإلكتروني / اسم المستخدم
                <span className="relative mt-3 block">
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-[#c4a87c]" size={21} />
                  <input required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="أدخل بريدك الإلكتروني أو اسم المستخدم" className="login-input pr-12" />
                </span>
              </label>
              <label className="block text-sm font-bold text-[#f0dfc6]">كلمة المرور
                <span className="relative mt-3 block">
                  <LockKeyhole className="absolute right-4 top-1/2 -translate-y-1/2 text-[#c4a87c]" size={21} />
                  <input required type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="أدخل كلمة المرور" className="login-input pr-12 pl-12" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c4a87c]" aria-label="إظهار كلمة المرور">{showPassword ? <EyeOff size={21} /> : <Eye size={21} />}</button>
                </span>
              </label>

              <div className="flex items-center justify-between text-sm">
                <button type="button" className="font-bold text-[#dca444] transition hover:text-[#f5c567]">نسيت كلمة المرور؟</button>
                <label className="flex cursor-pointer items-center gap-2 text-[#ead9be]"><input checked={remember} onChange={(e) => setRemember(e.target.checked)} type="checkbox" className="login-check" /> تذكرني</label>
              </div>

              <AnimatePresence>{error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-xl border border-red-400/35 bg-red-500/10 px-4 py-3 text-center text-sm text-red-200">{error}</motion.p>}</AnimatePresence>
              <button disabled={loading} type="submit" className="login-submit">{loading ? 'جاري تسجيل الدخول...' : <>تسجيل الدخول <ArrowLeft size={21} /></>}</button>
            </form>

            {meta.demoNote && <div className="mt-7 border-t border-[#b98131]/20 pt-5"><p className="mb-3 text-center text-xs text-[#d7c0a0]">{meta.demoNote}</p><div className="grid grid-cols-2 gap-3">{meta.demo.map((account) => <button key={account.username} onClick={() => { setUsername(account.username); setPassword('123456'); }} className="rounded-xl border border-[#b98131]/30 px-3 py-2 text-xs text-[#efd8b2] hover:bg-[#c78d32]/10">{account.label}</button>)}</div></div>}
            <p className="mt-8 text-center text-sm text-[#d7c0a0]">ليس لديك حساب؟ {portal === 'student' ? <a href="https://wa.me/201207275688" target="_blank" rel="noreferrer" className="font-bold text-[#dca444] transition hover:text-[#f5c567]">تواصل مع إدارة المنصة</a> : <span className="font-bold text-[#dca444]">تواصل مع إدارة المنصة</span>}</p>
            {portal === 'student' ? (
              <Link to="/" className="mt-5 flex items-center justify-center gap-2 text-xs text-[#cbb995] hover:text-[#dca444]">العودة للرئيسية <ArrowRight size={14} /></Link>
            ) : (
              <Link to={meta.path} className="mt-5 flex items-center justify-center gap-2 text-xs text-[#cbb995] hover:text-[#dca444]">{meta.pathLabel} <ArrowRight size={14} /></Link>
            )}
          </motion.div>
          {portal === 'staff' && <button onClick={() => navigate('/')} className="absolute bottom-5 text-sm text-[#cbb995] transition hover:text-[#dca444]">العودة للرئيسية</button>}
        </section>
      </div>
    </main>
  );
}

function portalAllows(portal: 'student' | 'staff', user: UserDto): boolean {
  return portal === 'student' ? user.role === 'Student' : user.role === 'Teacher' || user.role === 'Secretary' || user.role === 'Admin';
}
