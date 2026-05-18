import { Platform } from 'react-native';
import type { IncidentsMapRef, IncidentsMapViewProps } from './types';

type MapComponent = import('react').ForwardRefExoticComponent<
  IncidentsMapViewProps & import('react').RefAttributes<IncidentsMapRef>
>;

const IncidentsMapView: MapComponent =
  Platform.OS === 'web'
    ? require('./IncidentsMapView.web').default
    : require('./IncidentsMapView.native').default;

export default IncidentsMapView;
export type { IncidentsMapRef, IncidentsMapViewProps, IncidentMapMarker } from './types';
