'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'

export function BookingRealtimeSync({ bookingId }: { bookingId: string }) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    const channel = supabase
      .channel(`booking-status:${bookingId}`)
      .on('broadcast', { event: 'status_changed' }, () => {
        router.refresh()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [bookingId, router])

  return null
}
