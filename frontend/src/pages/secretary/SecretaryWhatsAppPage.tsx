import { CheckCircle2, Loader2, LogOut, MessageCircle, RefreshCw, Send, XCircle } from 'lucide-react';
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
  const [testPhone, setTestPhone] = useState('');
  const [testBusy, setTestBusy] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

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

  async function handleTestSend() {
    const phone = testPhone.trim();
    if (!phone) {
      setTestResult({ ok: false, message: 'اكتب رقم الموبايل الأول' });
      return;
    }
    setTestBusy(true);
    setTestResult(null);
    try {
      const res = await api.post<{ success: boolean; message?: string }>('/whatsapp/test-send', { phone });
      setTestResult({ ok: true, message: res.message ?? 'تم إرسال الرسالة التجريبية' });
    } catch (e) {
      const msg =
        (e as { message?: string })?.message ??
        'الرسالة التجريبية متبعتتش — شوف اللوج على الاستضافة أو جرّب رقم تاني';
      setTestResult({ ok: false, message: msg });
    } finally {
      setTestBusy(false);
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
        <>
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
          <Card className="p-5">
            <h2 className="mb-1 text-base font-bold text-text-primary">جرّب الإرسال</h2>
            <p className="mb-3 text-sm text-text-muted">
              اكتب رقم موبايل (زي رقم ولي أمر) واضغط إرسال — لو وصلتك رسالة تجريبية يبقى الربط شغال تمام ولو لأ هنشخّص من اللوج.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                dir="ltr"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="01000000000"
                className="h-10 flex-1 rounded-lg border border-border-soft bg-surface px-3 font-plex text-sm text-text-primary outline-none focus:border-gold"
              />
              <Button
                icon={testBusy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                disabled={testBusy}
                onClick={handleTestSend}
              >
                {testBusy ? 'بنتسجّل...' : 'إرسال تجريبي'}
              </Button>
            </div>
            {testResult && (
              <div
                className={`mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                  testResult.ok ? 'border-success/30 bg-success/10 text-success' : 'border-danger/30 bg-danger/10 text-danger'
                }`}
              >
                {testResult.ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <XCircle size={16} className="mt-0.5 shrink-0" />}
                <span>{testResult.message}</span>
              </div>
            )}
          </Card>
        </>
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