import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, Lock, User } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass as CompassBrand } from '../design-system/components/Compass';
import CoordinateLabel from '../design-system/components/CoordinateLabel';
import { HistoricalMap } from '../design-system/components/map/HistoricalMap';
import { Button } from '../design-system/ui/Button';
import Input from '../design-system/ui/Field';
import { useAuth } from '../lib/auth';
import { useToast } from '../design-system/ui/Toast';
import type { UserDto } from '../lib/types';

interface PortalLoginProps {
  portal: 'student' | 'staff';
}

const PORTALS = {
  student: {
    path: '/staff-login',
    pathLabel: 'بوابة المستر',
    title: 'محطة الوصول',
    subtitle: 'رحلتك التعليمية تبدأ من هنا',
    accent: 'الطلاب',
    roleMessage: 'دي بوابة الطلاب — الحساب ده تبع بوابة المستر',
    demoNote: 'حسابات تجريبية للطلاب — كلمة المرور: 123456',
    demo: [
      { label: 'أحمد سمير', username: 'ahmed.samir', desc: 'تالتة إعدادي' },
      { label: 'ملك محمود', username: 'malak.mahmoud', desc: 'تالتة إعدادي' },
    ],
  },
  staff: {
    path: '/login',
    pathLabel: 'بوابة الطلاب',
    title: 'بوابة المستر',
    subtitle: 'من هنا بتدير رحلتك التعليمية',
    accent: 'أعضاء التدريس',
    roleMessage: 'دي بوابة المستر — الحساب ده تبع بوابة الطلاب',
    demoNote: 'حسابات تجريبية — كلمة المرور: 123456',
    demo: [
      { label: 'مستر صيام', username: 'siam', desc: 'مدرس' },
      { label: 'أمين المعهد', username: 'secretary', desc: 'أمين' },
    ],
  },
} as const;

export default function PortalLoginPage({ portal }: PortalLoginProps) {
  const { login, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const meta = PORTALS[portal];
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [arrived, setArrived] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const user = await login(username.trim(), password);
      if (!portalAllows(portal, user)) {
        setError(meta.roleMessage);
        setShakeKey((k) => k + 1);
        return;
      }
      setArrived(true);
      toast('أهلاً بيك في رحلتك', `مرحباً يا ${user.fullName}`, 'success');
      setTimeout(() => navigate('/dashboard'), 750);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تسجيل الدخول');
      setShakeKey((k) => k + 1);
    }
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-navy-deep">
      {/* Historical map backdrop */}
      <div className="absolute inset-0 opacity-40">
        <HistoricalMap style="egypt" animated markers={[{ id: 'cairo', x: 46, y: 42, label: 'القاهرة', state: 'current' }]} />
      </div>
      {/* Stars */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'radial-gradient(1.5px 1.5px at 15% 12%, var(--gold-bright-accent), transparent), radial-gradient(1px 1px at 42% 6%, var(--gold-accent), transparent), radial-gradient(1.5px 1.5px at 68% 16%, var(--gold-bright-accent), transparent), radial-gradient(1px 1px at 88% 8%, var(--gold-accent), transparent), radial-gradient(1px 1px at 6% 40%, var(--gold-accent), transparent), radial-gradient(1.5px 1.5px at 94% 48%, var(--gold-bright-accent), transparent), radial-gradient(1px 1px at 26% 70%, var(--gold-accent), transparent), radial-gradient(1px 1px at 78% 84%, var(--gold-accent), transparent)',
          backgroundSize: '180px 180px',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-navy-deep/70 via-transparent to-navy-deep" />

      {/* Golden light column behind the card */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[70vh] w-[60vw] max-w-xl -translate-x-1/2 -translate-y-1/2"
        style={{ background: 'radial-gradient(ellipse at center, rgba(201,162,39,0.14), transparent 65%)' }}
        animate={reduced ? undefined : { opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      <CoordinateLabel
        latitude={{ degrees: 30, minutes: 3, hemisphere: 'N' }}
        longitude={{ degrees: 31, minutes: 14, hemisphere: 'E' }}
        ambient
        className="absolute top-8 start-6"
      />

      <div className="relative z-10 m-auto flex w-full max-w-md flex-col items-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <CompassBrand size="large" animated route />
          <AnimatePresence>
            {arrived && (
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 3.4, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 rounded-full border-2 border-gold"
              />
            )}
          </AnimatePresence>
        </motion.div>

        {/* Tagline above the card */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="display-serif mt-6 text-center text-lg font-bold text-gold-bright"
          dir="rtl"
        >
          مع أبو كيان .. الدراسات في أمان
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6 }}
          className="mt-4 w-full rounded-lg border border-gold/25 bg-white/[0.06] p-8 shadow-floating backdrop-blur-md"
        >
          <h1 className="display-serif text-center text-2xl font-bold text-white">
            {meta.title}
          </h1>
          <p className="mt-2 text-center text-sm text-white/60">{meta.subtitle}</p>

          {/* Field validation column-raise on error */}
          <motion.form
            key={shakeKey}
            animate={shakeKey ? { x: [0, -8, 8, -5, 5, 0] } : undefined}
            transition={reduced ? undefined : { duration: 0.45 }}
            onSubmit={submit}
            className="mt-8 flex flex-col gap-4"
          >
            <Input
              label="اسم المستخدم"
              required
              icon={<User size={15} />}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="مثال: ahmed.samir"
              className="[&_input]:border-white/15 [&_input]:bg-white/5 [&_input]:text-white [&_input]:placeholder:text-white/30"
            />
            <Input
              label="كلمة المرور"
              type="password"
              required
              icon={<Lock size={15} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              className="[&_input]:border-white/15 [&_input]:bg-white/5 [&_input]:text-white [&_input]:placeholder:text-white/30"
            />

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-md border border-error/40 bg-error/10 px-3 py-2 text-xs text-[#e89080]"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <Button type="submit" variant="gold" size="lg" loading={loading} icon={<ArrowLeft size={17} />} className="mt-2">
              ابدأ الرحلة
            </Button>
          </motion.form>

          <div className="mt-8 border-t border-white/10 pt-5">
            <p className="mb-3 text-center text-[11px] text-white/40">{meta.demoNote}</p>
            <div className="grid grid-cols-2 gap-2">
              {meta.demo.map((acc) => (
                <button
                  key={acc.username}
                  onClick={() => {
                    setUsername(acc.username);
                    setPassword('123456');
                  }}
                  className="rounded-md border border-white/10 bg-white/5 px-2 py-2 text-center transition-colors hover:border-gold/50 hover:bg-gold/10"
                >
                  <p className="text-xs font-bold text-gold-bright">{acc.label}</p>
                  <p className="mt-0.5 font-plex text-[9px] text-white/40" dir="ltr">
                    {acc.username}
                  </p>
                  <p className="mt-0.5 text-[9px] text-white/30">{acc.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link to={meta.path} className="text-xs text-white/50 underline-offset-4 transition-colors hover:text-gold hover:underline">
              {meta.pathLabel} — لوج إن منفصل
            </Link>
          </div>
        </motion.div>

        <button
          onClick={() => navigate('/')}
          className="mt-6 flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-gold"
        >
          <ArrowLeft size={15} className="rotate-180" />
          الرجوع للرئيسية
        </button>
      </div>
    </div>
  );
}

function portalAllows(portal: 'student' | 'staff', user: UserDto): boolean {
  if (portal === 'student') return user.role === 'Student';
  return user.role === 'Teacher' || user.role === 'Secretary' || user.role === 'Admin';
}
