import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import L, { ensureLeafletStyles } from '../../lib/leafletWeb';
import { statusToHexColor } from '../../lib/incidentMap';
import type { IncidentsMapRef, IncidentsMapViewProps } from './types';

const DEFAULT_CENTER: [number, number] = [12.8797, 121.774];
const DEFAULT_ZOOM = 10;

function fitLeafletBounds(map: L.Map, markers: { lat: number; lng: number }[]) {
  if (markers.length === 0) return;
  if (markers.length === 1) {
    map.setView([markers[0].lat, markers[0].lng], 14, { animate: false });
    map.invalidateSize();
    return;
  }
  const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number]));
  if (bounds.isValid()) {
    map.fitBounds(bounds.pad(0.12), { animate: false, maxZoom: 15 });
    map.invalidateSize();
  }
}

const IncidentsMapView = forwardRef<IncidentsMapRef, IncidentsMapViewProps>(function IncidentsMapView(
  { markers, selectedId, onMarkerPress, style },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const onMarkerPressRef = useRef(onMarkerPress);
  onMarkerPressRef.current = onMarkerPress;

  useImperativeHandle(ref, () => ({
    fitToMarkers() {
      const map = mapRef.current;
      if (!map) return;
      fitLeafletBounds(map, markers);
    },
    focusPoint(lat: number, lng: number) {
      const map = mapRef.current;
      if (!map) return;
      const z = map.getZoom();
      const nextZ = z < 11 ? 14 : z;
      map.setView([lat, lng], nextZ, { animate: false });
      map.invalidateSize();
    },
  }));

  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    ensureLeafletStyles();

    const map = L.map(el, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const layer = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerRef.current = layer;

    const t0 = window.setTimeout(() => map.invalidateSize(), 0);
    const t1 = window.setTimeout(() => map.invalidateSize(), 200);

    return () => {
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const group = layerRef.current;
    if (!map || !group) return;

    group.clearLayers();

    for (const m of markers) {
      const highlighted = m.id === selectedId;
      const color = statusToHexColor(m.status);
      const circle = L.circleMarker([m.lat, m.lng], {
        radius: highlighted ? 10 : 7,
        weight: highlighted ? 3 : 2,
        color,
        fillColor: color,
        fillOpacity: 0.85,
      });
      circle.bindTooltip(`<strong>${m.title}</strong><br/>${m.description ?? m.status}`, {
        direction: 'top',
      });
      circle.on('click', () => onMarkerPressRef.current?.(m.id));
      circle.addTo(group);
    }

    if (selectedId) {
      const sel = markers.find((x) => x.id === selectedId);
      if (sel) {
        const z = map.getZoom();
        const nextZ = z < 11 ? 14 : z;
        map.setView([sel.lat, sel.lng], nextZ, { animate: false });
      }
    } else if (markers.length > 0) {
      fitLeafletBounds(map, markers);
    }

    window.setTimeout(() => map.invalidateSize(), 50);
  }, [markers, selectedId]);

  return (
    <View style={[styles.wrap, style]}>
      <div ref={containerRef as never} style={styles.mapHost} />
    </View>
  );
});

export default IncidentsMapView;

const styles = StyleSheet.create({
  wrap: { flex: 1, minHeight: 320, backgroundColor: '#e2e8f0' },
  mapHost: {
    width: '100%',
    height: '100%',
    minHeight: 320,
    flex: 1,
  } as object,
});
