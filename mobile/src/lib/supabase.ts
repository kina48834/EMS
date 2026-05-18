import { createSupabaseClient } from '@ems/shared/supabase/createSupabaseClient';
import { getSupabaseEnv } from '../config/supabaseEnv';
import { getMobileAuthStorage } from './authStorage';

const { url, anonKey } = getSupabaseEnv();

export function assertSupabaseConfig(): void {
  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase config. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in mobile/.env, then rebuild the APK.',
    );
  }
}

export const supabase = createSupabaseClient({
  url: url || 'https://placeholder.supabase.co',
  anonKey: anonKey || 'placeholder',
  storage: getMobileAuthStorage(),
  detectSessionInUrl: false,
});
