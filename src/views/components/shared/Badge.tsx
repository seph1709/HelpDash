import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'premium'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-slate-100 text-slate-600',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-600',
    info: 'bg-indigo-100 text-indigo-700',
    premium: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white',
  }
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    open: { label: 'Open', variant: 'success' },
    matched: { label: 'Matched', variant: 'info' },
    in_progress: { label: 'In Progress', variant: 'warning' },
    completed: { label: 'Completed', variant: 'default' },
    disputed: { label: 'Disputed', variant: 'danger' },
    cancelled: { label: 'Cancelled', variant: 'danger' },
    pending: { label: 'Pending', variant: 'warning' },
    accepted: { label: 'Accepted', variant: 'info' },
    en_route: { label: 'En Route', variant: 'info' },
    arrived: { label: 'Arrived', variant: 'info' },
    done: { label: 'Done', variant: 'success' },
    no_show: { label: 'No Show', variant: 'danger' },
  }
  const entry = map[status] ?? { label: status, variant: 'default' }
  return <Badge variant={entry.variant}>{entry.label}</Badge>
}
