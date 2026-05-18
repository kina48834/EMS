import { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import OsmMapTiles, { nativeMapType } from './OsmMapTiles';
import { PH_CENTER, pinColorForStatus, regionForPoint, regionForPoints } from '../../lib/incidentMap';
import type { LocationPickerMapProps, LocationPickerMapRef } from './LocationPickerMap.types';

const LocationPickerMap = forwardRef<LocationPickerMapRef, LocationPickerMapProps>(function LocationPickerMap(
  { markers, pin, pickEnabled, onPick, style },
  ref,
) {
  const mapRef = useRef<MapView>(null);

  useImperativeHandle(ref, () => ({
    fitToMarkers() {
      const points = markers.map((m) => ({ lat: m.lat, lng: m.lng }));
      if (pin) points.push(pin);
      if (points.length === 0) return;
      mapRef.current?.animateToRegion(regionForPoints(points), 400);
    },
    focusPoint(lat: number, lng: number) {
      mapRef.current?.animateToRegion(regionForPoint(lat, lng), 350);
    },
  }));

  return (
    <View style={[styles.wrap, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={PH_CENTER}
        mapType={nativeMapType}
        onPress={
          pickEnabled
            ? (e) => onPick(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)
            : undefined
        }
      >
        <OsmMapTiles />
        {markers.map((m) => (
          <Marker
            key={m.id}
            coordinate={{ latitude: m.lat, longitude: m.lng }}
            pinColor={pinColorForStatus(m.status)}
            title={m.title}
            description={m.description}
          />
        ))}
        {pin ? (
          <Marker coordinate={{ latitude: pin.lat, longitude: pin.lng }} pinColor="red" title="New mark" />
        ) : null}
      </MapView>
    </View>
  );
});

export default LocationPickerMap;

const styles = StyleSheet.create({
  wrap: { flex: 1, overflow: 'hidden', borderRadius: 12 },
  map: { width: '100%', height: '100%', minHeight: 280 },
});
