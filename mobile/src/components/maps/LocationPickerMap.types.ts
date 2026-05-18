import type { StyleProp, ViewStyle } from 'react-native';
import type { IncidentMapMarker } from './types';

export type LocationPickerMapProps = {
  markers: IncidentMapMarker[];
  pin: { lat: number; lng: number } | null;
  pickEnabled: boolean;
  onPick: (lat: number, lng: number) => void;
  style?: StyleProp<ViewStyle>;
};

export type LocationPickerMapRef = {
  focusPoint: (lat: number, lng: number) => void;
  fitToMarkers: () => void;
};
