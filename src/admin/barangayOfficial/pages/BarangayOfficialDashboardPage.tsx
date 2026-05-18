import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '@/system/hooks/useSession'
import type { Incident, IncidentStatus, IncidentType } from '@/system/types'
import { createAlert, listIncidentsForBarangay, updateIncident } from '@/system/db'
import BarangayOfficialIncidentMarksMap from '@/maps/barangayOfficial/BarangayOfficialIncidentMarksMap'
import Button from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import StatusBadge from '@/components/ui/StatusBadge'
import TypeBadge from '@/components/ui/TypeBadge'

export default function BarangayOfficialDashboardPage() {
  const { user } = useSession()
  const navigate = useNavigate()
  const [tick, setTick] = useState(0)

  const barangayId = user?.barangayId
  const [incidents, setIncidents] = useState<Incident[]>([])

  useEffect(() => {
    if (!barangayId) return
    let cancelled = false
    ;(async () => {
      const next = await listIncidentsForBarangay(barangayId)
      if (cancelled) return
      setIncidents(next)
    })()
    return () => {
      cancelled = true
    }
  }, [barangayId, tick])

  const analytics = useMemo(() => {
    const byStatus: Record<IncidentStatus, number> = { pending: 0, approved: 0, rejected: 0, resolved: 0 }
    const byType: Record<IncidentType, number> = { crime: 0, fire: 0, accident: 0, disaster: 0 }
    for (const i of incidents) {
      byStatus[i.status]++
      byType[i.type]++
    }
    return { byStatus, byType }
  }, [incidents])

  if (!user) return null

  if (!barangayId) {
    return <div className="py-10 text-center text-sm text-slate-600">Barangay not assigned.</div>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Barangay official center"
        description="Review incoming reports, approve or reject, and coordinate alerts."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending" value={analytics.byStatus.pending} />
        <StatCard label="Approved" value={analytics.byStatus.approved} />
        <StatCard label="Rejected" value={analytics.byStatus.rejected} />
        <StatCard label="Resolved" value={analytics.byStatus.resolved} />
      </div>

      <Card>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle>Incident marks (barangay)</CardTitle>
            <div className="mt-1 text-xs text-slate-500">Click a marker to open the report.</div>
          </div>
          <div className="text-xs text-slate-500">{incidents.length} items</div>
        </div>
        <div className="mt-3">
          <BarangayOfficialIncidentMarksMap
            incidents={incidents}
            onIncidentClick={(incidentId) => navigate(`/barangay-official/incidents/${incidentId}`)}
            heightClassName="h-72 sm:h-96"
          />
        </div>
      </Card>

      <Card>
        <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div>
            <CardTitle>Reports in your barangay</CardTitle>
            <div className="mt-1 text-xs text-slate-500">Total: {incidents.length}</div>
          </div>
          <div className="hidden text-xs text-slate-500 lg:block">
            Type analytics: crime {analytics.byType.crime} · fire {analytics.byType.fire} · accident{' '}
            {analytics.byType.accident} · disaster {analytics.byType.disaster}
          </div>
        </div>

        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-100">
          <table className="ems-table min-w-[640px]">
            <thead>
              <tr>
                <th>Type</th>
                <th>Title</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {incidents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-sm text-slate-500">
                    No reports yet.
                  </td>
                </tr>
              ) : (
                incidents.map((i) => (
                  <tr key={i.id}>
                    <td>
                      <TypeBadge type={i.type} />
                    </td>
                    <td>
                      <div className="font-medium text-slate-900">{i.title}</div>
                      <div className="mt-1 text-xs text-slate-500">{i.description}</div>
                    </td>
                    <td>
                      <StatusBadge status={i.status} />
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" onClick={() => navigate(`/barangay-official/incidents/${i.id}`)}>
                          Open
                        </Button>
                        {i.status === 'pending' ? (
                          <>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => {
                                void (async () => {
                                  await updateIncident(i.id, { status: 'approved' })
                                  await createAlert({
                                    barangayId,
                                    incidentId: i.id,
                                    message: `Approved: ${i.title}`,
                                    channel: 'internet',
                                  })
                                  setTick((t) => t + 1)
                                })()
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => {
                                void (async () => {
                                  await updateIncident(i.id, { status: 'rejected' })
                                  setTick((t) => t + 1)
                                })()
                              }}
                            >
                              Reject
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
