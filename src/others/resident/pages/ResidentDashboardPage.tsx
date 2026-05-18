import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '@/system/hooks/useSession'
import type { GeoPoint, Incident, IncidentStatus } from '@/system/types'
import { distanceKm } from '@/system/utils/distance'
import { deleteIncident, listAlertsByBarangay, listIncidentsForBarangay } from '@/system/db'
import ResidentIncidentMarksMap from '@/maps/resident/ResidentIncidentMarksMap'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import PageHeader from '@/components/ui/PageHeader'
import StatusBadge from '@/components/ui/StatusBadge'

export default function ResidentDashboardPage() {
  const { user } = useSession()
  const navigate = useNavigate()

  const [tick, setTick] = useState(0)
  const [geo, setGeo] = useState<GeoPoint | null>(null)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [alerts, setAlerts] = useState<Awaited<ReturnType<typeof listAlertsByBarangay>>>(
    [],
  )

  useEffect(() => {
    if (!user?.barangayId) return

    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported in this browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      (err) => {
        setGeoError(err.message || 'Unable to fetch location.')
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }, [user?.barangayId])

  useEffect(() => {
    if (!user?.barangayId) return
    const barangayId = user.barangayId
    let cancelled = false
    ;(async () => {
      const [nextIncidents, nextAlerts] = await Promise.all([
        listIncidentsForBarangay(barangayId),
        listAlertsByBarangay(barangayId),
      ])
      if (cancelled) return
      setIncidents(nextIncidents)
      setAlerts(nextAlerts)
    })()
    return () => {
      cancelled = true
    }
  }, [user?.barangayId, tick])

  const radiusKm = 5
  const nearbyIncidents = useMemo(() => {
    if (!geo) return incidents
    return incidents.filter((i) => distanceKm(geo, i.location) <= radiusKm)
  }, [geo, incidents])

  if (!user) return null

  const canManageIncident = (incident: Incident) => {
    const isOwn = incident.reporterId === user.id
    return isOwn && (incident.status === 'pending' || incident.status === 'rejected')
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="My dashboard"
        description="Report incidents, view alerts, and track updates for your barangay."
        actions={
          <Button variant="primary" onClick={() => navigate('/resident/incidents/new')}>
            New report
          </Button>
        }
      />
      {geoError ? <p className="text-xs text-rose-700">{geoError}</p> : null}
      {geo ? <p className="text-xs text-slate-500">Nearby radius: {radiusKm} km</p> : null}

      <Card>
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-semibold text-slate-900">Nearby Incidents</div>
          <div className="text-xs text-slate-500">{nearbyIncidents.length} items</div>
        </div>

        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-100">
          <table className="ems-table min-w-[640px]">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {nearbyIncidents.length === 0 ? (
                <tr>
                  <td className="py-6 text-center text-sm text-slate-500" colSpan={4}>
                    No incidents yet.
                  </td>
                </tr>
              ) : (
                nearbyIncidents.map((i) => {
                  const dist = geo ? distanceKm(geo, i.location) : null
                  const canEdit = canManageIncident(i)
                  return (
                    <tr key={i.id} className="border-t">
                      <td className="py-3 pr-4 text-slate-700 capitalize">{i.type}</td>
                      <td className="py-3 pr-4">
                        <div className="font-medium text-slate-900">{i.title}</div>
                        <div className="text-xs text-slate-500">{i.description}</div>
                        {dist !== null ? <div className="mt-1 text-xs text-slate-500">{dist.toFixed(2)} km</div> : null}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={i.status} />
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="secondary" onClick={() => navigate(`/resident/incidents/${i.id}`)}>
                            View
                          </Button>
                          {canEdit ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => navigate(`/resident/incidents/${i.id}?edit=1`)}
                            >
                              Edit
                            </Button>
                          ) : null}
                          {canEdit ? (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => {
                                if (!confirm('Delete this incident?')) return
                                void (async () => {
                                  await deleteIncident(i.id)
                                  setTick((t) => t + 1)
                                })()
                              }}
                            >
                              Delete
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-sm font-semibold text-slate-900">Incident marks</div>
            <div className="mt-1 text-xs text-slate-500">Click a marker to open the report.</div>
          </div>
          <div className="text-xs text-slate-500">{nearbyIncidents.length} items</div>
        </div>

        <div className="mt-3">
          <ResidentIncidentMarksMap
            incidents={nearbyIncidents}
            onIncidentClick={(incidentId) => navigate(`/resident/incidents/${incidentId}`)}
            heightClassName="h-72 sm:h-96"
          />
        </div>
      </Card>

      <Card>
        <div className="text-sm font-semibold text-slate-900">Emergency alerts</div>
        <div className="mt-2 text-xs text-slate-500">Latest alerts for your barangay</div>

        <div className="mt-3 space-y-2">
          {alerts.length === 0 ? (
            <div className="text-sm text-slate-500">No alerts yet.</div>
          ) : (
            alerts.slice(0, 8).map((a) => (
              <div key={a.id} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <div className="text-xs text-slate-500">
                  {new Date(a.createdAt).toLocaleString()} • via {a.channel}
                </div>
                <div className="mt-1 text-sm font-medium text-slate-900">{a.message}</div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}

