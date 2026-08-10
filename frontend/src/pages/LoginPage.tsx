import { motion } from 'motion/react';
import { ArrowLeft, Lock, User } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass as CompassBrand } from '../design-system/components/Compass';
import CoordinateLabel from '../design-system/components/CoordinateLabel';
import { HistoricalMap } from '../design-system/components/map/HistoricalMap';
import { Button } from '../design-system/ui/Button';
import Input from '../design-system/ui/Field';
import { useAuth } from '../lib/auth';
import { useToast } from '../design-system/ui/Toast';

const DEMO_ACCOUNTS = [
  { label: 'طالب', username: 'ahmed.samir', desc: 'أحمد سمير — تالتة إعدادي' },
  { label: 'مدرس', username: 'siam', desc: 'مستر محمد صيام' },
  { label: 'أمين', username: 'secretary', desc: 'أمين المعهد' },
];

export default function LoginPage() {
  const { login, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const user = await login(username.trim(), password);
      toast('أهلاً بيك في رحلتك', `مرحباً يا ${user.fullName}`, 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تسجيل الدخول');
    }
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-navy-deep">
      <div className="absolute inset-0 opacity-40">
        <HistoricalMap style="egypt" animated markers={[{ id: 'cairo', x: 46, y: 42, label: 'القاهرة', state: 'current' }]} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-navy-deep/70 via-transparent to-navy-deep" />
      <CoordinateLabel
        latitude={{ degrees: 30, minutes: 3, hemisphere: 'N' }}
        longitude={{ degrees: 31, minutes: 14, hemisphere: 'E' }}
        ambient
        className="absolute top-8 start-6"
      />

      <div className="relative z-10 m-auto flex w-full max-w-md flex-col items-center px-4 py-12">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
          <CompassBrand size="large" animated route />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mt-8 w-full rounded-lg border border-white/10 bg-white/[0.06] p-8 shadow-floating backdrop-blur-md"
        >
          <h1 className="display-serif text-center text-2xl font-bold text-white">
            محطة الوصول
          </h1>
          <p className="mt-2 text-center text-sm text-white/60">سجّل دخولك وكمل رحلتك من حيث وقفت</p>

          <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
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

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-md border border-error/40 bg-error/10 px-3 py-2 text-xs text-[#e89080]"
              >
                {error}
              </motion.p>
            )}

            <Button type="submit" variant="gold" size="lg" loading={loading} icon={<ArrowLeft size={17} />} className="mt-2">
              ابدأ الرحلة
            </Button>
          </form>

          <div className="mt-8 border-t border-white/10 pt-5">
            <p className="mb-3 text-center text-[11px] text-white/40">حسابات تجريبية — كلمة المرور: 123456</p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
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
                </button>
              ))}
            </div>
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
