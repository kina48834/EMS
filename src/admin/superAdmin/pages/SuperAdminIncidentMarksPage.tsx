import { useEffect, useMemo, useState } from 'react'
import { useSession } from '@/system/hooks/useSession'
import type { ID, Incident, IncidentStatus, Role, User } from '@/system/types'
import { listIncidents, listUsersByRole } from '@/system/db'
import SuperAdminIncidentMarksMap from '@/maps/superAdmin/SuperAdminIncidentMarksMap'
import Button from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import PageHeader from '@/components/ui/PageHeader'
import StatusBadge from '@/components/ui/StatusBadge'

export default function SuperAdminIncidentMarksPage() {
  const { user } = useSession()

  const [incidents, setIncidents] = useState<Incident[]>([])
  const [residents, setResidents] = useState<User[]>([])
  const [selectedReporterId, setSelectedReporterId] = useState<ID | 'all'>('all')
  const [focusedIncidentId, setFocusedIncidentId] = useState<ID | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      const [nextIncidents, nextResidents] = await Promise.all([listIncidents(), listUsersByRole('resident' as Role)])
      if (cancelled) return
      setIncidents(nextIncidents)
      setResidents(nextResidents)
    })()
    return () => {
      cancelled = true
    }
  }, [user, tick])

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

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="text-sm font-semibold">Resident Marks (All Barangays)</div>
        <Button variant="primary" onClick={() => setTick((t) => t + 1)}>
          Refresh
        </Button>
      </div>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">Filter by Resident</div>
            <div className="mt-1 text-xs text-slate-500">Select a resident account to view their marks on the map.</div>
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
          <SuperAdminIncidentMarksMap
            incidents={filteredIncidents}
            heightClassName="h-96 sm:h-[32rem]"
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
                <th className="py-2 pr-4">Barangay</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Status</th>
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
                      <td className="py-3 pr-4">{i.barangayId ?? ''}</td>
                      <td className="py-3 pr-4 text-slate-700 capitalize">{i.type}</td>
                      <td className="py-3 pr-4">
                        <div className="font-medium text-slate-900">{i.title}</div>
                        <div className="mt-1 text-xs text-slate-500">{new Date(i.createdAt).toLocaleString()}</div>
                      </td>
                      <td className="py-3 pr-4"><StatusBadge status={i.status} /></td>
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

