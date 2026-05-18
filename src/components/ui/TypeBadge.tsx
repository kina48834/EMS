import type { IncidentType } from '@/system/types'

export default function TypeBadge({ type }: { type: IncidentType }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-slate-700 ring-1 ring-inset ring-slate-200/80">
      {type}
    </span>
  )
}
