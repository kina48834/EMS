import type { SupabaseClient } from '@supabase/supabase-js'
import { canResidentManageIncident } from '../incidentManage'
import type {
  Alert,
  AlertChannel,
  Barangay,
  EmergencyKind,
  ID,
  Incident,
  IncidentResponse,
  IncidentStatus,
  IncidentType,
  ResponseStatus,
  Role,
  User,
} from '../types'
import type { UserProfileInput } from '../profileFields'
import { formatAuthError, PROFILE_NOT_FOUND_MSG, throwIf } from './errors'
import { mapAlertRow, mapBarangayRow, mapIncidentRow, mapResponseRow, mapUserRow, newId } from './mappers'

export type UserCache = {
  getUser(): User | undefined
  setUser(user: User | undefined): void
}

export function createEmsClient(supabase: SupabaseClient, cache?: UserCache) {
  async function loadProfileByAuthId(authId: string): Promise<User> {
    const { data, error } = await supabase.from('users').select('*').eq('auth_id', authId).maybeSingle()
    throwIf(error)
    if (!data) throw new Error(PROFILE_NOT_FOUND_MSG)
    const user = mapUserRow(data as Record<string, unknown>)
    cache?.setUser(user)
    return user
  }

  async function requireProfile(): Promise<User> {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.user) throw new Error('Unauthorized')
    return loadProfileByAuthId(session.user.id)
  }

  async function login(input: { email: string; password: string }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email.trim().toLowerCase(),
      password: input.password,
    })
    if (error) throw new Error(formatAuthError(error.message))
    if (!data.user) throw new Error('Login failed')
    return loadProfileByAuthId(data.user.id)
  }

  async function register(input: {
    role: Role
    name: string
    email: string
    password: string
    barangayId?: ID
    responderKind?: EmergencyKind
  } & UserProfileInput) {
    const email = input.email.trim().toLowerCase()
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password: input.password })
    if (authError) throw new Error(formatAuthError(authError.message))
    if (!authData.user) throw new Error('Registration failed')

    const id = newId()
    const { error: profileError } = await supabase.from('users').insert({
      id,
      auth_id: authData.user.id,
      role: input.role,
      name: input.name.trim(),
      email,
      barangay_id: input.role === 'superAdmin' ? null : input.barangayId ?? null,
      responder_kind: input.role === 'emergencyResponders' ? input.responderKind ?? null : null,
      phone: input.phone?.trim() || null,
      address: input.address?.trim() || null,
      date_of_birth: input.dateOfBirth || null,
      gender: input.gender || null,
    })
    if (profileError) {
      await supabase.auth.signOut()
      throw new Error(profileError.message)
    }
    return loadProfileByAuthId(authData.user.id)
  }

  async function logout() {
    await supabase.auth.signOut()
    cache?.setUser(undefined)
  }

  function getCurrentUser(): User | undefined {
    return cache?.getUser()
  }

  async function fetchCurrentUser(): Promise<User | undefined> {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.user) {
      cache?.setUser(undefined)
      return undefined
    }
    return loadProfileByAuthId(session.user.id)
  }

  async function getMe(): Promise<User> {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.user) throw new Error('Not signed in')
    return loadProfileByAuthId(session.user.id)
  }

  async function getBarangays(): Promise<Barangay[]> {
    const { data, error } = await supabase.from('barangays').select('id, name, city').order('name')
    throwIf(error)
    return (data ?? []).map((b) => mapBarangayRow(b as Record<string, unknown>))
  }

  async function listUsers(): Promise<User[]> {
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false })
    throwIf(error)
    return (data ?? []).map((r) => mapUserRow(r as Record<string, unknown>))
  }

  async function listUsersByRole(role: Role): Promise<User[]> {
    const { data, error } = await supabase.from('users').select('*').eq('role', role).order('created_at', { ascending: false })
    throwIf(error)
    return (data ?? []).map((r) => mapUserRow(r as Record<string, unknown>))
  }

  async function createUser(input: {
    role: Role
    name: string
    email: string
    password: string
    barangayId?: ID
    responderKind?: EmergencyKind
  }): Promise<User> {
    const id = newId()
    const { data, error } = await supabase.rpc('ems_admin_create_user', {
      p_profile_id: id,
      p_role: input.role,
      p_name: input.name,
      p_email: input.email.trim().toLowerCase(),
      p_password: input.password,
      p_barangay_id: input.role === 'superAdmin' ? null : input.barangayId ?? null,
      p_responder_kind: input.role === 'emergencyResponders' ? input.responderKind ?? null : null,
    })
    throwIf(error)
    return mapUserRow(data as Record<string, unknown>)
  }

  async function updateUser(
    userId: ID,
    patch: Partial<{ role: Role; name: string; email: string; password: string; barangayId: ID | null; responderKind: EmergencyKind | null }>,
  ): Promise<User> {
    const currentRows = await supabase.from('users').select('*').eq('id', userId).maybeSingle()
    throwIf(currentRows.error)
    const current = currentRows.data as Record<string, unknown> | null
    if (!current) throw new Error('User not found')

    const role = (patch.role ?? current.role) as Role
    const row = {
      role,
      name: patch.name ?? current.name,
      email: typeof patch.email === 'string' ? patch.email.trim().toLowerCase() : current.email,
      barangay_id: role === 'superAdmin' ? null : patch.barangayId !== undefined ? patch.barangayId : current.barangay_id,
      responder_kind:
        role === 'emergencyResponders'
          ? patch.responderKind !== undefined
            ? patch.responderKind
            : current.responder_kind
          : null,
    }

    if (typeof patch.password === 'string' && patch.password.length > 0) {
      const { error: pwErr } = await supabase.rpc('ems_seed_auth_user', {
        p_email: row.email,
        p_password: patch.password,
        p_profile_id: userId,
        p_role: role,
        p_name: String(row.name),
        p_barangay_id: row.barangay_id,
        p_responder_kind: row.responder_kind,
      })
      throwIf(pwErr)
    }

    const { data, error } = await supabase.from('users').update(row).eq('id', userId).select('*').single()
    throwIf(error)
    return mapUserRow(data as Record<string, unknown>)
  }

  async function deleteUser(userId: ID): Promise<void> {
    const { error } = await supabase.rpc('ems_admin_delete_user', { p_user_id: userId })
    throwIf(error)
  }

  async function listIncidents(): Promise<Incident[]> {
    const { data, error } = await supabase.from('incidents').select('*').order('created_at', { ascending: false })
    throwIf(error)
    return (data ?? []).map((r) => mapIncidentRow(r as Record<string, unknown>))
  }

  async function listIncidentsForBarangay(barangayId: ID): Promise<Incident[]> {
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .eq('barangay_id', barangayId)
      .order('created_at', { ascending: false })
    throwIf(error)
    return (data ?? []).map((r) => mapIncidentRow(r as Record<string, unknown>))
  }

  async function listIncidentsForResponder(barangayId: ID): Promise<Incident[]> {
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .eq('barangay_id', barangayId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
    throwIf(error)
    return (data ?? []).map((r) => mapIncidentRow(r as Record<string, unknown>))
  }

  async function listIncidentsForReporter(reporterId: ID): Promise<Incident[]> {
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .eq('reporter_id', reporterId)
      .order('created_at', { ascending: false })
    throwIf(error)
    return (data ?? []).map((r) => mapIncidentRow(r as Record<string, unknown>))
  }

  async function getIncidentById(incidentId: ID): Promise<Incident> {
    const { data, error } = await supabase.from('incidents').select('*').eq('id', incidentId).maybeSingle()
    throwIf(error)
    if (!data) throw new Error('Incident not found')
    return mapIncidentRow(data as Record<string, unknown>)
  }

  async function createIncident(
    input: {
      reporterId: ID
      barangayId: ID
      type: IncidentType
      title: string
      description: string
      location: Incident['location']
      locationName?: string
      photoDataUrls?: string[]
      status?: IncidentStatus
    },
  ): Promise<Incident> {
    const actor = await requireProfile()
    if (actor.role !== 'resident') throw new Error('Only residents can create incidents')
    if (actor.id !== input.reporterId) throw new Error('Reporter mismatch')
    if (!actor.barangayId || actor.barangayId !== input.barangayId) throw new Error('Barangay mismatch')

    const id = newId()
    const { data, error } = await supabase
      .from('incidents')
      .insert({
        id,
        reporter_id: input.reporterId,
        barangay_id: input.barangayId,
        type: input.type,
        title: input.title.trim(),
        description: input.description.trim(),
        photo_data_urls: input.photoDataUrls ?? [],
        location_lat: input.location.lat,
        location_lng: input.location.lng,
        location_name: input.locationName?.trim() || null,
        status: input.status ?? 'pending',
      })
      .select('*')
      .single()
    throwIf(error)
    return mapIncidentRow(data as Record<string, unknown>)
  }

  async function updateIncident(
    incidentId: ID,
    patch: Partial<Omit<Incident, 'id' | 'createdAt' | 'barangayId' | 'reporterId'>>,
  ): Promise<Incident> {
    const actor = await requireProfile()
    const { data: current, error: curErr } = await supabase.from('incidents').select('*').eq('id', incidentId).maybeSingle()
    throwIf(curErr)
    if (!current) throw new Error('Incident not found')

    const cur = current as Record<string, unknown>
    const isResidentOwnEditable =
      actor.role === 'resident' &&
      canResidentManageIncident(
        { reporterId: String(cur.reporter_id), status: cur.status as IncidentStatus },
        actor.id,
      )

    const nextStatus = (patch.status ?? cur.status) as IncidentStatus
    const isBarangayOfficialWorkflowUpdate =
      actor.role === 'barangayOfficial' &&
      actor.barangayId === String(cur.barangay_id) &&
      (nextStatus === 'approved' || nextStatus === 'rejected' || nextStatus === 'resolved')

    const isResponderResolveOnly =
      actor.role === 'emergencyResponders' && actor.barangayId === String(cur.barangay_id) && nextStatus === 'resolved'

    const isSuperAdmin = actor.role === 'superAdmin'

    if (!isResidentOwnEditable && !isBarangayOfficialWorkflowUpdate && !isResponderResolveOnly && !isSuperAdmin) {
      throw new Error('Not authorized to update this incident')
    }

    const row: Record<string, unknown> = {}
    if (patch.type) row.type = patch.type
    if (patch.title) row.title = patch.title
    if (patch.description) row.description = patch.description
    if (patch.photoDataUrls) row.photo_data_urls = patch.photoDataUrls
    if (patch.location) {
      row.location_lat = patch.location.lat
      row.location_lng = patch.location.lng
    }
    if (patch.locationName !== undefined) row.location_name = patch.locationName?.trim() || null
    if (patch.status) row.status = patch.status

    const { data, error } = await supabase.from('incidents').update(row).eq('id', incidentId).select('*').single()
    throwIf(error)
    return mapIncidentRow(data as Record<string, unknown>)
  }

  async function deleteIncident(incidentId: ID): Promise<void> {
    const actor = await requireProfile()
    const { data: current, error: curErr } = await supabase.from('incidents').select('*').eq('id', incidentId).maybeSingle()
    throwIf(curErr)
    if (!current) return

    const cur = current as Record<string, unknown>
    const isResidentOwnPendingOrRejected =
      actor.role === 'resident' &&
      canResidentManageIncident(
        { reporterId: String(cur.reporter_id), status: cur.status as IncidentStatus },
        actor.id,
      )
    const isSuperAdmin = actor.role === 'superAdmin'

    if (!isResidentOwnPendingOrRejected && !isSuperAdmin) {
      throw new Error('Not authorized to delete this incident')
    }

    const { error } = await supabase.from('incidents').delete().eq('id', incidentId)
    throwIf(error)
  }

  async function listAlertsByBarangay(barangayId: ID): Promise<Alert[]> {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('barangay_id', barangayId)
      .order('created_at', { ascending: false })
    throwIf(error)
    return (data ?? []).map((r) => mapAlertRow(r as Record<string, unknown>))
  }

  async function createAlert(input: {
    barangayId: ID
    incidentId?: ID | null
    message: string
    channel: AlertChannel
  }): Promise<Alert> {
    const actor = await requireProfile()
    if (
      actor.role !== 'superAdmin' &&
      !(actor.role === 'barangayOfficial' && actor.barangayId === input.barangayId)
    ) {
      throw new Error('Only barangay officials and system admins can create alerts')
    }

    const id = newId()
    const { data, error } = await supabase
      .from('alerts')
      .insert({
        id,
        barangay_id: input.barangayId,
        incident_id: input.incidentId ?? null,
        message: input.message,
        channel: input.channel,
      })
      .select('*')
      .single()
    throwIf(error)
    return mapAlertRow(data as Record<string, unknown>)
  }

  async function listEmergencyRespondersByBarangay(barangayId: ID, kind?: EmergencyKind): Promise<User[]> {
    let q = supabase.from('users').select('*').eq('role', 'emergencyResponders').eq('barangay_id', barangayId)
    if (kind) q = q.eq('responder_kind', kind)
    const { data, error } = await q
    throwIf(error)
    return (data ?? []).map((r) => mapUserRow(r as Record<string, unknown>))
  }

  async function listResponsesByIncident(incidentId: ID): Promise<IncidentResponse[]> {
    const { data, error } = await supabase
      .from('responses')
      .select('*')
      .eq('incident_id', incidentId)
      .order('updated_at', { ascending: false })
    throwIf(error)
    return (data ?? []).map((r) => mapResponseRow(r as Record<string, unknown>))
  }

  async function getResponse(responderId: ID, incidentId: ID): Promise<IncidentResponse | undefined> {
    const { data, error } = await supabase
      .from('responses')
      .select('*')
      .eq('responder_id', responderId)
      .eq('incident_id', incidentId)
      .maybeSingle()
    throwIf(error)
    if (!data) return undefined
    return mapResponseRow(data as Record<string, unknown>)
  }

  async function upsertResponse(input: {
    incidentId: ID
    responderId: ID
    responderKind: EmergencyKind
    status: ResponseStatus
    notes?: string | null
  }): Promise<IncidentResponse> {
    const actor = await requireProfile()
    if (actor.role !== 'emergencyResponders' || actor.id !== input.responderId) {
      throw new Error('Only the assigned responder can update their response')
    }

    const { data: incident, error: incErr } = await supabase.from('incidents').select('barangay_id').eq('id', input.incidentId).maybeSingle()
    throwIf(incErr)
    if (!incident || actor.barangayId !== String(incident.barangay_id)) {
      throw new Error('Responder and incident barangay mismatch')
    }

    const existing = await getResponse(input.responderId, input.incidentId)
    if (!existing) {
      const id = newId()
      const { data, error } = await supabase
        .from('responses')
        .insert({
          id,
          responder_id: input.responderId,
          responder_kind: input.responderKind,
          incident_id: input.incidentId,
          status: input.status,
          notes: input.notes ?? null,
        })
        .select('*')
        .single()
      throwIf(error)
      return mapResponseRow(data as Record<string, unknown>)
    }

    const { data, error } = await supabase
      .from('responses')
      .update({
        responder_kind: input.responderKind,
        status: input.status,
        notes: input.notes ?? null,
      })
      .eq('responder_id', input.responderId)
      .eq('incident_id', input.incidentId)
      .select('*')
      .single()
    throwIf(error)
    return mapResponseRow(data as Record<string, unknown>)
  }

  async function updateIncidentStatusToApproved(incidentId: ID): Promise<Incident> {
    return updateIncident(incidentId, { status: 'approved' })
  }

  async function listIncidentsForBarangayApproved(barangayId: ID): Promise<Incident[]> {
    return listIncidentsForBarangay(barangayId)
  }

  /** Mobile-friendly resident registration. */
  async function registerResident(
    params: { name: string; email: string; password: string; barangayId: ID } & UserProfileInput,
  ) {
    return register({
      role: 'resident',
      name: params.name,
      email: params.email,
      password: params.password,
      barangayId: params.barangayId,
      phone: params.phone,
      address: params.address,
      dateOfBirth: params.dateOfBirth,
      gender: params.gender,
    })
  }

  async function updateOwnProfile(patch: { name: string } & UserProfileInput): Promise<User> {
    const me = await requireProfile()
    const name = patch.name.trim()
    if (name.length < 2) throw new Error('Name must be at least 2 characters')

    const row = {
      name,
      phone: patch.phone?.trim() || null,
      address: patch.address?.trim() || null,
      date_of_birth: patch.dateOfBirth || null,
      gender: patch.gender || null,
    }

    const { data, error } = await supabase.rpc('ems_update_own_profile', {
      p_name: name,
      p_phone: row.phone,
      p_address: row.address,
      p_date_of_birth: row.date_of_birth,
      p_gender: row.gender,
    })
    if (error) {
      const { data: fallback, error: updErr } = await supabase.from('users').update(row).eq('id', me.id).select('*').single()
      throwIf(updErr)
      const user = mapUserRow(fallback as Record<string, unknown>)
      cache?.setUser(user)
      return user
    }

    const user = mapUserRow(data as Record<string, unknown>)
    cache?.setUser(user)
    return user
  }

  async function changePassword(input: { currentPassword: string; newPassword: string }): Promise<void> {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const email = session?.user?.email
    if (!email) throw new Error('Not signed in')

    if (input.newPassword.length < 6) throw new Error('New password must be at least 6 characters')

    const { error: verifyErr } = await supabase.auth.signInWithPassword({
      email,
      password: input.currentPassword,
    })
    if (verifyErr) throw new Error('Current password is incorrect')

    const { error } = await supabase.auth.updateUser({ password: input.newPassword })
    if (error) throw new Error(formatAuthError(error.message))
  }

  return {
    login,
    register,
    registerResident,
    logout,
    getCurrentUser,
    fetchCurrentUser,
    getMe,
    getBarangays,
    listUsers,
    listUsersByRole,
    createUser,
    updateUser,
    deleteUser,
    listIncidents,
    listIncidentsForBarangay,
    listIncidentsForResponder,
    listIncidentsForReporter,
    getIncidentById,
    createIncident,
    updateIncident,
    deleteIncident,
    listAlertsByBarangay,
    createAlert,
    listEmergencyRespondersByBarangay,
    listResponsesByIncident,
    getResponse,
    upsertResponse,
    updateIncidentStatusToApproved,
    listIncidentsForBarangayApproved,
    updateOwnProfile,
    changePassword,
  }
}

export type EmsClient = ReturnType<typeof createEmsClient>
