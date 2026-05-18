import type { GeoPoint } from '@/system/types'
import BarangayOfficialIncidentMap from './BarangayOfficialIncidentMap'

type Props = {
  selectedLocation: GeoPoint | null
  heightClassName?: string
}

export default function BarangayOfficialIncidentCrosshairMap({ selectedLocation, heightClassName = 'h-56 sm:h-64' }: Props) {
  return <BarangayOfficialIncidentMap incidents={[]} selectedLocation={selectedLocation} heightClassName={heightClassName} />
}

