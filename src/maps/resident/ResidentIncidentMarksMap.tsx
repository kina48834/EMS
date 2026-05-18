import type { GeoPoint, Incident } from '@/system/types'
import ResidentIncidentMap from './ResidentIncidentMap'

type Props = {
  incidents: Incident[]
  onIncidentClick?: (incidentId: string) => void
  heightClassName?: string
  selectedLocation?: GeoPoint | null
  selectedLocationLabel?: string | null
  recenterOnSelected?: boolean
}

export default function ResidentIncidentMarksMap({
  incidents,
  onIncidentClick,
  heightClassName = 'h-72 sm:h-96',
  selectedLocation = null,
  selectedLocationLabel = null,
  recenterOnSelected = false,
}: Props) {
  return (
    <ResidentIncidentMap
      incidents={incidents}
      onIncidentClick={onIncidentClick}
      heightClassName={heightClassName}
      selectedLocation={selectedLocation}
      selectedLocationLabel={selectedLocationLabel}
      recenterOnSelected={recenterOnSelected}
    />
  )
}

