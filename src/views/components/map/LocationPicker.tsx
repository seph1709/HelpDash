'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { MapPin, Locate } from 'lucide-react'
import { reverseGeocode } from '@/lib/utils'
import { Button } from '@/views/components/shared/Button'

interface LocationPickerProps {
  lat?: number
  lng?: number
  onLocationSelect: (lat: number, lng: number, address: string) => void
  showRadius?: boolean
  height?: string
}

// Default center: Quezon City Hall
const DEFAULT_LAT = 14.6507
const DEFAULT_LNG = 121.0494

export function LocationPicker({
  lat,
  lng,
  onLocationSelect,
  showRadius = true,
  height = '300px',
}: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<unknown>(null)
  const markerRef = useRef<unknown>(null)
  const [loading, setLoading] = useState(false)
  const [address, setAddress] = useState('')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => { setIsClient(true) }, [])

  const updateLocation = useCallback(async (newLat: number, newLng: number) => {
    setLoading(true)
    const addr = await reverseGeocode(newLat, newLng)
    setAddress(addr)
    onLocationSelect(newLat, newLng, addr)
    setLoading(false)
  }, [onLocationSelect])

  useEffect(() => {
    if (!isClient || !mapRef.current || mapInstanceRef.current) return

    const initMap = async () => {
      const L = (await import('leaflet')).default
      // Fix default marker icon
      // @ts-expect-error leaflet icon hack
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const initialLat = lat ?? DEFAULT_LAT
      const initialLng = lng ?? DEFAULT_LNG

      const map = L.map(mapRef.current!, { zoomControl: true, attributionControl: true })
        .setView([initialLat, initialLng], 16)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map)

      // Add 2km radius circle
      if (showRadius) {
        L.circle([initialLat, initialLng], {
          color: '#4F46E5',
          fillColor: '#4F46E5',
          fillOpacity: 0.05,
          radius: 2000,
          weight: 1.5,
          dashArray: '6,4',
        }).addTo(map)
      }

      // Add draggable marker
      const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map)
      markerRef.current = marker

      marker.on('dragend', () => {
        const pos = marker.getLatLng()
        updateLocation(pos.lat, pos.lng)
      })

      map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
        marker.setLatLng([e.latlng.lat, e.latlng.lng])
        updateLocation(e.latlng.lat, e.latlng.lng)
      })

      mapInstanceRef.current = map

      // Initial address load
      if (lat && lng) {
        updateLocation(lat, lng)
      }
    }

    initMap()
  }, [isClient, lat, lng, showRadius, updateLocation])

  const locateMe = () => {
    if (!navigator.geolocation) return
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        const L = (await import('leaflet')).default
        const map = mapInstanceRef.current as ReturnType<typeof L.map>
        const marker = markerRef.current as ReturnType<typeof L.marker>
        map.setView([latitude, longitude], 17)
        marker.setLatLng([latitude, longitude])
        updateLocation(latitude, longitude)
      },
      () => { setLoading(false) }
    )
  }

  if (!isClient) {
    return (
      <div style={{ height }} className="rounded-xl bg-slate-100 flex items-center justify-center">
        <MapPin className="w-6 h-6 text-slate-400 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative" style={{ height }}>
        <div ref={mapRef} className="w-full h-full rounded-xl overflow-hidden border border-slate-200" />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={locateMe}
          loading={loading}
          className="absolute bottom-3 right-3 z-[1000] shadow-md"
        >
          <Locate className="w-4 h-4" />
          Use my location
        </Button>
      </div>
      {address && (
        <div className="flex items-start gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
          <MapPin className="w-4 h-4 mt-0.5 text-indigo-500 flex-shrink-0" />
          <span>{address}</span>
        </div>
      )}
    </div>
  )
}
