import { Award, BookCheck, Flag, Globe, Map as MapIcon, Medal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Compass as CompassBrand } from '../../design-system/components/Compass';
import { CompassLoader } from '../../design-system/components/CompassLoader';
import { Card } from '../../design-system/ui/Card';
import { EmptyState } from '../../design-system/ui/EmptyState';
import { ErrorState } from '../../design-system/ui/ErrorState';
import { api } from '../../lib/api';
import type { PassportDto, PassportStampDto } from '../../lib/types';

const STAMP_ICONS: Record<string, React.ReactNode> = {
  achievement: <Award size={16} />,
  perfect: <Medal size={16} />,
  passed: <BookCheck size={16} />,
  course: <Globe size={16} />,
  milestone: <Flag size={16} />,
};

export default function PassportPage() {
  const [data, setData] = useState<PassportDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<PassportDto>('/student/passport')
      .then((d) => setData(d))
      .catch((e) => setError(e instanceof Error ? e.message : 'فشل تحميل الجواز'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CompassLoader text="بنختم جواز سفرك..." />;
  if (error || !data) return <ErrorState title={error ?? 'مفيش بيانات'} onRetry={() => window.location.reload()} />;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Cover */}
      <div className="relative overflow-hidden rounded-lg border border-gold/30 bg-navy-deep p-6 text-cream shadow-soft">
        <div className="absolute -end-8 -top-8 h-40 w-40 rounded-full bg-gold/20 blur-2xl" />
        <div className="absolute -bottom-10 -start-10 h-40 w-40 rounded-full bg-gold/10 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-gold/60 bg-gold/10">
              <CompassBrand size="navigation" />
            </div>
            <div>
              <p className="font-plex text-[10px] uppercase tracking-[0.3em] text-gold" dir="ltr">
                Traveler's Passport
              </p>
              <h1 className="display-serif mt-0.5 text-2xl font-bold">جواز سفر المستكشف</h1>
              <p className="mt-0.5 text-xs text-cream/70">مع أبو كيان.. كل رحلة دراسية بتبقى اكتشاف</p>
            </div>
          </div>
          <div className="text-start sm:text-end">
            <p className="text-lg font-bold">{data.studentName}</p>
            <p className="text-xs text-cream/70" dir="ltr">{data.studentCode}</p>
            <p className="text-[10px] text-cream/60">{data.stageAr} · {data.academicYear}</p>
          </div>
        </div>
      </div>

      {data.stamps.length === 0 ? (
        <EmptyState
          icon="map"
          title="جوازك لسه جديد"
          description="خد أول امتحان، وحقق إنجاز، وابدأ الرحلة — كل محطة بتضيف ختم هنا."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.stamps.map((s, i) => (
            <PassportStamp key={`${s.kind}-${i}`} stamp={s} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function PassportStamp({ stamp, index }: { stamp: PassportStampDto; index: number }) {
  return (
    <Card className="relative overflow-hidden p-4" variant={index % 3 === 0 ? 'map' : undefined}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold">
          {STAMP_ICONS[stamp.kind] ?? <Award size={16} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-gold" dir="ltr">
            {stamp.kind}
          </p>
          <h3 className="mt-0.5 text-sm font-bold text-text-primary">{stamp.title}</h3>
          <p className="mt-0.5 text-[11px] leading-relaxed text-text-muted">{stamp.detail}</p>
          {stamp.date && (
            <p className="mt-1 text-[10px] text-text-muted">
              {new Date(stamp.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>
      <span className="pointer-events-none absolute bottom-2 end-3 rotate-12 select-none font-plex text-lg text-gold/25" dir="ltr">
        {stamp.icon ?? '✕'}
      </span>
    </Card>
  );
}
