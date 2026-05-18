import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '@/system/hooks/useSession'
import type { ID, Incident, IncidentStatus, Role, User } from '@/system/types'
import { listIncidentsForBarangay, listUsersByRole } from '@/system/db'
import EmergencyRespondersIncidentMarksMap from '@/maps/emergencyResponders/EmergencyRespondersIncidentMarksMap'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import PageHeader from '@/components/ui/PageHeader'
import StatusBadge from '@/components/ui/StatusBadge'
import { emsColors } from '@/lib/theme'

const STATUS_OPTIONS: Array<{ value: IncidentStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'resolved', label: 'Resolved' },
]

function MapLegend() {
  const items: Array<{ color: string; label: string }> = [
    { color: '#f59e0b', label: 'Pending' },
    { color: emsColors.mapApproved, label: 'Approved' },
    { color: emsColors.mapRejected, label: 'Rejected' },
    { color: emsColors.mapResolved, label: 'Resolved' },
  ]
  return (
    <div className="pointer-events-none absolute bottom-3 right-3 z-[1000] rounded-xl border border-slate-200/80 bg-white/95 px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 font-semibold text-slate-700">Legend</div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {items.map((item) => (
          <span key={item.label} className="inline-flex items-center gap-1.5 text-slate-600">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function EmergencyRespondersIncidentMarksPage() {
  const { user } = useSession()
  const navigate = useNavigate()
  const barangayId = user?.barangayId

  const [incidents, setIncidents] = useState<Incident[]>([])
  const [residents, setResidents] = useState<User[]>([])
  const [selectedReporterId, setSelectedReporterId] = useState<ID | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'all'>('all')
  const [focusedIncidentId, setFocusedIncidentId] = useState<ID | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!barangayId) return
    let cancelled = false
    ;(async () => {
      const [nextIncidents, nextResidents] = await Promise.all([
        listIncidentsForBarangay(barangayId),
        listUsersByRole('resident' as Role),
      ])
      if (cancelled) return
      setIncidents(nextIncidents)
      setResidents(nextResidents.filter((r) => r.barangayId === barangayId))
    })()
    return () => {
      cancelled = true
    }
  }, [barangayId, tick])

  const filteredIncidents = useMemo(() => {
    let list = incidents
    if (selectedReporterId !== 'all') {
      list = list.filter((i) => i.reporterId === selectedReporterId)
    }
    if (statusFilter !== 'all') {
      list = list.filter((i) => i.status === statusFilter)
    }
    return list
  }, [incidents, selectedReporterId, statusFilter])

  const focusedIncident = useMemo(() => {
    if (!focusedIncidentId) return null
    return filteredIncidents.find((i) => i.id === focusedIncidentId) ?? null
  }, [filteredIncidents, focusedIncidentId])

  const residentById = useMemo(() => {
    const m = new Map<string, User>()
    for (const r of residents) m.set(r.id, r)
    return m
  }, [residents])

  useEffect(() => {
    if (!focusedIncidentId) return
    const stillVisible = filteredIncidents.some((i) => i.id === focusedIncidentId)
    if (!stillVisible) setFocusedIncidentId(null)
  }, [filteredIncidents, focusedIncidentId])

  if (!user) return null
  if (!barangayId) {
    return <div className="py-10 text-center text-sm text-slate-600">Responder barangay missing.</div>
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Resident marks map"
        description="All incident pins reported by residents in your barangay. Click a marker or table row to focus."
      />

      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <Button variant="secondary" onClick={() => navigate('/emergency-responders')} type="button">
          Back
        </Button>
        <Button variant="primary" onClick={() => setTick((t) => t + 1)}>
          Refresh
        </Button>
      </div>

      <Card>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">Map — all resident marks</div>
            <div className="mt-1 text-xs text-slate-500">
              {filteredIncidents.length} mark{filteredIncidents.length === 1 ? '' : 's'} shown
              {filteredIncidents.length === 0 ? ' — run demo_accounts.sql if empty' : ''}
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap lg:w-auto">
            <label className="w-full sm:w-56">
              <div className="mb-1 text-xs text-slate-700">Resident</div>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-ems-600 focus:outline-none focus:ring-2 focus:ring-ems-600/25"
                value={selectedReporterId}
                onChange={(e) => {
                  setSelectedReporterId(e.target.value === 'all' ? 'all' : (e.target.value as ID))
                  setFocusedIncidentId(null)
                }}
              >
                <option value="all">All residents</option>
                {residents.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.email})
                  </option>
                ))}
              </select>
            </label>
            <label className="w-full sm:w-44">
              <div className="mb-1 text-xs text-slate-700">Status</div>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-ems-600 focus:outline-none focus:ring-2 focus:ring-ems-600/25"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as IncidentStatus | 'all')
                  setFocusedIncidentId(null)
                }}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="relative mt-4">
          <EmergencyRespondersIncidentMarksMap
            incidents={filteredIncidents}
            heightClassName="h-96 sm:h-[32rem]"
            selectedLocation={focusedIncident ? focusedIncident.location : null}
            selectedLocationLabel={
              focusedIncident
                ? focusedIncident.locationName ?? focusedIncident.title
                : null
            }
            recenterOnSelected={Boolean(focusedIncident)}
            highlightedIncidentId={focusedIncidentId}
            onIncidentClick={(incidentId) => setFocusedIncidentId(incidentId)}
          />
          <MapLegend />
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-sm font-semibold text-slate-900">Marks table</div>
            <div className="mt-1 text-xs text-slate-500">Click a row to highlight on the map.</div>
          </div>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="min-w-[720px] w-full text-xs sm:text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="py-2 pr-4">Resident</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Location</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td className="py-6 text-center text-sm text-slate-500" colSpan={6}>
                    No resident marks found for this filter.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((i) => {
                  const r = residentById.get(i.reporterId)
                  const focused = focusedIncidentId === i.id
                  return (
                    <tr
                      key={i.id}
                      className={`border-t cursor-pointer hover:bg-slate-50 ${focused ? 'bg-ems-50/60' : ''}`}
                      onClick={() => setFocusedIncidentId(i.id)}
                    >
                      <td className="py-3 pr-4">
                        <div className="font-medium text-slate-900">{r ? r.name : i.reporterId}</div>
                        <div className="mt-1 text-xs text-slate-500">{r ? r.email : ''}</div>
                      </td>
                      <td className="py-3 pr-4 text-slate-700 capitalize">{i.type}</td>
                      <td className="py-3 pr-4">
                        <div className="font-medium text-slate-900">{i.title}</div>
                        <div className="mt-1 text-xs text-slate-500">{new Date(i.createdAt).toLocaleString()}</div>
                      </td>
                      <td className="py-3 pr-4 max-w-[200px]">
                        <div className="text-xs text-slate-700 line-clamp-2">
                          {i.locationName ?? `${i.location.lat.toFixed(5)}, ${i.location.lng.toFixed(5)}`}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={i.status} />
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation()
                              setFocusedIncidentId(i.id)
                            }}
                          >
                            On map
                          </Button>
                          {i.status === 'approved' ? (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate(`/emergency-responders/incidents/${i.id}`)
                              }}
                            >
                              Respond
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
    </div>
  )
}
