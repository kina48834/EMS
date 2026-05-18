import { useCallback, useEffect, useMemo, useState } from 'react'
import type { EmergencyKind, Gender, Role, User } from '../types'
import type { UserProfileInput } from '@ems/shared/profileFields'
import { fetchCurrentUser, getCurrentUser, login as doLogin, logout as doLogout, register as doRegister } from '../session'
import type { ID } from '../types'

export function useSession() {
  // Initialize from localStorage so protected routes work immediately.
  const initialUser = getCurrentUser()
  const [userId, setUserId] = useState<ID | undefined>(initialUser?.id)
  const [role, setRole] = useState<Role | undefined>(initialUser?.role)
  const [profileTick, setProfileTick] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const u = await fetchCurrentUser()
      const decoded = getCurrentUser()
      const next = u ?? decoded
      setUserId(next?.id)
      setRole(next?.role)
    } catch {
      // Never block the UI if profile refresh fails.
      const decoded = getCurrentUser()
      setUserId(decoded?.id)
      setRole(decoded?.role)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // Important: memoize the user object identity so components/effects depending on `user`
  // do not re-run on every render (getCurrentUser() returns fresh objects).
  const user = useMemo(() => (userId ? getCurrentUser() : undefined), [userId, profileTick])

  const login = useCallback(
    async (input: { email: string; password: string; role?: Role }) => {
      const u = await doLogin(input)
      setUserId(u.id)
      setRole(u.role)
      return u
    },
    [],
  )

  const logout = useCallback(() => {
    void (async () => {
      await doLogout()
      setUserId(undefined)
      setRole(undefined)
    })()
  }, [])

  const register = useCallback(
    async (
      input: {
        role: Role
        name: string
        email: string
        password: string
        barangayId?: ID
        responderKind?: EmergencyKind
      } & UserProfileInput,
    ) => {
      const u = await doRegister(input)
      setUserId(u.id)
      setRole(u.role)
      return u
    },
    [],
  )

  const refreshUser = useCallback(
    async (updated?: User) => {
      if (updated) {
        setUserId(updated.id)
        setRole(updated.role)
        setProfileTick((t) => t + 1)
        return updated
      }
      await refresh()
      setProfileTick((t) => t + 1)
      return getCurrentUser()
    },
    [refresh],
  )

  return { user, userId, role, refresh, refreshUser, login, logout, register, isLoading }
}

