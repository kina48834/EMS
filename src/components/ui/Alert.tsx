import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Tone = 'error' | 'success' | 'info'

const toneClass: Record<Tone, string> = {
  error: 'border-rose-200 bg-rose-50 text-rose-800',
  success: 'border-ems-200 bg-ems-50 text-ems-900',
  info: 'border-sky-200 bg-sky-50 text-sky-900',
}

export default function Alert({ children, tone = 'error' }: { children: ReactNode; tone?: Tone }) {
  return (
    <div className={cn('rounded-xl border px-3.5 py-2.5 text-sm', toneClass[tone])} role="alert">
      {children}
    </div>
  )
}
