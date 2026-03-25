'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { Button } from '@/views/components/shared/Button'
import { Card } from '@/views/components/shared/Card'
import { Badge } from '@/views/components/shared/Badge'
import { Crown, Zap, Star, TrendingUp, Check, Smartphone, CreditCard } from 'lucide-react'

const PREMIUM_FEATURES = [
  { icon: Zap, text: 'See jobs immediately when posted (vs. 5-min delay)' },
  { icon: TrendingUp, text: 'Priority placement in client search results' },
  { icon: Star, text: '"Top Provider" badge on your profile' },
  { icon: Crown, text: 'Profile analytics: views, booking rate, peak hours' },
]

export default function SubscriptionPage() {
  const router = useRouter()
  const [method, setMethod] = useState<'gcash' | 'card'>('gcash')
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      toast.info('Payment integration coming soon. Check back shortly.')
      setLoading(false)
      return
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to process')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="pt-2">
        <p className="text-xs font-medium uppercase tracking-widest text-[#0068C9] mb-0.5">Subscription</p>
        <h1 className="text-xl font-semibold text-gray-900">Upgrade to Premium</h1>
        <p className="text-sm text-gray-400">₱99 per month — cancel anytime</p>
      </div>

      {/* Hero */}
      <div className="rounded-lg bg-[#fffbe6] border border-[#ffe58f] p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-[#faad14] rounded-lg flex items-center justify-center">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-semibold text-lg text-gray-900">Premium Provider</p>
            <p className="text-sm text-[#ad6800]">Be first. Win more gigs.</p>
          </div>
        </div>
        <p className="text-sm text-[#ad6800]">
          The 5-minute delay on free tier is the single biggest reason providers miss jobs.
          Premium eliminates it entirely.
        </p>
      </div>

      {/* Features */}
      <Card>
        <p className="font-semibold text-gray-900 mb-3">What you get</p>
        <div className="flex flex-col gap-3">
          {PREMIUM_FEATURES.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#fffbe6] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon className="w-3.5 h-3.5 text-[#faad14]" />
              </div>
              <p className="text-sm text-gray-700">{text}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Comparison */}
      <Card className="overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-[#f0f0f0]">
          <div className="p-3 text-center">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Free</p>
            <p className="text-2xl font-bold text-gray-400">₱0</p>
            <p className="text-xs text-gray-400 mt-1">5-min delay</p>
            <p className="text-xs text-gray-400">Standard placement</p>
            <p className="text-xs text-gray-400">No badge</p>
          </div>
          <div className="p-3 text-center bg-[#fffbe6]">
            <p className="text-xs font-medium text-[#d48806] uppercase tracking-wide mb-2 flex items-center justify-center gap-1">Premium <Zap className="w-3 h-3" /></p>
            <p className="text-2xl font-bold text-gray-900">₱99</p>
            <p className="text-xs text-gray-700 mt-1 font-medium">Instant access</p>
            <p className="text-xs text-gray-700 font-medium">Priority placement</p>
            <p className="text-xs text-gray-700 font-medium">Top Provider badge</p>
          </div>
        </div>
      </Card>

      {/* Payment method */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Payment method</p>
        <div className="grid grid-cols-2 gap-2">
          {(['gcash', 'card'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                method === m ? 'border-[#faad14] bg-[#fffbe6]' : 'border-[#f0f0f0] bg-white'
              }`}
            >
              <p className="font-medium text-sm text-gray-900 flex items-center gap-1.5">
                {m === 'gcash' ? <Smartphone className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                {m === 'gcash' ? 'GCash' : 'Credit / Debit Card'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {m === 'gcash' ? 'Pay via GCash' : 'Visa, Mastercard, JCB'}
              </p>
            </button>
          ))}
        </div>
      </div>

      <Button onClick={handleUpgrade} loading={loading} fullWidth size="lg" className="bg-[#faad14] hover:bg-[#d48806]">
        <Crown className="w-4 h-4" />
        Upgrade for ₱99/month
      </Button>

      <p className="text-xs text-center text-gray-400">
        No hidden fees. Providers keep 100% of job earnings. Cancel anytime.
      </p>
    </div>
  )
}
