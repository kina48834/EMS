import { createSupabaseClient } from '@ems/shared/supabase/createSupabaseClient'

const url = import.meta.env.VITE_SUPABASE_URL ?? ''
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

/** Fails at runtime in the browser when Vercel env vars are missing (build still succeeds). */
export const supabase = createSupabaseClient({
  url: url || 'https://placeholder.supabase.co',
  anonKey: anonKey || 'placeholder',
  detectSessionInUrl: true,
})

export function assertSupabaseConfigured(): void {
  if (!url || !anonKey) {
    throw new Error(
      'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Add them in Vercel → Project → Settings → Environment Variables.',
    )
  }
}
