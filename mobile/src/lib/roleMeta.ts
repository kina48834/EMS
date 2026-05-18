import { Role } from '../models';

export const ROLE_LABELS: Record<string, string> = {
  [Role.resident]: 'Resident',
  [Role.barangayOfficial]: 'Barangay Official',
  [Role.emergencyResponders]: 'Emergency Responder',
  [Role.superAdmin]: 'System Admin',
};
