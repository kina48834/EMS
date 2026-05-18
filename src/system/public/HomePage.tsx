import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '@/system/hooks/useSession'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

const steps = [
  { title: 'Register', body: 'Create a Resident account linked to your barangay.' },
  { title: 'Mark & submit', body: 'Save report details, then pin the incident on the map.' },
  { title: 'Track', body: 'Follow status updates from officials and responders.' },
]

/** Dev: `public/EMS.apk`. Production: GitHub release (override with VITE_APK_DOWNLOAD_URL). */
const APK_DOWNLOAD_URL =
  import.meta.env.VITE_APK_DOWNLOAD_URL ||
  (import.meta.env.DEV
    ? '/EMS.apk'
    : 'https://github.com/kina48834/EMS/releases/download/v1.0.0/EMS.apk')
const APK_FILENAME = 'EMS.apk'

const roles = [
  { title: 'Resident', body: 'Mark locations, submit reports, manage your own marks.' },
  { title: 'Barangay Official', body: 'Review marks and approve or reject incidents.' },
  { title: 'Emergency Responder', body: 'View approved incidents and log response status.' },
  { title: 'System Admin', body: 'Manage users and oversee marks across barangays.' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const { user, role, isLoading } = useSession()

  useEffect(() => {
    if (isLoading || !user || !role) return
    switch (role) {
      case 'resident':
        navigate('/resident', { replace: true })
        return
      case 'barangayOfficial':
        navigate('/barangay-official', { replace: true })
        return
      case 'emergencyResponders':
        navigate('/emergency-responders', { replace: true })
        return
      case 'superAdmin':
        navigate('/super-admin', { replace: true })
        return
    }
  }, [isLoading, user, role, navigate])

  if (!isLoading && user && role) return null

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
          <div className="space-y-6 lg:col-span-7">
            <Card className="overflow-hidden !p-0">
              <div className="bg-gradient-to-br from-cyan-600 via-ems-500 to-teal-600 px-6 py-8 text-white sm:px-8 sm:py-10">
                <p className="text-xs font-semibold uppercase tracking-widest text-cyan-100">Emergency Management</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Report incidents. Respond faster.</h1>
                <p className="mt-3 max-w-xl text-sm text-cyan-50/95 sm:text-base">
                  Residents mark locations on the map. Barangay officials, emergency responders, and admins coordinate
                  in one Supabase-backed system.
                </p>
                <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Button
                    variant="secondary"
                    className="border-white/20 bg-white text-ems-800 hover:bg-ems-50"
                    onClick={() => navigate('/register')}
                  >
                    Register
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-white hover:bg-white/15"
                    onClick={() => navigate('/login')}
                  >
                    Sign in
                  </Button>
                  <a
                    href={APK_DOWNLOAD_URL}
                    download={APK_FILENAME}
                    rel="noopener noreferrer"
                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    Download Android app (EMS.apk)
                  </a>
                </div>
              </div>
              <div className="border-t border-slate-100 bg-ems-50/50 px-6 py-3 text-xs text-ems-900">
                Tip: Use demo account buttons on the login page for quick testing.
              </div>
            </Card>

            <Card>
              <h2 className="text-sm font-semibold text-slate-900">How it works</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {steps.map((s, i) => (
                  <div key={s.title} className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ems-600 text-sm font-bold text-white">
                      {i + 1}
                    </div>
                    <div className="mt-3 text-sm font-semibold text-slate-900">{s.title}</div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">{s.body}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-4 lg:col-span-5">
            <Card>
              <h2 className="text-sm font-semibold text-slate-900">Roles in the system</h2>
              <ul className="mt-4 space-y-3">
                {roles.map((r) => (
                  <li key={r.title} className="rounded-xl border border-slate-100 p-4 transition hover:border-ems-200/80 hover:bg-ems-50/30">
                    <div className="text-sm font-semibold text-slate-900">{r.title}</div>
                    <p className="mt-1 text-xs text-slate-600">{r.body}</p>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
