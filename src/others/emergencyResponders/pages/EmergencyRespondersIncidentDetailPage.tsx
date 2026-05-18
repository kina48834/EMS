import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSession } from '@/system/hooks/useSession'
import type { GeoPoint, Incident, Response, ResponseStatus } from '@/system/types'
import { getIncidentById, getResponse, listResponsesByIncident, updateIncident, upsertResponse } from '@/system/db'
import EmergencyRespondersIncidentCrosshairMap from '@/maps/emergencyResponders/EmergencyRespondersIncidentCrosshairMap'
import Button from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import ResponseStatusBadge from '@/components/ui/ResponseStatusBadge'
import Select from '@/components/ui/Select'
import StatusBadge from '@/components/ui/StatusBadge'
import TypeBadge from '@/components/ui/TypeBadge'

export default function EmergencyRespondersIncidentDetailPage() {
  const { user } = useSession()
  const navigate = useNavigate()
  const params = useParams()
  const incidentId = params.incidentId

  const [tick, setTick] = useState(0)
  const [incident, setIncident] = useState<Incident | undefined>(undefined)
  const [responses, setResponses] = useState<Response[]>([])
  const [myResponse, setMyResponse] = useState<Response | undefined>(undefined)

  const [status, setStatus] = useState<ResponseStatus>('enRoute')
  const [notes, setNotes] = useState('')
  const [geo, setGeo] = useState<GeoPoint | null>(null)

  useEffect(() => {
    if (!incidentId || !user?.id) return
    let cancelled = false
    ;(async () => {
      const [nextIncident, nextResponses, nextMyResponse] = await Promise.all([
        getIncidentById(incidentId),
        listResponsesByIncident(incidentId),
        getResponse(user.id, incidentId),
      ])
      if (cancelled) return
      setIncident(nextIncident)
      setResponses(nextResponses)
      setMyResponse(nextMyResponse)
    })()
    return () => {
      cancelled = true
    }
  }, [incidentId, user?.id, tick])

  useEffect(() => {
    if (!incident) return
    if (myResponse) {
      setStatus(myResponse.status)
      setNotes(myResponse.notes)
    } else {
      setStatus('enRoute')
      setNotes('')
    }
  }, [incident?.id, myResponse?.id])

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => undefined,
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }, [])

  if (!user) return null
  if (!user.barangayId || !user.responderKind) {
    return <div className="py-10 text-center text-sm text-slate-600">Responder account missing barangay or type.</div>
  }
  if (!incident) {
    return (
      <div className="py-10 text-center">
        <div className="text-sm text-slate-600">Incident not found.</div>
        <div className="mt-4">
          <Button variant="secondary" onClick={() => navigate('/emergency-responders')}>
            Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:gap-4">
        <div className="min-w-0">
          <div className="truncate text-lg font-semibold sm:text-xl">{incident.title}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {myResponse ? <ResponseStatusBadge status={myResponse.status} /> : <span className="text-xs text-slate-500">Not started</span>}
            <TypeBadge type={incident.type} />
            <StatusBadge status={incident.status} />
          </div>
          <div className="mt-2 text-sm text-slate-600">{incident.description}</div>
          <div className="mt-1 text-xs font-mono text-slate-500">
            Lat: {incident.location.lat.toFixed(6)} • Lng: {incident.location.lng.toFixed(6)}
          </div>

          <div className="mt-3">
            <EmergencyRespondersIncidentCrosshairMap selectedLocation={incident.location} heightClassName="h-56 sm:h-64" />
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Button variant="secondary" onClick={() => navigate('/emergency-responders')}>
            Back
          </Button>
          <Button variant="ghost" onClick={() => setTick((t) => t + 1)}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Photos</CardTitle>
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
        </Card>

        <Card>
          <CardTitle>Update your response</CardTitle>
          <div className="mt-2 text-xs text-slate-500">Status updates will reflect in the Barangay Official view.</div>

          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault()
              void (async () => {
                await upsertResponse({
                  incidentId: incident!.id,
                  responderId: user.id,
                  responderKind: user.responderKind!,
                  status,
                  notes: notes.trim(),
                })
                if (status === 'resolved') {
                  await updateIncident(incident!.id, { status: 'resolved' })
                }
                setTick((t) => t + 1)
              })()
            }}
          >
            <Field label="Response status">
              <Select value={status} onChange={(e) => setStatus(e.target.value as ResponseStatus)}>
                <option value="enRoute">En route</option>
                <option value="onSite">On-site</option>
                <option value="resolved">Resolved</option>
              </Select>
            </Field>

            <label className="block">
              <div className="mb-1 text-sm text-slate-700">Notes / Communication</div>
              <textarea className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-ems-600 focus:outline-none focus:ring-2 focus:ring-ems-600/25" value={notes} rows={4} onChange={(e) => setNotes(e.target.value)} />
            </label>

            <Button variant="primary" fullWidth type="submit">
              Save update
            </Button>

            {geo ? <div className="text-xs text-slate-500">You can share GPS via notes (prototype).</div> : null}
          </form>
        </Card>
      </div>

      <Card>
        <CardTitle>All responder updates</CardTitle>
        <div className="mt-2 space-y-2">
          {responses.length === 0 ? (
            <div className="text-sm text-slate-500">No updates yet.</div>
          ) : (
            responses.map((r) => (
              <div key={r.id} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium capitalize">{r.responderKind}</div>
                  <div className="text-xs text-slate-500">{new Date(r.updatedAt).toLocaleString()}</div>
                </div>
                <div className="mt-1">
                  <ResponseStatusBadge status={r.status} />
                </div>
                {r.notes ? <div className="mt-1 text-sm text-slate-600">{r.notes}</div> : null}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}

