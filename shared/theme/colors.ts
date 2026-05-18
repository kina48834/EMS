/** EMS brand — blue-emerald (cyan + teal), aligned on web and Expo. */
export const emsColors = {
  primary: '#0891b2',
  primaryDark: '#0e7490',
  primaryLight: '#ecfeff',
  primaryMuted: '#cffafe',
  accent: '#14b8a6',
  accentLight: '#2dd4bf',
  /** Map / legend — approved & resolved (teal-cyan, not green) */
  mapApproved: '#14b8a6',
  mapResolved: '#22d3ee',
  mapPending: '#f59e0b',
  mapRejected: '#ef4444',
} as const

export type EmsColors = typeof emsColors
