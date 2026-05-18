import { Role } from '../models';

export type NavScreenItem = {
  label: string;
  screen: string;
};

export const RESIDENT_NAV: NavScreenItem[] = [
  { label: 'My Reports', screen: 'Dashboard' },
  { label: 'New Report & Map', screen: 'CreateReport' },
  { label: 'My Marks Map', screen: 'MarksMap' },
  { label: 'Profile', screen: 'Profile' },
];

export const RESPONDER_NAV: NavScreenItem[] = [
  { label: 'Incident Queue', screen: 'ResponderDashboard' },
  { label: 'Resident Marks Map', screen: 'ResponderMarksMap' },
  { label: 'Profile', screen: 'Profile' },
];

export function navItemsForRole(role: string): NavScreenItem[] {
  if (role === Role.emergencyResponders) return RESPONDER_NAV;
  return RESIDENT_NAV;
}
