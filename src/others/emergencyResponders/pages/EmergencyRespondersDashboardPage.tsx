import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '@/system/hooks/useSession'
import type { Incident, Response } from '@/system/types'
import { getResponse, listIncidentsForResponder } from '@/system/db'
import EmergencyRespondersIncidentMarksMap from '@/maps/emergencyResponders/EmergencyRespondersIncidentMarksMap'
import Button from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import PageHeader from '@/components/ui/PageHeader'
import ResponseStatusBadge from '@/components/ui/ResponseStatusBadge'
import TypeBadge from '@/components/ui/TypeBadge'

export default function EmergencyRespondersDashboardPage() {
  const { user } = useSession()
  const navigate = useNavigate()
  const [tick, setTick] = useState(0)
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [myResponses, setMyResponses] = useState<Record<string, Response | undefined>>({})

  useEffect(() => {
    if (!user?.barangayId) return
    const barangayId = user.barangayId
    let cancelled = false
    ;(async () => {
      const next = await listIncidentsForResponder(barangayId)
      if (cancelled) return
      setIncidents(next)
    })()
    return () => {
      cancelled = true
    }
  }, [user?.barangayId, tick])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      const entries = await Promise.all(
        incidents.map(async (i) => {
          const r = await getResponse(user.id, i.id)
          return [i.id, r] as const
        }),
      )
      if (cancelled) return
      const next: Record<string, Response | undefined> = {}
      for (const [incidentId, r] of entries) next[incidentId] = r
      setMyResponses(next)
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id, incidents, tick])

  if (!user) return null
  if (!user.barangayId || !user.responderKind) {
    return <div className="py-10 text-center text-sm text-slate-600">Responder account missing barangay or type.</div>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Emergency responder queue"
        description="Receive approved incident notifications and update your response status."
      />

      <Card>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle>Approved incident marks</CardTitle>
            <div className="mt-1 text-xs text-slate-500">Click a marker to open the incident.</div>
          </div>
          <div className="text-xs text-slate-500">{incidents.length} items</div>
        </div>
        <div className="mt-3">
          <EmergencyRespondersIncidentMarksMap
            incidents={incidents}
            onIncidentClick={(incidentId) => navigate(`/emergency-responders/incidents/${incidentId}`)}
            heightClassName="h-72 sm:h-96"
          />
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>Approved incidents</CardTitle>
          <div className="text-xs text-slate-500">{incidents.length} items</div>
        </div>

        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-100">
          <table className="ems-table min-w-[640px]">
            <thead>
              <tr>
                <th>Type</th>
                <th>Incident</th>
                <th>Your response</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {incidents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-sm text-slate-500">
                    No approved incidents in your barangay.
                  </td>
                </tr>
              ) : (
                incidents.map((i) => {
                  const my = myResponses[i.id]
                  return (
                    <tr key={i.id}>
                      <td>
                        <TypeBadge type={i.type} />
                      </td>
                      <td>
                        <div className="font-medium text-slate-900">{i.title}</div>
                        <div className="mt-1 text-xs text-slate-500">{i.description}</div>
                      </td>
                      <td>
                        {my ? (
                          <ResponseStatusBadge status={my.status} />
                        ) : (
                          <span className="text-xs text-slate-500">Not started</span>
                        )}
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="secondary" onClick={() => navigate(`/emergency-responders/incidents/${i.id}`)}>
                            Open
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setTick((t) => t + 1)}>
                            Refresh
                          </Button>
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
