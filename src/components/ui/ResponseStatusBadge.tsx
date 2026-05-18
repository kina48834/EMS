import type { ResponseStatus } from '@/system/types'
import { cn } from '@/lib/cn'

const styles: Record<ResponseStatus, string> = {
  enRoute: 'bg-ems-50 text-ems-800 ring-ems-200/80',
  onSite: 'bg-amber-50 text-amber-900 ring-amber-200/80',
  resolved: 'bg-sky-50 text-sky-800 ring-sky-200/80',
}

const labels: Record<ResponseStatus, string> = {
  enRoute: 'En route',
  onSite: 'On-site',
  resolved: 'Resolved',
}

export default function ResponseStatusBadge({ status }: { status: ResponseStatus }) {
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
