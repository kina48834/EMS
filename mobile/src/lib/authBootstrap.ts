import type { User } from '../models';
import { ems } from '../emsClient';
import { supabase } from './supabase';

const BOOTSTRAP_MS = 12_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise
      .then((v) => {
        clearTimeout(timer);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(timer);
        reject(e);
      });
  });
}

/** Restore session without calling getSession inside onAuthStateChange (avoids GoTrue lock deadlock). */
export async function restoreAuthUser(): Promise<User | null> {
  try {
    const {
      data: { session },
    } = await withTimeout(supabase.auth.getSession(), BOOTSTRAP_MS, 'getSession');

    if (!session?.user) {
      if (ems.getCurrentUser()) await ems.logout().catch(() => {});
      return null;
    }

    const user = await withTimeout(ems.fetchCurrentUser(), BOOTSTRAP_MS, 'fetchCurrentUser');
    return user ?? null;
  } catch {
    await supabase.auth.signOut().catch(() => {});
    return null;
  }
}

/** Defer profile reload — never await getSession inside onAuthStateChange. */
export function scheduleProfileReload(onUser: (user: User | null) => void) {
  setTimeout(() => {
    void restoreAuthUser()
      .then(onUser)
      .catch(() => onUser(null));
  }, 0);
}
