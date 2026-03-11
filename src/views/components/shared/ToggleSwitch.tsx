'use client'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ToggleSwitchProps {
  checked: boolean
  providerId: string
  label?: string
}

export function ToggleSwitch({ checked: initialChecked, providerId, label }: ToggleSwitchProps) {
  const [checked, setChecked] = useState(initialChecked)
  const [isPending, startTransition] = useTransition()

  const toggle = () => {
    const newVal = !checked
    setChecked(newVal)
    startTransition(async () => {
      try {
        const res = await fetch('/api/providers/availability', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_available: newVal }),
        })
        if (!res.ok) throw new Error()
        toast.success(newVal ? 'You are now available' : 'You are now unavailable')
      } catch {
        setChecked(!newVal)
        toast.error('Failed to update availability')
      }
    })
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={toggle}
      disabled={isPending}
      className={cn(
        'relative inline-flex items-center h-7 w-12 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677ff] focus-visible:ring-offset-2',
        checked ? 'bg-[#52c41a]' : 'bg-gray-200',
        isPending && 'opacity-70'
      )}
    >
      <span
        className={cn(
          'inline-block w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  )
}
