import { CheckCircle2, ExternalLink, Loader2, MessageCircle, QrCode, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../design-system/ui/Button';
import { Card } from '../../design-system/ui/Card';

const GATEWAY = (import.meta.env.VITE_WA_GATEWAY as string | undefined) ?? 'http://localhost:3002';

interface WaStatus {
  connected: boolean;
  phone?: string | null;
}

export default function SecretaryWhatsAppPage() {
  const [status, setStatus] = useState<WaStatus | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [reachable, setReachable] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    async function tick() {
      try {
        const [s, q] = await Promise.all([
          fetch(`${GATEWAY}/status`, { cache: 'no-store' }).then((r) => r.json()),
          fetch(`${GATEWAY}/qr`, { cache: 'no-store' }).then((r) => r.json()),
        ]);
        if (!alive) return;
        setStatus(s as WaStatus);
        setQr((q as { qr: string | null })?.qr ?? null);
        setReachable(true);
      } catch {
        if (alive) setReachable(false);
      }
    }
    tick();
    const t = setInterval(tick, 4000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [attempt]);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="display-serif text-2xl font-bold text-text-primary">ربط واتساب السنتر</h1>
        <p className="mt-1 text-sm text-text-muted">
          بيربط المنصة برقم واتساب واحد — ومنه تتوجه إيصالات السداد تلقائيًا لأولياء الأمور.
        </p>
      </div>

      {!reachable ? (
        <Card className="p-6">
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <Loader2 size={28} className="animate-spin text-gold" />
            <p className="font-bold text-text-primary">البوابة مش شغالة حاليًا</p>
            <p className="max-w-md text-sm text-text-muted">
              شغّل الملف <code className="rounded bg-gold/10 px-1.5 py-0.5 font-plex text-gold">run-all.bat</code> في جذر
              المشروع — بيفتح الباك اند والواجهة والبوابة مع بعض. الصفحة دي بتتحدّث لوحدها.
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
              إيصالات السداد والنتايج هتتوجه لأولياء الأمور تلقائيًا من الرقم ده.
            </p>
            <Button variant="outline" icon={<ExternalLink size={14} />} onClick={() => window.open(GATEWAY, '_blank')}>
              فتح صفحة البوابة
            </Button>
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
            <div className="flex gap-2">
              <Button variant="outline" icon={<ExternalLink size={14} />} onClick={() => window.open(GATEWAY, '_blank')}>
                فتح الصفحة كاملة
              </Button>
              <Button variant="ghost" icon={<QrCode size={14} />} onClick={() => setAttempt((a) => a + 1)}>
                تحديث
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}