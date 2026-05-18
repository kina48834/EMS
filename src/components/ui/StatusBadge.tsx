import type { IncidentStatus } from '@/system/types'
import { cn } from '@/lib/cn'

const styles: Record<IncidentStatus, string> = {
  pending: 'bg-amber-50 text-amber-900 ring-amber-200/80',
  approved: 'bg-ems-50 text-ems-800 ring-ems-200/80',
  rejected: 'bg-rose-50 text-rose-800 ring-rose-200/80',
  resolved: 'bg-sky-50 text-sky-800 ring-sky-200/80',
}

const labels: Record<IncidentStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  resolved: 'Resolved',
}

export default function StatusBadge({ status }: { status: IncidentStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        styles[status],
      )}
    >
      {labels[status]}
    </span>
  )
}
