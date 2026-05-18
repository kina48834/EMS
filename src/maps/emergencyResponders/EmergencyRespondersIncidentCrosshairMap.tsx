import type { GeoPoint } from '@/system/types'
import EmergencyRespondersIncidentMap from './EmergencyRespondersIncidentMap'

type Props = {
  selectedLocation: GeoPoint | null
  heightClassName?: string
}

export default function EmergencyRespondersIncidentCrosshairMap({ selectedLocation, heightClassName = 'h-56 sm:h-64' }: Props) {
  return <EmergencyRespondersIncidentMap incidents={[]} selectedLocation={selectedLocation} heightClassName={heightClassName} />
}

