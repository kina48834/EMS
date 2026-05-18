import type { Role } from '@/system/types'

export const ROLE_LABELS: Record<Role, string> = {
  resident: 'Resident',
  barangayOfficial: 'Barangay Official',
  emergencyResponders: 'Emergency Responder',
  superAdmin: 'System Admin',
}

export function profilePathForRole(role: Role): string {
  switch (role) {
    case 'resident':
      return '/resident/profile'
    case 'barangayOfficial':
      return '/barangay-official/profile'
    case 'emergencyResponders':
      return '/emergency-responders/profile'
    case 'superAdmin':
      return '/super-admin/profile'
  }
}

export function homePathForRole(role: Role): string {
  switch (role) {
    case 'resident':
      return '/resident'
    case 'barangayOfficial':
      return '/barangay-official'
    case 'emergencyResponders':
      return '/emergency-responders'
    case 'superAdmin':
      return '/super-admin'
  }
}
