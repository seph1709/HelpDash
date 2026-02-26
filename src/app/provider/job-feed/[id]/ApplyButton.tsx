'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { Button } from '@/views/components/shared/Button'
import { toast } from 'sonner'
import { CheckCircle } from 'lucide-react'
import { notifyUser } from '@/lib/notify'

interface Props {
  jobId: string
  clientId: string
  providerId: string
  existingBooking: { id: string; status: string } | null
  jobTitle: string
}

export function ApplyButton({ jobId, clientId, providerId, existingBooking, jobTitle }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [applied, setApplied] = useState(!!existingBooking)

  if (applied) {
    return (
      <div className="flex items-center justify-center gap-2 p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
        <CheckCircle className="w-5 h-5 text-emerald-600" />
        <span className="font-medium text-emerald-700">Application sent — waiting for client</span>
      </div>
    )
  }

  const handleApply = async () => {
    setLoading(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase.from('bookings').insert({
        job_id: jobId,
        client_id: clientId,
        provider_id: providerId,
        status: 'pending',
      })
      if (error) throw new Error(error.message)
      try {
        await notifyUser(supabase, clientId, 'new_application', `A provider applied for your job "${jobTitle}"`)
      } catch {
        // silent
      }
      toast.success('Application sent! Waiting for client to accept.')
      setApplied(true)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to apply')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleApply} loading={loading} fullWidth size="lg">
      Apply for this Job
    </Button>
  )
}
