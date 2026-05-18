import { Platform } from 'react-native';
import type { LocationPickerMapProps, LocationPickerMapRef } from './LocationPickerMap.types';

type Comp = import('react').ForwardRefExoticComponent<
  LocationPickerMapProps & import('react').RefAttributes<LocationPickerMapRef>
>;

const LocationPickerMap: Comp =
  Platform.OS === 'web'
    ? require('./LocationPickerMap.web').default
    : Platform.OS === 'android'
      ? require('./LocationPickerMap.android').default
      : require('./LocationPickerMap.ios').default;

export default LocationPickerMap;
export type { LocationPickerMapProps, LocationPickerMapRef };
