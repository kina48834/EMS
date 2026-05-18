/**
 * Leaflet for Expo web only — do not import leaflet.css in Metro (url() assets fail).
 * Loads stylesheet from CDN; native APK uses react-native-maps instead.
 */
import L from 'leaflet';

let stylesReady = false;

export function ensureLeafletStyles(): void {
  if (stylesReady || typeof document === 'undefined') return;
  stylesReady = true;

  if (document.getElementById('ems-leaflet-css')) return;

  const link = document.createElement('link');
  link.id = 'ems-leaflet-css';
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

export { L };
export default L;
