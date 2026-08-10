import { Compass } from './Compass';
import CoordinateLabel from './CoordinateLabel';
import type { Coordinate } from './CoordinateLabel';

export interface HistoricalDividerProps {
  latitude?: Coordinate;
  longitude?: Coordinate;
  className?: string;
}

const DEFAULT_LAT: Coordinate = { degrees: 31, minutes: 15, hemisphere: 'N' };
const DEFAULT_LON: Coordinate = { degrees: 32, minutes: 18, hemisphere: 'E' };

/** Section transition divider: compass, line, coordinates — the brand seam */
export function HistoricalDivider({
  latitude = DEFAULT_LAT,
  longitude = DEFAULT_LON,
  className = '',
}: HistoricalDividerProps) {
  return (
    <div className={`relative flex items-center justify-center gap-6 py-4 ${className}`} aria-hidden="true">
      <div className="relative flex-1">
        <div className="h-px w-full bg-gradient-to-l from-border-gold via-border-subtle to-transparent" />
        <CoordinateLabel latitude={latitude} longitude={longitude} className="absolute -top-3 start-1" />
      </div>

      <Compass size="medium" className="shrink-0 opacity-90" />

      <div className="relative flex-1">
        <div className="h-px w-full bg-gradient-to-r from-border-gold via-border-subtle to-transparent" />
        <CoordinateLabel latitude={longitude} longitude={latitude} className="absolute -top-3 end-1" />
      </div>
    </div>
  );
}

export default HistoricalDivider;
