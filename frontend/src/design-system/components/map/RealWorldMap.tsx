import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '../../motion/hooks';

export interface GeoMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  state?: 'discovered' | 'current' | 'locked';
}

export interface GeoRoute {
  id: string;
  points: [number, number][];
}

export interface RealWorldMapProps {
  markers?: GeoMarker[];
  routes?: GeoRoute[];
  animated?: boolean;
  className?: string;
  tileStyle?: 'dark' | 'light';
}

function markerHtml(m: GeoMarker): string {
  const state = m.state ?? 'discovered';
  return `
    <div class="realmap-marker ${state}">
      ${state !== 'locked' ? '<span class="realmap-pulse"></span>' : ''}
      <span class="realmap-dot"></span>
      ${m.label ? `<span class="realmap-label">${m.label}</span>` : ''}
    </div>
  `;
}

/**
 * Real cartographic world map (OSM + CARTO tiles via Leaflet).
 * True continents & coastlines — the same visual language used by atlases.
 * Pure background: no zoom/drag by the user; a slow ambient drift animates it.
 * Markers/routes are placed on real coordinates (lat/lng).
 */
export function RealWorldMap({
  markers = [],
  routes = [],
  animated = true,
  className = '',
  tileStyle = 'dark',
}: RealWorldMapProps) {
  const reduced = usePrefersReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{ markers: L.Marker[]; routes: L.Polyline[] }>({ markers: [], routes: [] });

  /* Init map once */
  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const map = L.map(el, {
      zoomControl: false,
      attributionControl: true,
      dragging: false,
      touchZoom: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      zoomSnap: 0.25,
      minZoom: 2,
    });
    mapRef.current = map;

    const tiles =
      tileStyle === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    L.tileLayer(tiles, {
      subdomains: 'abcd',
      maxZoom: 19,
      detectRetina: true,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(map);

    map.setView([24, 20], 2);
    map.setMaxBounds(L.latLngBounds([-65, -180], [80, 180]));

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [tileStyle]);

  /* Ambient slow drift */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || reduced || !animated) return;
    let dx = 0.5;
    let dy = 0.18;
    const id = setInterval(() => {
      const c = map.getCenter();
      const nextLat = c.lat + dy;
      const nextLng = c.lng + dx;
      if (nextLat > 38) dy = -Math.abs(dy);
      if (nextLat < 8) dy = Math.abs(dy);
      if (nextLng > 55) dx = -Math.abs(dx);
      if (nextLng < -15) dx = Math.abs(dx);
      map.panTo([nextLat, nextLng], { animate: true, duration: 2.6, easeLinearity: 0.35, noMoveStart: true });
    }, 3200);
    return () => clearInterval(id);
  }, [animated, reduced]);

  /* Markers + routes (re-created on change) */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    layersRef.current.markers.forEach((m) => m.remove());
    layersRef.current.routes.forEach((r) => r.remove());
    layersRef.current = { markers: [], routes: [] };

    markers.forEach((m) => {
      const icon = L.divIcon({
        className: 'realmap-icon',
        html: markerHtml(m),
        iconSize: [64, 46],
        iconAnchor: [32, 22],
      });
      const marker = L.marker([m.lat, m.lng], {
        icon,
        interactive: false,
        keyboard: false,
        title: m.label ?? '',
      }).addTo(map);
      layersRef.current.markers.push(marker);
    });

    routes.forEach((r) => {
      const poly = L.polyline(r.points, {
        color: 'var(--gold-accent)',
        weight: 1.6,
        opacity: 0.85,
        dashArray: '6 6',
        interactive: false,
        className: 'realmap-route',
      }).addTo(map);
      layersRef.current.routes.push(poly);
    });

    if (markers.length > 0) {
      map.fitBounds(
        L.latLngBounds(markers.map((m) => [m.lat, m.lng])),
        { padding: [70, 70], maxZoom: 3.6 },
      );
    } else {
      map.setView([24, 20], 2);
    }
  }, [markers, routes]);

  return (
    <div className={`relative ${className}`} aria-label="خريطة العالم">
      <div ref={containerRef} className="realmap-shell absolute inset-0" />
    </div>
  );
}

export default RealWorldMap;
