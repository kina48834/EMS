export {
  Role,
  IncidentType,
  IncidentStatus,
  mapUserRow as parseUser,
  mapBarangayRow as parseBarangay,
  mapIncidentRow as parseIncident,
  mapResponseRow as parseIncidentResponderRow,
  mapAlertRow as parseAlert,
} from '@ems/shared';

export type {
  Alert,
  AlertChannel,
  Barangay,
  EmergencyKind,
  GeoPoint,
  ID,
  Incident,
  IncidentResponse,
  ResponseStatus,
  User,
} from '@ems/shared/types';

/** @deprecated Use IncidentResponse */
export type IncidentResponderRow = import('@ems/shared/types').IncidentResponse;
