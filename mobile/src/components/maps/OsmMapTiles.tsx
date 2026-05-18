import { Platform } from 'react-native';
import { UrlTile } from 'react-native-maps';

/** OpenStreetMap tiles — no Google Maps API key required on Android release APK. */
export default function OsmMapTiles() {
  return (
    <UrlTile
      urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      maximumZ={19}
      flipY={false}
      tileSize={256}
      zIndex={-1}
      shouldReplaceMapContent={Platform.OS === 'android'}
    />
  );
}

/** Use with OsmMapTiles on Android so tiles render without a Google Maps API key. */
export const nativeMapType = Platform.OS === 'android' ? ('none' as const) : ('standard' as const);
