import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ems } from '@/system/emsClient'
import { getBarangays } from '@/system/db'
import type { Gender, User } from '@/system/types'
import { formatDateOfBirth, genderLabel } from '@ems/shared/profileFields'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import Input from '@/components/ui/Input'
import PageHeader from '@/components/ui/PageHeader'
import ProfileFormFields, { type ProfileFormState } from './ProfileFormFields'
import { ROLE_LABELS, homePathForRole } from './roleMeta'

type Props = {
  user: User
  onUserUpdated: (user: User) => void
}

function toFormState(user: User): ProfileFormState {
  return {
    name: user.name,
    phone: user.phone ?? '',
    address: user.address ?? '',
    dateOfBirth: user.dateOfBirth ?? '',
    gender: user.gender ?? '',
  }
}

export default function ProfileView({ user, onUserUpdated }: Props) {
  const [form, setForm] = useState<ProfileFormState>(() => toFormState(user))
  const [barangayName, setBarangayName] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [profileBusy, setProfileBusy] = useState(false)
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setForm(toFormState(user))
  }, [user])

  useEffect(() => {
    if (!user.barangayId) {
      setBarangayName(null)
      return
    }
    let cancelled = false
    void (async () => {
      const list = await getBarangays()
      if (cancelled) return
      setBarangayName(list.find((b) => b.id === user.barangayId)?.name ?? user.barangayId)
    })()
    return () => {
      cancelled = true
    }
  }, [user.barangayId])

  function patchForm(patch: Partial<ProfileFormState>) {
    setForm((prev) => ({ ...prev, ...patch }))
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileBusy(true)
    setError(null)
    setMessage(null)
    try {
      const updated = await ems.updateOwnProfile({
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: (form.gender || undefined) as Gender | undefined,
      })
      onUserUpdated(updated)
      setMessage('Profile updated.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setProfileBusy(false)
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordBusy(true)
    setError(null)
    setMessage(null)
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      setPasswordBusy(false)
      return
    }
    try {
      await ems.changePassword({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setMessage('Password changed successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password')
    } finally {
      setPasswordBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My profile"
        description="Your EMS account ID, contact details, and security settings."
        actions={
          <Link to={homePathForRole(user.role)}>
            <Button variant="secondary" size="sm" type="button">
              Back to dashboard
            </Button>
          </Link>
        }
      />

      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert>{error}</Alert> : null}

      <Card className="space-y-4">
        <div className="text-sm font-semibold text-slate-900">Account</div>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Account ID</dt>
            <dd className="mt-1 break-all font-mono text-sm font-semibold text-ems-800">{user.id}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Role</dt>
            <dd className="mt-1 font-medium text-slate-900">{ROLE_LABELS[user.role]}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</dt>
            <dd className="mt-1 text-slate-800">{user.email}</dd>
          </div>
          {user.barangayId ? (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Barangay</dt>
              <dd className="mt-1 text-slate-800">{barangayName ?? user.barangayId}</dd>
            </div>
          ) : null}
          {user.responderKind ? (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Responder type</dt>
              <dd className="mt-1 capitalize text-slate-800">{user.responderKind}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Phone</dt>
            <dd className="mt-1 text-slate-800">{user.phone ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Address</dt>
            <dd className="mt-1 text-slate-800">{user.address ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Date of birth</dt>
            <dd className="mt-1 text-slate-800">{formatDateOfBirth(user.dateOfBirth)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Gender</dt>
            <dd className="mt-1 text-slate-800">{genderLabel(user.gender)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Member since</dt>
            <dd className="mt-1 text-slate-800">{new Date(user.createdAt).toLocaleString()}</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <form className="space-y-4" onSubmit={(e) => void saveProfile(e)}>
          <div className="text-sm font-semibold text-slate-900">Personal information</div>
          <ProfileFormFields value={form} onChange={patchForm} />
          <Button variant="primary" type="submit" disabled={profileBusy}>
            {profileBusy ? 'Saving…' : 'Save profile'}
          </Button>
        </form>
      </Card>

      <Card>
        <form className="space-y-4" onSubmit={(e) => void savePassword(e)}>
          <div className="text-sm font-semibold text-slate-900">Change password</div>
          <Field label="Current password">
            <Input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </Field>
          <Field label="New password">
            <Input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </Field>
          <Field label="Confirm new password">
            <Input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </Field>
          <Button variant="primary" type="submit" disabled={passwordBusy}>
            {passwordBusy ? 'Updating…' : 'Change password'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
