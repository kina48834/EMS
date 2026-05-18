import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSession } from '@/system/hooks/useSession'
import type { AlertChannel, Incident, IncidentStatus, Response, ResponseStatus, User } from '@/system/types'
import { createAlert, getIncidentById, listEmergencyRespondersByBarangay, listResponsesByIncident, updateIncident } from '@/system/db'
import BarangayOfficialIncidentCrosshairMap from '@/maps/barangayOfficial/BarangayOfficialIncidentCrosshairMap'
import Button from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import StatusBadge from '@/components/ui/StatusBadge'
import ResponseStatusBadge from '@/components/ui/ResponseStatusBadge'
import TypeBadge from '@/components/ui/TypeBadge'

function channelSelectLabel(channel: AlertChannel) {
  return channel === 'internet' ? 'Internet' : 'SMS'
}

export default function BarangayOfficialIncidentDetailPage() {
  const { user } = useSession()
  const navigate = useNavigate()
  const params = useParams()
  const incidentId = params.incidentId

  const [tick, setTick] = useState(0)
  const [alertMessage, setAlertMessage] = useState('')
  const [alertChannel, setAlertChannel] = useState<AlertChannel>('internet')

  const [incident, setIncident] = useState<Incident | undefined>(undefined)
  const [responses, setResponses] = useState<Response[]>([])
  const [responders, setResponders] = useState<User[]>([])

  useEffect(() => {
    if (!incidentId || !user?.barangayId) return
    const barangayId = user.barangayId
    let cancelled = false
    ;(async () => {
      const [nextIncident, nextResponses, nextResponders] = await Promise.all([
        getIncidentById(incidentId),
        listResponsesByIncident(incidentId),
        listEmergencyRespondersByBarangay(barangayId),
      ])
      if (cancelled) return
      setIncident(nextIncident)
      setResponses(nextResponses)
      setResponders(nextResponders)
    })()
    return () => {
      cancelled = true
    }
  }, [incidentId, user?.barangayId, tick])

  useEffect(() => {
    if (!incident) return
    setAlertMessage(`Update: ${incident.title}`)
  }, [incident?.id])

  if (!user) return null
  if (!user.barangayId) return <div className="py-10 text-center text-sm text-slate-600">Barangay not assigned.</div>
  if (!incident) {
    return (
      <div className="py-10 text-center">
        <div className="text-sm text-slate-600">Incident not found.</div>
        <div className="mt-4">
          <Button variant="secondary" onClick={() => navigate('/barangay-official')}>
            Back
          </Button>
        </div>
      </div>
    )
  }

  const approve = () => {
    if (!incident) return
    void (async () => {
      await updateIncident(incident.id, { status: 'approved' })
      await createAlert({
        barangayId: user.barangayId!,
        incidentId: incident.id,
        message: `Approved: ${incident.title}`,
        channel: 'internet',
      })
      setTick((t) => t + 1)
    })()
  }

  const reject = () => {
    if (!incident) return
    void (async () => {
      await updateIncident(incident.id, { status: 'rejected' })
      setTick((t) => t + 1)
    })()
  }

  const markResolved = () => {
    if (!incident) return
    void (async () => {
      await updateIncident(incident.id, { status: 'resolved' })
      setTick((t) => t + 1)
    })()
  }

  const sendAlert = () => {
    const msg = alertMessage.trim()
    if (!msg) return
    if (!incident) return
    void (async () => {
      await createAlert({
        barangayId: user.barangayId!,
        incidentId: incident.id,
        message: msg,
        channel: alertChannel,
      })
      setTick((t) => t + 1)
    })()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:gap-4">
        <div className="min-w-0">
          <div className="truncate text-lg font-semibold sm:text-xl">{incident.title}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={incident.status} />
            <TypeBadge type={incident.type} />
            <span className="text-xs text-slate-500">Updated: {new Date(incident.updatedAt).toLocaleString()}</span>
          </div>
          <div className="mt-2 text-sm text-slate-600">{incident.description}</div>
          <div className="mt-2 text-sm text-slate-600 font-mono text-xs">
            Lat: {incident.location.lat.toFixed(6)} • Lng: {incident.location.lng.toFixed(6)}
          </div>

          <div className="mt-3">
            <BarangayOfficialIncidentCrosshairMap selectedLocation={incident.location} heightClassName="h-56 sm:h-64" />
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Button variant="secondary" onClick={() => navigate('/barangay-official')}>
            Back
          </Button>
          {incident.status === 'pending' ? (
            <>
              <Button variant="primary" onClick={approve}>
                Approve
              </Button>
              <Button variant="danger" onClick={reject}>
                Reject
              </Button>
            </>
          ) : null}
          {incident.status === 'approved' ? (
            <Button variant="secondary" onClick={markResolved}>
              Mark Resolved
            </Button>
          ) : null}
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
          <CardTitle>Responder coordination</CardTitle>
          <div className="mt-2 text-sm text-slate-600">Available responders in your barangay:</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {responders.length === 0 ? <div className="text-sm text-slate-500">No responders assigned.</div> : null}
            {responders.map((r) => (
              <span key={r.id} className="rounded border bg-gray-50 px-2 py-1 text-xs text-slate-700 capitalize">
                {r.responderKind}
              </span>
            ))}
          </div>
          <div className="mt-4 text-xs text-slate-500">
            Tip: responders update their status in their own queue. Use alerts to notify residents and responders.
          </div>
        </Card>
      </div>

      <Card>
        <CardTitle>Send alert to residents</CardTitle>
        <div className="mt-1 text-xs text-slate-500">Your alert will appear on the resident feed.</div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="block sm:col-span-2">
            <div className="mb-1 text-sm text-slate-700">Message</div>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-ems-600 focus:outline-none focus:ring-2 focus:ring-ems-600/25"
              value={alertMessage}
              onChange={(e) => setAlertMessage(e.target.value)}
            />
          </label>
          <label className="block">
            <div className="mb-1 text-sm text-slate-700">Channel</div>
            <select className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-ems-600 focus:outline-none focus:ring-2 focus:ring-ems-600/25" value={alertChannel} onChange={(e) => setAlertChannel(e.target.value as AlertChannel)}>
              <option value="internet">{channelSelectLabel('internet')}</option>
              <option value="sms">{channelSelectLabel('sms')}</option>
            </select>
          </label>
          <div className="sm:col-span-3">
            <Button variant="primary" type="button" onClick={sendAlert}>
              Send alert
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>Responder updates</CardTitle>
        <div className="mt-2 space-y-2">
          {responses.length === 0 ? (
            <div className="text-sm text-slate-500">No responses yet.</div>
          ) : (
            responses.map((r) => (
              <div key={r.id} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium capitalize">{r.responderKind}</div>
                  <div className="text-xs text-slate-500">{new Date(r.updatedAt).toLocaleString()}</div>
                </div>
                <div className="mt-1 text-sm">
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

