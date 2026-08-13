import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Button } from '../ui/Button';

const BOX_WIDTH = 320;

interface ImageCropperProps {
  src: string;
  /** عرض ÷ ارتفاع — النسبة اللي هيتقص عليها (16/9 للكورس، 4/3 للحصة...) */
  aspect?: number;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}

/**
 * قصّ صورة قبل الرفع: اسحب للتحريك + منزلق تقريب، وبالاعتماد بيطلع Blob جاهز للرفع.
 */
export function ImageCropper({ src, aspect = 16 / 9, onCancel, onConfirm }: ImageCropperProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dims, setDims] = useState({ natW: 0, natH: 0, cover: 1 });

  const boxH = BOX_WIDTH / aspect;

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    const onLoad = () => {
      const natW = img.naturalWidth || 1;
      const natH = img.naturalHeight || 1;
      setDims({ natW, natH, cover: Math.max(BOX_WIDTH / natW, boxH / natH) });
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    if (img.complete) onLoad();
    else img.addEventListener('load', onLoad);
    return () => img.removeEventListener('load', onLoad);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const s = dims.cover * zoom;
  const scaledW = dims.natW * s;
  const scaledH = dims.natH * s;
  const maxOx = Math.max(0, (scaledW - BOX_WIDTH) / 2);
  const maxOy = Math.max(0, (scaledH - boxH) / 2);
  const clamp = (x: number, y: number) => ({
    x: Math.max(-maxOx, Math.min(maxOx, x)),
    y: Math.max(-maxOy, Math.min(maxOy, y)),
  });

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    setOffset(clamp(dragRef.current.ox + (e.clientX - dragRef.current.startX), dragRef.current.oy + (e.clientY - dragRef.current.startY)));
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  const confirm = useCallback(() => {
    const img = imgRef.current;
    if (!img || !img.naturalWidth) return;
    const outW = 800;
    const outH = Math.max(1, Math.round(800 / aspect));
    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sw = BOX_WIDTH / s;
    const sh = boxH / s;
    const sx = Math.max(0, Math.min(dims.natW / 2 + offset.x / s - sw / 2, dims.natW - sw));
    const sy = Math.max(0, Math.min(dims.natH / 2 + offset.y / s - sh / 2, dims.natH - sh));

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, outW, outH);
    ctx.drawImage(img, sx, sy, Math.min(sw, dims.natW - sx), Math.min(sh, dims.natH - sy), 0, 0, outW, outH);
    canvas.toBlob((blob) => {
      if (blob) onConfirm(blob);
    }, 'image/jpeg', 0.9);
  }, [aspect, boxH, dims, offset, s, onConfirm]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-center">
        <div
          className="relative cursor-grab touch-none overflow-hidden rounded-lg border border-border-soft bg-surface-sunken active:cursor-grabbing"
          style={{ width: BOX_WIDTH, height: boxH }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <img
            ref={imgRef}
            src={src}
            alt=""
            draggable={false}
            className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
            style={{ width: scaledW, height: scaledH, transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 px-1">
        <span className="text-[11px] text-text-muted">تقريب:</span>
        <input
          type="range"
          min={1}
          max={4}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="flex-1 accent-gold"
        />
        <span className="w-10 text-end text-[11px] text-text-muted">{zoom.toFixed(1)}×</span>
      </div>

      <p className="text-center text-[11px] text-text-muted">اسحب الصورة عشان تحدد الجزء اللي هيتعرض — الكارت هيتعبأ تلقائيًا.</p>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          إلغاء
        </Button>
        <Button type="button" variant="gold" onClick={confirm}>
          اعتماد الصورة
        </Button>
      </div>
    </div>
  );
}
