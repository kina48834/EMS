import type { Alert, Barangay, EmergencyKind, Incident, IncidentStatus, ID, Response, Role, User } from './types'

const LS = {
  users: 'ems_users',
  incidents: 'ems_incidents',
  responses: 'ems_responses',
  alerts: 'ems_alerts',
  barangays: 'ems_barangays',
  session: 'ems_session',
}

function isBrowser() {
  return typeof window !== 'undefined'
}

function readJSON<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback
  const raw = window.localStorage.getItem(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJSON<T>(key: string, value: T) {
  if (!isBrowser()) return
  window.localStorage.setItem(key, JSON.stringify(value))
}

function newId(): ID {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now())
}

function nowIso() {
  return new Date().toISOString()
}

type MutationOptions = {
  // Used by internal/system flows to bypass actor checks (standalone prototype).
  bypassAuth?: boolean
}

function getSessionUserId(): ID | undefined {
  const session = readJSON<{ userId?: ID }>(LS.session, {})
  return session.userId
}

function getUserByIdInternal(userId: ID): User | undefined {
  return listUsers().find((u) => u.id === userId)
}

function getCurrentActor(): User | undefined {
  const userId = getSessionUserId()
  if (!userId) return undefined
  return getUserByIdInternal(userId)
}

function assertAuthorized(check: (actor: User | undefined) => boolean, message: string, options?: MutationOptions) {
  if (options?.bypassAuth) return
  const actor = getCurrentActor()
  if (!check(actor)) throw new Error(message)
}

function ensureSeeded() {
  if (!isBrowser()) return
  // IMPORTANT:
  // LocalStorage persists between refreshes. If the user had an older seed with
  // different demo passwords, demo auto-login would fail. So we "repair" the
  // demo accounts on every startup without wiping other saved data.
  let barangays = readJSON<Barangay[]>(LS.barangays, [])
  let users = readJSON<User[]>(LS.users, [])

  const requiredBarangays: Barangay[] = [
    { id: 'bgy-001', name: 'Tobias Fornier Barangay 1' },
    { id: 'bgy-002', name: 'Tobias Fornier Barangay 2' },
    { id: 'bgy-003', name: 'Tobias Fornier Barangay 3' },
  ]

  // Ensure barangays exist (and keep their expected names).
  const byId = new Map<string, Barangay>(barangays.map((b) => [b.id, b]))
  for (const b of requiredBarangays) {
    const existing = byId.get(b.id)
    byId.set(b.id, { id: b.id, name: existing?.name ?? b.name })
  }
  barangays = Array.from(byId.values())
  const order = requiredBarangays.map((b) => b.id)
  barangays.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))

  const defaultBarangayId = barangays.find((b) => b.id === 'bgy-001')?.id ?? barangays[0]?.id
  if (!defaultBarangayId) {
    // Extremely defensive: should never happen after ensuring barangays above.
    return
  }

  // Keep demo credentials aligned with `src/system/auth/LoginPage.tsx`.
  const demoAccounts = [
    {
      email: 'admin@gmail.com',
      password: 'admin123',
      role: 'superAdmin' as const,
      name: 'EMS Super Admin',
      barangayId: undefined as string | undefined,
      responderKind: undefined as EmergencyKind | undefined,
    },
    {
      email: 'resident@gmail.com',
      password: 'resident123',
      role: 'resident' as const,
      name: 'Sample Resident',
      barangayId: defaultBarangayId,
      responderKind: undefined as EmergencyKind | undefined,
    },
    {
      email: 'barangayofficial@gmail.com',
      password: 'official123',
      role: 'barangayOfficial' as const,
      name: 'Sample Barangay Official',
      barangayId: defaultBarangayId,
      responderKind: undefined as EmergencyKind | undefined,
    },
    {
      email: 'emergencyresponder@gmail.com',
      password: 'emergencyresponder123',
      role: 'emergencyResponders' as const,
      name: 'Sample Police',
      barangayId: defaultBarangayId,
      responderKind: 'police' as EmergencyKind,
    },
  ]

  // Upsert demo users by email. Preserve existing ids and createdAt to avoid
  // breaking any already-created demo data.
  const upsertedUsers: User[] = [...users]
  for (const demo of demoAccounts) {
    const idx = upsertedUsers.findIndex((u) => u.email.toLowerCase() === demo.email.toLowerCase())
    if (idx === -1) {
      upsertedUsers.push({
        id:
          demo.role === 'superAdmin'
            ? 'usr-superadmin-001'
            : demo.role === 'resident'
              ? 'usr-resident-001'
              : demo.role === 'barangayOfficial'
                ? 'usr-official-001'
                : 'usr-responder-police-001',
        role: demo.role,
        name: demo.name,
        email: demo.email,
        password: demo.password,
        barangayId: demo.barangayId,
        responderKind: demo.responderKind,
        createdAt: nowIso(),
      })
      continue
    }

    const existing = upsertedUsers[idx]!
    upsertedUsers[idx] = {
      ...existing,
      role: demo.role,
      name: demo.name,
      password: demo.password,
      barangayId: demo.barangayId,
      responderKind: demo.responderKind,
    } as User
  }

  writeJSON(LS.barangays, barangays)
  writeJSON(LS.users, upsertedUsers)
}

export function getBarangays(): Barangay[] {
  ensureSeeded()
  return readJSON<Barangay[]>(LS.barangays, [])
}

export function listUsers(): User[] {
  ensureSeeded()
  return readJSON<User[]>(LS.users, [])
}

export function getUserById(userId: ID): User | undefined {
  return listUsers().find((u) => u.id === userId)
}

export function findUserByEmail(email: string): User | undefined {
  const normalized = email.trim().toLowerCase()
  return listUsers().find((u) => u.email.toLowerCase() === normalized)
}

export function createUser(input: Omit<User, 'id' | 'createdAt'>, options?: MutationOptions): User {
  assertAuthorized((actor) => Boolean(actor && actor.role === 'superAdmin'), 'Only system admins can create users', options)
  ensureSeeded()

  const users = listUsers()
  const exists = users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())
  if (exists) throw new Error('Email already exists')

  const newUser: User = {
    ...input,
    id: newId(),
    createdAt: nowIso(),
  }
  writeJSON(LS.users, [...users, newUser])
  return newUser
}

export function updateUser(userId: ID, patch: Partial<Omit<User, 'id' | 'createdAt'>>): User {
  assertAuthorized((actor) => Boolean(actor && actor.role === 'superAdmin'), 'Only system admins can update users')
  const users = listUsers()
  const idx = users.findIndex((u) => u.id === userId)
  if (idx === -1) throw new Error('User not found')

  const updated: User = {
    ...users[idx]!,
    ...patch,
  }

  // Basic guardrails
  if (updated.role === 'superAdmin') {
    delete (updated as any).barangayId
    delete (updated as any).responderKind
  }
  if (updated.role !== 'emergencyResponders') {
    delete (updated as any).responderKind
  }

  users[idx] = updated
  writeJSON(LS.users, users)
  return updated
}

export function deleteUser(userId: ID) {
  const actor = getCurrentActor()
  if (!actor || actor.role !== 'superAdmin') throw new Error('Only system admins can delete users')
  if (actor.id === userId) throw new Error('System admins cannot delete their own account')

  const users = listUsers()
  const next = users.filter((u) => u.id !== userId)
  writeJSON(LS.users, next)
}

export function listIncidents(): Incident[] {
  ensureSeeded()
  return readJSON<Incident[]>(LS.incidents, []).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getIncidentById(incidentId: ID): Incident | undefined {
  return listIncidents().find((i) => i.id === incidentId)
}

export function createIncident(input: Omit<Incident, 'id' | 'createdAt' | 'updatedAt'>): Incident {
  assertAuthorized(
    (actor) =>
      Boolean(actor && actor.role === 'resident' && actor.id === input.reporterId && actor.barangayId && actor.barangayId === input.barangayId),
    'Only residents can create incidents for their own barangay',
  )

  ensureSeeded()
  const incidents = listIncidents()
  const newIncident: Incident = {
    ...input,
    id: newId(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
  writeJSON(LS.incidents, [...incidents, newIncident])
  return newIncident
}

export function updateIncident(
  incidentId: ID,
  patch: Partial<Omit<Incident, 'id' | 'createdAt' | 'barangayId' | 'reporterId'>>,
): Incident {
  const incidents = listIncidents()
  const idx = incidents.findIndex((i) => i.id === incidentId)
  if (idx === -1) throw new Error('Incident not found')

  const current = incidents[idx]!
  const actor = getCurrentActor()

  const isResidentOwnEditable =
    Boolean(actor && actor.role === 'resident' && actor.id === current.reporterId) &&
    (current.status === 'pending' || current.status === 'rejected')

  const isBarangayOfficialWorkflowUpdate =
    Boolean(actor && actor.role === 'barangayOfficial' && actor.barangayId === current.barangayId) &&
    (patch.status === 'approved' || patch.status === 'rejected' || patch.status === 'resolved')

  const isResponderResolveOnly = Boolean(actor && actor.role === 'emergencyResponders' && actor.barangayId === current.barangayId) && patch.status === 'resolved'

  const isSuperAdmin = Boolean(actor && actor.role === 'superAdmin')

  if (!isResidentOwnEditable && !isBarangayOfficialWorkflowUpdate && !isResponderResolveOnly && !isSuperAdmin) {
    throw new Error('Not authorized to update this incident')
  }

  const updated: Incident = {
    ...current,
    ...patch,
    updatedAt: nowIso(),
  }
  incidents[idx] = updated
  writeJSON(LS.incidents, incidents)
  return updated
}

export function deleteIncident(incidentId: ID) {
  const incidents = listIncidents()
  const current = incidents.find((i) => i.id === incidentId)
  if (!current) return

  const actor = getCurrentActor()
  const isResidentOwnPendingOrRejected =
    Boolean(actor && actor.role === 'resident' && actor.id === current.reporterId) && (current.status === 'pending' || current.status === 'rejected')
  const isSuperAdmin = Boolean(actor && actor.role === 'superAdmin')

  if (!isResidentOwnPendingOrRejected && !isSuperAdmin) throw new Error('Not authorized to delete this incident')

  const next = incidents.filter((i) => i.id !== incidentId)
  writeJSON(LS.incidents, next)

  // Cascade delete responses and alerts.
  const responses = readJSON<Response[]>(LS.responses, [])
  writeJSON(
    LS.responses,
    responses.filter((r) => r.incidentId !== incidentId),
  )

  const alerts = readJSON<Alert[]>(LS.alerts, [])
  writeJSON(
    LS.alerts,
    alerts.filter((a) => a.incidentId !== incidentId),
  )
}

export function listResponses(): Response[] {
  ensureSeeded()
  return readJSON<Response[]>(LS.responses, []).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function listResponsesByIncident(incidentId: ID): Response[] {
  return listResponses().filter((r) => r.incidentId === incidentId)
}

export function getResponse(responderId: ID, incidentId: ID): Response | undefined {
  return listResponses().find((r) => r.responderId === responderId && r.incidentId === incidentId)
}

export function upsertResponse(input: Omit<Response, 'id' | 'createdAt' | 'updatedAt'>): Response {
  assertAuthorized(
    (actor) =>
      Boolean(
        actor &&
          actor.role === 'emergencyResponders' &&
          actor.id === input.responderId &&
          actor.responderKind === input.responderKind,
      ),
    'Only the assigned responder can update their response',
  )

  const incident = getIncidentById(input.incidentId)
  const actor = getCurrentActor()
  if (!incident || !actor || actor.barangayId !== incident.barangayId) throw new Error('Responder and incident barangay mismatch')

  ensureSeeded()
  const responses = listResponses()
  const idx = responses.findIndex((r) => r.responderId === input.responderId && r.incidentId === input.incidentId)
  const t = nowIso()

  if (idx === -1) {
    const created: Response = {
      ...input,
      id: newId(),
      createdAt: t,
      updatedAt: t,
    }
    writeJSON(LS.responses, [...responses, created])
    return created
  }

  const updated: Response = {
    ...responses[idx]!,
    ...input,
    updatedAt: t,
  }
  responses[idx] = updated
  writeJSON(LS.responses, responses)
  return updated
}

export function listAlertsByBarangay(barangayId: ID): Alert[] {
  ensureSeeded()
  return readJSON<Alert[]>(LS.alerts, [])
    .filter((a) => a.barangayId === barangayId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function createAlert(input: Omit<Alert, 'id' | 'createdAt'>): Alert {
  assertAuthorized(
    (actor) =>
      Boolean(
        actor &&
          (actor.role === 'superAdmin' ||
            (actor.role === 'barangayOfficial' && actor.barangayId && actor.barangayId === input.barangayId)),
      ),
    'Only barangay officials and system admins can create alerts',
  )

  ensureSeeded()
  const alerts = readJSON<Alert[]>(LS.alerts, [])
  const created: Alert = {
    ...input,
    id: newId(),
    createdAt: nowIso(),
  }
  writeJSON(LS.alerts, [...alerts, created])
  return created
}

export function updateIncidentStatusToApproved(incidentId: ID) {
  return updateIncident(incidentId, { status: 'approved' as IncidentStatus })
}

export function listIncidentsForBarangay(barangayId: ID): Incident[] {
  return listIncidents().filter((i) => i.barangayId === barangayId)
}

export function listIncidentsForResponder(barangayId: ID): Incident[] {
  // Responders should see approved incidents in their barangay.
  return listIncidentsForBarangay(barangayId).filter((i) => i.status === 'approved')
}

export function listIncidentsForReporter(reporterId: ID): Incident[] {
  // Keep existing ordering from `listIncidents()` (newest first).
  return listIncidents().filter((i) => i.reporterId === reporterId)
}

export function listUsersByRole(role: Role): User[] {
  return listUsers().filter((u) => u.role === role)
}

export function listEmergencyRespondersByBarangay(barangayId: ID, kind?: EmergencyKind): User[] {
  return listUsers().filter((u) => {
    if (u.role !== 'emergencyResponders') return false
    if (u.barangayId !== barangayId) return false
    if (kind && u.responderKind !== kind) return false
    return true
  })
}

export async function searchPlacesInPhilippines(query: string, limit = 6): Promise<Array<{ lat: number; lng: number; name: string }>> {
  const q = query.trim()
  if (!q) return []

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=ph&addressdetails=1&limit=${encodeURIComponent(
      String(limit),
    )}&q=${encodeURIComponent(q)}`
    const r = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json', 'User-Agent': 'EMS-Web/1.0 (local dev)' },
    })
    if (!r.ok) throw new Error('Place search failed')
    const data = (await r.json()) as any[]
    return data
      .map((x) => {
        const lat = typeof x?.lat === 'string' ? Number.parseFloat(x.lat) : Number.NaN
        const lng = typeof x?.lon === 'string' ? Number.parseFloat(x.lon) : Number.NaN
        const name = typeof x?.display_name === 'string' ? x.display_name : null
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || !name) return null
        return { lat, lng, name }
      })
      .filter((v): v is { lat: number; lng: number; name: string } => v !== null)
  } catch {
    return []
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  // Standalone: best-effort reverse geocode from browser to Nominatim.
  // If it fails (CORS/network), we return a readable fallback.
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(
      String(lng),
    )}&zoom=18&addressdetails=1`
    const r = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json', 'User-Agent': 'EMS-Web/1.0 (local dev)' },
    })
    if (!r.ok) throw new Error('Reverse geocode failed')
    const data = (await r.json()) as any
    const name = typeof data?.display_name === 'string' ? data.display_name : null
    return name ?? `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  } catch {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  }
}

