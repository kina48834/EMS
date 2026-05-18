export type Role = 'resident' | 'barangayOfficial' | 'emergencyResponders' | 'superAdmin'

export type EmergencyKind = 'police' | 'fire' | 'ems'

export type IncidentType = 'crime' | 'fire' | 'accident' | 'disaster'

export type IncidentStatus = 'pending' | 'approved' | 'rejected' | 'resolved'

export type ResponseStatus = 'enRoute' | 'onSite' | 'resolved'

export type AlertChannel = 'internet' | 'sms'

export type ID = string

export type GeoPoint = {
  lat: number
  lng: number
}

export type Barangay = {
  id: ID
  name: string
  city?: string
}

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say'

export type User = {
  id: ID
  role: Role
  name: string
  email: string
  password?: string
  barangayId?: ID
  responderKind?: EmergencyKind
  phone?: string
  address?: string
  /** ISO date YYYY-MM-DD */
  dateOfBirth?: string
  gender?: Gender
  createdAt: string
}

export type Incident = {
  id: ID
  type: IncidentType
  title: string
  description: string
  photoDataUrls: string[]
  location: GeoPoint
  /** Reverse-geocoded place label when the report was pinned on the map */
  locationName?: string
  barangayId: ID
  reporterId: ID
  status: IncidentStatus
  createdAt: string
  updatedAt: string
}

/** Responder assignment (named to avoid clashing with `fetch` Response on web). */
export type IncidentResponse = {
  id: ID
  incidentId: ID
  responderId: ID
  responderKind: EmergencyKind
  status: ResponseStatus
  notes: string
  createdAt: string
  updatedAt: string
}

/** @deprecated Use IncidentResponse */
export type Response = IncidentResponse

export type Alert = {
  id: ID
  barangayId: ID
  incidentId?: ID
  message: string
  channel: AlertChannel
  createdAt: string
}

export const Role = {
  resident: 'resident',
  barangayOfficial: 'barangayOfficial',
  emergencyResponders: 'emergencyResponders',
  superAdmin: 'superAdmin',
} as const satisfies Record<string, Role>

export const IncidentType = {
  crime: 'crime',
  fire: 'fire',
  accident: 'accident',
  disaster: 'disaster',
} as const satisfies Record<string, IncidentType>

export const IncidentStatus = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
  resolved: 'resolved',
} as const satisfies Record<string, IncidentStatus>
