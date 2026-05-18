import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { emsColors } from '@/lib/theme'
import type { GeoPoint, Incident, IncidentStatus } from '@/system/types'
import { searchPlacesInPhilippines } from '@/system/db'

const DEFAULT_CENTER: GeoPoint = { lat: 12.8797, lng: 121.774 }
const DEFAULT_ZOOM = 10
/** Comfortable zoom when pinning — avoids forcing users to zoom in too far */
const PIN_ZOOM = 14
const MIN_ZOOM_TO_BOOST = 11

function gentlePanTo(map: L.Map, lat: number, lng: number) {
  const z = map.getZoom()
  const nextZoom = z < MIN_ZOOM_TO_BOOST ? PIN_ZOOM : z
  map.setView([lat, lng], nextZoom, { animate: false })
  map.invalidateSize()
}

function refreshTiles(map: L.Map, tileLayer: L.TileLayer | null) {
  map.invalidateSize(true)
  tileLayer?.redraw()
}

type Props = {
  incidents?: Incident[]
  selectedLocation?: GeoPoint | null
  selectedLocationLabel?: string | null
  /** When true, map clicks call onPick */
  pickEnabled?: boolean
  onPick?: (p: GeoPoint) => void
  onIncidentClick?: (incidentId: string) => void
  heightClassName?: string
  className?: string
  recenterOnSelected?: boolean
  /** Pan here when entering mark mode (e.g. device location) without over-zooming */
  focusPoint?: GeoPoint | null
  markingActive?: boolean
  /** Zoom/pan to show every incident marker (marks overview pages) */
  fitBoundsToIncidents?: boolean
  /** Thicker ring on the focused incident marker */
  highlightedIncidentId?: string | null
  showPlaceSearch?: boolean
  zoomControl?: boolean
  overlay?: ReactNode
}

function incidentTooltip(incident: Incident) {
  const place = incident.locationName ? `<br/><span style="opacity:0.85">${incident.locationName}</span>` : ''
  return `<strong>${incident.title}</strong><br/>${incident.status}${place}`
}

export default function ResidentIncidentMap({
  incidents = [],
  selectedLocation = null,
  selectedLocationLabel = null,
  pickEnabled = false,
  onPick,
  onIncidentClick,
  heightClassName = 'h-72 sm:h-96',
  className,
  recenterOnSelected = false,
  focusPoint = null,
  markingActive = false,
  fitBoundsToIncidents = false,
  highlightedIncidentId = null,
  showPlaceSearch = true,
  zoomControl = false,
  overlay,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)
  const layersGroupRef = useRef<L.LayerGroup | null>(null)
  const pickEnabledRef = useRef(pickEnabled)
  const onPickRef = useRef(onPick)

  const [placeQuery, setPlaceQuery] = useState('')
  const [placeResults, setPlaceResults] = useState<Array<{ lat: number; lng: number; name: string }>>([])
  const [placeOpen, setPlaceOpen] = useState(false)
  const [placeLoading, setPlaceLoading] = useState(false)
  const placeAbortRef = useRef<AbortController | null>(null)
  const placeDebounceRef = useRef<number | undefined>(undefined)

  pickEnabledRef.current = pickEnabled
  onPickRef.current = onPick

  const initialCenter = useMemo<GeoPoint>(() => {
    return (
      (selectedLocation && { ...selectedLocation }) ||
      (incidents[0]?.location && { ...incidents[0].location }) ||
      DEFAULT_CENTER
    )
  }, [incidents, selectedLocation])

  // Create map once — never tear down on center/prop changes (that causes blank tiles).
  useEffect(() => {
    const el = containerRef.current
    if (!el || mapRef.current) return

    const map = L.map(el, {
      center: [initialCenter.lat, initialCenter.lng],
      zoom: DEFAULT_ZOOM,
      zoomControl,
      attributionControl: true,
    })

    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    })
    tileLayer.addTo(map)

    const layersGroup = L.layerGroup().addTo(map)
    mapRef.current = map
    tileLayerRef.current = tileLayer
    layersGroupRef.current = layersGroup

    const t0 = window.setTimeout(() => refreshTiles(map, tileLayer), 0)
    const t1 = window.setTimeout(() => refreshTiles(map, tileLayer), 200)

    const onResize = () => refreshTiles(map, tileLayer)
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null
    ro?.observe(el)

    const handler = (e: L.LeafletMouseEvent) => {
      if (!pickEnabledRef.current) return
      onPickRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng })
    }
    map.on('click', handler)

    return () => {
      window.clearTimeout(t0)
      window.clearTimeout(t1)
      ro?.disconnect()
      map.off('click', handler)
      map.remove()
      mapRef.current = null
      tileLayerRef.current = null
      layersGroupRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once
  }, [])

  // Cursor while marking (avoid Tailwind selectors on .leaflet-container — can break tiles in some builds).
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const container = map.getContainer()
    container.style.cursor = markingActive ? 'crosshair' : ''
    return () => {
      container.style.cursor = ''
    }
  }, [markingActive])

  // Refresh tiles when layout may shift (e.g. Cancel button appears).
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const id = window.setTimeout(() => refreshTiles(map, tileLayerRef.current), 50)
    return () => window.clearTimeout(id)
  }, [markingActive, heightClassName])

  useEffect(() => {
    return () => {
      placeAbortRef.current?.abort()
      if (placeDebounceRef.current) window.clearTimeout(placeDebounceRef.current)
    }
  }, [])

  const searchPlaces = async (q: string) => {
    const query = q.trim()
    if (query.length < 2) {
      setPlaceResults([])
      setPlaceOpen(false)
      return
    }

    placeAbortRef.current?.abort()
    const ac = new AbortController()
    placeAbortRef.current = ac

    setPlaceLoading(true)
    try {
      const results = await searchPlacesInPhilippines(query)
      if (ac.signal.aborted) return
      setPlaceResults(results)
      setPlaceOpen(true)
    } catch {
      if (ac.signal.aborted) return
      setPlaceResults([])
      setPlaceOpen(true)
    } finally {
      if (ac.signal.aborted) return
      setPlaceLoading(false)
    }
  }

  const pickPlace = useCallback(
    (p: { lat: number; lng: number; name: string }) => {
      const map = mapRef.current
      if (map) gentlePanTo(map, p.lat, p.lng)
      if (pickEnabledRef.current) {
        onPickRef.current?.({ lat: p.lat, lng: p.lng })
      }
      setPlaceOpen(false)
    },
    [],
  )

  useEffect(() => {
    const group = layersGroupRef.current
    if (!group) return

    group.clearLayers()

    for (const incident of incidents) {
      const color = statusToColor(incident.status)
      const highlighted = highlightedIncidentId === incident.id
      const circle = L.circleMarker([incident.location.lat, incident.location.lng], {
        radius: highlighted ? 10 : 7,
        weight: highlighted ? 3 : 2,
        color: color,
        fillColor: color,
        fillOpacity: 0.85,
      })

      circle.on('click', () => {
        onIncidentClick?.(incident.id)
      })

      circle.bindTooltip(incidentTooltip(incident), { direction: 'top' })
      circle.addTo(group)
    }

    if (selectedLocation) {
      const marker = L.marker([selectedLocation.lat, selectedLocation.lng], {
        icon: crosshairIcon('#ef4444'),
        interactive: false,
      })
      if (selectedLocationLabel) {
        marker.bindTooltip(selectedLocationLabel, { direction: 'top' })
      }
      marker.addTo(group)
    }
  }, [incidents, selectedLocation, selectedLocationLabel, onIncidentClick, highlightedIncidentId])

  const incidentsBoundsKey = useMemo(
    () => incidents.map((i) => i.id).join(','),
    [incidents],
  )

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (!fitBoundsToIncidents) return
    if (incidents.length === 0) return
    if (recenterOnSelected && selectedLocation) return

    const bounds = L.latLngBounds(incidents.map((i) => [i.location.lat, i.location.lng] as [number, number]))
    if (!bounds.isValid()) return
    map.fitBounds(bounds.pad(0.12), { animate: false, maxZoom: 15 })
    const id = window.setTimeout(() => refreshTiles(map, tileLayerRef.current), 100)
    return () => window.clearTimeout(id)
  }, [fitBoundsToIncidents, incidentsBoundsKey, recenterOnSelected, selectedLocation?.lat, selectedLocation?.lng])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (!recenterOnSelected || !selectedLocation) return
    if (markingActive) return
    gentlePanTo(map, selectedLocation.lat, selectedLocation.lng)
    const id = window.setTimeout(() => refreshTiles(map, tileLayerRef.current), 100)
    return () => window.clearTimeout(id)
  }, [recenterOnSelected, selectedLocation?.lat, selectedLocation?.lng, markingActive])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !focusPoint) return
    gentlePanTo(map, focusPoint.lat, focusPoint.lng)
    const id = window.setTimeout(() => refreshTiles(map, tileLayerRef.current), 100)
    return () => window.clearTimeout(id)
  }, [focusPoint?.lat, focusPoint?.lng])

  return (
    <div
      className={`relative w-full ${className ?? ''}`}
      style={{
        borderRadius: 8,
        overflow: 'hidden',
        border: '1px solid rgba(229, 231, 235, 1)',
      }}
    >
      <div ref={containerRef} className={`w-full ${heightClassName}`} style={{ minHeight: 240 }} />
      {showPlaceSearch ? (
      <div className="pointer-events-none absolute left-3 top-3 z-[1000] w-[270px] max-w-[70%]">
        <div className="pointer-events-auto rounded-2xl border border-slate-200/80 bg-white shadow-lg shadow-slate-200/40">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void searchPlaces(placeQuery)
            }}
            className="flex items-center gap-1 p-2"
          >
            <input
              className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-ems-200"
              placeholder="Search places (PH)"
              value={placeQuery}
              onChange={(e) => {
                const next = e.target.value
                setPlaceQuery(next)
                if (placeDebounceRef.current) window.clearTimeout(placeDebounceRef.current)
                placeDebounceRef.current = window.setTimeout(() => {
                  void searchPlaces(next)
                }, 400)
              }}
            />
          </form>

          {placeOpen ? (
            <div className="max-h-60 overflow-auto border-t" onMouseDown={(e) => e.stopPropagation()}>
              {placeLoading ? <div className="p-2 text-xs text-gray-600">Searching...</div> : null}
              {!placeLoading && placeResults.length === 0 ? (
                <div className="p-2 text-xs text-gray-600">No results</div>
              ) : null}
              {!placeLoading
                ? placeResults.map((r) => (
                    <button
                      key={`${r.lat}:${r.lng}:${r.name}`}
                      type="button"
                      className="block w-full p-2 text-left text-xs hover:bg-gray-50"
                      onClick={() => pickPlace(r)}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      {r.name.length > 70 ? `${r.name.slice(0, 70)}...` : r.name}
                    </button>
                  ))
                : null}
            </div>
          ) : null}
        </div>
      </div>
      ) : null}
      {overlay ? <div className="pointer-events-none absolute inset-0">{overlay}</div> : null}
    </div>
  )
}

function statusToColor(status: IncidentStatus) {
  switch (status) {
    case 'pending':
      return emsColors.mapPending
    case 'approved':
      return emsColors.mapApproved
    case 'rejected':
      return emsColors.mapRejected
    case 'resolved':
      return emsColors.mapResolved
    default:
      return emsColors.mapApproved
  }
}

function crosshairIcon(colorHex: string) {
  const html = `
    <div style="
      width:26px;height:26px;position:relative;border-radius:999px;
      background:${colorHex}22;">
      <div style="
        position:absolute;left:50%;top:0;bottom:0;width:2px;background:${colorHex};
        transform:translateX(-50%);"></div>
      <div style="
        position:absolute;top:50%;left:0;right:0;height:2px;background:${colorHex};
        transform:translateY(-50%);"></div>
      <div style="
        position:absolute;left:50%;top:50%;width:8px;height:8px;border-radius:999px;
        background:${colorHex};transform:translate(-50%,-50%);"></div>
    </div>
  `
  return L.divIcon({
    html,
    className: '',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  })
}
