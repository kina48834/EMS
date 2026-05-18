import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useSession } from '@/system/hooks/useSession'
import type { Alert, GeoPoint, Incident, IncidentType, IncidentStatus, Response } from '@/system/types'
import { distanceKm } from '@/system/utils/distance'
import { deleteIncident, getIncidentById, listAlertsByBarangay, listResponsesByIncident, updateIncident } from '@/system/db'
import ResidentIncidentCrosshairMap from '@/maps/resident/ResidentIncidentCrosshairMap'
import Button from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import StatusBadge from '@/components/ui/StatusBadge'
import TypeBadge from '@/components/ui/TypeBadge'

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export default function ResidentIncidentDetailPage() {
  const { user } = useSession()
  const navigate = useNavigate()
  const params = useParams()
  const [searchParams] = useSearchParams()

  const incidentId = params.incidentId
  const editMode = searchParams.get('edit') === '1'

  const [tick, setTick] = useState(0)
  const [geo, setGeo] = useState<GeoPoint | null>(null)
  const [incident, setIncident] = useState<Incident | undefined>(undefined)
  const [responses, setResponses] = useState<Response[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])

  useEffect(() => {
    if (!user?.barangayId) return
    navigator.geolocation?.getCurrentPosition(
      (pos) => setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => undefined,
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }, [user?.barangayId])

  useEffect(() => {
    if (!incidentId || !user?.barangayId) return
    const barangayId = user.barangayId
    let cancelled = false
    ;(async () => {
      const [nextIncident, nextResponses, nextAlerts] = await Promise.all([
        getIncidentById(incidentId),
        listResponsesByIncident(incidentId),
        listAlertsByBarangay(barangayId),
      ])
      if (cancelled) return
      setIncident(nextIncident)
      setResponses(nextResponses)
      setAlerts(nextAlerts.filter((a) => !a.incidentId || a.incidentId === incidentId))
    })()
    return () => {
      cancelled = true
    }
  }, [incidentId, user?.barangayId, tick])

  const canEdit = Boolean(
    user &&
      incident &&
      incident.reporterId === user.id &&
      (incident.status === 'pending' || incident.status === 'rejected'),
  )

  const [type, setType] = useState<IncidentType>('crime')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [photoDataUrls, setPhotoDataUrls] = useState<string[]>([])
  const [location, setLocation] = useState<GeoPoint | null>(null)

  useEffect(() => {
    if (!incident) return
    setType(incident.type)
    setTitle(incident.title)
    setDescription(incident.description)
    setPhotoDataUrls(incident.photoDataUrls)
    setLocation(incident.location)
  }, [incident?.id])

  if (!user) return null
  if (!incident) {
    return (
      <div className="py-10">
        <div className="text-center text-sm text-slate-600">Incident not found.</div>
        <div className="mt-4 text-center">
          <Button variant="secondary" onClick={() => navigate('/resident')}>
            Back
          </Button>
        </div>
      </div>
    )
  }

  const dist = geo ? distanceKm(geo, incident.location) : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="min-w-0">
          <div className="truncate text-lg font-semibold sm:text-xl">{incident.title}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <StatusBadge status={incident.status} />
            <TypeBadge type={incident.type} />
            {dist !== null ? <span className="text-xs text-slate-500">{dist.toFixed(2)} km away</span> : null}
          </div>
          <div className="mt-2 text-sm text-slate-600">{incident.description}</div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Button variant="secondary" onClick={() => navigate('/resident')}>
            Back
          </Button>
          {canEdit ? (
            editMode ? (
              <Button
                variant="primary"
                type="button"
                onClick={() => {
                  navigate(`/resident/incidents/${incident.id}`)
                }}
              >
                Exit edit
              </Button>
            ) : (
              <Button variant="secondary" type="button" onClick={() => navigate(`/resident/incidents/${incident.id}?edit=1`)}>
                Edit
              </Button>
            )
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="text-sm font-semibold">Photos</div>
          {incident.photoDataUrls.length === 0 ? (
            <div className="mt-2 text-sm text-slate-500">No photos attached.</div>
          ) : (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {incident.photoDataUrls.map((p, idx) => (
                <div key={idx} className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                  <img src={p} alt={`Incident photo ${idx + 1}`} className="h-28 w-full object-cover" />
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 text-sm text-slate-600">
            Location: <span className="font-mono text-xs">{incident.location.lat.toFixed(6)}</span>,{' '}
            <span className="font-mono text-xs">{incident.location.lng.toFixed(6)}</span>
          </div>

          <div className="mt-3">
            <ResidentIncidentCrosshairMap
              selectedLocation={location ?? incident.location}
              onSelectLocation={
                canEdit && editMode
                  ? (p) => {
                      setLocation(p)
                    }
                  : undefined
              }
              recenterOnSelected={canEdit && editMode}
              heightClassName="h-56 sm:h-64"
            />
          </div>

          {canEdit && !editMode ? (
            <Button
              className="mt-4"
              variant="danger"
              fullWidth
              onClick={() => {
                if (!confirm('Delete this incident report?')) return
                void (async () => {
                  await deleteIncident(incident.id)
                  navigate('/resident')
                })()
              }}
            >
              Delete report
            </Button>
          ) : null}
        </Card>

        <Card>
          <div className="text-sm font-semibold">Status Updates</div>
          <div className="mt-2 space-y-2">
            {responses.length === 0 ? <div className="text-sm text-slate-500">No responder updates yet.</div> : null}
            {responses.map((r) => (
              <div key={r.id} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium capitalize">{r.responderKind}</div>
                  <div className="text-xs text-slate-500">{new Date(r.updatedAt).toLocaleString()}</div>
                </div>
                <div className="mt-1 text-sm">
                  Response status:{' '}
                  <span className="font-medium">
                    {r.status === 'enRoute' ? 'En route' : r.status === 'onSite' ? 'On-site' : 'Resolved'}
                  </span>
                </div>
                {r.notes ? <div className="mt-1 text-sm text-slate-600">{r.notes}</div> : null}
              </div>
            ))}
          </div>

          {alerts.length ? (
            <Card className="mt-4 bg-slate-50/80">
              <div className="text-sm font-semibold">Alerts</div>
              <div className="mt-2 space-y-2">
                {alerts.slice(0, 6).map((a) => (
                  <div key={a.id} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                    <div className="text-xs text-slate-500">{a.channel} • {new Date(a.createdAt).toLocaleString()}</div>
                    <div className="mt-1 text-sm font-medium">{a.message}</div>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </Card>
      </div>

      {canEdit && editMode ? (
        <Card>
          <div className="text-sm font-semibold">Edit Report</div>
          <form
            className="mt-4 space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (!location) return
              void (async () => {
                await updateIncident(incident.id, {
                  type,
                  title: title.trim(),
                  description: description.trim(),
                  photoDataUrls,
                  location,
                })
                setTick((t) => t + 1)
                navigate(`/resident/incidents/${incident.id}`)
              })()
            }}
          >
            <label className="block">
              <div className="mb-1 text-sm text-slate-700">Incident Type</div>
              <select className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-ems-600 focus:outline-none focus:ring-2 focus:ring-ems-600/25" value={type} onChange={(e) => setType(e.target.value as IncidentType)}>
                <option value="crime">Crime</option>
                <option value="fire">Fire</option>
                <option value="accident">Accident</option>
                <option value="disaster">Disaster</option>
              </select>
            </label>

            <label className="block">
              <div className="mb-1 text-sm text-slate-700">Title</div>
              <input className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-ems-600 focus:outline-none focus:ring-2 focus:ring-ems-600/25" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>

            <label className="block">
              <div className="mb-1 text-sm text-slate-700">Description</div>
              <textarea className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-ems-600 focus:outline-none focus:ring-2 focus:ring-ems-600/25" value={description} rows={4} onChange={(e) => setDescription(e.target.value)} required />
            </label>

            <label className="block">
              <div className="mb-1 text-sm text-slate-700">Replace Photos (optional)</div>
              <input
                className="w-full text-sm"
                type="file"
                accept="image/*"
                multiple
                onChange={async (e) => {
                  const files = Array.from(e.target.files ?? [])
                  if (files.length === 0) return
                  const urls: string[] = []
                  for (const f of files.slice(0, 5)) urls.push(await fileToDataUrl(f))
                  setPhotoDataUrls(urls)
                }}
              />
              <div className="mt-1 text-xs text-slate-500">Current: {photoDataUrls.length} photo(s)</div>
            </label>

            <div className="flex flex-col items-start gap-3 sm:flex-row">
              <div className="flex-1">
                <div className="text-sm font-semibold text-slate-800">Location</div>
                <div className="mt-1 rounded border bg-gray-50 p-2 text-xs font-mono">
                  {location ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : 'No location'}
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  navigator.geolocation?.getCurrentPosition(
                    (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                    () => undefined,
                    { enableHighAccuracy: true, timeout: 8000 },
                  )
                }}
              >
                Recapture GPS
              </Button>
            </div>

            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
              <Button variant="primary" type="submit">
                Save changes
              </Button>
              <Button variant="secondary" type="button" onClick={() => navigate(`/resident/incidents/${incident.id}`)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      ) : null}
    </div>
  )
}

