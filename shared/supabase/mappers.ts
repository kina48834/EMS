import type {
  Alert,
  AlertChannel,
  Barangay,
  EmergencyKind,
  GeoPoint,
  ID,
  Incident,
  IncidentResponse,
  IncidentStatus,
  IncidentType,
  ResponseStatus,
  Role,
  User,
} from '../types'

export function newId(): ID {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function mapUserRow(row: Record<string, unknown>): User {
  const barangayId = row.barangayId ?? row.barangay_id
  const responderKind = row.responderKind ?? row.responder_kind
  const createdAt = row.createdAt ?? row.created_at
  const phone = row.phone
  const address = row.address
  const dateOfBirth = row.dateOfBirth ?? row.date_of_birth
  const gender = row.gender
  return {
    id: String(row.id),
    role: row.role as Role,
    name: String(row.name),
    email: String(row.email),
    barangayId: barangayId != null && barangayId !== '' ? String(barangayId) : undefined,
    responderKind: responderKind != null && responderKind !== '' ? (responderKind as EmergencyKind) : undefined,
    phone: phone != null && String(phone) !== '' ? String(phone) : undefined,
    address: address != null && String(address) !== '' ? String(address) : undefined,
    dateOfBirth:
      dateOfBirth != null && String(dateOfBirth) !== ''
        ? String(dateOfBirth).slice(0, 10)
        : undefined,
    gender:
      gender != null && String(gender) !== ''
        ? (String(gender) as import('../types').Gender)
        : undefined,
    createdAt: createdAt ? new Date(String(createdAt)).toISOString() : new Date().toISOString(),
  }
}

export function mapBarangayRow(row: Record<string, unknown>): Barangay {
  return {
    id: String(row.id),
    name: String(row.name),
    city: row.city != null && row.city !== '' ? String(row.city) : undefined,
  }
}

export function mapIncidentRow(row: Record<string, unknown>): Incident {
  const loc = row.location as Record<string, unknown> | undefined
  const photos = row.photoDataUrls ?? row.photo_data_urls
  const lat = loc?.lat ?? row.location_lat
  const lng = loc?.lng ?? row.location_lng
  return {
    id: String(row.id),
    reporterId: String(row.reporterId ?? row.reporter_id),
    barangayId: String(row.barangayId ?? row.barangay_id),
    type: row.type as IncidentType,
    title: String(row.title),
    description: String(row.description),
    photoDataUrls: Array.isArray(photos) ? (photos as string[]) : [],
    location: { lat: Number(lat), lng: Number(lng) } as GeoPoint,
    locationName:
      row.locationName != null && String(row.locationName) !== ''
        ? String(row.locationName)
        : row.location_name != null && String(row.location_name) !== ''
          ? String(row.location_name)
          : undefined,
    status: row.status as IncidentStatus,
    createdAt: new Date(String(row.createdAt ?? row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updatedAt ?? row.updated_at)).toISOString(),
  }
}

export function mapResponseRow(row: Record<string, unknown>): IncidentResponse {
  return {
    id: String(row.id),
    responderId: String(row.responderId ?? row.responder_id),
    responderKind: (row.responderKind ?? row.responder_kind) as EmergencyKind,
    incidentId: String(row.incidentId ?? row.incident_id),
    status: row.status as ResponseStatus,
    notes: row.notes != null ? String(row.notes) : '',
    createdAt: new Date(String(row.createdAt ?? row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updatedAt ?? row.updated_at)).toISOString(),
  }
}

export function mapAlertRow(row: Record<string, unknown>): Alert {
  const incidentId = row.incidentId ?? row.incident_id
  return {
    id: String(row.id),
    barangayId: String(row.barangayId ?? row.barangay_id),
    incidentId: incidentId != null && incidentId !== '' ? String(incidentId) : undefined,
    message: String(row.message),
    channel: row.channel as AlertChannel,
    createdAt: new Date(String(row.createdAt ?? row.created_at)).toISOString(),
  }
}
