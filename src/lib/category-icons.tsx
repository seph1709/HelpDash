import {
  Wrench,
  Zap,
  Droplets,
  Sparkles,
  Wind,
  Hammer,
  Paintbrush,
  Settings,
  Truck,
  ShoppingBag,
  BookOpen,
  MoreHorizontal,
} from 'lucide-react'
import type { LucideProps } from 'lucide-react'

type IconComponent = React.ComponentType<LucideProps>

const MAP: Record<string, IconComponent> = {
  plumbing: Wrench,
  electrical: Zap,
  laundry: Droplets,
  cleaning: Sparkles,
  aircon: Wind,
  carpentry: Hammer,
  painting: Paintbrush,
  appliance_repair: Settings,
  moving: Truck,
  errands: ShoppingBag,
  tutoring: BookOpen,
  other: MoreHorizontal,
}

export function CategoryIcon({
  category,
  className,
}: {
  category?: string
  className?: string
}) {
  const Icon = (category && MAP[category]) ?? MoreHorizontal
  return <Icon className={className ?? 'w-4 h-4'} />
}
