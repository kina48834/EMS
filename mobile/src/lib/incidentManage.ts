import { canResidentManageIncident } from '@ems/shared/incidentManage';
import type { Incident } from '../models';

export function canManageOwnMark(incident: Incident, userId: string): boolean {
  return canResidentManageIncident(incident, userId);
}
