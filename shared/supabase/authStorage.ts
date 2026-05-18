/**
 * Cross-platform Supabase Auth storage.
 * - Web / Expo web: localStorage
 * - Native Expo: inject SecureStore via createNativeAuthStorage()
 */

export type AuthStorageAdapter = {
  getItem: (key: string) => Promise<string | null>
  setItem: (key: string, value: string) => Promise<void>
  removeItem: (key: string) => Promise<void>
}

function hasLocalStorage(): boolean {
  return typeof globalThis !== 'undefined' && typeof localStorage !== 'undefined'
}

/** Browser and Expo web — never use expo-secure-store here. */
export function createWebAuthStorage(): AuthStorageAdapter {
  return {
    async getItem(key: string) {
      if (!hasLocalStorage()) return null
      try {
        return localStorage.getItem(key)
      } catch {
        return null
      }
    },
    async setItem(key: string, value: string) {
      if (!hasLocalStorage()) return
      localStorage.setItem(key, value)
    },
    async removeItem(key: string) {
      if (!hasLocalStorage()) return
      localStorage.removeItem(key)
    },
  }
}

/** In-memory fallback (tests / SSR). */
export function createMemoryAuthStorage(): AuthStorageAdapter {
  const store = new Map<string, string>()
  return {
    getItem: async (key) => store.get(key) ?? null,
    setItem: async (key, value) => {
      store.set(key, value)
    },
    removeItem: async (key) => {
      store.delete(key)
    },
  }
}

export function createNativeAuthStorage(native: {
  getItemAsync: (key: string) => Promise<string | null>
  setItemAsync: (key: string, value: string) => Promise<void>
  deleteItemAsync: (key: string) => Promise<void>
}): AuthStorageAdapter {
  return {
    getItem: (key) => native.getItemAsync(key),
    setItem: (key, value) => native.setItemAsync(key, value),
    removeItem: (key) => native.deleteItemAsync(key),
  }
}
