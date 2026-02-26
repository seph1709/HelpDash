'use client'
import { cn } from '@/lib/utils'
import { Star } from 'lucide-react'
import { useState } from 'react'

interface StarRatingProps {
  value?: number
  onChange?: (value: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function StarRating({ value = 0, onChange, readonly = false, size = 'md' }: StarRatingProps) {
  const [hovered, setHovered] = useState(0)
  const sizes = { sm: 'w-3.5 h-3.5', md: 'w-5 h-5', lg: 'w-6 h-6' }

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={cn('transition-colors', !readonly && 'cursor-pointer hover:scale-110')}
        >
          <Star
            className={cn(
              sizes[size],
              (hovered || value) >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-200'
            )}
          />
        </button>
      ))}
    </div>
  )
}
