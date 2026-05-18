import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import L from '@/lib/leafletRuntime'

import { emsColors } from '@/lib/theme'
import type { GeoPoint, Incident, IncidentStatus } from '@/system/types'

const DEFAULT_CENTER: GeoPoint = { lat: 12.8797, lng: 121.774 }
const DEFAULT_ZOOM = 10

function statusToColor(status: IncidentStatus) {
  switch (status) {
    case 'pending':
      return '#f59e0b' // amber
    case 'approved':
      return emsColors.mapApproved
    case 'rejected':
      return '#ef4444' // red
    case 'resolved':
      return emsColors.mapResolved
    default: {
      return emsColors.mapApproved
    }
  }
}

function crosshairIcon(colorHex: string) {
  // Leaflet divIcon anchor uses `iconAnchor` (in pixels).
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

type Props = {
  incidents?: Incident[]
  selectedLocation?: GeoPoint | null
  selectedLocationLabel?: string | null
  onSelectLocation?: (p: GeoPoint) => void
  onIncidentClick?: (incidentId: string) => void
  heightClassName?: string
  className?: string
  recenterOnSelected?: boolean
  overlay?: ReactNode
}

export default function IncidentMap({
  incidents = [],
  selectedLocation = null,
  selectedLocationLabel = null,
  onSelectLocation,
  onIncidentClick,
  heightClassName = 'h-72 sm:h-96',
  className,
  recenterOnSelected = false,
  overlay,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layersGroupRef = useRef<L.LayerGroup | null>(null)

  const initialCenter = useMemo<GeoPoint>(() => {
    return (
      (selectedLocation && { ...selectedLocation }) ||
      (incidents[0]?.location && { ...incidents[0].location }) ||
      DEFAULT_CENTER
    )
  }, [incidents, selectedLocation])

  useEffect(() => {
    if (!containerRef.current) return
    if (mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [initialCenter.lat, initialCenter.lng],
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
      attributionControl: true,
    })

    const layersGroup = L.layerGroup().addTo(map)
    mapRef.current = map
    layersGroupRef.current = layersGroup

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    // Ensure Leaflet sizes correctly after the first paint.
    setTimeout(() => map.invalidateSize(), 0)

    return () => {
      map.remove()
      mapRef.current = null
      layersGroupRef.current = null
    }
  }, [initialCenter.lat, initialCenter.lng])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (!onSelectLocation) return

    const handler = (e: L.LeafletMouseEvent) => {
      onSelectLocation({ lat: e.latlng.lat, lng: e.latlng.lng })
    }
    map.on('click', handler)
    return () => {
      map.off('click', handler)
    }
  }, [onSelectLocation])

  useEffect(() => {
    const group = layersGroupRef.current
    if (!group) return

    group.clearLayers()

    for (const incident of incidents) {
      const color = statusToColor(incident.status)
      const circle = L.circleMarker([incident.location.lat, incident.location.lng], {
        radius: 7,
        weight: 2,
        color: color,
        fillColor: color,
        fillOpacity: 0.85,
      })

      circle.on('click', () => {
        onIncidentClick?.(incident.id)
      })

      circle.bindTooltip(`${incident.title}`, { direction: 'top' })
      circle.addTo(group)
    }

    if (selectedLocation) {
      const marker = L.marker([selectedLocation.lat, selectedLocation.lng], {
        icon: crosshairIcon('#ef4444'),
        interactive: false, // selection is set by clicking the map, not by clicking the marker
      })
      if (selectedLocationLabel) {
        marker.bindTooltip(selectedLocationLabel, { direction: 'top' })
      }
      marker.addTo(group)
    }
  }, [incidents, selectedLocation, onIncidentClick])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (!recenterOnSelected) return
    if (!selectedLocation) return

    // Zoom a bit closer when selecting.
    map.setView([selectedLocation.lat, selectedLocation.lng], Math.max(map.getZoom(), 15), { animate: true })
  }, [recenterOnSelected, selectedLocation?.lat, selectedLocation?.lng])

  return (
    <div
      className={`relative w-full ${className ?? ''}`}
      style={{
        borderRadius: 8,
        overflow: 'hidden',
        border: '1px solid rgba(229, 231, 235, 1)', // tailwind gray-200-ish
      }}
    >
      <div ref={containerRef} className={`w-full ${heightClassName}`} />
      {overlay ? <div className="pointer-events-none absolute inset-0">{overlay}</div> : null}
    </div>
  )
}

