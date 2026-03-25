'use client'
import { useEffect, useRef, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { MapPin } from 'lucide-react'

interface Props {
  bookingId: string
  jobLat: number
  jobLng: number
  providerLat: number | null
  providerLng: number | null
  height?: string
}

export function LiveMap({ bookingId, jobLat, jobLng, providerLat, providerLng, height = '280px' }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<unknown>(null)
  const providerMarkerRef = useRef<unknown>(null)
  const routeLineRef = useRef<unknown>(null)
  const [isClient, setIsClient] = useState(false)
  const [providerPos, setProviderPos] = useState<{ lat: number; lng: number } | null>(
    providerLat != null && providerLng != null ? { lat: providerLat, lng: providerLng } : null
  )
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => { setIsClient(true) }, [])

  // Subscribe to real-time location broadcasts
  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    const channel = supabase
      .channel(`tracking:${bookingId}`)
      .on('broadcast', { event: 'location' }, ({ payload }) => {
        setProviderPos({ lat: payload.lat, lng: payload.lng })
        setLastUpdate(new Date())
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [bookingId])

  // Init map
  useEffect(() => {
    if (!isClient || !mapRef.current || mapInstanceRef.current) return

    const init = async () => {
      const L = (await import('leaflet')).default

      // Fix default icon paths
      // @ts-expect-error leaflet icon hack
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const centerLat = providerPos?.lat ?? jobLat
      const centerLng = providerPos?.lng ?? jobLng

      const map = L.map(mapRef.current!, { zoomControl: false, attributionControl: false })
        .setView([centerLat, centerLng], 15)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map)

      // Job destination pin (red)
      const jobIcon = L.divIcon({
        html: `<div style="width:32px;height:32px;background:#ff4d4f;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        className: '',
      })
      L.marker([jobLat, jobLng], { icon: jobIcon })
        .addTo(map)
        .bindPopup('<b>Job location</b>')

      // Provider pin (blue) — only if we have position
      if (providerPos) {
        const providerIcon = L.divIcon({
          html: `<div style="width:36px;height:36px;background:#FF9012;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(255,144,18,0.4);display:flex;align-items:center;justify-content:center"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L19 21L12 17L5 21Z"/></svg></div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          className: '',
        })
        const marker = L.marker([providerPos.lat, providerPos.lng], { icon: providerIcon }).addTo(map)
        marker.bindPopup('<b>Provider</b>')
        providerMarkerRef.current = marker

        // Draw dotted line between provider and job
        const line = L.polyline([[providerPos.lat, providerPos.lng], [jobLat, jobLng]], {
          color: '#FF9012', weight: 2, dashArray: '6 6', opacity: 0.6,
        }).addTo(map)
        routeLineRef.current = line

        // Fit both pins in view
        map.fitBounds([[providerPos.lat, providerPos.lng], [jobLat, jobLng]], { padding: [40, 40] })
      }

      mapInstanceRef.current = map
    }

    init()
  }, [isClient]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update provider marker when position changes
  useEffect(() => {
    if (!providerPos || !mapInstanceRef.current) return

    const updateMap = async () => {
      const L = (await import('leaflet')).default
      const map = mapInstanceRef.current as ReturnType<typeof L.map>

      if (providerMarkerRef.current) {
        const marker = providerMarkerRef.current as ReturnType<typeof L.marker>
        marker.setLatLng([providerPos.lat, providerPos.lng])
      } else {
        const providerIcon = L.divIcon({
          html: `<div style="width:36px;height:36px;background:#FF9012;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(255,144,18,0.4);display:flex;align-items:center;justify-content:center"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L19 21L12 17L5 21Z"/></svg></div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          className: '',
        })
        const marker = L.marker([providerPos.lat, providerPos.lng], { icon: providerIcon }).addTo(map)
        providerMarkerRef.current = marker
      }

      // Update the dashed line
      if (routeLineRef.current) {
        const line = routeLineRef.current as ReturnType<typeof L.polyline>
        line.setLatLngs([[providerPos.lat, providerPos.lng], [jobLat, jobLng]])
      } else {
        const line = L.polyline([[providerPos.lat, providerPos.lng], [jobLat, jobLng]], {
          color: '#FF9012', weight: 2, dashArray: '6 6', opacity: 0.6,
        }).addTo(map)
        routeLineRef.current = line
      }

      // Keep both pins in frame
      map.fitBounds([[providerPos.lat, providerPos.lng], [jobLat, jobLng]], { padding: [40, 40] })
    }

    updateMap()
  }, [providerPos, jobLat, jobLng])

  if (!isClient) {
    return (
      <div style={{ height }} className="rounded-lg bg-gray-100 flex items-center justify-center">
        <MapPin className="w-6 h-6 text-gray-400 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative" style={{ height }}>
        <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden border border-[#f0f0f0]" />

        {/* Live badge */}
        <div className="absolute top-3 left-3 z-[1000] flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-md border border-[#f0f0f0] text-xs font-semibold text-gray-700">
          <span className="w-2 h-2 bg-[#52c41a] rounded-full animate-pulse" />
          LIVE
        </div>

        {/* Legend */}
        <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1 bg-white rounded-lg px-3 py-2 shadow-md border border-[#f0f0f0] text-xs text-gray-600">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#FF9012] inline-block" /> Provider</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#ff4d4f] inline-block" /> Job</span>
        </div>
      </div>

      {/* Last update */}
      {lastUpdate && (
        <p className="text-xs text-gray-400 text-center">
          Last updated {lastUpdate.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
      )}
      {!providerPos && (
        <p className="text-xs text-gray-400 text-center">Waiting for provider to share location…</p>
      )}
    </div>
  )
}
