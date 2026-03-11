'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { Button } from '@/views/components/shared/Button'
import { StarRating } from '@/views/components/shared/StarRating'
import { toast } from 'sonner'
import { notifyUser } from '@/lib/notify'

interface Props {
  bookingId: string
  jobId: string
  providerId: string
  clientId: string
  status: string
  clientConfirmed: boolean
  jobTitle: string
}

export function BookingActions({
  bookingId,
  jobId,
  providerId,
  clientId,
  status,
  clientConfirmed,
  jobTitle,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [showRating, setShowRating] = useState(false)
  const [score, setScore] = useState(0)
  const [comment, setComment] = useState('')
  const [wouldRehire, setWouldRehire] = useState(true)

  const broadcastStatusChange = async () => {
    const supabase = createSupabaseBrowserClient()
    await supabase.channel(`booking-status:${bookingId}`).send({
      type: 'broadcast',
      event: 'status_changed',
      payload: {},
    })
  }

  const updateBooking = async (action: string, updates: Record<string, unknown>) => {
    setLoading(action)
    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase.from('bookings').update(updates).eq('id', bookingId)
      if (error) throw new Error(error.message)
      await broadcastStatusChange()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setLoading(null)
    }
  }

  const acceptBooking = async () => {
    setLoading('accept')
    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'accepted' })
        .eq('id', bookingId)
      if (error) throw new Error(error.message)
      await broadcastStatusChange()
      try {
        await notifyUser(supabase, providerId, 'application_accepted', `Your application for "${jobTitle}" was accepted!`, bookingId)
      } catch {
        // silent
      }
      toast.success('Provider accepted!')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to accept')
    } finally {
      setLoading(null)
    }
  }

  const declineBooking = async () => {
    setLoading('decline')
    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
      if (error) throw new Error(error.message)
      await broadcastStatusChange()
      try {
        await notifyUser(supabase, providerId, 'application_declined', `Your application for "${jobTitle}" was declined.`, bookingId)
      } catch {
        // silent
      }
      toast.success('Booking declined.')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setLoading(null)
    }
  }

  const confirmComplete = async () => {
    setLoading('confirm')
    try {
      const supabase = createSupabaseBrowserClient()

      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ client_confirmed: true })
        .eq('id', bookingId)
      if (bookingError) throw new Error(bookingError.message)

      const { error: jobError } = await supabase
        .from('jobs')
        .update({ status: 'completed' })
        .eq('id', jobId)
      if (jobError) throw new Error(jobError.message)

      await broadcastStatusChange()
      try {
        await notifyUser(supabase, providerId, 'job_confirmed', `Client confirmed "${jobTitle}" as complete!`, bookingId)
      } catch {
        // silent
      }

      // Show rating form next instead of refreshing
      setShowRating(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to confirm')
    } finally {
      setLoading(null)
    }
  }

  const submitRating = async () => {
    if (score === 0) {
      toast.error('Please select a star rating')
      return
    }
    setLoading('rate')
    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase.from('ratings').insert({
        booking_id: bookingId,
        from_user_id: clientId,
        to_user_id: providerId,
        score,
        comment: comment.trim() || null,
        would_rehire: wouldRehire,
      })
      if (error) throw new Error(error.message)

      // Recalculate provider stats via admin client (trigger can't bypass RLS)
      await fetch('/api/provider/update-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId }),
      })

      toast.success('Review submitted!')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit review')
    } finally {
      setLoading(null)
    }
  }

  // ── Pending: accept or decline provider ──────────────────────────────────
  if (status === 'pending') {
    return (
      <div className="flex flex-col gap-2">
        <Button
          fullWidth
          size="lg"
          loading={loading === 'accept'}
          onClick={acceptBooking}
        >
          Accept Provider
        </Button>
        <Button
          fullWidth
          size="lg"
          variant="outline"
          loading={loading === 'decline'}
          onClick={declineBooking}
        >
          Decline
        </Button>
      </div>
    )
  }

  // ── Done — waiting for confirmation ──────────────────────────────────────
  if (status === 'done' && !clientConfirmed && !showRating) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs text-center text-gray-400 px-2">
          The provider has marked this job as done. Confirm only when you are satisfied with the work.
        </p>
        <Button fullWidth size="lg" loading={loading === 'confirm'} onClick={confirmComplete}>
          Confirm Job Complete
        </Button>
      </div>
    )
  }

  // ── Rating form — shown right after confirming ────────────────────────────
  if ((status === 'done' && !clientConfirmed && showRating) || (status === 'done' && clientConfirmed && score === 0 && showRating)) {
    return (
      <div className="bg-white rounded-lg border border-[#f0f0f0] shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-4 flex flex-col gap-4">
        <div>
          <p className="font-semibold text-gray-900">Leave a review</p>
          <p className="text-xs text-gray-400 mt-0.5">Help others by sharing your experience</p>
        </div>

        {/* Stars */}
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-gray-700">Rating</p>
          <StarRating value={score} onChange={setScore} size="lg" />
          {score > 0 && (
            <p className="text-xs text-gray-400">
              {['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent!'][score]}
            </p>
          )}
        </div>

        {/* Comment */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Comment <span className="text-gray-400 font-normal">(optional)</span></label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="How was the job done? Any details to share..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-[#d9d9d9] bg-white text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#1677ff] focus:border-[#1677ff] hover:border-[#1677ff] transition-colors"
          />
        </div>

        {/* Would rehire */}
        <button
          type="button"
          onClick={() => setWouldRehire((v) => !v)}
          className="flex items-center gap-3 text-sm text-gray-700"
        >
          <div className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 ${wouldRehire ? 'bg-[#1677ff]' : 'bg-gray-200'}`}>
            <div className={`w-4 h-4 bg-white rounded-full mt-1 transition-transform shadow ${wouldRehire ? 'translate-x-5' : 'translate-x-1'}`} />
          </div>
          Would hire this provider again
        </button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => { router.refresh() }}
          >
            Skip
          </Button>
          <Button
            className="flex-1"
            loading={loading === 'rate'}
            onClick={submitRating}
          >
            Submit Review
          </Button>
        </div>
      </div>
    )
  }

  // ── Accepted: can cancel ──────────────────────────────────────────────────
  if (status === 'accepted') {
    return (
      <Button
        fullWidth
        variant="outline"
        loading={loading === 'cancel'}
        onClick={() =>
          updateBooking('cancel', { status: 'cancelled' }).then(() =>
            toast.success('Booking cancelled.')
          )
        }
      >
        Cancel Booking
      </Button>
    )
  }

  return null
}
