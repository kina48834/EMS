import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { statusToHexColor } from '../../lib/incidentMap';
import { buildPickerMapHtml } from './mapWebHtml';
import type { LocationPickerMapProps, LocationPickerMapRef } from './LocationPickerMap.types';

const LocationPickerMap = forwardRef<LocationPickerMapRef, LocationPickerMapProps>(function LocationPickerMap(
  { markers, pin, pickEnabled, onPick, style },
  ref,
) {
  const webRef = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  const html = useMemo(() => buildPickerMapHtml(markers, pin, pickEnabled), [markers, pin, pickEnabled]);

  const pushState = useCallback(() => {
    if (!ready) return;
    const m = JSON.stringify(
      markers.map((x) => ({
        lat: x.lat,
        lng: x.lng,
        title: x.title,
        color: statusToHexColor(x.status),
      })),
    );
    const p = pin ? JSON.stringify(pin) : 'null';
    webRef.current?.injectJavaScript(
      `window.__emsMap && window.__emsMap.setState(${m}, ${p}, ${pickEnabled ? 'true' : 'false'}); true;`,
    );
  }, [markers, pin, pickEnabled, ready]);

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
    pushState();
  }, [pushState]);

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
            const msg = JSON.parse(e.nativeEvent.data) as { type: string; lat?: number; lng?: number };
            if (msg.type === 'ready') setReady(true);
            if (msg.type === 'pick' && typeof msg.lat === 'number' && typeof msg.lng === 'number') {
              onPickRef.current(msg.lat, msg.lng);
            }
          } catch {
            /* ignore */
          }
        }}
      />
    </View>
  );
});

export default LocationPickerMap;

const styles = StyleSheet.create({
  wrap: { flex: 1, overflow: 'hidden', borderRadius: 12 },
  map: { width: '100%', height: '100%', minHeight: 280, backgroundColor: '#e2e8f0' },
});
