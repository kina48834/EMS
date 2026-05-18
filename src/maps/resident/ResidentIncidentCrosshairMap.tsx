import type { GeoPoint } from '@/system/types'
import ResidentIncidentMap from './ResidentIncidentMap'

type Props = {
  selectedLocation: GeoPoint | null
  selectedLocationLabel?: string | null
  heightClassName?: string
  className?: string
  recenterOnSelected?: boolean
  onSelectLocation?: (p: GeoPoint) => void
}

export default function ResidentIncidentCrosshairMap({
  selectedLocation,
  selectedLocationLabel = null,
  heightClassName = 'h-56 sm:h-64',
  className,
  recenterOnSelected = false,
  onSelectLocation,
}: Props) {
  return (
    <ResidentIncidentMap
      incidents={[]}
      selectedLocation={selectedLocation}
      selectedLocationLabel={selectedLocationLabel}
      pickEnabled={Boolean(onSelectLocation)}
      onPick={onSelectLocation}
      heightClassName={heightClassName}
      className={className}
      recenterOnSelected={recenterOnSelected}
    />
  )
}

