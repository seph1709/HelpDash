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
        'bg-white rounded-lg border border-[#f0f0f0] shadow-[0_2px_8px_rgba(0,0,0,0.06)]',
        paddings[padding],
        hover && 'cursor-pointer transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)] hover:-translate-y-px',
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
    <div className={cn('border-t border-[#f0f0f0] pt-4 mt-4', className)} {...props}>
      {children}
    </div>
  )
}
