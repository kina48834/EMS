import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/40 sm:p-5', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('text-sm font-semibold text-slate-900', className)}>{children}</div>
}
