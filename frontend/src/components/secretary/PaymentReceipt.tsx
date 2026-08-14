import { CheckCircle2 } from 'lucide-react';
import type { PaymentReceiptDto } from '../../lib/types';

export function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, (m || 1) - 1, 1);
  return d.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
}

const WORDS_UNITS = ['صفر', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
const WORDS_TEENS: Record<number, string> = {
  10: 'عشرة',
  11: 'أحد عشر',
  12: 'اثنا عشر',
  13: 'ثلاثة عشر',
  14: 'أربعة عشر',
  15: 'خمسة عشر',
  16: 'ستة عشر',
  17: 'سبعة عشر',
  18: 'ثمانية عشر',
  19: 'تسعة عشر',
};
const WORDS_TENS = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
const WORDS_HUNDREDS = ['', 'مئة', 'مئتان', 'ثلاثمئة', 'أربعمئة', 'خمسمئة', 'ستمئة', 'سبعمئة', 'ثمانمئة', 'تسعمئة'];

function chunkWords(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  let s = h > 0 ? WORDS_HUNDREDS[h] : '';
  let t = '';
  if (rest > 0) {
    if (rest < 10) t = WORDS_UNITS[rest];
    else if (rest < 20) t = WORDS_TEENS[rest];
    else {
      const tens = Math.floor(rest / 10);
      const ones = rest % 10;
      t = ones > 0 ? `${WORDS_UNITS[ones]} و${WORDS_TENS[tens]}` : WORDS_TENS[tens];
    }
  }
  return [s, t].filter(Boolean).join(' و');
}

function scaleLabel(scale: number, count: number): string {
  if (scale === 1) {
    if (count === 1) return 'ألف';
    if (count === 2) return 'ألفان';
    if (count <= 10) return 'آلاف';
    return 'ألف';
  }
  const names = ['', 'مليون', 'مليار'];
  const dual = ['', 'مليونان', 'ملياران'];
  const plural = ['', 'ملايين', 'مليارات'];
  if (count === 1) return names[scale];
  if (count === 2) return dual[scale];
  if (count <= 10) return plural[scale];
  return names[scale];
}

function amountInWords(amount: number): string {
  const n = Math.round(Math.abs(amount));
  if (n === 0) return 'صفر جنيه مصري';
  const parts: string[] = [];
  let rest = n;
  let scale = 0;
  while (rest > 0) {
    const chunk = rest % 1000;
    if (chunk > 0) {
      const words = chunkWords(chunk);
      if (scale === 0) parts.unshift(words);
      else if (chunk <= 2) parts.unshift(scaleLabel(scale, chunk));
      else parts.unshift(`${words} ${scaleLabel(scale, chunk)}`);
    }
    rest = Math.floor(rest / 1000);
    scale++;
  }
  return `${parts.join(' و')} جنيه مصري`;
}

function formatHijri(d: Date): string {
  try {
    return new Intl.DateTimeFormat('ar-EG-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
  } catch {
    return '';
  }
}

function ReceiptRow({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-[#8a6d2f]">{label}</span>
      <span className={`font-bold ${ltr ? 'font-plex' : ''}`} dir={ltr ? 'ltr' : undefined}>
        {value}
      </span>
    </div>
  );
}

export function ReceiptView({ rec }: { rec: PaymentReceiptDto }) {
  const paidDate = new Date(rec.paidAt);
  return (
    <div
      id="payment-receipt"
      className="w-full max-w-[430px] rounded-xl border-[3px] border-double border-gold bg-[#fffdf7] p-6 text-center text-[#16121f]"
    >
      <div className="flex items-center justify-between text-[10px] text-[#8a6d2f]">
        <span>رقم الإيصال</span>
        <span className="font-plex font-bold" dir="ltr">
          RCP-{String(rec.id).padStart(4, '0')}
        </span>
      </div>

      <h1 className="display-serif mt-3 text-2xl font-black tracking-wide text-[#16121f]">مستر محمد صيام</h1>
      <p className="mt-0.5 text-[11px] text-[#6b6b76]">مع أبو كيان .. الدراسات في أمان</p>

      <div className="my-3 flex items-center gap-2 text-gold">
        <span className="h-px flex-1 bg-gold/40" />
        <span>◆</span>
        <span className="h-px flex-1 bg-gold/40" />
      </div>

      <p className="text-sm font-bold uppercase tracking-[0.3em] text-gold">إيصال دفع</p>

      <div className="mt-4 space-y-1.5 rounded-lg border border-gold/30 bg-[#fdf9ee] p-3">
        <ReceiptRow label="الطالب" value={rec.studentName} />
        <ReceiptRow label="المرحلة" value={rec.stageAr || '—'} />
        <ReceiptRow label="يوزر نيم المنصة" value={rec.username || '—'} ltr />
        <ReceiptRow label="رقم الطالب" value={rec.studentCode || '—'} ltr />
        <ReceiptRow label="الشهر المستحق" value={formatMonth(rec.month)} />
        <ReceiptRow label="طريقة الدفع" value={rec.method ?? 'نقدي'} />
      </div>

      <div className="mt-4 rounded-lg border-2 border-gold/60 bg-gold/5 p-4">
        <p className="text-[10px] text-[#6b6b76]">المبلغ المدفوع</p>
        <p className="mt-1 text-4xl font-black text-[#16121f]">
          {Number(rec.amount).toLocaleString('ar-EG')}
          <span className="ms-1 text-lg font-bold text-gold">ج.م</span>
        </p>
        <p className="mt-1.5 text-[11px] font-semibold text-[#8a6d2f]">{amountInWords(rec.amount)}</p>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-[#3a3a42]">
        استلمنا من الطالب <b>{rec.studentName}</b> مبلغ{' '}
        <b>{Number(rec.amount).toLocaleString('ar-EG')} جنيه مصري</b> عن اشتراك شهر <b>{formatMonth(rec.month)}</b>.
      </p>

      <div className="mt-4 flex items-center justify-between border-t border-gold/30 pt-3 text-[10px] text-[#6b6b76]">
        <span>التاريخ: {formatDate(rec.paidAt)}</span>
        <span>{formatHijri(paidDate)}</span>
      </div>

      <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-bold text-[#2e7d5b]">
        <CheckCircle2 size={14} /> مدفوع ✓
      </div>

      <div className="mt-4 flex items-end justify-between text-[10px] text-[#8a6d2f]">
        <span className="text-xs font-bold">إمضاء الأمين</span>
        <span className="mb-2 text-xs font-bold">مستر محمد صيام</span>
      </div>
    </div>
  );
}
