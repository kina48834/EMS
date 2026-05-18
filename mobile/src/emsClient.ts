import { Platform } from 'react-native';
import { createEmsClient, type User } from '@ems/shared';
import { supabase } from './lib/supabase';

const KEY_USER = 'ems_user';

let cachedUser: User | undefined;

function readWebProfile(): User | undefined {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem(KEY_USER);
    if (!raw) return undefined;
    return JSON.parse(raw) as User;
  } catch {
    return undefined;
  }
}

function writeWebProfile(user: User | undefined) {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return;
  if (!user) localStorage.removeItem(KEY_USER);
  else localStorage.setItem(KEY_USER, JSON.stringify(user));
}

const cache = {
  getUser(): User | undefined {
    return cachedUser ?? readWebProfile();
  },
  setUser(user: User | undefined) {
    cachedUser = user;
    writeWebProfile(user);
  },
};

export const ems = createEmsClient(supabase, cache);
