import { ems } from './emsClient'

export { reverseGeocode, searchPlacesInPhilippines } from './dbStandalone'

export const {
  getBarangays,
  listUsers,
  listUsersByRole,
  createUser,
  updateUser,
  deleteUser,
  listIncidents,
  listIncidentsForBarangay,
  listIncidentsForResponder,
  listIncidentsForReporter,
  getIncidentById,
  createIncident,
  updateIncident,
  deleteIncident,
  listAlertsByBarangay,
  createAlert,
  listEmergencyRespondersByBarangay,
  listResponsesByIncident,
  getResponse,
  upsertResponse,
  updateIncidentStatusToApproved,
  listIncidentsForBarangayApproved,
} = ems

export function getSessionUserId(): string | undefined {
  return undefined
}
