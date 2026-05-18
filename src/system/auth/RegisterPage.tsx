import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getBarangays } from '@/system/db'
import { useSession } from '@/system/hooks/useSession'
import type { Gender, ID } from '@/system/types'
import ProfileFormFields, { type ProfileFormState } from '@/profile/shared/ProfileFormFields'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'

export default function RegisterPage() {
  const { register } = useSession()
  const navigate = useNavigate()

  const [barangays, setBarangays] = useState<Array<{ id: ID; name: string; city?: string }>>([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [profile, setProfile] = useState<ProfileFormState>({
    name: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    gender: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [barangayId, setBarangayId] = useState<ID>('bgy-001')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const b = await getBarangays()
      if (cancelled) return
      setBarangays(b)
      if (b[0]?.id) setBarangayId(b[0].id)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8 sm:py-12">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ems-700">EMS</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create account</h1>
          <p className="mt-1 text-sm text-slate-600">Register as a resident with your basic contact details.</p>
        </div>
        <Button variant="ghost" size="sm" type="button" onClick={() => navigate('/')}>
          Home
        </Button>
      </div>

      <Card>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault()
            setError(null)
            setBusy(true)
            try {
              await register({
                name: profile.name.trim(),
                email,
                password,
                role: 'resident',
                barangayId,
                phone: profile.phone.trim() || undefined,
                address: profile.address.trim() || undefined,
                dateOfBirth: profile.dateOfBirth || undefined,
                gender: (profile.gender || undefined) as Gender | undefined,
              })
              navigate('/resident')
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Registration failed')
            } finally {
              setBusy(false)
            }
          }}
        >
          <ProfileFormFields value={profile} onChange={(p) => setProfile((prev) => ({ ...prev, ...p }))} idPrefix="reg" />

          <Field label="Email">
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              required
            />
          </Field>

          <Field label="Password" hint="At least 6 characters">
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
            />
          </Field>

          <Field label="Barangay">
            <Select value={barangayId} onChange={(e) => setBarangayId(e.target.value as ID)}>
              {barangays.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                  {b.city ? ` · ${b.city}` : ''}
                </option>
              ))}
            </Select>
          </Field>

          {error ? <Alert>{error}</Alert> : null}

          <Button variant="primary" fullWidth type="submit" disabled={busy}>
            {busy ? 'Creating account…' : 'Register'}
          </Button>
        </form>
      </Card>

      <p className="mt-4 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <button className="font-semibold text-ems-700 hover:underline" type="button" onClick={() => navigate('/login')}>
          Sign in
        </button>
      </p>
    </div>
  )
}
