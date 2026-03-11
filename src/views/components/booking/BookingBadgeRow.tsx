'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'hd_booking_seen'

function getSeenStatuses(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function setSeenStatus(bookingId: string, status: string) {
  try {
    const seen = getSeenStatuses()
    seen[bookingId] = status
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seen))
  } catch {
    // ignore
  }
}

interface Props {
  bookingId: string
  href: string
  status: string
  children: React.ReactNode
}

export function BookingBadgeRow({ bookingId, href, status, children }: Props) {
  const [hasNew, setHasNew] = useState(false)

  useEffect(() => {
    const seen = getSeenStatuses()
    const lastSeen = seen[bookingId]
    // Show badge if status changed since last visit (or never visited)
    if (!lastSeen || lastSeen !== status) {
      setHasNew(true)
    }
  }, [bookingId, status])

  const handleClick = () => {
    setSeenStatus(bookingId, status)
    setHasNew(false)
  }

  return (
    <Link href={href} onClick={handleClick} className="relative block">
      {hasNew && (
        <span className="absolute top-2 right-2 z-10 w-2.5 h-2.5 rounded-full bg-[#1677ff] ring-2 ring-white" />
      )}
      {children}
    </Link>
  )
}
