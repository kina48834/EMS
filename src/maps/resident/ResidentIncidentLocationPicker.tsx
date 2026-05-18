import { useEffect, useState } from 'react'
import type { GeoPoint, Incident } from '@/system/types'
import ResidentIncidentMap from './ResidentIncidentMap'
import { reverseGeocode } from '@/system/db'
import Button from '@/components/ui/Button'

function formatCoord(n: number) {
  return n.toFixed(6)
}

type Props = {
  value: GeoPoint | null
  onChange: (p: GeoPoint) => void
  incidents?: Incident[]
  markEnabled?: boolean
  /** Device or barangay center — map pans here when entering mark mode */
  initialCenter?: GeoPoint | null
  heightClassName?: string
}

export default function ResidentIncidentLocationPicker({
  value,
  onChange,
  incidents = [],
  markEnabled = true,
  initialCenter = null,
  heightClassName = 'h-56 sm:h-72',
}: Props) {
  const [placeName, setPlaceName] = useState<string | null>(null)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [markMode, setMarkMode] = useState(false)
  const [resolvingName, setResolvingName] = useState(false)
  const [mapFocus, setMapFocus] = useState<GeoPoint | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!value) {
      setPlaceName(null)
      setGeoError(null)
      setResolvingName(false)
      return
    }

    setResolvingName(true)
    ;(async () => {
      try {
        setGeoError(null)
        const name = await reverseGeocode(value.lat, value.lng)
        if (cancelled) return
        setPlaceName(name ?? null)
      } catch (err) {
        if (cancelled) return
        setPlaceName(null)
        setGeoError(err instanceof Error ? err.message : 'Could not look up this place name.')
      } finally {
        if (!cancelled) setResolvingName(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [value?.lat, value?.lng])

  const startMarkMode = () => {
    if (!markEnabled) return
    setGeoError(null)
    setMarkMode(true)
    if (initialCenter) setMapFocus({ ...initialCenter })
    else if (value) setMapFocus({ ...value })
  }

  return (
    <div>
      <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm">
        {value ? (
          <div className="space-y-1">
            <div className="font-medium text-slate-900">
              {resolvingName ? 'Looking up place name…' : placeName ?? 'Pinned location'}
            </div>
            <div className="font-mono text-xs text-slate-600">
              {formatCoord(value.lat)}, {formatCoord(value.lng)}
            </div>
          </div>
        ) : markMode ? (
          <p className="text-slate-700">Tap anywhere on the map to drop your pin.</p>
        ) : !markEnabled ? (
          <p className="text-slate-600">Save the report info below, then mark your location on the map.</p>
        ) : (
          <p className="text-slate-600">
            Press <span className="font-medium">Mark location</span>, then tap the map.
          </p>
        )}
      </div>

      {geoError ? <div className="mt-2 text-xs text-red-700">{geoError}</div> : null}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={markMode ? 'secondary' : 'primary'}
          onClick={startMarkMode}
          disabled={!markEnabled || markMode}
        >
          Mark location
        </Button>
        {markMode ? (
          <Button size="sm" variant="ghost" onClick={() => setMarkMode(false)}>
            Cancel
          </Button>
        ) : null}
        <p className="text-[11px] text-slate-500">
          {markMode
            ? 'Tap the map once — no need to zoom in close.'
            : markEnabled
              ? 'Enables one tap on the map to pin and save.'
              : 'Save report info first.'}
        </p>
      </div>

      <div className="mt-3">
        <ResidentIncidentMap
          incidents={incidents}
          selectedLocation={value}
          selectedLocationLabel={placeName}
          pickEnabled={markMode}
          onPick={(p) => {
            onChange(p)
            setMarkMode(false)
            setMapFocus({ ...p })
            setGeoError(null)
          }}
          recenterOnSelected
          focusPoint={mapFocus}
          markingActive={markMode}
          heightClassName={heightClassName}
        />
      </div>
    </div>
  )
}
