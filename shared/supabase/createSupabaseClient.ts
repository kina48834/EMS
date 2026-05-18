import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { AuthStorageAdapter } from './authStorage'
import { createWebAuthStorage } from './authStorage'

export type CreateSupabaseClientOptions = {
  url: string
  anonKey: string
  /** Defaults to localStorage on web; pass SecureStore adapter on native. */
  storage?: AuthStorageAdapter
  detectSessionInUrl?: boolean
}

/**
 * Single Supabase client setup for Vite web and Expo (native + web).
 * Same project URL/key → same sessions and RLS as long as .env matches.
 */
export function createSupabaseClient(options: CreateSupabaseClientOptions): SupabaseClient {
  const { url, anonKey, storage = createWebAuthStorage(), detectSessionInUrl = false } = options

  return createClient(url, anonKey, {
    auth: {
      storage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl,
    },
  })
}
