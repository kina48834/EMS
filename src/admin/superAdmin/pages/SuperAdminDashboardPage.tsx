import { useEffect, useMemo, useState } from 'react'
import { getBarangays, listIncidents, listUsers, createUser, deleteUser, updateUser } from '@/system/db'
import type { Barangay, EmergencyKind, Incident, Role, User } from '@/system/types'
import { useSession } from '@/system/hooks/useSession'
import SuperAdminIncidentMarksMap from '@/maps/superAdmin/SuperAdminIncidentMarksMap'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import Input from '@/components/ui/Input'
import PageHeader from '@/components/ui/PageHeader'
import Select from '@/components/ui/Select'
import StatCard from '@/components/ui/StatCard'

const roles: { value: Role; label: string }[] = [
  { value: 'resident', label: 'Resident / Citizen' },
  { value: 'barangayOfficial', label: 'Barangay Official' },
  { value: 'emergencyResponders', label: 'Emergency Responders' },
  { value: 'superAdmin', label: 'System administrator' },
]

const responderKinds: { value: EmergencyKind; label: string }[] = [
  { value: 'police', label: 'Police' },
  { value: 'fire', label: 'Firefighters' },
  { value: 'ems', label: 'Medical (EMS)' },
]

function roleNeedsBarangay(role: Role) {
  return role === 'resident' || role === 'barangayOfficial' || role === 'emergencyResponders'
}

function roleNeedsResponderKind(role: Role) {
  return role === 'emergencyResponders'
}

export default function SuperAdminDashboardPage() {
  const { user } = useSession()
  const [tick, setTick] = useState(0)

  const [barangays, setBarangays] = useState<Barangay[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      setIsLoading(true)
      try {
        const [b, u, inc] = await Promise.all([getBarangays(), listUsers(), listIncidents()])
        if (cancelled) return
        setBarangays(b)
        setAllUsers(u)
        setIncidents(inc)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id, tick])

  const incidentByStatus = useMemo(() => {
    const by: Record<string, number> = {}
    for (const i of incidents) by[i.status] = (by[i.status] ?? 0) + 1
    return by
  }, [incidents])

  const [createRole, setCreateRole] = useState<Role>('resident')
  const [createName, setCreateName] = useState('')
  const [createEmail, setCreateEmail] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [createBarangayId, setCreateBarangayId] = useState<string>(barangays[0]?.id ?? 'bgy-001')
  const [createResponderKind, setCreateResponderKind] = useState<EmergencyKind>('police')

  const [editingId, setEditingId] = useState<string | null>(null)
  const editingUser: User | undefined = useMemo(
    () => (editingId ? allUsers.find((u) => u.id === editingId) : undefined),
    [editingId, allUsers],
  )

  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editRole, setEditRole] = useState<Role>('resident')
  const [editBarangayId, setEditBarangayId] = useState<string>(barangays[0]?.id ?? 'bgy-001')
  const [editResponderKind, setEditResponderKind] = useState<EmergencyKind>('police')

  const syncEditForm = (u: User) => {
    setEditName(u.name)
    setEditEmail(u.email)
    setEditRole(u.role)
    setEditBarangayId(u.barangayId ?? barangays[0]?.id ?? 'bgy-001')
    setEditResponderKind(u.responderKind ?? 'police')
    setEditPassword('')
  }

  const [error, setError] = useState<string | null>(null)

  if (!user) return null
  if (user.role !== 'superAdmin') return <div className="py-10 text-center text-sm text-slate-600">Not authorized.</div>

  return (
    <div className="space-y-6">
      <PageHeader
        title="System administrator"
        description="Manage user accounts for residents, barangay officials, and emergency responders."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total users" value={isLoading ? '…' : allUsers.length} />
        <StatCard label="Incidents" value={isLoading ? '…' : incidents.length} />
        <StatCard label="Pending" value={isLoading ? '…' : (incidentByStatus.pending ?? 0)} />
      </div>

      <Card>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle>All incident marks</CardTitle>
            <div className="mt-1 text-xs text-slate-500">Showing incident locations across all barangays.</div>
          </div>
          <div className="text-xs text-slate-500">{incidents.length} items</div>
        </div>
        <div className="mt-3">
          <SuperAdminIncidentMarksMap incidents={incidents} heightClassName="h-72 sm:h-96" />
        </div>
      </Card>

      <Card>
        <CardTitle>Create user</CardTitle>
        <div className="mt-1 text-xs text-slate-500">This is a prototype; passwords are stored locally.</div>

        <form
          className="mt-4 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault()
            setError(null)
            try {
              await createUser({
                role: createRole,
                name: createName.trim(),
                email: createEmail.trim(),
                password: createPassword,
                barangayId: roleNeedsBarangay(createRole) ? createBarangayId : undefined,
                responderKind: roleNeedsResponderKind(createRole) ? createResponderKind : undefined,
              })
              setCreateName('')
              setCreateEmail('')
              setCreatePassword('')
              setTick((t) => t + 1)
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Create user failed')
            }
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <div className="mb-1 text-sm text-slate-700">Role</div>
              <select className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-ems-600 focus:outline-none focus:ring-2 focus:ring-ems-600/25" value={createRole} onChange={(e) => setCreateRole(e.target.value as Role)}>
                {roles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <div className="mb-1 text-sm text-slate-700">Name</div>
              <input className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-ems-600 focus:outline-none focus:ring-2 focus:ring-ems-600/25" value={createName} onChange={(e) => setCreateName(e.target.value)} required />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <div className="mb-1 text-sm text-slate-700">Email</div>
              <input className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-ems-600 focus:outline-none focus:ring-2 focus:ring-ems-600/25" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} type="email" required />
            </label>
            <label className="block">
              <div className="mb-1 text-sm text-slate-700">Password</div>
              <input className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-ems-600 focus:outline-none focus:ring-2 focus:ring-ems-600/25" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} type="password" required />
            </label>
          </div>

          {roleNeedsBarangay(createRole) ? (
            <label className="block">
              <div className="mb-1 text-sm text-slate-700">Barangay</div>
              <select className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-ems-600 focus:outline-none focus:ring-2 focus:ring-ems-600/25" value={createBarangayId} onChange={(e) => setCreateBarangayId(e.target.value)}>
                {barangays.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {roleNeedsResponderKind(createRole) ? (
            <label className="block">
              <div className="mb-1 text-sm text-slate-700">Responder Type</div>
              <select className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-ems-600 focus:outline-none focus:ring-2 focus:ring-ems-600/25" value={createResponderKind} onChange={(e) => setCreateResponderKind(e.target.value as EmergencyKind)}>
                {responderKinds.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {error ? <Alert>{error}</Alert> : null}

          <Button variant="primary" fullWidth type="submit">
            Create user
          </Button>
        </form>
      </Card>

      <Card>
        <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
          <CardTitle>User accounts</CardTitle>
          {editingUser ? <div className="text-xs text-slate-500">Editing: {editingUser.email}</div> : <div className="text-xs text-slate-500">Click Edit to update</div>}
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="ems-table min-w-[760px]">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Barangay / Type</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-sm text-slate-500">
                    No users.
                  </td>
                </tr>
              ) : (
                allUsers.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="py-3 pr-4 font-medium text-slate-900">{u.name}</td>
                    <td className="py-3 pr-4 capitalize">{u.role}</td>
                    <td className="py-3 pr-4 text-sm text-slate-700">
                      {u.barangayId ? `Barangay: ${u.barangayId}` : '-'}
                      {u.responderKind ? ` • ${u.responderKind}` : null}
                    </td>
                    <td className="py-3 pr-4 text-sm text-slate-700">{u.email}</td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setEditingId(u.id)
                            syncEditForm(u)
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => {
                            if (!confirm(`Delete ${u.email}?`)) return
                            void (async () => {
                              await deleteUser(u.id)
                              if (editingId === u.id) setEditingId(null)
                              setTick((t) => t + 1)
                            })()
                          }}
                          disabled={u.id === user.id}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {editingUser ? (
          <Card className="mt-6 bg-slate-50/80">
            <CardTitle>Edit selected user</CardTitle>

            <form
              className="mt-4 space-y-3"
              onSubmit={async (e) => {
                e.preventDefault()
                if (!editingUser) return
                setError(null)
                try {
                  const patch: any = {
                    name: editName.trim(),
                    email: editEmail.trim(),
                    role: editRole,
                  }
                  if (editPassword.trim()) patch.password = editPassword
                  if (roleNeedsBarangay(editRole)) patch.barangayId = editBarangayId
                  if (roleNeedsResponderKind(editRole)) patch.responderKind = editResponderKind
                  await updateUser(editingUser.id, patch)
                  setEditingId(null)
                  setTick((t) => t + 1)
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Update failed')
                }
              }}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <div className="mb-1 text-sm text-slate-700">Role</div>
                  <select className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-ems-600 focus:outline-none focus:ring-2 focus:ring-ems-600/25" value={editRole} onChange={(e) => setEditRole(e.target.value as Role)}>
                    {roles.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <div className="mb-1 text-sm text-slate-700">Name</div>
                  <input className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-ems-600 focus:outline-none focus:ring-2 focus:ring-ems-600/25" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <div className="mb-1 text-sm text-slate-700">Email</div>
                  <input className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-ems-600 focus:outline-none focus:ring-2 focus:ring-ems-600/25" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} type="email" required />
                </label>
                <label className="block">
                  <div className="mb-1 text-sm text-slate-700">New Password (optional)</div>
                  <input className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-ems-600 focus:outline-none focus:ring-2 focus:ring-ems-600/25" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} type="password" />
                </label>
              </div>

              {roleNeedsBarangay(editRole) ? (
                <label className="block">
                  <div className="mb-1 text-sm text-slate-700">Barangay</div>
                  <select className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-ems-600 focus:outline-none focus:ring-2 focus:ring-ems-600/25" value={editBarangayId} onChange={(e) => setEditBarangayId(e.target.value)}>
                    {barangays.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {roleNeedsResponderKind(editRole) ? (
                <label className="block">
                  <div className="mb-1 text-sm text-slate-700">Responder Type</div>
                  <select className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-ems-600 focus:outline-none focus:ring-2 focus:ring-ems-600/25" value={editResponderKind} onChange={(e) => setEditResponderKind(e.target.value as EmergencyKind)}>
                    {responderKinds.map((k) => (
                      <option key={k.value} value={k.value}>
                        {k.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {error ? <Alert>{error}</Alert> : null}

              <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                <Button variant="primary" type="submit">
                  Save changes
                </Button>
                <Button variant="secondary" type="button" onClick={() => setEditingId(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        ) : null}
      </Card>
    </div>
  )
}

