'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { Button } from '@/views/components/shared/Button'
import { Card } from '@/views/components/shared/Card'
import { Badge } from '@/views/components/shared/Badge'
import { Crown, Zap, Star, TrendingUp, Check } from 'lucide-react'

const PREMIUM_FEATURES = [
  { icon: Zap, text: 'See jobs immediately when posted (vs. 5-min delay)' },
  { icon: TrendingUp, text: 'Priority placement in client search results' },
  { icon: Star, text: '"Top Provider" badge on your profile' },
  { icon: Crown, text: 'Profile analytics: views, booking rate, peak hours' },
]

export default function SubscriptionPage() {
  const router = useRouter()
  const [method, setMethod] = useState<'gcash' | 'cash'>('gcash')
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      if (method === 'gcash') {
        // Week 2: integrate PayMongo here
        toast.info('GCash payment integration coming soon. Use cash option for now.')
        setLoading(false)
        return
      }

      // Cash: mark as pending admin confirmation
      await supabase.from('subscriptions').insert({
        provider_id: user.id,
        plan: 'premium',
        amount_paid: 99,
        payment_method: 'cash',
        payment_status: 'failed', // will be confirmed by admin
      })

      toast.success('Cash payment recorded! Admin will confirm within 24 hours.')
      router.push('/provider/dashboard')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to process')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="pt-2">
        <h1 className="text-xl font-bold text-slate-900">Upgrade to Premium</h1>
        <p className="text-sm text-slate-500">₱99 per month — cancel anytime</p>
      </div>

      {/* Hero */}
      <Card className="bg-gradient-to-br from-amber-400 to-orange-500 border-0 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-xl">Premium Provider</p>
            <p className="text-orange-100 text-sm">Be first. Win more gigs.</p>
          </div>
        </div>
        <p className="text-orange-100 text-sm">
          The 5-minute delay on free tier is the single biggest reason providers miss jobs.
          Premium eliminates it entirely.
        </p>
      </Card>

      {/* Features */}
      <Card>
        <p className="font-semibold text-slate-900 mb-3">What you get</p>
        <div className="flex flex-col gap-3">
          {PREMIUM_FEATURES.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-start gap-3">
              <div className="w-6 h-6 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <p className="text-sm text-slate-700">{text}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Comparison */}
      <Card className="overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-slate-100">
          <div className="p-3 text-center">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Free</p>
            <p className="text-2xl font-bold text-slate-400">₱0</p>
            <p className="text-xs text-slate-400 mt-1">5-min delay</p>
            <p className="text-xs text-slate-400">Standard placement</p>
            <p className="text-xs text-slate-400">No badge</p>
          </div>
          <div className="p-3 text-center bg-amber-50">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">Premium ⚡</p>
            <p className="text-2xl font-bold text-slate-900">₱99</p>
            <p className="text-xs text-slate-700 mt-1 font-medium">Instant access</p>
            <p className="text-xs text-slate-700 font-medium">Priority placement</p>
            <p className="text-xs text-slate-700 font-medium">Top Provider badge</p>
          </div>
        </div>
      </Card>

      {/* Payment method */}
      <div>
        <p className="text-sm font-medium text-slate-700 mb-2">Payment method</p>
        <div className="grid grid-cols-2 gap-2">
          {(['gcash', 'cash'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={`p-3 rounded-xl border-2 transition-all text-left ${
                method === m ? 'border-amber-500 bg-amber-50' : 'border-slate-100 bg-white'
              }`}
            >
              <p className="font-medium text-sm text-slate-900 capitalize">
                {m === 'gcash' ? '📱 GCash' : '💵 Cash'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {m === 'gcash' ? 'Pay via PayMongo' : 'Pay admin directly'}
              </p>
            </button>
          ))}
        </div>
      </div>

      <Button onClick={handleUpgrade} loading={loading} fullWidth size="lg" className="bg-amber-500 hover:bg-amber-600">
        <Crown className="w-4 h-4" />
        Upgrade for ₱99/month
      </Button>

      <p className="text-xs text-center text-slate-400">
        No hidden fees. Providers keep 100% of job earnings. Cancel anytime.
      </p>
    </div>
  )
}
