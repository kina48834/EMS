import type { StyleProp, ViewStyle } from 'react-native';

export type IncidentMapMarker = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description?: string;
  status: string;
};

export type IncidentsMapRef = {
  fitToMarkers: () => void;
  focusPoint: (lat: number, lng: number) => void;
};

export type IncidentsMapViewProps = {
  markers: IncidentMapMarker[];
  selectedId?: string | null;
  onMarkerPress?: (id: string) => void;
  style?: StyleProp<ViewStyle>;
};
