import type { Role } from '@/system/types'
import { profilePathForRole } from '@/profile/shared/roleMeta'

export type NavLinkItem = { label: string; to: string; end?: boolean }

export const ROLE_NAV_LINKS: Record<Role, NavLinkItem[]> = {
  resident: [
    { label: 'My Reports', to: '/resident', end: true },
    { label: 'New Report & Map', to: '/resident/incidents/new' },
    { label: 'Profile', to: '/resident/profile' },
  ],
  barangayOfficial: [
    { label: 'Review Reports', to: '/barangay-official', end: true },
    { label: 'Resident Marks', to: '/barangay-official/marks' },
    { label: 'Profile', to: '/barangay-official/profile' },
  ],
  emergencyResponders: [
    { label: 'Incident Queue', to: '/emergency-responders', end: true },
    { label: 'Resident Marks', to: '/emergency-responders/marks' },
    { label: 'Profile', to: '/emergency-responders/profile' },
  ],
  superAdmin: [
    { label: 'User Management', to: '/super-admin', end: true },
    { label: 'Resident Marks', to: '/super-admin/marks' },
    { label: 'Profile', to: '/super-admin/profile' },
  ],
}

export function profileLinkForRole(role: Role) {
  return profilePathForRole(role)
}
