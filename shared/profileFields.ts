import type { Gender } from './types'

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

export type UserProfileInput = {
  phone?: string
  address?: string
  dateOfBirth?: string
  gender?: Gender
}

export function genderLabel(gender?: string): string {
  if (!gender) return '—'
  return GENDER_OPTIONS.find((g) => g.value === gender)?.label ?? gender
}

export function formatDateOfBirth(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso.includes('T') ? iso : `${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString()
}
