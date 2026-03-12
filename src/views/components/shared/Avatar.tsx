import { cn } from '@/lib/utils'

interface AvatarProps {
  name?: string | null
  src?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const sizes = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-sm', md: 'w-10 h-10 text-base', lg: 'w-12 h-12 text-lg', xl: 'w-16 h-16 text-xl' }
  const initials = name ? name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : '?'

  if (src) {
    return (
      <img
        src={src}
        alt={name ?? 'avatar'}
        className={cn('rounded-full object-cover flex-shrink-0 bg-slate-200', sizes[size], className)}
      />
    )
  }

  return (
    <div className={cn('rounded-full flex-shrink-0 flex items-center justify-center font-semibold bg-[#e6f4ff] text-[#1677ff]', sizes[size], className)}>
      {initials}
    </div>
  )
}
