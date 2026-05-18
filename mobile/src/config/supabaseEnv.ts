import Constants from 'expo-constants';
import { supabaseEnv as generated } from './supabaseEnv.generated';

function readExtra(key: string): string {
  const extra = Constants.expoConfig?.extra as Record<string, string | undefined> | undefined;
  return extra?.[key] ?? '';
}

/** Supabase URL/key for release APK and dev — generated file wins, then app.config extra, then process.env. */
export function getSupabaseEnv(): { url: string; anonKey: string } {
  const url =
    generated.url ||
    readExtra('EXPO_PUBLIC_SUPABASE_URL') ||
    (process.env as Record<string, string | undefined>).EXPO_PUBLIC_SUPABASE_URL ||
    '';
  const anonKey =
    generated.anonKey ||
    readExtra('EXPO_PUBLIC_SUPABASE_ANON_KEY') ||
    (process.env as Record<string, string | undefined>).EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    '';
  return { url, anonKey };
}
