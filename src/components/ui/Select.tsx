import type { SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type Props = SelectHTMLAttributes<HTMLSelectElement>

export default function Select({ className, children, ...props }: Props) {
  return (
    <select
      className={cn(
        'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm',
        'focus:border-ems-600 focus:outline-none focus:ring-2 focus:ring-ems-600/25',
        'disabled:cursor-not-allowed disabled:bg-slate-50',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}
