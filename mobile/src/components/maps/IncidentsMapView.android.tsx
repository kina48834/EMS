import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { statusToHexColor } from '../../lib/incidentMap';
import { buildIncidentsMapHtml } from './mapWebHtml';
import type { IncidentsMapRef, IncidentsMapViewProps } from './types';

const IncidentsMapView = forwardRef<IncidentsMapRef, IncidentsMapViewProps>(function IncidentsMapView(
  { markers, selectedId, onMarkerPress, style },
  ref,
) {
  const webRef = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  const onMarkerPressRef = useRef(onMarkerPress);
  onMarkerPressRef.current = onMarkerPress;

  const html = useMemo(() => buildIncidentsMapHtml(markers, selectedId ?? null), [markers, selectedId]);

  const pushMarkers = useCallback(() => {
    if (!ready) return;
    const payload = JSON.stringify(
      markers.map((m) => ({
        id: m.id,
        lat: m.lat,
        lng: m.lng,
        title: m.title,
        description: m.description ?? m.status,
        color: statusToHexColor(m.status),
        selected: m.id === selectedId,
      })),
    );
    webRef.current?.injectJavaScript(`window.__emsMap && window.__emsMap.setMarkers(${payload}); true;`);
  }, [markers, selectedId, ready]);

  useImperativeHandle(ref, () => ({
    fitToMarkers() {
      webRef.current?.injectJavaScript('window.__emsMap && window.__emsMap.fitMarkers(); true;');
    },
    focusPoint(lat: number, lng: number) {
      webRef.current?.injectJavaScript(
        `window.__emsMap && window.__emsMap.focus(${lat}, ${lng}); true;`,
      );
    },
  }));

  useEffect(() => {
    pushMarkers();
  }, [pushMarkers]);

  return (
    <View style={[styles.wrap, style]}>
      <WebView
        ref={webRef}
        style={styles.map}
        originWhitelist={['*']}
        source={{ html }}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        setSupportMultipleWindows={false}
        onMessage={(e) => {
          try {
            const msg = JSON.parse(e.nativeEvent.data) as { type: string; id?: string };
            if (msg.type === 'ready') setReady(true);
            if (msg.type === 'markerPress' && msg.id) onMarkerPressRef.current?.(msg.id);
          } catch {
            /* ignore */
          }
        }}
      />
    </View>
  );
});

export default IncidentsMapView;

const styles = StyleSheet.create({
  wrap: { flex: 1, overflow: 'hidden' },
  map: { flex: 1, backgroundColor: '#e2e8f0' },
});
