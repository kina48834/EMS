import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type Props = InputHTMLAttributes<HTMLInputElement>

export default function Input({ className, ...props }: Props) {
  return (
    <input
      className={cn(
        'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm',
        'placeholder:text-slate-400',
        'focus:border-ems-600 focus:outline-none focus:ring-2 focus:ring-ems-600/25',
        'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
        className,
      )}
      {...props}
    />
  )
}
