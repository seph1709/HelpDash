import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
}

export function Card({ padding = 'md', hover, className, children, ...props }: CardProps) {
  const paddings = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-6' }
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-slate-100 shadow-sm',
        paddings[padding],
        hover && 'cursor-pointer transition-shadow hover:shadow-md hover:-translate-y-px',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardSection({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('border-t border-slate-100 pt-4 mt-4', className)} {...props}>
      {children}
    </div>
  )
}
