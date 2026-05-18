import { emsColors } from '@ems/shared/theme/colors';
import type { Region } from 'react-native-maps';
import { IncidentStatus, type Incident } from '../models';

export const PH_CENTER: Region = {
  latitude: 12.8797,
  longitude: 121.774,
  latitudeDelta: 8,
  longitudeDelta: 8,
};

/** Comfortable zoom when focusing a pin (matches web/mobile map picker). */
export const PIN_DELTA = 0.08;

export function regionForPoint(lat: number, lng: number, delta = PIN_DELTA): Region {
  return {
    latitude: lat,
    longitude: lng,
    latitudeDelta: delta,
    longitudeDelta: delta,
  };
}

export function regionForPoints(points: { lat: number; lng: number }[]): Region {
  if (points.length === 0) return PH_CENTER;
  if (points.length === 1) return regionForPoint(points[0].lat, points[0].lng);

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const p of points) {
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
    minLng = Math.min(minLng, p.lng);
    maxLng = Math.max(maxLng, p.lng);
  }

  const latDelta = Math.max((maxLat - minLat) * 1.35, 0.06);
  const lngDelta = Math.max((maxLng - minLng) * 1.35, 0.06);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}

export function regionForIncidents(incidents: Incident[]): Region {
  return regionForPoints(incidents.map((i) => ({ lat: i.location.lat, lng: i.location.lng })));
}

/** react-native-maps pinColor values */
export function pinColorForStatus(status: string): 'red' | 'green' | 'purple' | undefined {
  switch (status) {
    case IncidentStatus.approved:
      return 'green';
    case IncidentStatus.rejected:
      return 'red';
    case IncidentStatus.resolved:
      return 'purple';
    case IncidentStatus.pending:
    default:
      return undefined;
  }
}

export function locationLabel(incident: Incident): string {
  if (incident.locationName?.trim()) return incident.locationName.trim();
  return `${incident.location.lat.toFixed(5)}, ${incident.location.lng.toFixed(5)}`;
}

/** Leaflet / web circle marker colors (aligned with Vite web map). */
export function statusToHexColor(status: string): string {
  switch (status) {
    case IncidentStatus.pending:
      return emsColors.mapPending;
    case IncidentStatus.approved:
      return emsColors.mapApproved;
    case IncidentStatus.rejected:
      return emsColors.mapRejected;
    case IncidentStatus.resolved:
      return emsColors.mapResolved;
    default:
      return emsColors.mapApproved;
  }
}

export function incidentsToMarkers(incidents: Incident[]): Array<{
  id: string;
  lat: number;
  lng: number;
  title: string;
  description: string;
  status: string;
}> {
  return incidents.map((i) => ({
    id: i.id,
    lat: i.location.lat,
    lng: i.location.lng,
    title: i.title,
    description: locationLabel(i),
    status: i.status,
  }));
}
