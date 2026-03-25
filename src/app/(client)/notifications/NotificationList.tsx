'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { formatRelativeTime } from '@/lib/utils'
import { X, ClipboardList, CheckCircle2, XCircle, Navigation, MapPin, Wrench, Flag, Bell } from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import { toast } from 'sonner'

type IconComponent = React.ComponentType<LucideProps>

const TYPE_ICON_MAP: Record<string, IconComponent> = {
  new_application:      ClipboardList,
  application_accepted: CheckCircle2,
  application_declined: XCircle,
  en_route:             Navigation,
  arrived:              MapPin,
  in_progress:          Wrench,
  done:                 Flag,
  job_confirmed:        CheckCircle2,
}

const PROVIDER_TYPES = new Set(['application_accepted', 'application_declined', 'job_confirmed'])

function getNotificationUrl(type: string, bookingId?: string | null): string | null {
  if (!bookingId) return null
  return PROVIDER_TYPES.has(type)
    ? `/provider/bookings/${bookingId}`
    : `/bookings/${bookingId}`
}

interface Notification {
  id: string
  type: string
  message: string
  is_read: boolean
  booking_id?: string | null
  created_at: string
}

export function NotificationList({ initialNotifications, userId }: {
  initialNotifications: Notification[]
  userId: string
}) {
  const router = useRouter()
  const [notifications, setNotifications] = useState(initialNotifications)
  const [deleting, setDeleting] = useState<string | null>(null)

  const deleteOne = async (id: string) => {
    setDeleting(id)
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.from('notifications').delete().eq('id', id)
    if (error) {
      toast.error('Failed to delete')
    } else {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }
    setDeleting(null)
  }

  const deleteAll = async () => {
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.from('notifications').delete().eq('user_id', userId)
    if (error) {
      toast.error('Failed to clear notifications')
    } else {
      setNotifications([])
    }
  }

  if (notifications.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-end">
        <button
          onClick={deleteAll}
          className="text-xs text-red-500 font-medium hover:underline"
        >
          Clear all
        </button>
      </div>
      {notifications.map((n) => {
        const url = getNotificationUrl(n.type, n.booking_id)
        const NotifIcon = TYPE_ICON_MAP[n.type] ?? Bell
        const inner = (
          <div
            className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${
              n.is_read ? 'bg-white border-[#f0f0f0]' : 'bg-[#fff3e0] border-[#ffcc80]'
            } ${url ? 'hover:bg-gray-50 cursor-pointer' : ''}`}
          >
            <span className="w-8 h-8 rounded-lg bg-[#fff3e0] flex items-center justify-center flex-shrink-0 mt-0.5">
              <NotifIcon className="w-4 h-4 text-[#FF9012]" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800">{n.message}</p>
              <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(n.created_at)}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
              {!n.is_read && (
                <span className="w-2 h-2 rounded-full bg-[#FF9012]" />
              )}
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  deleteOne(n.id)
                }}
                disabled={deleting === n.id}
                className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                aria-label="Delete notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )

        return url ? (
          <Link key={n.id} href={url}>
            {inner}
          </Link>
        ) : (
          <div key={n.id}>{inner}</div>
        )
      })}
    </div>
  )
}
