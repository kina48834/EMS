import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '@/system/hooks/useSession'
import type { ID, Incident, IncidentStatus, Role, User } from '@/system/types'
import { listIncidentsForBarangay, listUsersByRole } from '@/system/db'
import BarangayOfficialIncidentMarksMap from '@/maps/barangayOfficial/BarangayOfficialIncidentMarksMap'
import Button from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import PageHeader from '@/components/ui/PageHeader'
import StatusBadge from '@/components/ui/StatusBadge'

export default function BarangayOfficialIncidentMarksPage() {
  const { user } = useSession()
  const navigate = useNavigate()
  const barangayId = user?.barangayId

  const [incidents, setIncidents] = useState<Incident[]>([])
  const [residents, setResidents] = useState<User[]>([])
  const [selectedReporterId, setSelectedReporterId] = useState<ID | 'all'>('all')
  const [focusedIncidentId, setFocusedIncidentId] = useState<ID | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!barangayId) return
    let cancelled = false
    ;(async () => {
      const [nextIncidents, nextResidents] = await Promise.all([listIncidentsForBarangay(barangayId), listUsersByRole('resident' as Role)])
      if (cancelled) return
      setIncidents(nextIncidents)
      setResidents(nextResidents.filter((r) => r.barangayId === barangayId))
    })()
    return () => {
      cancelled = true
    }
  }, [barangayId, tick])

  const filteredIncidents = useMemo(() => {
    if (selectedReporterId === 'all') return incidents
    return incidents.filter((i) => i.reporterId === selectedReporterId)
  }, [incidents, selectedReporterId])

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
  if (!barangayId) return <div className="py-10 text-center text-sm text-slate-600">Barangay not assigned.</div>

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <Button variant="secondary" onClick={() => navigate('/barangay-official')} type="button">
          Back
        </Button>
        <Button variant="primary" onClick={() => setTick((t) => t + 1)}>
          Refresh
        </Button>
      </div>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">Resident Marks (Barangay)</div>
            <div className="mt-1 text-xs text-slate-500">Filter by resident account, then view their marks on the map.</div>
          </div>

          <label className="w-full sm:w-64">
            <div className="mb-1 text-xs text-slate-700">Resident</div>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-ems-600 focus:outline-none focus:ring-2 focus:ring-ems-600/25"
              value={selectedReporterId}
              onChange={(e) => setSelectedReporterId(e.target.value === 'all' ? 'all' : (e.target.value as ID))}
            >
              <option value="all">All Residents</option>
              {residents.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.email})
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4">
          <BarangayOfficialIncidentMarksMap
            incidents={filteredIncidents}
            heightClassName="h-96 sm:h-[32rem]"
            onIncidentClick={(incidentId) => navigate(`/barangay-official/incidents/${incidentId}`)}
            selectedLocation={focusedIncident ? focusedIncident.location : null}
            selectedLocationLabel={focusedIncident ? focusedIncident.title : null}
            recenterOnSelected={Boolean(focusedIncident)}
          />
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-sm font-semibold text-slate-900">Marks Table</div>
            <div className="mt-1 text-xs text-slate-500">{filteredIncidents.length} items</div>
          </div>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="min-w-[640px] w-full text-xs sm:text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="py-2 pr-4">Resident</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td className="py-6 text-center text-sm text-slate-500" colSpan={5}>
                    No resident marks found.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((i) => {
                  const r = residentById.get(i.reporterId)
                  return (
                    <tr
                      key={i.id}
                      className="border-t cursor-pointer hover:bg-gray-50"
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
                      <td className="py-3 pr-4"><StatusBadge status={i.status} /></td>
                      <td className="py-3 pr-4">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation()
                            setFocusedIncidentId(i.id)
                            navigate(`/barangay-official/incidents/${i.id}`)
                          }}
                        >
                          Open
                        </Button>
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

