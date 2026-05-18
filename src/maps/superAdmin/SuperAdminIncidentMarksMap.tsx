import type { GeoPoint, Incident } from '@/system/types'
import ResidentIncidentMap from '../resident/ResidentIncidentMap'

type Props = {
  incidents: Incident[]
  heightClassName?: string
  onIncidentClick?: (incidentId: string) => void
  selectedLocation?: GeoPoint | null
  selectedLocationLabel?: string | null
  recenterOnSelected?: boolean
  highlightedIncidentId?: string | null
}

export default function SuperAdminIncidentMarksMap({
  incidents,
  onIncidentClick,
  heightClassName = 'h-72 sm:h-96',
  selectedLocation = null,
  selectedLocationLabel = null,
  recenterOnSelected = false,
  highlightedIncidentId = null,
}: Props) {
  return (
    <ResidentIncidentMap
      incidents={incidents}
      onIncidentClick={onIncidentClick}
      heightClassName={heightClassName}
      selectedLocation={selectedLocation}
      selectedLocationLabel={selectedLocationLabel}
      recenterOnSelected={recenterOnSelected}
      highlightedIncidentId={highlightedIncidentId}
      fitBoundsToIncidents={!recenterOnSelected}
      showPlaceSearch={false}
      zoomControl
    />
  )
}
