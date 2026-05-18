import { createSupabaseClient } from '@ems/shared/supabase/createSupabaseClient'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
}

export const supabase = createSupabaseClient({
  url,
  anonKey,
  detectSessionInUrl: true,
})
