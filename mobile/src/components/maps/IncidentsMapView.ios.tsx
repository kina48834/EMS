import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import OsmMapTiles, { nativeMapType } from './OsmMapTiles';
import { PH_CENTER, pinColorForStatus, regionForPoint, regionForPoints } from '../../lib/incidentMap';
import type { IncidentsMapRef, IncidentsMapViewProps } from './types';

const IncidentsMapView = forwardRef<IncidentsMapRef, IncidentsMapViewProps>(function IncidentsMapView(
  { markers, selectedId, onMarkerPress, style },
  ref,
) {
  const mapRef = useRef<MapView>(null);

  useImperativeHandle(ref, () => ({
    fitToMarkers() {
      if (markers.length === 0) return;
      mapRef.current?.animateToRegion(regionForPoints(markers), 400);
    },
    focusPoint(lat: number, lng: number) {
      mapRef.current?.animateToRegion(regionForPoint(lat, lng), 350);
    },
  }));

  useEffect(() => {
    if (selectedId) {
      const m = markers.find((x) => x.id === selectedId);
      if (m) mapRef.current?.animateToRegion(regionForPoint(m.lat, m.lng), 350);
    }
  }, [selectedId, markers]);

  return (
    <View style={[styles.wrap, style]}>
      <MapView ref={mapRef} style={styles.map} initialRegion={PH_CENTER} mapType={nativeMapType}>
        <OsmMapTiles />
        {markers.map((m) => (
          <Marker
            key={m.id}
            coordinate={{ latitude: m.lat, longitude: m.lng }}
            pinColor={m.id === selectedId ? 'red' : pinColorForStatus(m.status)}
            title={m.title}
            description={m.description}
            onPress={() => onMarkerPress?.(m.id)}
          />
        ))}
      </MapView>
    </View>
  );
});

export default IncidentsMapView;

const styles = StyleSheet.create({
  wrap: { flex: 1, overflow: 'hidden' },
  map: { ...StyleSheet.absoluteFillObject },
});
