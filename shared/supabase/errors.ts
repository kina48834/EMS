export function throwIf(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

export function formatAuthError(message: string): string {
  if (message === 'Invalid login credentials') return 'Invalid email or password'
  if (message.toLowerCase().includes('database error querying schema')) {
    return 'Demo auth account needs repair. In Supabase SQL Editor, run supabase/sql/demo_accounts.sql (after 00_all_in_one.sql).'
  }
  if (message.toLowerCase().includes('already')) return 'Email already exists'
  return message
}

export const PROFILE_NOT_FOUND_MSG =
  'User profile not found. Run supabase/sql/demo_accounts.sql if using demo logins.'
