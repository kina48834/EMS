import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '@/system/hooks/useSession'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import Input from '@/components/ui/Input'

export default function LoginPage() {
  const { login, user, role, isLoading } = useSession()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const sampleAccounts = useMemo(
    () => [
      { key: 'superAdmin', label: 'System Admin', email: 'admin@gmail.com', password: 'admin123' },
      { key: 'resident', label: 'Resident', email: 'resident@gmail.com', password: 'resident123' },
      { key: 'barangayOfficial', label: 'Barangay Official', email: 'barangayofficial@gmail.com', password: 'official123' },
      {
        key: 'emergencyResponders',
        label: 'Emergency Responder',
        email: 'emergencyresponder@gmail.com',
        password: 'emergencyresponder123',
      },
    ],
    [],
  )

  const pathForRole = (r: 'resident' | 'barangayOfficial' | 'emergencyResponders' | 'superAdmin') => {
    switch (r) {
      case 'resident':
        return '/resident'
      case 'barangayOfficial':
        return '/barangay-official'
      case 'emergencyResponders':
        return '/emergency-responders'
      case 'superAdmin':
        return '/super-admin'
    }
  }

  useEffect(() => {
    if (isLoading || !user || !role) return
    navigate(pathForRole(role), { replace: true })
  }, [isLoading, user, role, navigate])

  async function handleLogin(loginEmail: string, loginPassword: string) {
    setError(null)
    setBusy(true)
    try {
      const u = await login({ email: loginEmail, password: loginPassword })
      navigate(pathForRole(u.role))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  if (!isLoading && user && role) return null

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8 sm:py-12">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ems-700">EMS</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-600">Sign in with your email and password.</p>
        </div>
        {!user ? (
          <Button variant="secondary" size="sm" type="button" onClick={() => navigate('/')}>
            Home
          </Button>
        ) : null}
      </div>

      <Card className="space-y-4">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            void handleLogin(email, password)
          }}
        >
          <Field label="Email">
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </Field>

          <Field label="Password">
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
            />
          </Field>

          {error ? <Alert>{error}</Alert> : null}

          <Button variant="primary" fullWidth type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>

          <Button variant="secondary" fullWidth type="button" onClick={() => navigate('/register')}>
            Create resident account
          </Button>
        </form>
      </Card>

      <Card className="mt-5 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Demo accounts</h2>
          <p className="mt-1 text-xs text-slate-500">
            Run 00_all_in_one.sql then demo_accounts.sql in Supabase SQL Editor. Turn off email confirmation
            under Auth → Email.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {sampleAccounts.map((a) => (
            <Button
              key={a.key}
              variant="secondary"
              size="sm"
              className="!h-auto !min-h-10 !flex-col !items-start !py-2.5 !text-left"
              type="button"
              disabled={busy}
              onClick={() => void handleLogin(a.email, a.password)}
            >
              <span className="font-semibold">{a.label}</span>
              <span className="text-xs font-normal text-slate-500">{a.email}</span>
              <span className="text-[11px] font-normal text-slate-400">Password: {a.password}</span>
            </Button>
          ))}
        </div>
      </Card>
    </div>
  )
}
