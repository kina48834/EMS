import { Platform } from 'react-native';
import { createWebAuthStorage, type AuthStorageAdapter } from '@ems/shared/supabase/authStorage';
import { getLargeAuthStorage } from './largeAuthStorage';

let cached: AuthStorageAdapter | null = null;

/** Encrypted AsyncStorage on native (sessions exceed SecureStore 2048 B); localStorage on web. */
export function getMobileAuthStorage(): AuthStorageAdapter {
  if (cached) return cached;

  if (Platform.OS === 'web') {
    cached = createWebAuthStorage();
    return cached;
  }

  cached = getLargeAuthStorage();
  return cached;
}
