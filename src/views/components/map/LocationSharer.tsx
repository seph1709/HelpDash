'use client'
import { useEffect, useRef, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface Props {
  bookingId: string
  providerId: string
}

export function LocationSharer({ bookingId, providerId }: Props) {
  const [status, setStatus] = useState<'connecting' | 'sharing' | 'error'>('connecting')
  const channelRef = useRef<RealtimeChannel | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const lastSentRef = useRef<number>(0)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    const channel = supabase.channel(`tracking:${bookingId}`)
    channelRef.current = channel

    channel.subscribe((s) => {
      if (s !== 'SUBSCRIBED') return
      setStatus('sharing')

      if (!navigator.geolocation) {
        setStatus('error')
        return
      }

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const now = Date.now()
          // Throttle to once every 4 seconds
          if (now - lastSentRef.current < 4000) return
          lastSentRef.current = now

          const lat = pos.coords.latitude
          const lng = pos.coords.longitude

          channel.send({
            type: 'broadcast',
            event: 'location',
            payload: { lat, lng },
          })

          // Also persist to DB so client gets latest position on page load/refresh
          supabase.from('users').update({ lat, lng }).eq('id', providerId).then(() => {})
        },
        () => setStatus('error'),
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
      )
    })

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
      supabase.removeChannel(channel)
    }
  }, [bookingId, providerId])

  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium ${
      status === 'sharing'
        ? 'bg-[#f6ffed] text-[#52c41a] border border-[#b7eb8f]'
        : status === 'error'
          ? 'bg-[#fff2f0] text-[#ff4d4f] border border-[#ffccc7]'
          : 'bg-gray-50 text-gray-400 border border-[#f0f0f0]'
    }`}>
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
        status === 'sharing' ? 'bg-[#52c41a] animate-pulse' :
        status === 'error'   ? 'bg-[#ff4d4f]' : 'bg-gray-300 animate-pulse'
      }`} />
      {status === 'sharing' && 'Sharing live location with client'}
      {status === 'error'   && 'Location access denied — enable GPS'}
      {status === 'connecting' && 'Connecting…'}
    </div>
  )
}
