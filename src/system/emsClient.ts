import { createEmsClient, type User } from '@ems/shared'
import { supabase } from '../lib/supabase'

const KEY_USER = 'ems_user'

function isBrowser() {
  return typeof window !== 'undefined'
}

const cache = {
  getUser(): User | undefined {
    if (!isBrowser()) return undefined
    try {
      const raw = localStorage.getItem(KEY_USER)
      if (!raw) return undefined
      return JSON.parse(raw) as User
    } catch {
      return undefined
    }
  },
  setUser(user: User | undefined) {
    if (!isBrowser()) return
    if (!user) localStorage.removeItem(KEY_USER)
    else localStorage.setItem(KEY_USER, JSON.stringify(user))
  },
}

export const ems = createEmsClient(supabase, cache)
