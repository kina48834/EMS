import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import type { Role } from '@/system/types'
import { useSession } from '@/system/hooks/useSession'

export function ProtectedRoute(props: { allowedRoles?: Role[]; children?: ReactNode }) {
  const { isLoading, user } = useSession()

  if (isLoading) return null
  if (!user) return <Navigate to="/login" replace />
  if (props.allowedRoles && !props.allowedRoles.includes(user.role)) return <Navigate to="/not-authorized" replace />

  return <>{props.children}</>
}

