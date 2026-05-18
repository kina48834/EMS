import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '@/system/hooks/useSession'
import type { GeoPoint, Incident, IncidentStatus, IncidentType } from '@/system/types'
import {
  createIncident,
  deleteIncident,
  listIncidentsForBarangay,
  listIncidentsForReporter,
  reverseGeocode,
} from '@/system/db'
import ResidentIncidentLocationPicker from '@/maps/resident/ResidentIncidentLocationPicker'
import { distanceKm } from '@/system/utils/distance'
import Button from '@/components/ui/Button'
import { Card, CardTitle } from '@/components/ui/Card'
import PageHeader from '@/components/ui/PageHeader'
import Alert from '@/components/ui/Alert'
import StatusBadge from '@/components/ui/StatusBadge'

export default function ResidentIncidentCreatePage() {
  const { user } = useSession()
  const navigate = useNavigate()

  const mapSectionRef = useRef<HTMLDivElement | null>(null)
  const [location, setLocation] = useState<GeoPoint | null>(null)

  const [geo, setGeo] = useState<GeoPoint | null>(null)
  const [geoError, setGeoError] = useState<string | null>(null)
  const radiusKm = 5

  const [barangayIncidents, setBarangayIncidents] = useState<Incident[]>([])
  const [myIncidents, setMyIncidents] = useState<Incident[]>([])
  const [busy, setBusy] = useState(false)
  const [tick, setTick] = useState(0)

  const [draftType, setDraftType] = useState<IncidentType>('crime')
  const [draftTitle, setDraftTitle] = useState('')
  const [draftDescription, setDraftDescription] = useState('')
  const [draftSaved, setDraftSaved] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.barangayId) return
    let cancelled = false
    ;(async () => {
      const next = await listIncidentsForBarangay(user.barangayId!)
      if (cancelled) return
      setBarangayIncidents(next)
    })()
    return () => {
      cancelled = true
    }
  }, [user?.barangayId, tick])

  useEffect(() => {
    if (!user?.barangayId) return
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported in this browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGeoError(null)
      },
      (err) => {
        setGeoError(err.message || 'Unable to fetch location.')
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }, [user?.barangayId])

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    ;(async () => {
      const next = await listIncidentsForReporter(user.id)
      if (cancelled) return
      setMyIncidents(next)
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id, tick])

  if (!user) return null

  // If the user edits draft info, require saving again before marking.
  useEffect(() => {
    setDraftSaved(false)
    setSubmitError(null)
  }, [draftType, draftTitle, draftDescription])

  const nearbyIncidents = useMemo(() => {
    if (!geo) return barangayIncidents
    return barangayIncidents.filter((i) => distanceKm(geo, i.location) <= radiusKm)
  }, [geo, barangayIncidents])

  const onMark = (p: GeoPoint) => {
    if (!draftSaved) return
    setLocation(p)
    if (busy) return
    if (!user.barangayId) return

    const barangayId = user.barangayId
    const reporterId = user.id
    if (!reporterId) return

    const title = draftTitle.trim()
    const description = draftDescription.trim()
    if (!title || !description) return

    setBusy(true)
    void (async () => {
      try {
        let locationName: string | undefined
        try {
          const name = await reverseGeocode(p.lat, p.lng)
          if (name) locationName = name
        } catch {
          /* place name is optional */
        }
        await createIncident({
          type: draftType,
          title,
          description,
          photoDataUrls: [],
          location: p,
          locationName,
          barangayId,
          reporterId,
          status: 'pending',
        })
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Failed to save mark.')
      } finally {
        setBusy(false)
        setTick((t) => t + 1)
      }
    })()
  }

  const canEdit = (i: Incident) => {
    return i.reporterId === user.id && (i.status === 'pending' || i.status === 'rejected')
  }

  const focusMarkedIncident = (i: Incident) => {
    setLocation(i.location)
    // Smoothly bring the map back into view.
    requestAnimationFrame(() => {
      mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  const canSaveInfo = Boolean(draftType && draftTitle.trim() && draftDescription.trim())

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <Button variant="secondary" onClick={() => navigate('/resident')}>
          Back
        </Button>
        <div className="text-xs text-slate-500">
          {geoError ? (
            <span className="text-red-700">{geoError}</span>
          ) : geo ? (
            <span>Nearby radius: {radiusKm} km</span>
          ) : (
            <span>Loading nearby incidents…</span>
          )}
        </div>
      </div>

      <div ref={mapSectionRef}>
        <ResidentIncidentLocationPicker
          value={location}
          onChange={onMark}
          incidents={nearbyIncidents}
          markEnabled={draftSaved}
          initialCenter={geo}
          heightClassName="h-96 sm:h-[32rem]"
        />
      </div>

      <Card>
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-sm font-semibold text-slate-900">My Marked Reports</div>
            <div className="mt-1 text-xs text-slate-500">Marks you saved from this page.</div>
          </div>
          <div className="text-xs text-slate-500">{myIncidents.length} items</div>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="min-w-[640px] w-full text-xs sm:text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {myIncidents.length === 0 ? (
                <tr>
                  <td className="py-6 text-center text-sm text-slate-500" colSpan={4}>
                    No marks yet. Mark on the map above.
                  </td>
                </tr>
              ) : (
                myIncidents.map((i) => (
                  <tr
                    key={i.id}
                    className="border-t cursor-pointer hover:bg-gray-50"
                    onClick={() => focusMarkedIncident(i)}
                  >
                    <td className="py-3 pr-4 text-slate-700 capitalize">{i.type}</td>
                    <td className="py-3 pr-4">
                      <div className="font-medium text-slate-900">{i.title}</div>
                      <div className="mt-1 text-xs text-slate-500">{new Date(i.createdAt).toLocaleString()}</div>
                    </td>
                    <td className="py-3 pr-4"><StatusBadge status={i.status} /></td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/resident/incidents/${i.id}`)
                          }}
                        >
                          Open
                        </Button>
                        {canEdit(i) ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/resident/incidents/${i.id}?edit=1`)
                            }}
                          >
                            Edit
                          </Button>
                        ) : null}
                        {canEdit(i) ? (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (!confirm('Delete this marked report?')) return
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">New Report Info</div>
            <div className="mt-1 text-xs text-slate-500">Save info first, then mark the location on the map.</div>
          </div>
          <div className="text-xs text-slate-500">{draftSaved ? 'Info saved. Map marking enabled.' : 'Info not saved yet.'}</div>
        </div>

        <div className="mt-4 space-y-4">
          <label className="block">
            <div className="mb-1 text-sm text-slate-700">Incident Type</div>
            <select className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-ems-600 focus:outline-none focus:ring-2 focus:ring-ems-600/25" value={draftType} onChange={(e) => setDraftType(e.target.value as IncidentType)}>
              <option value="crime">Crime</option>
              <option value="fire">Fire</option>
              <option value="accident">Accident</option>
              <option value="disaster">Disaster</option>
            </select>
          </label>

          <label className="block">
            <div className="mb-1 text-sm text-slate-700">Title</div>
            <input className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-ems-600 focus:outline-none focus:ring-2 focus:ring-ems-600/25" value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} />
          </label>

          <label className="block">
            <div className="mb-1 text-sm text-slate-700">Description</div>
            <textarea className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-ems-600 focus:outline-none focus:ring-2 focus:ring-ems-600/25" value={draftDescription} rows={4} onChange={(e) => setDraftDescription(e.target.value)} />
          </label>

          {submitError ? <Alert>{submitError}</Alert> : null}

          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <Button
              variant="primary"
              fullWidth
              disabled={!canSaveInfo || busy}
              onClick={() => {
                if (!canSaveInfo) return
                setDraftSaved(true)
                setSubmitError(null)
              }}
            >
              {busy ? 'Saving…' : 'Save info'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

