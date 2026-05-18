import { useSession } from '@/system/hooks/useSession'
import ProfileView from '@/profile/shared/ProfileView'

export default function ResidentProfilePage() {
  const { user, refreshUser } = useSession()
  if (!user) return null
  return <ProfileView user={user} onUserUpdated={(u) => void refreshUser(u)} />
}
