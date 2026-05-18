import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import L, { ensureLeafletStyles } from '../../lib/leafletWeb';
import { statusToHexColor } from '../../lib/incidentMap';
import type { LocationPickerMapProps, LocationPickerMapRef } from './LocationPickerMap.types';

const DEFAULT_CENTER: [number, number] = [12.8797, 121.774];

function fitBounds(map: L.Map, points: { lat: number; lng: number }[]) {
  if (points.length === 0) return;
  if (points.length === 1) {
    map.setView([points[0].lat, points[0].lng], 14, { animate: false });
  } else {
    const b = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
    if (b.isValid()) map.fitBounds(b.pad(0.12), { animate: false, maxZoom: 15 });
  }
  map.invalidateSize();
}

const LocationPickerMap = forwardRef<LocationPickerMapRef, LocationPickerMapProps>(function LocationPickerMap(
  { markers, pin, pickEnabled, onPick, style },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const pickEnabledRef = useRef(pickEnabled);
  const onPickRef = useRef(onPick);
  pickEnabledRef.current = pickEnabled;
  onPickRef.current = onPick;

  useImperativeHandle(ref, () => ({
    fitToMarkers() {
      const map = mapRef.current;
      if (!map) return;
      const pts = markers.map((m) => ({ lat: m.lat, lng: m.lng }));
      if (pin) pts.push(pin);
      fitBounds(map, pts);
    },
    focusPoint(lat: number, lng: number) {
      const map = mapRef.current;
      if (!map) return;
      map.setView([lat, lng], 14, { animate: false });
      map.invalidateSize();
    },
  }));

  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    ensureLeafletStyles();

    const map = L.map(el, { center: DEFAULT_CENTER, zoom: 10, zoomControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    const layer = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerRef.current = layer;

    map.on('click', (e: L.LeafletMouseEvent) => {
      if (!pickEnabledRef.current) return;
      onPickRef.current(e.latlng.lat, e.latlng.lng);
    });

    setTimeout(() => map.invalidateSize(), 0);
    setTimeout(() => map.invalidateSize(), 200);

    return () => {
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
      const c = statusToHexColor(m.status);
      L.circleMarker([m.lat, m.lng], {
        radius: 7,
        weight: 2,
        color: c,
        fillColor: c,
        fillOpacity: 0.85,
      })
        .bindTooltip(m.title)
        .addTo(group);
    }

    if (pin) {
      L.circleMarker([pin.lat, pin.lng], {
        radius: 10,
        weight: 3,
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 0.9,
      })
        .bindTooltip('New pin')
        .addTo(group);
      map.setView([pin.lat, pin.lng], Math.max(map.getZoom(), 14), { animate: false });
    } else if (markers.length > 0) {
      fitBounds(
        map,
        markers.map((m) => ({ lat: m.lat, lng: m.lng })),
      );
    }

    const container = map.getContainer();
    container.style.cursor = pickEnabled ? 'crosshair' : '';
    setTimeout(() => map.invalidateSize(), 50);
  }, [markers, pin, pickEnabled]);

  return (
    <View style={[styles.wrap, style, pickEnabled && styles.pickActive]}>
      <div ref={containerRef as never} style={styles.host} />
    </View>
  );
});

export default LocationPickerMap;

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 320,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#e2e8f0',
  },
  pickActive: { borderColor: '#0891b2', borderWidth: 2 },
  host: { width: '100%', height: '100%', minHeight: 320, flex: 1 } as object,
});
