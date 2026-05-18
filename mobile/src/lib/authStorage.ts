import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {
  createNativeAuthStorage,
  createWebAuthStorage,
  type AuthStorageAdapter,
} from '@ems/shared/supabase/authStorage';

let cached: AuthStorageAdapter | null = null;

/** SecureStore on iOS/Android; localStorage on Expo web (fixes deleteValueWithKeyAsync error). */
export function getMobileAuthStorage(): AuthStorageAdapter {
  if (cached) return cached;

  if (Platform.OS === 'web') {
    cached = createWebAuthStorage();
    return cached;
  }

  cached = createNativeAuthStorage({
    getItemAsync: SecureStore.getItemAsync,
    setItemAsync: SecureStore.setItemAsync,
    deleteItemAsync: SecureStore.deleteItemAsync,
  });
  return cached;
}
