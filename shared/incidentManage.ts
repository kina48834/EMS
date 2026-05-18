import type { IncidentStatus } from './types'

/** Residents may edit or delete their own marks while pending or rejected. */
export function canResidentManageIncident(
  incident: { reporterId: string; status: IncidentStatus },
  userId: string,
): boolean {
  return (
    incident.reporterId === userId &&
    (incident.status === 'pending' || incident.status === 'rejected')
  )
}
