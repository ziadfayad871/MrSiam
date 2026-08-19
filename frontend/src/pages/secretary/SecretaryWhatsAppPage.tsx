import { CheckCircle2, Loader2, LogOut, MessageCircle, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../design-system/ui/Button';
import { Card } from '../../design-system/ui/Card';
import { api } from '../../lib/api';

interface WaStatus {
  reachable: boolean;
  connected: boolean;
  phone?: string | null;
}

interface WaQr {
  reachable: boolean;
  qr?: string | null;
}

export default function SecretaryWhatsAppPage() {
  const [status, setStatus] = useState<WaStatus | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    async function tick() {
      try {
        const [s, q] = await Promise.all([
          api.get<WaStatus>('/whatsapp/status'),
          api.get<WaQr>('/whatsapp/qr'),
        ]);
        if (!alive) return;
        setStatus(s);
        setQr(q?.qr ?? null);
      } catch {
        if (alive) setStatus({ reachable: false, connected: false });
      } finally {
        if (alive) setLoading(false);
      }
    }
    tick();
    const t = setInterval(tick, 4000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [attempt]);

  const unreachable = status && !status.reachable;

  async function handleLogout() {
    if (!window.confirm('هيتم تسجيل خروج الواتساب الحالي وهتظهر QR جديدة لربط رقم آخر. نكمل؟')) return;
    setBusy(true);
    try {
      await api.post('/whatsapp/logout');
      setAttempt((a) => a + 1);
    } catch {
      window.alert('حصلت مشكلة في تسجيل الخروج — تأكد إن البوابة شغالة على جهاز السنتر وجرب تاني');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="display-serif text-2xl font-bold text-text-primary">ربط واتساب السنتر</h1>
        <p className="mt-1 text-sm text-text-muted">
          بيربط المنصة برقم واتساب واحد — ومنه تتوجه إيصالات السداد والنتايج وإشعارات الغياب تلقائيًا لأولياء الأمور.
        </p>
      </div>

      {loading ? (
        <Card className="p-6">
          <div className="flex items-center justify-center gap-2 py-10 text-text-muted">
            <Loader2 size={20} className="animate-spin text-gold" />
            <span className="text-sm">بنجيب حالة الربط...</span>
          </div>
        </Card>
      ) : unreachable ? (
        <Card className="p-6">
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <Loader2 size={28} className="animate-spin text-gold" />
            <p className="font-bold text-text-primary">البوابة مش شغالة حاليًا</p>
            <p className="max-w-md text-sm text-text-muted">
              شغّل خدمة البوابة على جهاز السنتر (خدمة <code className="rounded bg-gold/10 px-1.5 py-0.5 font-plex text-gold">MrSiamWhatsAppGateway</code> —
              افحصها بـ <code className="font-plex" dir="ltr">whatsapp-service-status.bat</code> أو أعد تشغيلها من{' '}
              <code className="font-plex" dir="ltr">install-whatsapp-service.bat</code> كأدمن)، وبعدها اربط الرقم.
            </p>
            <Button variant="outline" icon={<RefreshCw size={14} />} onClick={() => setAttempt((a) => a + 1)}>
              أعد المحاولة
            </Button>
          </div>
        </Card>
      ) : status?.connected ? (
        <Card className="p-6">
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-success/15">
              <CheckCircle2 size={34} className="text-success" />
            </span>
            <p className="text-lg font-bold text-text-primary">الواتساب متصل</p>
            <p className="font-plex text-xs font-semibold tracking-wide text-text-muted" dir="ltr">
              {status.phone ?? 'Phone connected'}
            </p>
            <p className="max-w-md text-sm text-text-muted">
              إيصالات السداد والنتايج وإشعارات الغياب هتتوجه لأولياء الأمور تلقائيًا من الرقم ده.
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <Button variant="outline" icon={<RefreshCw size={14} />} onClick={() => setAttempt((a) => a + 1)}>
                تحديث
              </Button>
              <Button
                variant="outline"
                icon={busy ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                disabled={busy}
                onClick={handleLogout}
              >
                تغيير رقم الواتساب
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-gold/15">
              <MessageCircle size={26} className="text-gold" />
            </span>
            <p className="text-lg font-bold text-text-primary">اربط رقم الواتساب تاني مرة بس</p>
            {qr ? (
              <img src={qr} alt="QR ربط واتساب" className="h-56 w-56 rounded-xl border border-border-soft" />
            ) : (
              <span className="grid h-56 w-56 place-items-center rounded-xl border border-dashed border-border-soft">
                <Loader2 size={22} className="animate-spin text-gold" />
              </span>
            )}
            <ol className="max-w-md list-decimal space-y-1 ps-5 text-start text-sm text-text-muted">
              <li>افتح الواتساب على موبايل السنتر</li>
              <li>
                الإعدادات <span className="text-text-secondary">Settings</span> ← الأجهزة المرتبطة{' '}
                <span className="text-text-secondary">Linked devices</span> ← ربط جهاز
              </li>
              <li>امسح الكود ده — وما تقفلش الصفحة لحد ما الكود يظهر (بيتجدد تلقائيًا)</li>
            </ol>
            <Button variant="outline" icon={<RefreshCw size={14} />} onClick={() => setAttempt((a) => a + 1)}>
              تحديث
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}