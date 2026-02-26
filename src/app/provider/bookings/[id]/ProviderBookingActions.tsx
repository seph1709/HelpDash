'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { Button } from '@/views/components/shared/Button'
import { toast } from 'sonner'
import { notifyUser } from '@/lib/notify'

interface Props {
  bookingId: string
  status: string
  clientId: string
  jobTitle: string
}

const NEXT_STATUS: Record<string, { label: string; value: string }> = {
  accepted:    { label: "I'm on my way",     value: 'en_route'    },
  en_route:    { label: "I've arrived",       value: 'arrived'     },
  arrived:     { label: 'Start job',          value: 'in_progress' },
  in_progress: { label: 'Mark as done',       value: 'done'        },
}

const NOTIFY_CLIENT: Record<string, string> = {
  en_route:    'on the way',
  arrived:     'has arrived',
  in_progress: 'started the work',
  done:        'marked the job as done — please confirm to complete',
}

export function ProviderBookingActions({ bookingId, status, clientId, jobTitle }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const update = async (action: string, updates: Record<string, unknown>) => {
    setLoading(action)
    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', bookingId)
      if (error) throw new Error(error.message)
      const nextValue = (updates as { status?: string }).status
      if (nextValue && NOTIFY_CLIENT[nextValue]) {
        try {
          const supabase2 = createSupabaseBrowserClient()
          await notifyUser(supabase2, clientId, nextValue, `Your provider ${NOTIFY_CLIENT[nextValue]} for "${jobTitle}"`, bookingId)
        } catch {
          // silent
        }
      }
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setLoading(null)
    }
  }

  const next = NEXT_STATUS[status]

  return (
    <div className="flex flex-col gap-2">
      {next && (
        <Button
          fullWidth
          size="lg"
          loading={loading === 'next'}
          onClick={() =>
            toast.promise(update('next', { status: next.value }), {
              loading: 'Updating...',
              success: 'Status updated!',
              error: 'Failed to update',
            })
          }
        >
          {next.label}
        </Button>
      )}

      {/* Cancel only while still pending or accepted */}
      {['pending', 'accepted'].includes(status) && (
        <Button
          fullWidth
          variant="outline"
          loading={loading === 'cancel'}
          onClick={() =>
            update('cancel', { status: 'cancelled' }).then(() =>
              toast.success('Booking cancelled.')
            )
          }
        >
          Cancel
        </Button>
      )}
    </div>
  )
}
