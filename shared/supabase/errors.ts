export function throwIf(error: { message: string } | null) {
  if (error) throw new Error(formatDbError(error.message))
}

export function formatAuthError(message: string): string {
  const lower = message.toLowerCase()
  if (message === 'Invalid login credentials') return 'Invalid email or password'
  if (lower.includes('database error querying schema')) {
    return 'Demo auth account needs repair. In Supabase SQL Editor, run supabase/sql/demo_accounts.sql (after 00_all_in_one.sql).'
  }
  if (lower.includes('already')) return 'Email already exists'
  if (lower.includes('2048 bytes') || lower.includes('securestore')) {
    return 'Session could not be saved on this device. Update the app and sign in again.'
  }
  if (lower.includes('network request failed') || lower.includes('failed to fetch')) {
    return 'No internet connection. Check Wi‑Fi or mobile data and try again.'
  }
  return message
}

export function formatDbError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('row-level security') || lower.includes('permission denied') || lower.includes('42501')) {
    return 'You do not have permission for this action.'
  }
  if (lower.includes('jwt') || lower.includes('not authenticated')) {
    return 'Session expired. Please sign in again.'
  }
  return formatAuthError(message)
}

export const PROFILE_NOT_FOUND_MSG =
  'User profile not found. Run supabase/sql/demo_accounts.sql if using demo logins.'
